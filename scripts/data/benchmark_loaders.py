"""Loaders for verified benchmark datasets (AI4Privacy, Kiji, CoNLL-2003)."""

import json
import re
import zipfile
from pathlib import Path

AI4_SUPPORTED_TAGS = {
    "FIRSTNAME": "PII",
    "LASTNAME": "PII",
    "MIDDLENAME": "PII",
    "EMAIL": "PII",
    "PHONENUMBER": "PII",
    "SSN": "PII",
    "PASSPORT": "PII",
    "DRIVERLICENSE": "PII",
    "CREDITCARDNUMBER": "FINANCIAL",
    "IBAN": "FINANCIAL",
    "IPV4": "IP",
    "IPV6": "IP",
}

KIJI_SUPPORTED_TAGS = {
    "SECURITYTOKEN": "CONFIDENTIAL",
    "PASSWORD": "CONFIDENTIAL",
    "CREDITCARDNUMBER": "FINANCIAL",
    "IBAN": "FINANCIAL",
    "FIRSTNAME": "PII",
    "SURNAME": "PII",
    "EMAIL": "PII",
    "PHONENUMBER": "PII",
    "SSN": "PII",
    "PASSPORTID": "PII",
    "DRIVERLICENSENUM": "PII",
    "IDCARDNUM": "PII",
    "NATIONALID": "PII",
}


def load_ai4privacy_strict_samples(filepath: Path):
    samples = []
    if not filepath.exists():
        return samples

    with open(filepath, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
            except Exception:
                continue

            masks = row.get("privacy_mask", [])
            if not masks or not all(m.get("label", "") in AI4_SUPPORTED_TAGS for m in masks):
                continue

            text = row.get("source_text", "")
            expected = []
            valid = True

            for m in masks:
                val, cat = m.get("value", ""), AI4_SUPPORTED_TAGS[m["label"]]
                start, end = m.get("start", -1), m.get("end", -1)
                if start < 0 or end <= start or text[start:end] != val or text.count(val) != 1:
                    valid = False
                    break
                expected.append({"value": val, "category": cat, "start": start, "end": end})

            if not valid or not expected:
                continue

            expected.sort(key=lambda x: x["start"])
            if any(expected[i]["end"] > expected[i + 1]["start"] for i in range(len(expected) - 1)):
                continue

            samples.append({
                "id": f"ai4p-{row.get('id', idx)}",
                "source": "prompt",
                "origin": "ai4privacy-300k-strict",
                "text": text,
                "expected": [{"value": x["value"], "category": x["category"]} for x in expected],
            })
    return samples


def load_kiji_confidential_samples(parquet_path: Path):
    samples = []
    if not parquet_path.exists():
        return samples

    try:
        import pyarrow.parquet as pq
    except ImportError:
        return samples

    table = pq.read_table(str(parquet_path))
    en_rows = [r for r in table.to_pylist() if r.get("language") == "English"]

    for idx, r in enumerate(en_rows):
        masks = r.get("privacy_mask", [])
        if not masks or not any(m.get("label") in ("SECURITYTOKEN", "PASSWORD") for m in masks):
            continue

        text = r.get("text", "")
        expected, valid = [], True

        for m in masks:
            lbl = m.get("label", "")
            if lbl not in KIJI_SUPPORTED_TAGS:
                continue
            cat, val = KIJI_SUPPORTED_TAGS[lbl], m.get("value", "")
            start, end = m.get("start", -1), m.get("end", -1)
            if start < 0 or end <= start or text[start:end] != val or text.count(val) != 1:
                valid = False
                break
            expected.append({"value": val, "category": cat, "start": start, "end": end})

        if not valid or not expected:
            continue

        expected.sort(key=lambda x: x["start"])
        if any(expected[i]["end"] > expected[i + 1]["start"] for i in range(len(expected) - 1)):
            continue

        samples.append({
            "id": f"kiji-conf-{idx}",
            "source": "prompt",
            "origin": "kiji-pii-english",
            "text": text,
            "expected": [{"value": x["value"], "category": x["category"]} for x in expected],
        })
    return samples


def load_conll2003_samples(zip_path: Path):
    person_samples, clean_samples = [], []
    if not zip_path.exists():
        return person_samples, clean_samples

    with zipfile.ZipFile(str(zip_path)) as z:
        with z.open("test.txt") as f:
            lines = [line.decode("utf-8").strip() for line in f]

    sentences, curr_tokens, curr_ner = [], [], []
    for line in lines:
        if not line or line.startswith("-DOCSTART-"):
            if curr_tokens:
                sentences.append((curr_tokens, curr_ner))
                curr_tokens, curr_ner = [], []
            continue
        parts = line.split()
        if len(parts) >= 4:
            curr_tokens.append(parts[0])
            curr_ner.append(parts[3])

    for idx, (tokens, ner) in enumerate(sentences):
        if any(tag in ("B-LOC", "I-LOC", "B-ORG", "I-ORG", "B-MISC", "I-MISC") for tag in ner):
            continue

        text = re.sub(r"\s+([,.:;?!])", r"\1", " ".join(tokens))
        text = re.sub(r"\(\s+", r"(", re.sub(r"\s+\)", r")", text))

        expected, i, valid = [], 0, True
        while i < len(tokens):
            if ner[i] == "B-PER":
                p_tokens = [tokens[i]]
                j = i + 1
                while j < len(tokens) and ner[j] == "I-PER":
                    p_tokens.append(tokens[j])
                    j += 1
                name_val = " ".join(p_tokens)
                if text.count(name_val) != 1:
                    valid = False
                    break
                expected.append({"value": name_val, "category": "PII"})
                i = j
            else:
                i += 1

        if not valid:
            continue

        if expected:
            person_samples.append({
                "id": f"conll-per-{idx}",
                "source": "prompt",
                "origin": "conll2003-human-verified",
                "text": text,
                "expected": expected,
            })
        elif len(text.split()) >= 4:
            clean_samples.append({
                "id": f"conll-clean-{idx}",
                "source": "prompt",
                "origin": "conll2003-clean-zero-entity",
                "text": text,
                "expected": [],
            })

    return person_samples, clean_samples
