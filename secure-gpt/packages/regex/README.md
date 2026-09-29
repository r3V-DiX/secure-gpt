# @securegpt/regex

Browser-safe deterministic detection rules and validators. `RegexTier.run(text, config)` returns `PIIEntity[]` using the shared policy and entity types. Rules and validators are independently exported for focused tests. The detection package owns orchestration and overlap handling.

Run `npm test --workspace=@securegpt/regex` and `npm run typecheck --workspace=@securegpt/regex` from `secure-gpt/`.
