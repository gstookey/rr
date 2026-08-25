#!/bin/bash
# protect-main.sh — merge-to-main gate (post-PR-#17 governance decision, 2026-07-02).
#
# PreToolUse hook on Bash. Any command that would merge or push to main/master
# is forced to an interactive "ask" permission decision, regardless of the
# session permission mode. Graham approves the specific command or it does not
# run. Everything else exits silently with no opinion.
#
# Refinement (Graham explicit authorization, 2026-07-12): `gh pr merge` is gated
# by the TARGETED PR's BASE BRANCH, not blanket. A PR whose base is a feature/
# integration branch (task -> integration merges, delegated to the fleet) runs
# without a prompt; a PR whose base is main/master still requires Graham's
# approval; and if the base cannot be positively determined, it FAILS SAFE to a
# prompt. This tightens the gate's precision — main protection is unchanged; only
# false-positive prompts on non-main merges are removed. Do not weaken further.

input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')

ask() {
  reason=$1
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"%s"}}\n' "$reason"
  exit 0
}

current_branch() {
  git -C "${CLAUDE_PROJECT_DIR:-.}" symbolic-ref --short HEAD 2>/dev/null
}

# --- gh pr merge: gate by the PR's base branch ------------------------------
if printf '%s' "$cmd" | grep -qiE '(^|[;&|[:space:]])gh[[:space:]]+pr[[:space:]]+merge'; then
  # Require an explicit PR selector (number or URL) right after "gh pr merge".
  sel=$(printf '%s' "$cmd" | grep -oiE 'gh[[:space:]]+pr[[:space:]]+merge[[:space:]]+([0-9]+|https?://[^[:space:]]+)' | grep -oE '([0-9]+|https?://[^[:space:]]+)$' | head -n1)
  if [ -z "$sel" ]; then
    ask "MERGE GATE: the PR could not be identified (no number/URL after 'gh pr merge') — approve this merge explicitly."
  fi
  repo=$(printf '%s' "$cmd" | grep -oE '\-\-repo[[:space:]]+[^[:space:]]+' | awk '{print $2}' | head -n1)
  base=$(gh pr view "$sel" ${repo:+--repo "$repo"} --json baseRefName -q '.baseRefName' 2>/dev/null)
  if [ -z "$base" ]; then
    ask "MERGE GATE: could not determine PR #$sel's base branch — approve this merge explicitly."
  fi
  if [ "$base" = "main" ] || [ "$base" = "master" ]; then
    ask "MERGE GATE: merging PR #$sel into $base requires Graham to review the diff and approve this exact command."
  fi
  # base is a non-main feature/integration branch -> allow silently (standing authorization).
fi

# --- gh api .../merge (raw API merge — hard to introspect, stays gated) ------
if printf '%s' "$cmd" | grep -qE '(^|[;&|[:space:]])gh[[:space:]]+api[[:space:]].*/merge'; then
  ask "MERGE GATE: merging via the GitHub API requires Graham to review and approve this exact command."
fi

# --- git push --------------------------------------------------------------
if printf '%s' "$cmd" | grep -qE '(^|[;&|[:space:]])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+push'; then
  if printf '%s' "$cmd" | grep -qE '[[:space:]:](main|master)([[:space:]]|$|["'"'"'])'; then
    ask "MERGE GATE: pushing to main/master requires Graham to approve this exact command."
  fi
  if printf '%s' "$cmd" | grep -qE '\-\-force|\-\-delete|[[:space:]]-f([[:space:]]|$)'; then
    ask "MERGE GATE: force/delete pushes require Graham to approve this exact command."
  fi
  branch=$(current_branch)
  if [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
    ask "MERGE GATE: pushing while checked out on $branch requires Graham to approve this exact command."
  fi
fi

# --- git merge while on main/master ------------------------------------------
if printf '%s' "$cmd" | grep -qE '(^|[;&|[:space:]])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+merge'; then
  branch=$(current_branch)
  if [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
    ask "MERGE GATE: merging into $branch requires Graham to approve this exact command."
  fi
fi

exit 0
