#!/usr/bin/env python3
"""Score the shipped browser detection pipeline through Chrome DevTools Protocol."""

import argparse
import csv
import hashlib
import json
import os
import shutil
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
CATEGORIES = ["PII", "FINANCIAL", "CONFIDENTIAL", "IP"]


def find_chrome_binary():
    """Locate a valid Chrome or Chromium executable."""
    candidates = [
        os.environ.get("CHROME_BIN"),
        "/opt/google/chrome/google-chrome",
        "/opt/google/chrome/chrome",
        shutil.which("google-chrome"),
        shutil.which("google-chrome-stable"),
        shutil.which("chromium"),
        shutil.which("chromium-browser"),
    ]
    for candidate in candidates:
        if candidate and os.path.exists(candidate) and os.access(candidate, os.X_OK):
            return candidate
    raise RuntimeError("No Google Chrome or Chromium executable found on the system.")


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
    for item in sample.get("expected", []):
        val = item["value"]
        start = sample["text"].find(val)
        if start < 0:
            raise ValueError(f"{sample['id']}: missing gold value {val}")
        if sample["text"].count(val) != 1:
            raise ValueError(f"{sample['id']}: gold value occurs more than once: {val}")
        spans.append((start, start + len(val), item["category"], val))
    return spans


def score(sample, entities):
    """
    Score entities against gold spans.
    Produces detailed match items enabling confusion matrix and row-level CSV export.
    """
    gold = gold_spans(sample)  # list of (start, end, category, value)
    matches = []
    gold_matched = set()

    for entity in entities:
        e_start = entity["startIndex"]
        e_end = entity["endIndex"]
        e_cat = entity["category"]
        e_tier = entity["tier"]
        e_type = entity.get("type", "")
        e_val = entity.get("value", sample["text"][e_start:e_end])

        # Check for overlapping gold span
        matching_gold_idx = None
        for idx, (g_start, g_end, g_cat, g_val) in enumerate(gold):
            if idx not in gold_matched:
                if max(e_start, g_start) < min(e_end, g_end):
                    matching_gold_idx = idx
                    break

        if matching_gold_idx is not None:
            gold_matched.add(matching_gold_idx)
            g_start, g_end, g_cat, g_val = gold[matching_gold_idx]
            is_tp = (e_cat == g_cat)
            matches.append({
                "outcome": "tp" if is_tp else "fp",
                "category": e_cat,
                "gold_category": g_cat,
                "pred_category": e_cat,
                "source": sample["source"],
                "tier": e_tier,
                "type": e_type,
                "value": e_val,
                "span": [e_start, e_end],
            })
        else:
            # False Positive without any overlapping gold entity
            matches.append({
                "outcome": "fp",
                "category": e_cat,
                "gold_category": "NONE",
                "pred_category": e_cat,
                "source": sample["source"],
                "tier": e_tier,
                "type": e_type,
                "value": e_val,
                "span": [e_start, e_end],
            })

    # Record False Negatives for gold spans that were missed
    for idx, (g_start, g_end, g_cat, g_val) in enumerate(gold):
        if idx not in gold_matched:
            matches.append({
                "outcome": "fn",
                "category": g_cat,
                "gold_category": g_cat,
                "pred_category": "NONE",
                "source": sample["source"],
                "tier": "missed",
                "type": "missed",
                "value": g_val,
                "span": [g_start, g_end],
            })

    # If sample is a negative sample and nothing was predicted, record true negative
    if not gold and not entities:
        matches.append({
            "outcome": "tn",
            "category": "NONE",
            "gold_category": "NONE",
            "pred_category": "NONE",
            "source": sample["source"],
            "tier": "clean",
            "type": "clean",
            "value": "",
            "span": [0, 0],
        })

    return {"id": sample["id"], "origin": sample.get("origin", ""), "matches": matches}


