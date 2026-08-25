# scripts/

**Created:** 2026-08-25

| Script | Status in RR | Purpose |
|---|---|---|
| `corpus-graph.mjs` (+ `corpus-graph-areas.txt`, `corpus-graph-claim-namespaces.txt`, `corpus-graph-exclusions.txt`, `corpus-graph-viewer.template.html`, `test/corpus-graph-claims.spec.mjs`) | **live** | Doc graph: `lookup` (pre-build reflex, contract rule 17), `check` (lint), `index` (regenerate the four artifacts), `index --check`, `coverage`. |
| `snapshot-file-tree.sh` | **live** | Session-closeout `current_file_tree.txt`. Floor guard lowered to 100 lines for RR's smaller tree (2026-08-25). |
| `check-migration-collisions.mjs` | dormant | TrAIdit CI guard for migration version collisions. Keep for when RR has a migration runner; paths inside are TrAIdit's. |
| `*.example.*` (`start_traidit`, `stop_traidit`, `local-ci`, `gen-tool-cards`, `auth-break-glass`, `README.example.md`) | **reference only** | TrAIdit stack/CI scripts kept as patterns for RR's future equivalents. None run here. |
