#!/usr/bin/env python3
"""Score the shipped browser detection pipeline through Chrome DevTools Protocol."""

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

import websocket

from evaluate_metrics import (
    build_confusion_matrix,
    export_csv,
    print_ascii_matrix,
    score,
    tally,
    tier_tally,
)

ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "secure-gpt/packages/extension/dist"
DEFAULT_CORPUS = Path(__file__).with_name("corpus.json")


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