def tally(rows, group):
    counts = defaultdict(lambda: {"tp": 0, "fp": 0, "fn": 0})
    for row in rows:
        for match in row["matches"]:
            if match["outcome"] in ("tp", "fp", "fn"):
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
    gold_count = sum(match["outcome"] in ("tp", "fn") for row in rows for match in row["matches"])
    tiers = defaultdict(lambda: {"tp": 0, "fp": 0})
    for row in rows:
        for match in row["matches"]:
            if match["outcome"] in ("tp", "fp"):
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


def build_confusion_matrix(rows):
    matrix_labels = CATEGORIES + ["NONE"]
    matrix = {actual: {pred: 0 for pred in matrix_labels} for actual in matrix_labels}

    for row in rows:
        for match in row["matches"]:
            actual = match.get("gold_category", "NONE")
            pred = match.get("pred_category", "NONE")
            matrix[actual][pred] += 1

    return matrix


def print_ascii_matrix(matrix):
    headers = CATEGORIES + ["NONE"]
    print("\n" + "=" * 76)
    print("                      CATEGORY CONFUSION MATRIX")
    print("=" * 76)
    col_title = "Actual \\ Pred"
    header_line = f"{col_title:<14} | " + " | ".join(f"{h:>10}" for h in headers)
    print(header_line)
    print("-" * len(header_line))

    for actual in headers:
        row_str = f"{actual:<14} | " + " | ".join(f"{matrix[actual][pred]:>10}" for pred in headers)
        print(row_str)
    print("=" * 76 + "\n")


def export_csv(rows, csv_path: Path):
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["sample_id", "source", "outcome", "gold_category", "pred_category", "tier", "type", "value"])
        for row in rows:
            for m in row["matches"]:
                writer.writerow([
                    row["id"],
                    m["source"],
                    m["outcome"],
                    m.get("gold_category", ""),
                    m.get("pred_category", ""),
                    m["tier"],
                    m["type"],
                    m.get("value", "").replace("\n", " "),
                ])
    print(f"Exported row-level results to CSV: {csv_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--corpus", type=Path, default=DEFAULT_CORPUS)
    parser.add_argument("--csv", type=Path, default=None, help="Optional CSV output path for row-level details")
    args = parser.parse_args()
    corpus = args.corpus.resolve()
    if not (DIST / "benchmark/index.html").exists():
        raise SystemExit("Build the extension and benchmark page first; see README.md")

    chrome_bin = find_chrome_binary()

    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8765", "--bind", "127.0.0.1", "--directory", str(DIST)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    chrome = subprocess.Popen([
        chrome_bin, "--headless=new", "--no-sandbox", "--disable-gpu",
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
        total = len(samples)
        print(f"Running detection benchmark on {total} samples using {chrome_bin}...")
        for i, sample in enumerate(samples):
            expression = f"window.runDetectionSample({json.dumps(sample['text'])})"
            entities = cdp.evaluate(expression)
            rows.append(score(sample, entities))
            if (i + 1) % 50 == 0 or (i + 1) == total:
                print(f"[{i + 1}/{total}] processed (latest: {sample['id']} with {len(entities)} preds)")

        if not cdp.ner_ready:
            raise RuntimeError(f"The ONNX worker did not initialize; refusing a mock-only report: {cdp.errors}")
        if cdp.ner_inferences != len(samples):
            raise RuntimeError(f"Expected {len(samples)} ONNX inference responses; got {cdp.ner_inferences}: {cdp.errors}")

        confusion_matrix = build_confusion_matrix(rows)
        print_ascii_matrix(confusion_matrix)

        if args.csv:
            export_csv(rows, args.csv)

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
            "confusionMatrix": confusion_matrix,
            "cases": rows,
        }
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(report, indent=2) + "\n")
        print(f"Full JSON report saved to: {args.output}")
        print("\nSummary by Category:")
        print(json.dumps(report["byCategory"], indent=2))
        print("\nSummary by Tier:")
        print(json.dumps(report["byTier"], indent=2))
    finally:
        chrome.terminate()
        server.terminate()


if __name__ == "__main__":
    main()
