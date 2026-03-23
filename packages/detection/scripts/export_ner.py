# ─────────────────────────────────────────────
# NER Model Export & Quantization
# Prepares the BERT-PII model for browser use
# ─────────────────────────────────────────────

import json
import os
import shutil
import sys
from pathlib import Path

# --- Configuration ---
MODEL_ID = "sfermion/bert-pii-detector-onnx"
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent
EXTENSION_MODELS = PROJECT_ROOT / "packages/extension/public/models"
DETECTION_NER_DIR = PROJECT_ROOT / "packages/detection/src/tiers/ner"

def export_and_quantize():
    """
    Downloads the BERT-PII model, exports it to ONNX,
    applies INT8 quantization, and saves it to the extension public folder.
    """
    # 1. Ensure output directories exist
    EXTENSION_MODELS.mkdir(parents=True, exist_ok=True)
    DETECTION_NER_DIR.mkdir(parents=True, exist_ok=True)
    
    # Check for dependencies
    try:
        from optimum.onnxruntime import ORTModelForTokenClassification, ORTQuantizer
        from optimum.onnxruntime.configuration import AutoQuantizationConfig
        from transformers import AutoTokenizer, AutoConfig
    except ImportError:
        print("Error: Missing dependencies. Run:")
        print("pip install \"optimum[onnxruntime]\" transformers torch onnx")
        sys.exit(1)

    print(f"\n--- Exporting {MODEL_ID} to ONNX FP32 ---")
    
    # 2. Download and Export
    # This might take a few minutes depending on internet speed
    try:
        model = ORTModelForTokenClassification.from_pretrained(MODEL_ID, export=True)
        tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
        config = AutoConfig.from_pretrained(MODEL_ID)
    except Exception as e:
        print(f"Failed to download/export model: {str(e)}")
        sys.exit(1)
    
    temp_dir = Path("temp_onnx_export")
    model.save_pretrained(str(temp_dir))
    tokenizer.save_pretrained(str(temp_dir))

    # 3. Apply INT8 Dynamic Quantization
    print("--- Applying INT8 Quantization (Optimizing for Extension) ---")
    quantizer = ORTQuantizer.from_pretrained(str(temp_dir))
    
    # Using dynamic quantization for BERT-based token classification
    qconfig = AutoQuantizationConfig.avx512_vnni(is_static=False, per_channel=False)
    
    quantizer.quantize(
        save_dir=str(EXTENSION_MODELS),
        quantization_config=qconfig,
    )

    # 4. Finalizing Files
    # Move and rename the quantized model
    src_model = EXTENSION_MODELS / "model_quantized.onnx"
    if not src_model.exists():
        src_model = EXTENSION_MODELS / "model.onnx"
        
    final_model = EXTENSION_MODELS / "pii-ner-int8.onnx"
    shutil.move(str(src_model), str(final_model))

    # Save label_map.json for the extension (maps IDs to PII types)
    with open(EXTENSION_MODELS / "label_map.json", "w") as f:
        json.dump(config.id2label, f, indent=2)

    # Copy vocab.txt to BOTH extension (for runtime) and detection package (for build-time raw import)
    shutil.copy(str(temp_dir / "vocab.txt"), str(EXTENSION_MODELS / "vocab.txt"))
    shutil.copy(str(temp_dir / "vocab.txt"), str(DETECTION_NER_DIR / "vocab.txt"))

    # Cleanup temporary files
    if temp_dir.exists():
        shutil.rmtree(temp_dir)
        
    print(f"\n--- ✅ Success! ---")
    print(f"Model: {final_model}")
    print(f"Metadata: {EXTENSION_MODELS / 'label_map.json'}")
    print(f"Vocab updated in: {DETECTION_NER_DIR / 'vocab.txt'}")

if __name__ == "__main__":
    export_and_quantize()
