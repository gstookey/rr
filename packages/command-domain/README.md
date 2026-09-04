# @rr/command-domain

The **Command** Floor's domain library: value objects, view-model types and pure selectors for the Device Tasking bounded context.

**Lexicon (Graham, 2026-09-03):** *Command* capitalised is this Floor; *command* lowercase is a CQRS write message; what a Campaign delivers to a device is an **instruction**. Nothing in this package may name a device payload "command".

Same two fence rules as `@rr/invent-domain` (tags `type:domain` + `scope:command`): no Angular, no other Floor.

**S0 status:** stub. One type, so the fence has something real to guard.
