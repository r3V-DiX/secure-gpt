# Text detection evaluation

The reproducible runner and corpus format are in [benchmarks/detection](../../benchmarks/detection/README.md). The experiment record is in [EXP-002](../../research/experiments/detection/EXP-002/README.md).

The benchmark calls `detectPII` in Chrome with all default policy categories enabled. It reports exact entity-span precision and recall by category and input source, and attributes correct hits and false alarms by emitting tier. Each expected value must occur once in its sample so its character span is unambiguous.

The main corpus is small and intentionally diagnostic; it is not a population-level accuracy estimate. The public-derived corpus tests authentic phrasing after replacing names and contact details with fictional values. Raw Enron mail, the 43k-row dataset, and existing ID images are excluded because their per-item provenance and sharing permissions are not established for this benchmark. Add future examples only with documented source, permission, sanitization, and reviewed labels.
