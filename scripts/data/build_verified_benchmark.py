#!/usr/bin/env python3
"""Build a 100% verified, trusted benchmark dataset for SecureGPT detection evaluation."""

import argparse
import json
import random
from collections import Counter
from pathlib import Path

from benchmark_loaders import (
    load_ai4privacy_strict_samples,
    load_conll2003_samples,
    load_kiji_confidential_samples,
)

ROOT = Path(__file__).resolve().parents[2]
AI4PRIVACY_PATH = ROOT / "data/raw/english_pii_43k.jsonl"
KIJI_PARQUET_PATH = ROOT / "data/raw/kiji_test.parquet"
CONLL_ZIP_PATH = ROOT / "data/raw/conll2003.zip"
DEFAULT_OUTPUT = ROOT / "data/processed/benchmark_verified.json"


def main():
    parser = argparse.ArgumentParser(description="Build verified SecureGPT benchmark corpus.")
    parser.add_argument("--size", type=int, default=500, help="Total target sample count (e.g. 500 or 1000)")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Destination JSON path")
    args = parser.parse_args()

    print("\n" + "=" * 65 + "\n 🛠️  BUILDING TRUSTED & VERIFIED BENCHMARK CORPUS\n" + "=" * 65)

    print("\n1. Loading strict AI4Privacy samples (100% supported tags only)...")
    ai4_samples = load_ai4privacy_strict_samples(AI4PRIVACY_PATH)
    print(f"   Found {len(ai4_samples)} eligible, strictly complete AI4Privacy rows.")

    print("2. Loading Kiji-PII English samples (passwords, tokens)...")
    kiji_samples = load_kiji_confidential_samples(KIJI_PARQUET_PATH)
    print(f"   Found {len(kiji_samples)} eligible Kiji-PII English confidential rows.")

    print("3. Loading CoNLL-2003 human-annotated test sentences...")
    conll_per, conll_clean = load_conll2003_samples(CONLL_ZIP_PATH)
    print(f"   Found {len(conll_per)} verified Person sentences and {len(conll_clean)} clean sentences.")

    target_pos = int(args.size * 0.65)
    target_clean = args.size - target_pos

    random.seed(42)
    random.shuffle(ai4_samples)
    random.shuffle(kiji_samples)
    random.shuffle(conll_per)
    random.shuffle(conll_clean)

    pos_selected = []
    pos_selected.extend(kiji_samples[:min(len(kiji_samples), 80)])
    pos_selected.extend(conll_per[:min(len(conll_per), 100)])
    rem_pos = target_pos - len(pos_selected)
    pos_selected.extend(ai4_samples[:rem_pos])

    clean_selected = conll_clean[:target_clean]

    corpus = pos_selected + clean_selected
    random.seed(42)
    random.shuffle(corpus)

    cat_counts = Counter()
    for sample in corpus:
        for item in sample.get("expected", []):
            cat_counts[item["category"]] += 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(corpus, f, indent=2)

    print("\n" + "-" * 65 + "\n ✅ DATASET GENERATION COMPLETE\n" + "-" * 65)
    print(f"Total benchmark items: {len(corpus)}")
    print(f"  - Positive PII/Credential samples: {len(pos_selected)}")
    print(f"  - Verified 100% clean negatives:   {len(clean_selected)}")
    print("\nGround-Truth Category Distribution:")
    for cat, count in sorted(cat_counts.items()):
        print(f"  - {cat:<14}: {count} entities")
    print(f"\nSaved verified benchmark to:\n  {args.output.resolve()}\n")


if __name__ == "__main__":
    main()
