#!/usr/bin/env python3
"""
Optimized ONNX NER export pipeline using Optimum.
Uses the pre-exported ONNX model from sfermion/bert-pii-detector-onnx,
quantizes it to INT8, and saves to the extension and detection packages.
"""

import json
import shutil
import sys
import gzip
from pathlib import Path
from huggingface_hub import snapshot_download

# ─── Config ───────────────────────────────────────────────────────────────────

MODEL_ID = "sfermion/bert-pii-detector-onnx"

SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent

EXTENSION_MODELS = PROJECT_ROOT / "packages" / "extension" / "public" / "models"
DETECTION_NER_DIR = PROJECT_ROOT / "packages" / "ner" / "src"

ONNX_FINAL = EXTENSION_MODELS / "pii-ner-int8.onnx"

EXTENSION_MODELS.mkdir(parents=True, exist_ok=True)
DETECTION_NER_DIR.mkdir(parents=True, exist_ok=True)

# ─── Dependency check ─────────────────────────────────────────────────────────

def check_deps():
    missing = []
    for pkg in ("optimum", "transformers", "torch", "onnx", "onnxruntime", "huggingface_hub"):
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)

    if missing:
        print(f"[export_ner] Missing packages: {missing}")
        print("Install with: pip install \"optimum[onnxruntime]\" transformers torch onnx onnxruntime huggingface_hub")
        sys.exit(1)

check_deps()

# ─── Imports ─────────────────────────────────────────────────────────────────

from optimum.onnxruntime import ORTQuantizer
from optimum.onnxruntime.configuration import AutoQuantizationConfig
from transformers import AutoTokenizer, AutoConfig

# ─── Step 1: Download existing ONNX model ─────────────────────────────────────

print(f"[export_ner] Downloading model snapshot: {MODEL_ID}")
# We download the full repo which already contains model.onnx (inside an 'onnx' subfolder usually)
repo_path = Path(snapshot_download(repo_id=MODEL_ID))

# Find the model.onnx file in the snapshot
onnx_files = list(repo_path.rglob("model.onnx"))
if not onnx_files:
    # If not named model.onnx, take any .onnx file
    onnx_files = list(repo_path.rglob("*.onnx"))

if not onnx_files:
    print("[export_ner] ERROR: No ONNX file found in the repository.")
    sys.exit(1)

# Optimum expects the model to be named 'model.onnx' in the directory we pass to ORTQuantizer
# and it expects tokenizer/config to be in the same directory.
# So we'll copy everything to a flat structure in a temporary location.
import tempfile
with tempfile.TemporaryDirectory() as tmp_dir:
    tmp_path = Path(tmp_dir)
    print(f"[export_ner] Preparing temporary directory for quantization...")
    
    # Copy ONNX file
    shutil.copy(str(onnx_files[0]), str(tmp_path / "model.onnx"))
    
    # Download/Save Tokenizer and Config to the same flat dir
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    config = AutoConfig.from_pretrained(MODEL_ID)
    tokenizer.save_pretrained(str(tmp_path))
    config.save_pretrained(str(tmp_path))

    # ─── Step 2: INT8 Dynamic Quantization ────────────────────────────────────

    print("[export_ner] Applying INT8 dynamic quantization...")
    
    quantizer = ORTQuantizer.from_pretrained(str(tmp_path))
    qconfig = AutoQuantizationConfig.avx512_vnni(is_static=False, per_channel=False)

    quantizer.quantize(
        save_dir=str(EXTENSION_MODELS),
        quantization_config=qconfig,
    )

    # Rename the output
    quantized_src = EXTENSION_MODELS / "model_quantized.onnx"
    if not quantized_src.exists():
        quantized_src = EXTENSION_MODELS / "model.onnx"

    if quantized_src.exists():
        if ONNX_FINAL.exists():
            ONNX_FINAL.unlink()
        shutil.move(str(quantized_src), str(ONNX_FINAL))
        print(f"[export_ner] Quantized model saved: {ONNX_FINAL}")
    else:
        print("[export_ner] ERROR: Could not find quantized model output.")
        sys.exit(1)

    # ─── Step 3: Gzip compression ─────────────────────────────────────────────

    gzip_path = str(ONNX_FINAL) + ".gz"
    print("[export_ner] Compressing model (gzip)...")
    with open(ONNX_FINAL, "rb") as f_in:
        with gzip.open(gzip_path, "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)

    # ─── Step 4: Save Label Map ───────────────────────────────────────────────

    label_map = {int(k): v for k, v in config.id2label.items()}
    with open(EXTENSION_MODELS / "label_map.json", "w") as f:
        json.dump(label_map, f, indent=2)

    # ─── Step 5: Copy Vocab to both locations ─────────────────────────────────

    vocab_src = tmp_path / "vocab.txt"
    if vocab_src.exists():
        shutil.copy(str(vocab_src), str(EXTENSION_MODELS / "vocab.txt"))
        shutil.copy(str(vocab_src), str(DETECTION_NER_DIR / "vocab.txt"))
        print("[export_ner] vocab.txt copied to both locations")
    else:
        print("[export_ner] WARNING: vocab.txt not found")

# ─── Step 6: Verify ───────────────────────────────────────────────────────────

print(f"[export_ner] Final model size: {ONNX_FINAL.stat().st_size / 1e6:.1f} MB")
print("[export_ner] Verifying model...")

import onnxruntime as ort
import numpy as np

sess = ort.InferenceSession(str(ONNX_FINAL))
ids = np.zeros((1, 64), dtype=np.int64)
mask = np.ones((1, 64), dtype=np.int64)
feeds = {"input_ids": ids, "attention_mask": mask}

if any(i.name == "token_type_ids" for i in sess.get_inputs()):
    feeds["token_type_ids"] = np.zeros((1, 64), dtype=np.int64)

out = sess.run(None, feeds)
print(f"[export_ner] Logits shape: {out[0].shape}")
print("[export_ner] Verification passed!")

print("""
DONE!
Outputs:
  packages/extension/public/models/pii-ner-int8.onnx (.gz)
  packages/extension/public/models/label_map.json
  packages/extension/public/models/vocab.txt
  packages/ner/src/vocab.txt
""")
