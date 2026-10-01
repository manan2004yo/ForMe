$text = @"

## MASTER PLAN (single source of truth)
13. **READ ``MASTER_PLAN.md`` BEFORE ANY TASK.** It defines the frozen roadmap order, locked architecture, data rules, and open decisions. Never edit ``MASTER_PLAN.md`` yourself; change it only when the user pastes an exact update instruction, and record it in its Change log.
14. **DEVIATION CHECK.** Before executing any prompt, compare it to ``MASTER_PLAN.md``. If the prompt (a) changes or skips the roadmap order, (b) edits a LOCKED file (aiOrchestrator, productResolutionEngine, nutritionEstimator, /api/resolve-barcode), (c) bundles several roadmap steps into one, (d) uses mock data for an integration, (e) saves an unknown value as 0, (f) writes user-supplied nutrition to the shared KV cache, (g) decides one of the parked open decisions (section 8), or (h) conflicts with any other rule in ``MASTER_PLAN.md``, then STOP. Do not execute. Report which rule it conflicts with and quote the conflicting part of the prompt.
15. **DEVIATIONS NEED THE USER'S WRITTEN APPROVAL.** Only continue after the user confirms in writing that the deviation is intended. Approved deviations are recorded in the Change log of ``MASTER_PLAN.md``.
"@

Add-Content -Path "AGENTS.md" -Value $text
