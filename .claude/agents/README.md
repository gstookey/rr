# Claude Agent Harnesses

This directory contains the custom subagents for Project Road Runner (RR). Each `*.md` file is a
custom subagent (YAML frontmatter + system prompt) that Claude Code can invoke via the
Task/Agent tool by its `name`. These mirror the Project Road Runner fleet roles defined in
`docs/context/team/agents/` so the same operating model is available in the Claude ecosystem.



## Full Fleet

| Role | Claude Harness | Model |
|------|----------------|-------|
| Lead Systems Engineer | `axium-systems-engineer.md` | fable |
| Coder | `marlow-coder.md` | opus |
| Reviewer | `verin-reviewer.md` | sonnet |
| Tester | `vera-tester.md` | sonnet |
| Fast UI Repairer | `ember-fast-ui-repairer.md` | sonnet |
| UI Designer | `cadence-ui-designer.md` | opus |
| Context Librarian | `rin-librarian.md` | fable |

Adjust per-role in the frontmatter as needed.

Per the agreed working model, the default is one well-oriented thread with lightweight
checkpoints rather than a full multi-agent fleet; harnesses are ported when a specific
role's recurring use justifies a dedicated subagent.
