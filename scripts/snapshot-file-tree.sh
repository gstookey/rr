#!/usr/bin/env bash
#
# Regenerate current_file_tree.txt — the session-closeout repo-structure snapshot
# (Context Librarian workflow step 8). Run from anywhere:
#
#   scripts/snapshot-file-tree.sh
#
# Deliberately ONE command with no knobs. Earlier closeout runs paraphrased the
# `tree` invocation and a depth limit crept in (`tree -L 3`), silently truncating
# the snapshot from ~3,500 lines to ~100 and dropping the entire docs/ corpus.
# This script removes that surface: no flags to get wrong, and a floor guard that
# FAILS LOUDLY rather than writing a truncated stub (which also catches `tree`
# being absent, since that produces a near-empty file).
#
# The ignore set filters generated/dependency folders so the snapshot stays a
# repo-structure reference, not a build-output dump.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if ! command -v tree >/dev/null 2>&1; then
  echo "snapshot-file-tree: 'tree' is not installed (brew install tree / apt-get install tree)" >&2
  exit 1
fi

OUT="current_file_tree.txt"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

{
  echo "File tree as of $(date)"
  tree -I 'node_modules|.angular|dist|coverage|.git'
} > "$TMP"

# Floor guard (RR: tree is a few hundred lines today; TrAIdit was ~3,500).
# Anything under this means a truncated tree (stray depth limit) or missing `tree`.
MIN_LINES=100  # lowered from 1000 on 2026-08-25: RR tree is small; raise as the repo grows
lines="$(wc -l < "$TMP" | tr -d ' ')"
if [ "$lines" -lt "$MIN_LINES" ]; then
  echo "snapshot-file-tree: refusing to write — only $lines lines (expected >= $MIN_LINES)." >&2
  echo "  A truncated tree (stray depth limit?) or a missing 'tree' binary produces this." >&2
  exit 1
fi

mv "$TMP" "$OUT"
trap - EXIT
echo "snapshot-file-tree: wrote $OUT ($lines lines)"
