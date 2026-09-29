# EXP-002: Browser text detection extraction and accuracy

- **Date:** 2026-09-29
- **Engine:** Chrome, real bundled regex rules and ONNX NER worker (no inference mock)
- **Corpora:** 10 diagnostic cases in `benchmarks/detection/corpus.json`; two separate public-derived cases in `public_corpus.json`
- **Reports:** `baseline.json` before behavior changes; `after.json` after package extraction and runtime/rule fixes; `public-derived.json` is exploratory and has no pre-change comparison

| Input group | Gold entities | Baseline recall | Final recall | Baseline false alarms | Final false alarms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Pasted prompts | 7 | 5/7 (71.4%) | 7/7 (100%) | 0 | 0 |
| Document text | 8 | 4/8 (50%) | 6/8 (75%) | 1 | 0 |

The four recovered entities are first and last names following explicit `my name is` and `Bill to` labels. Tokenizer offsets now map model labels to source characters, and partial model spans that start inside a word or number are rejected. These runtime fixes remove a false alarm but do not make the current model recognize free-form names reliably.

The two sanitized public-derived examples test authentic email and meeting-chat phrasing. Their five gold entities produced one correct email detection and four missed names. The source links and transformations are stored with each sample; [CMU describes the Enron corpus](https://www.cs.cmu.edu/~enron/) as public research data and asks users to respect privacy, and the meeting chat is a [public U.S. government record](https://open-staging.usa.gov/assets/files/05022024_OpenGov_PPCE_Listening_Session_saved_chat.pdf). No original names, email addresses, phone numbers, or credential values from those sources are in the benchmark.

**Limitations:** The datasets are too small to support a release accuracy claim. The diagnostic corpus intentionally includes rule-friendly cases; `public-derived.json` shows how much free-form name recognition still depends on model quality. The older eight-row NER dataset and the repository's larger raw corpus were not treated as verified real-world test data. Model training or replacement remains future work.
