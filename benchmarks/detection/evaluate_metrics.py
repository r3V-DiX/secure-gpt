"""Scoring, confusion matrix, and reporting helpers for detection benchmarks."""

import csv
from collections import defaultdict
from pathlib import Path

CATEGORIES = ["PII", "FINANCIAL", "CONFIDENTIAL", "IP"]


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
    """Score predicted entities against gold annotations."""
    gold = gold_spans(sample)
    matches = []
    gold_matched = set()

    for entity in entities:
        e_start = entity["startIndex"]
        e_end = entity["endIndex"]
        e_cat = entity["category"]
        e_tier = entity["tier"]
        e_type = entity.get("type", "")
        e_val = entity.get("value", sample["text"][e_start:e_end])

        matching_gold_idx = None
        for idx, (g_start, g_end, _, _) in enumerate(gold):
            if idx not in gold_matched and max(e_start, g_start) < min(e_end, g_end):
                matching_gold_idx = idx
                break

        if matching_gold_idx is not None:
            gold_matched.add(matching_gold_idx)
            _, _, g_cat, _ = gold[matching_gold_idx]
            matches.append({
                "outcome": "tp" if e_cat == g_cat else "fp",
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
                counts[match[group]][match["outcome"]] += 1
    return {
        key: {
            **val,
            "precision": round(val["tp"] / (val["tp"] + val["fp"]), 4) if val["tp"] + val["fp"] else None,
            "recall": round(val["tp"] / (val["tp"] + val["fn"]), 4) if val["tp"] + val["fn"] else None,
        }
        for key, val in sorted(counts.items())
    }


def tier_tally(rows):
    gold_count = sum(m["outcome"] in ("tp", "fn") for r in rows for m in r["matches"])
    tiers = defaultdict(lambda: {"tp": 0, "fp": 0})
    for row in rows:
        for m in row["matches"]:
            if m["outcome"] in ("tp", "fp"):
                tiers[m["tier"]][m["outcome"]] += 1
    return {
        tier: {
            **counts,
            "precision": round(counts["tp"] / (counts["tp"] + counts["fp"]), 4) if counts["tp"] + counts["fp"] else None,
            "shareOfGoldDetected": round(counts["tp"] / gold_count, 4) if gold_count else None,
        }
        for tier, counts in sorted(tiers.items())
    }


def build_confusion_matrix(rows):
    labels = CATEGORIES + ["NONE"]
    matrix = {actual: {pred: 0 for pred in labels} for actual in labels}
    for row in rows:
        for m in row["matches"]:
            matrix[m.get("gold_category", "NONE")][m.get("pred_category", "NONE")] += 1
    return matrix


def print_ascii_matrix(matrix):
    headers = CATEGORIES + ["NONE"]
    print("\n" + "=" * 76 + "\n                      CATEGORY CONFUSION MATRIX\n" + "=" * 76)
    header_line = f"{'Actual \\ Pred':<14} | " + " | ".join(f"{h:>10}" for h in headers)
    print(header_line + "\n" + "-" * len(header_line))
    for actual in headers:
        print(f"{actual:<14} | " + " | ".join(f"{matrix[actual][pred]:>10}" for pred in headers))
    print("=" * 76 + "\n")


def export_csv(rows, csv_path: Path):
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["sample_id", "source", "outcome", "gold_category", "pred_category", "tier", "type", "value"])
        for row in rows:
            for m in row["matches"]:
                writer.writerow([
                    row["id"], m["source"], m["outcome"],
                    m.get("gold_category", ""), m.get("pred_category", ""),
                    m["tier"], m["type"], m.get("value", "").replace("\n", " "),
                ])
    print(f"Exported row-level results to CSV: {csv_path}")
