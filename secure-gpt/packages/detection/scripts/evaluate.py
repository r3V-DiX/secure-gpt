#!/usr/bin/env python3
"""
SecureGPT NER Model Evaluation Script.
Loads the quantized ONNX model and evaluates it against packages/detection/dataset/example_data.jsonl.
Calculates Precision, Recall, and F1-score.
"""

import json
from pathlib import Path
import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer

# Config
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent

MODEL_DIR = PROJECT_ROOT / "packages" / "extension" / "public" / "models"
ONNX_PATH = MODEL_DIR / "pii-ner-int8.onnx"
LABEL_MAP_PATH = MODEL_DIR / "label_map.json"
DATASET_PATH = PROJECT_ROOT / "packages" / "detection" / "dataset" / "example_data.jsonl"

def load_label_map(path):
    with open(path, "r") as f:
        lbl_map = json.load(f)
    # Convert keys to int
    return {int(k): v for k, v in lbl_map.items()}

def evaluate():
    if not ONNX_PATH.exists():
        print(f"Error: ONNX model not found at {ONNX_PATH}. Please run export_ner.py first.")
        return

    if not DATASET_PATH.exists():
        print(f"Error: Dataset not found at {DATASET_PATH}.")
        return

    print("Loading label map...")
    label_map = load_label_map(LABEL_MAP_PATH)
    
    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(str(MODEL_DIR))

    print("Initializing ONNX Inference Session...")
    sess = ort.InferenceSession(str(ONNX_PATH))

    # Read dataset
    dataset = []
    with open(DATASET_PATH, "r") as f:
        for line in f:
            if line.strip():
                dataset.append(json.loads(line))

    print(f"Loaded {len(dataset)} evaluation samples.")

    # We evaluate at the token level for precision, recall, and F1.
    all_y_true = []
    all_y_pred = []
    
    for idx, sample in enumerate(dataset):
        text = sample["text"]
        entities = sample["entities"]

        # Character-level label array
        char_labels = ["O"] * len(text)
        for ent in entities:
            start, end, lbl = ent["start"], ent["end"], ent["label"]
            # Mark characters with entity label prefix B- and I-
            if start < len(text):
                char_labels[start] = f"B-{lbl}"
                for i in range(start + 1, min(end, len(text))):
                    char_labels[i] = f"I-{lbl}"

        # Tokenize text
        encoding = tokenizer(
            text,
            return_offsets_mapping=True,
            truncation=True,
            max_length=128,
            return_tensors="np"
        )
        
        input_ids = encoding["input_ids"]
        attention_mask = encoding["attention_mask"]
        offset_mapping = encoding["offset_mapping"][0]

        # Feed model
        feeds = {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
        }
        if "token_type_ids" in [i.name for i in sess.get_inputs()]:
            feeds["token_type_ids"] = np.zeros_like(input_ids)

        outputs = sess.run(None, feeds)
        logits = outputs[0][0] # Shape: (seq_len, num_labels)
        predictions = np.argmax(logits, axis=-1)

        # Align tokens with char labels
        for t_idx, pred_label_idx in enumerate(predictions):
            start_char, end_char = offset_mapping[t_idx]
            
            # Skip special tokens ([CLS], [SEP], [PAD])
            if start_char == 0 and end_char == 0:
                continue

            # Ground truth label for this token span (majority vote or start char)
            true_label = char_labels[start_char]
            pred_label = label_map.get(pred_label_idx, "O")

            # Clean prefixes (B-/I-) to get raw label class
            true_clean = true_label.split("-")[-1]
            pred_clean = pred_label.split("-")[-1]

            all_y_true.append(true_clean)
            all_y_pred.append(pred_clean)

    # Calculate metrics
    classes = sorted(list(set(all_y_true + all_y_pred) - {"O"}))
    
    print("\n" + "="*70)
    print(f"{'Class':<20} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10}")
    print("="*70)

    total_tp = 0
    total_fp = 0
    total_fn = 0

    for cls in classes:
        tp = sum(1 for t, p in zip(all_y_true, all_y_pred) if t == cls and p == cls)
        fp = sum(1 for t, p in zip(all_y_true, all_y_pred) if t != cls and p == cls)
        fn = sum(1 for t, p in zip(all_y_true, all_y_pred) if t == cls and p != cls)

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

        total_tp += tp
        total_fp += fp
        total_fn += fn

        print(f"{cls:<20} | {precision:<10.4f} | {recall:<10.4f} | {f1:<10.4f}")

    print("-"*70)
    # Overall micro averages
    micro_precision = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0.0
    micro_recall = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0.0
    micro_f1 = 2 * micro_precision * micro_recall / (micro_precision + micro_recall) if (micro_precision + micro_recall) > 0 else 0.0

    print(f"{'OVERALL (Micro)':<20} | {micro_precision:<10.4f} | {micro_recall:<10.4f} | {micro_f1:<10.4f}")
    print("="*70)

if __name__ == "__main__":
    evaluate()
