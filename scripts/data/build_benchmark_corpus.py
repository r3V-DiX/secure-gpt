#!/usr/bin/env python3
"""Build a scaled, balanced benchmark corpus for SecureGPT detection evaluation."""

import argparse
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW_DATASET = ROOT / "data/raw/english_pii_43k.jsonl"
DEFAULT_OUTPUT = ROOT / "data/processed/benchmark_1000.json"

TAG_TO_CATEGORY = {
    # PII (Targeted by NER: givenname/lastname/email/phone/ssn/national_id and Regex: email/phone/aadhaar/ssn/pan/passport/voter_id)
    "FIRSTNAME": "PII",
    "LASTNAME": "PII",
    "MIDDLENAME": "PII",
    "NAME": "PII",
    "EMAIL": "PII",
    "PHONENUMBER": "PII",
    "SOCIALNUMBER": "PII",
    "SSN": "PII",
    "PASSPORT": "PII",
    "DRIVERLICENSE": "PII",
    # FINANCIAL (Targeted by Regex: credit_card, iban)
    "CREDITCARD": "FINANCIAL",
    "CREDITCARDNUMBER": "FINANCIAL",
    "IBAN": "FINANCIAL",
    # CONFIDENTIAL (Targeted by Regex: jwt, aws, stripe, github_pat, private_key)
    # Note: passwords in english_pii_43k are random strings without secret keys or config syntax
    # IP (Targeted by Regex: ipv4, roadmap/ma)
    "IPV4": "IP",
    "IPV6": "IP",
}

HARD_NEGATIVE_TEMPLATES = [
    "git commit -m 'feat(auth): upgrade oauth2 token refresh logic to v2.4.1'",
    "SELECT u.id, u.created_at, count(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' GROUP BY u.id HAVING order_count > 5;",
    "docker run -d --name redis-cache -p 6379:6379 -v /data/redis:/data redis:7.2-alpine --requirepass 'mypassword123'",
    "The function calculate_bounding_box(x: int, y: int, width: int, height: int) -> Tuple[int, int, int, int]: returns normalized canvas coordinates.",
    "Kubernetes deployment status: pod/frontend-7f98b6d85c-4kx9q is running on node ip-10-0-12-84.ec2.internal.",
    "const theme = { primary: '#3B82F6', secondary: '#10B981', dark: '#1F2937', padding: '16px 24px', borderRadius: '8px' };",
    "Review roadmap milestones for Q3: 1. Deploy WASM runtime 2. Conduct load testing on WebSocket clusters.",
    "Traceback (most recent call last): File 'server.py', line 45, in handle_request res = await handler(req) ValueError: Connection reset by peer",
    "curl -X POST https://api.internal.service/v1/healthcheck -H 'Content-Type: application/json' -d '{\"status\":\"healthy\",\"uptime\":10425}'",
    "Exporting ONNX model to model.onnx with opset version 14. Graph optimization level: ORT_ENABLE_ALL.",
    "npm install --save-dev @types/node @typescript-eslint/parser vitest prettier eslint-config-prettier",
    "Refactor state management using Zustand store: create((set) => ({ count: 0, inc: () => set((state) => ({ count: state.count + 1 })) }))",
    "Nginx configuration directive: proxy_pass http://127.0.0.1:8080; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr;",
    "The current system architecture separates client-side content scripts from the offscreen document via chrome.runtime messaging.",
    "Run unit tests with coverage threshold 85%: vitest run --coverage --reporter=verbose --run",
]


def load_pii_samples(filepath: Path, limit: int = 700):
    samples = []
    if not filepath.exists():
        print(f"Warning: {filepath} not found.")
        return samples

    with open(filepath, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
            except Exception:
                continue

            text = row.get("source_text", "")
            masks = row.get("privacy_mask", [])
            expected = []
            valid = True

            for m in masks:
                val = m.get("value", "")
                lbl = m.get("label", "").upper()
                cat = TAG_TO_CATEGORY.get(lbl)
                if not cat:
                    continue

                start = m.get("start", -1)
                end = m.get("end", -1)
                if start >= 0 and end > start and text[start:end] != val:
                    valid = False
                    break

                # Ensure substring exists exactly once to guarantee deterministic character spans
                if text.count(val) != 1:
                    valid = False
                    break
                expected.append({"value": val, "category": cat, "start": start, "end": end})

            if valid and expected:
                # Ensure no overlapping expected spans
                expected.sort(key=lambda x: x["start"])
                has_overlap = any(expected[i]["end"] > expected[i+1]["start"] for i in range(len(expected)-1))
                if not has_overlap:
                    clean_expected = [{"value": x["value"], "category": x["category"]} for x in expected]
                    samples.append({
                        "id": f"prompt-pii-{row.get('id', idx)}",
                        "source": "prompt",
                        "origin": "english-pii-43k",
                        "text": text,
                        "expected": clean_expected,
                    })

            if len(samples) >= limit * 2:
                break

    random.seed(42)
    random.shuffle(samples)
    return samples[:limit]


def generate_hard_negatives(count: int = 300):
    negatives = []
    for i in range(count):
        base = HARD_NEGATIVE_TEMPLATES[i % len(HARD_NEGATIVE_TEMPLATES)]
        # Add slight variations to prevent exact line duplication
        text = f"{base} (run #{i + 1})"
        negatives.append({
            "id": f"prompt-negative-{i+1:04d}",
            "source": "prompt",
            "origin": "synthetic-technical-negative",
            "text": text,
            "expected": [],
        })
    return negatives


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--size", type=int, default=1000, help="Total corpus size (e.g. 1000)")
    parser.add_argument("--input", type=Path, default=RAW_DATASET)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)

    pos_count = int(args.size * 0.7)
    neg_count = args.size - pos_count

    print(f"Loading {pos_count} positive PII samples from {args.input}...")
    positives = load_pii_samples(args.input, limit=pos_count)

    print(f"Generating {neg_count} hard-negative technical samples...")
    negatives = generate_hard_negatives(count=neg_count)

    corpus = positives + negatives
    random.seed(42)
    random.shuffle(corpus)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(corpus, f, indent=2)

    print(f"\nSuccessfully generated {len(corpus)} benchmark items ({len(positives)} positive, {len(negatives)} negative).")
    print(f"Saved to: {args.output}")


if __name__ == "__main__":
    main()
