# Research findings: Text detection

EXP-002 established a browser ONNX baseline before behavior changes. Extraction into `@securegpt/regex` and `@securegpt/ner` preserved that baseline. On the ten-case diagnostic corpus, explicit-context name rules improved prompt recall from 5/7 to 7/7 and document-text recall from 4/8 to 6/8. False alarms fell from one to zero after rejecting partial NER spans.

The model still missed free-form names in the document case and all four names in the separate sanitized public-derived cases. The public-derived email was detected by regex. This supports a narrow conclusion: explicit labels can recover some missed names, while broader name recognition needs model evaluation and likely model work. These counts are not a general accuracy estimate.

See [EXP-002](../experiments/detection/EXP-002/README.md) for corpus provenance, methods, and saved reports.
