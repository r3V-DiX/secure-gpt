#!/usr/bin/env python3
"""Score the shipped browser detection pipeline through Chrome DevTools Protocol."""

import argparse
import hashlib
import json
import subprocess
import sys
import time
import urllib.request
from collections import defaultdict
from pathlib import Path

import websocket

ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "secure-gpt/packages/extension/dist"
DEFAULT_CORPUS = Path(__file__).with_name("corpus.json")


def wait_for_json(url, timeout=20):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                return json.load(response)
        except Exception:
            time.sleep(0.2)
    raise RuntimeError(f"Timed out waiting for {url}")


class CDP:
    def __init__(self, url):
        self.ws = websocket.create_connection(url, timeout=90, suppress_origin=True)
        self.next_id = 0
        self.model_response = False
        self.ner_ready = False
        self.ner_inferences = 0
        self.errors = []

    def call(self, method, params=None):
        self.next_id += 1
        request_id = self.next_id
        self.ws.send(json.dumps({"id": request_id, "method": method, "params": params or {}}))
        while True:
            message = json.loads(self.ws.recv())
            if message.get("method") == "Network.responseReceived":
                response = message["params"]["response"]
                if response["url"].endswith("/models/pii-ner-int8.onnx") and response["status"] == 200:
                    self.model_response = True
            if message.get("method") == "Runtime.consoleAPICalled":
                arguments = message["params"].get("args", [])
                lines = " ".join(str(arg.get("value", arg.get("description", ""))) for arg in arguments)
                if "[NERTier] Worker fully ready" in lines:
                    self.ner_ready = True
                if "[NERTier] Received inference result for ID:" in lines:
                    self.ner_inferences += 1
                if message["params"]["type"] in ("error", "warning"):
                    self.errors.append(lines)
            if message.get("id") == request_id:
                if "error" in message:
                    raise RuntimeError(f"CDP {method}: {message['error']}")
                return message.get("result", {})

    def evaluate(self, expression):
        result = self.call("Runtime.evaluate", {
            "expression": expression,
            "awaitPromise": True,
            "returnByValue": True,
        })
        if "exceptionDetails" in result:
            raise RuntimeError(str(result["exceptionDetails"]))
        return result["result"].get("value")


def gold_spans(sample):
    spans = []
    for item in sample["expected"]:
        start = sample["text"].find(item["value"])
        if start < 0:
            raise ValueError(f"{sample['id']}: missing gold value {item['value']}")
        if sample["text"].count(item["value"]) != 1:
            raise ValueError(f"{sample['id']}: gold value occurs more than once: {item['value']}")
        spans.append((start, start + len(item["value"]), item["category"]))
    if len(spans) != len(set(spans)):
        raise ValueError(f"{sample['id']}: ambiguous duplicate span")
    return spans


def tally(rows, group):
    counts = defaultdict(lambda: {"tp": 0, "fp": 0, "fn": 0})
    for row in rows:
        for match in row["matches"]:
            key = match[group]
            counts[key][match["outcome"]] += 1
    return {
        key: {
            **value,
            "precision": round(value["tp"] / (value["tp"] + value["fp"]), 4)
            if value["tp"] + value["fp"] else None,
            "recall": round(value["tp"] / (value["tp"] + value["fn"]), 4)
            if value["tp"] + value["fn"] else None,
        }
        for key, value in sorted(counts.items())
    }


def tier_tally(rows):
    gold_count = sum(match["outcome"] != "fp" for row in rows for match in row["matches"])
    tiers = defaultdict(lambda: {"tp": 0, "fp": 0})
    for row in rows:
        for match in row["matches"]:
            if match["outcome"] != "fn":
                tiers[match["tier"]][match["outcome"]] += 1
    return {
        tier: {
            **counts,
            "precision": round(counts["tp"] / (counts["tp"] + counts["fp"]), 4)
            if counts["tp"] + counts["fp"] else None,
            "shareOfGoldDetected": round(counts["tp"] / gold_count, 4) if gold_count else None,
        }
        for tier, counts in sorted(tiers.items())
    }


def score(sample, entities):
    gold = set(gold_spans(sample))
    matches = []
    seen = set()
    for entity in entities:
        span = (entity["startIndex"], entity["endIndex"], entity["category"])
        correct = span in gold and span not in seen
        seen.add(span)
        matches.append({
            "outcome": "tp" if correct else "fp",
            "category": entity["category"],
            "source": sample["source"],
            "tier": entity["tier"],
            "type": entity["type"],
            "span": list(span),
        })
    for span in sorted(gold - seen):
        matches.append({
            "outcome": "fn", "category": span[2], "source": sample["source"],
            "tier": "missed", "span": list(span),
        })
    return {"id": sample["id"], "origin": sample["origin"], "matches": matches}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--corpus", type=Path, default=DEFAULT_CORPUS)
    args = parser.parse_args()
    corpus = args.corpus.resolve()
    if not (DIST / "benchmark/index.html").exists():
        raise SystemExit("Build the extension and benchmark page first; see README.md")

    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8765", "--bind", "127.0.0.1", "--directory", str(DIST)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    chrome = subprocess.Popen([
        "google-chrome", "--headless=new", "--no-sandbox", "--disable-gpu",
        "--remote-debugging-port=9223", "--remote-allow-origins=*",
        "--user-data-dir=/tmp/securegpt-detection-benchmark-chrome",
        "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        wait_for_json("http://127.0.0.1:9223/json/version")
        tabs = wait_for_json("http://127.0.0.1:9223/json")
        page = next(tab for tab in tabs if tab["type"] == "page")
        cdp = CDP(page["webSocketDebuggerUrl"])
        cdp.call("Network.enable")
        cdp.call("Runtime.enable")
        cdp.call("Page.enable")
        cdp.call("Page.navigate", {"url": "http://127.0.0.1:8765/benchmark/index.html"})
        deadline = time.monotonic() + 30
        while time.monotonic() < deadline:
            if cdp.evaluate("typeof window.runDetectionSample === 'function'"):
                break
            time.sleep(0.2)
        else:
            raise RuntimeError("Benchmark page did not initialize")

        rows = []
        samples = json.loads(corpus.read_text())
        for sample in samples:
            expression = f"window.runDetectionSample({json.dumps(sample['text'])})"
            entities = cdp.evaluate(expression)
            rows.append(score(sample, entities))
            print(f"{sample['id']}: {len(entities)} predictions")
        if not cdp.ner_ready:
            raise RuntimeError(f"The ONNX worker did not initialize; refusing a mock-only report: {cdp.errors}")
        if cdp.ner_inferences != len(samples):
            raise RuntimeError(f"Expected {len(samples)} ONNX inference responses; got {cdp.ner_inferences}: {cdp.errors}")
        report = {
            "engine": "chrome-onnx-runtime",
            "corpus": str(corpus.relative_to(ROOT)),
            "corpusSha256": hashlib.sha256(corpus.read_bytes()).hexdigest(),
            "modelSha256": hashlib.sha256((DIST / "models/pii-ner-int8.onnx").read_bytes()).hexdigest(),
            "modelLoaded": cdp.ner_ready,
            "nerInferenceResponses": cdp.ner_inferences,
            "byCategory": tally(rows, "category"),
            "bySource": tally(rows, "source"),
            "byTier": tier_tally(rows),
            "cases": rows,
        }
        Path(args.output).write_text(json.dumps(report, indent=2) + "\n")
        print(json.dumps(report["bySource"], indent=2))
    finally:
        chrome.terminate()
        server.terminate()


if __name__ == "__main__":
    main()
