# SecureGPT Research Guide & Protocol

## Overview
SecureGPT conducts data-driven experimentation to improve client-side Data Loss Prevention (DLP) accuracy across Regex (Tier 1), Named Entity Recognition (Tier 2), and OCR (Tier 3).

## Experimentation Protocol
1. **Define Hypothesis**: Articulate expected accuracy or latency impact before changing models/heuristics.
2. **Assign Experiment ID**: Create `research/experiments/<tier>/EXP-XXX/` containing `README.md`, `config.yaml`, and `notes.md`.
3. **Run Benchmark**: Execute evaluation harness (`scripts/research/run_experiment.py` or tier-specific CLI runner).
4. **Log Results**: Store raw JSON outputs in `research/experiments/<tier>/EXP-XXX/results.json`.
5. **Document Findings**: Summarize conclusions in `research/findings/<tier>.md`.
