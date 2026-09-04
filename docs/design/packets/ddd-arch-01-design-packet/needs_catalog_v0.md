---
schema: corpus-doc/v1
status: exploratory
title: DDD-ARCH-01 — Needs Catalog v0 (an event-storming aid for identifying and naming capabilities)
areas: [system-architecture, domain-driven-design, process-governance]
related: ["docs/design/packets/ddd-arch-01-design-packet/README.md", "docs/design/packets/ddd-arch-01-design-packet/context_boundary_test_v0.md", "docs/design/packets/ddd-arch-01-design-packet/tier_model_exploration_v0.md", "docs/context/platform/research/ddd_domain_driven_design_brief_v0.md"]
updated: 2026-09-03
---

# Needs Catalog v0 — an event-storming aid

**Created:** 2026-09-03 | **Last updated:** 2026-09-03 | **Author:** Axium | **Status:** `exploratory` — a *prompt list*, not a product spec. Nothing here is a requirement for RR; it is a vocabulary to hold up against what the island's experts actually say.

## How to use this in the room

A **need** is a capability the system must provide, named as a **verb-noun, customer-neutral** phrase ("Approve a plan", never "Customer B's approval"). In a Big Picture EventStorming session (R1 §5.1; Brandolini), needs surface as **clusters of domain events** — orange stickies, past tense, "Plan approved" — arranged on a timeline, with **pivotal events** marking where one cluster hands off to another. Those clusters, plus the words the experts use for them, are your **candidate bounded contexts**, and therefore your candidate Floors and Suites.

This catalog exists because a blank wall is hard. Use it three ways:

1. **Priming.** Before the session, read the families and pick the ten that smell like RR. Do not show the list to the experts first — let them put their own words on the wall, *then* use the catalog to ask "you have not mentioned X; is that because it does not exist here, or because someone else owns it?"
2. **Naming.** When a cluster forms, find the nearest catalog need and take its verb-noun shape. Keep the experts' *noun*; the catalog only lends the *shape*.
3. **Splitting.** The **same-word traps** table (§3) is the list of words most likely to mean two things in one room. When one appears, run the [Context Boundary Test](context_boundary_test_v0.md) check 1 on the spot.

A need is *not* a screen, a table, or a team. If a candidate can only be described as "the X page" or "what Team Y does", it is not yet a need.

## 1. Running the session on the island (no agents, paper is fine)

| Step | What happens | Output |
|---|---|---|
| 0. Invite | Every group that will use the system sends someone who *does the work*, not a manager. Plus one facilitator, one scribe, the lexicon owner (register Q12). | attendance by group |
| 1. Chaotic exploration (45–60 min) | Everyone writes domain events (past tense, orange) and sticks them on a long wall, no order | hundreds of events |
| 2. Timeline (30 min) | Sort left to right in time; duplicates merge; **disagreements stay as hotspots** (pink) — never averaged | ordered timeline, hotspots |
| 3. Pivotal events (15 min) | Mark the 5–10 events where "the thing changes hands or changes nature" with vertical tape | the first boundary candidates |
| 4. People and systems (30 min) | Who triggers each event (yellow), which external system is involved (light pink) | actors, integrations |
| 5. Swimlanes and vocabulary (30 min) | Group events between pivotal lines; ask each cluster "what do *you* call this thing?" — write the nouns on a lexicon card per cluster | candidate contexts with their words |
| 6. Same-word sweep (20 min) | Walk §3; for every word used by two clusters, ask "same meaning?" | boundary hits, ACL candidates |
| 7. Needs list (20 min) | One verb-noun per cluster or sub-cluster; classify core / supporting / generic (R1 §5.1) | the needs list — input to the Floor list |

Photograph everything. The scribe transcribes the lexicon cards and the needs list the same day; those two artefacts, not the photos, are what cross the fence to this side.

## 2. The catalog — need families

Each family lists needs in verb-noun form, the **events** most likely to appear on the wall, the **nouns** the experts will fight over, and the **split question** that reveals whether the family hides two contexts. Core / supporting / generic is the *usual* classification — RR's real one comes from the room.

### 2.1 Identity, access and administration *(usually generic — the IdP's job, R4)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Onboard a user | User invited · Account created · Credential enrolled | user, account, principal | Is "user" a person, a device, or a service? |
| Delegate group administration | Admin role granted · Member added to group by group admin | group, organisation, role | Is a "group" a need-to-know compartment or an org unit? (R5 Q3) |
| Grant / revoke entitlement | Entitlement granted · Entitlement expired | entitlement, permission, claim | Time-boxed or standing? Who audits? |
| Authenticate / step up | Signed in · Step-up satisfied · Session ended | session, factor, CAC | Which factors, per group? |
| Attest access periodically | Access review opened · Access certified · Access revoked | review, attestation | Whose calendar drives it? |

### 2.2 Approval, review, release and authority *(the family most likely to hide two contexts)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Approve a plan / request | Submitted for approval · Approved · Rejected · Returned for rework | approval, sign-off, approver | Is approval *a decision about content* or *a gate in a process*? |
| Review a document | Review assigned · Comment added · Review completed | review, reviewer, finding | Review as quality check vs review as authorisation? |
| Release across a boundary | Marked for release · Human review recorded · Released · Rejected by guard | release, downgrade, RHR | A **different word from approval** — is it a different lifecycle? (Boundary Test example C) |
| Authorise to proceed / go-no-go | Authorisation granted · Hold placed · Hold lifted | authorisation, hold, waiver | Who can lift a hold, and is that the same person who granted? |
| Grant a waiver / exception | Waiver requested · Waiver granted · Waiver expired | waiver, deviation, exception | Waivers against *which* rule set? |
| Sign / countersign | Signed · Countersigned · Signature invalidated | signature, attestation | Legal signature vs workflow acknowledgement? |

### 2.3 Planning, scheduling and tasking *(often core)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Plan an activity | Plan drafted · Plan revised · Plan baselined | plan, activity, mission, sortie, job | Does "plan" mean *intent* or *schedule*? |
| Schedule / deconflict | Slot requested · Conflict detected · Slot confirmed | schedule, slot, window, conflict | Deconfliction against *whose* resources? |
| Allocate a resource | Resource reserved · Resource released · Over-allocation flagged | resource, asset, crew, capacity | Allocation vs assignment vs ownership? |
| Task / assign work | Task created · Task assigned · Task accepted · Task completed | task, tasking, assignment, ticket | Is a "task" an order, a to-do, or a unit of work? |
| Sequence / prioritise | Priority set · Order changed · Preempted | priority, precedence, queue | Who may preempt whom? |
| Rehearse / dry-run a plan | Rehearsal started · Deviation noted · Rehearsal closed | rehearsal, dry run, exercise | Same plan model, or a copy that may diverge? |

### 2.4 Requesting and fulfilment *(supporting)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Raise a request | Request raised · Request triaged · Request prioritised | request, requirement, demand, RFI | Request for a thing vs request for a decision? |
| Fulfil / deliver | Fulfilment started · Delivered · Accepted by requester | delivery, fulfilment, order | Who declares "done" — provider or requester? |
| Track a request to closure | Status changed · Escalated · Closed | status, SLA, escalation | Closure = delivered, or = accepted? |

### 2.5 Tracking, monitoring and alerting *(supporting, sometimes core)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Track status of a thing | Status reported · Status derived · Status stale | status, state, health, readiness | Reported by a human vs derived by the system? |
| Monitor a feed / threshold | Reading received · Threshold crossed · Reading missing | reading, telemetry, feed, sensor | Raw readings vs interpreted state? |
| Alert and acknowledge | Alert raised · Alert acknowledged · Alert cleared · Alert escalated | alert, alarm, notification, warning | Alert (needs action) vs notification (FYI)? |
| Watch / subscribe | Watch set · Watch triggered · Watch removed | watch, subscription, interest | Per user or per group? |

### 2.6 Records, documents and content *(supporting)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Author a document | Draft created · Draft edited · Draft submitted | document, record, artefact, product | Document as *content* vs document as *evidence*? |
| Version and baseline | Version minted · Baseline set · Superseded | version, revision, baseline, edition | Linear versions or branches? |
| Publish / distribute | Published · Distributed to · Withdrawn | publication, distribution, dissemination | Distribution list = access control, or = notification? |
| Retain / dispose | Retention applied · Legal hold placed · Disposed | retention, hold, disposition | Whose retention schedule? |
| Redact / sanitise | Redaction applied · Sanitised copy produced | redaction, sanitisation, portion | Redaction for release (R6) vs for privacy? |

### 2.7 Configuration and change management *(supporting; core if the product is a CM system)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Baseline a configuration | Baseline established · Baseline audited | baseline, configuration item, CI | CI of software, hardware, or documents? |
| Raise / approve a change | Change requested · Impact assessed · Change approved · Change implemented | change request, ECP, deviation | Approval here vs §2.2 — same board, same rules? |
| Release a version | Release candidate cut · Release approved · Release deployed | release (of software) | **Same word as §2.2's release; almost never the same meaning** |
| Track deployment state | Deployed to · Rolled back · Verified in environment | deployment, environment, island | Environment = network, cluster, or site? |

### 2.8 Inventory, assets and logistics *(supporting)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Register an asset | Asset registered · Asset tagged · Asset retired | asset, item, equipment, unit | Serialised individual vs fungible stock? |
| Check out / check in | Checked out to · Returned · Overdue | custody, loan, custodian | Custody vs allocation (§2.3)? |
| Maintain an asset | Fault reported · Work order opened · Repair completed · Asset returned to service | work order, fault, maintenance action | Maintenance planning vs execution? |
| Manage stock / parts | Stock received · Stock consumed · Reorder triggered | stock, part, consumable, lot | Lot-tracked or not? |
| Move / ship | Shipment created · In transit · Received | shipment, movement, transfer | Physical transfer vs cross-domain transfer (§2.11)? |

### 2.9 Reporting, analytics and decision support *(generic unless it is the product)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Produce a periodic report | Report generated · Report submitted · Report acknowledged | report, return, summary | Report = document (§2.6) or = query result? |
| Aggregate / roll up | Rollup computed · Figure disputed · Figure corrected | metric, KPI, figure, rollup | Who owns the definition of each figure? |
| Compare scenarios | Scenario created · Scenario run · Scenarios compared | scenario, case, run, what-if | Scenario data separate from live data? |
| Recommend / advise | Recommendation produced · Recommendation accepted / overridden | recommendation, advisory, score | Advisory only, or does it act? |
| Export / hand off data | Export produced · Export marked · Export released | export, extract, product | Export to a person vs to another domain (§2.11)? |

### 2.10 Data ingest, integration and quality *(supporting; R2)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Ingest a feed | Feed received · Record parsed · Record rejected | feed, message, record, source | Push or pull; who owns the schema? |
| Validate / reconcile | Validation failed · Reconciled · Discrepancy raised | discrepancy, reconciliation, match | Reconcile against which system of record? |
| Transform / normalise | Normalised · Mapping applied · Mapping changed | mapping, schema, canonical form | Whose canonical form? |
| Publish a data product | Data product published · Schema version bumped · Consumer subscribed | data product, dataset, contract | Owner = producing context (R2 §5.4) — does the room agree? |
| Catalog and search data | Asset catalogued · Tag applied · Asset found | catalog, tag, lineage, glossary | Catalog as inventory vs catalog as access gate? |

### 2.11 Cross-domain transfer and marking *(supporting; R5, R6 — only if a second security domain exists)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Mark / classify a record | Marking applied · Marking changed · Marking disputed | marking, label, classification, caveat | Marking = display vs enforcement (R5 §4.1)? |
| Prepare for transfer | Package built · Package validated against data type · Package rejected | package, data type, filter | Guard-friendly shape (R6 §4.2) — whose schema? |
| Transfer and reconcile | Sent · Received on far side · Acknowledged · Lost | transfer, crossing, ack | Is there a return channel at all (R6 Q6)? |
| Regrade / downgrade | Regrade requested · Regrade approved · Regraded | regrade, downgrade, declassification | Authority to regrade — same as §2.2 authorities? |
| Handle spillage | Spillage reported · Contained · Remediated | spillage, incident | This is §2.13's incident with a different owner — same context? |

### 2.12 Collaboration and communication *(generic)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Notify | Notification sent · Notification read | notification, message | Notification vs alert (§2.5)? |
| Comment / annotate | Comment added · Annotation attached · Thread resolved | comment, annotation, note | Comments as record (retained) vs chat (ephemeral)? |
| Hand off / shift change | Handoff started · Handoff acknowledged | handoff, turnover, watch | What state must survive a handoff? |
| Coordinate a meeting / board | Board convened · Item tabled · Decision minuted | board, meeting, minute, decision | Is the *decision* an event some other context owns? |

### 2.13 Incidents, issues and corrective action *(supporting)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Report an incident | Incident reported · Severity assigned · Incident triaged | incident, event, occurrence, mishap | Incident (something happened) vs issue (something is wrong)? |
| Investigate | Investigation opened · Finding recorded · Root cause identified | investigation, finding, cause | Findings feed which corrective process? |
| Resolve and verify | Corrective action assigned · Action verified · Incident closed | corrective action, CAPA, closure | Closure authority — same as §2.2? |
| Capture lessons | Lesson recorded · Lesson promoted · Lesson retired | lesson, observation | Knowledge (§2.6) or process (§2.7)? |

### 2.14 Compliance, audit and evidence *(supporting)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Record an auditable action | Action logged · Log sealed · Log exported | audit log, trail, evidence | Is the log a domain concern or cross-cutting? |
| Collect evidence for accreditation | Control mapped · Evidence attached · Control assessed | control, evidence, POA&M, ATO | Whose control catalogue? |
| Inspect / self-assess | Inspection scheduled · Deficiency found · Deficiency cleared | inspection, deficiency, finding | Finding here vs §2.13 finding — same thing? |
| Attest / certify | Attestation signed · Certification expired | attestation, certificate | Certificate of a person (§2.15) or of a system? |

### 2.15 People, qualification and readiness *(supporting)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Qualify / certify a person | Qualification awarded · Currency lapsed · Requalified | qualification, currency, cert, rating | Qualification = permission (§2.1) or = competence record? |
| Track availability | Available · Unavailable · On leave · Deployed | availability, roster, duty | Availability for scheduling (§2.3) — same calendar? |
| Assess readiness | Readiness computed · Readiness reported · Shortfall flagged | readiness, C-rating, shortfall | Readiness of a person, a unit, or a system? |
| Train / exercise | Course completed · Exercise conducted · Performance recorded | training, exercise, course | Training records vs qualification decisions? |

### 2.16 Situational awareness and geospatial-temporal *(core in many defence systems; otherwise generic)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Maintain a picture | Track created · Track updated · Track dropped · Picture published | track, contact, object, picture, COP | Track = a sensor thing or an intelligence thing? |
| Overlay and annotate | Overlay added · Annotation shared | overlay, layer, graphic | Overlays as data vs as presentation? |
| Correlate / fuse | Tracks correlated · Correlation rejected | correlation, fusion, association | Correlation authority — human or algorithm? |
| Replay / reconstruct | Replay started · Timeline reconstructed | replay, history, timeline | Same events as the live picture, or a derived record? |

### 2.17 Money, contracts and resources *(usually generic; appears at the edges)*
| Need | Typical events | Nouns | Split question |
|---|---|---|---|
| Budget / fund a line | Funds allocated · Funds obligated · Funds expended | budget, funding line, obligation | Is money a first-class concept or a field on a plan? |
| Contract / obligate a vendor | Contract awarded · Deliverable accepted · Invoice approved | contract, deliverable, CLIN | Approval here (§2.2) — same board? |
| Cost / estimate | Estimate produced · Actual recorded · Variance flagged | estimate, actual, variance | Estimates as plans (§2.3) or as finance? |

## 3. Same-word traps — words that most often mean two things in one room

When one of these appears on two clusters, stop and run Boundary Test check 1.

| Word | Meaning A | Meaning B | Usually resolved as |
|---|---|---|---|
| approval | decision about content | gate in a workflow | two words; or one context with rung-2 process config |
| release | authorised crossing of a boundary (§2.2/§2.11) | a software/CM version going out (§2.7) | two contexts, always |
| plan | statement of intent | schedule of resources | often two contexts (Planning vs Scheduling) with a customer-supplier relation |
| task | an order to someone | a to-do item | rung-2 config if the lifecycle is the same; else two |
| asset | serialised equipment | a document or data product | two contexts sharing a word — rename one |
| ticket / request | ask for a thing | ask for a decision | usually one context, two request *types* |
| status | reported by a person | derived by the system | one context if the derivation is transparent; else the derivation is its own context |
| report | a document (§2.6) | a query result (§2.9) | two |
| review | quality check | authorisation | see approval |
| version | linear revision | branch | decide once, globally (lexicon) |
| baseline | CM baseline | schedule baseline | two |
| incident | something happened | something is wrong | split into incident vs issue |
| finding | audit finding | investigation finding | two, unless one corrective process serves both |
| group | need-to-know compartment | organisational unit | **decide before anything else** — R5 Q3, register DA-D6 |
| customer | a tenant/group in RR | an external buyer | RR's word is *group*; reserve *customer* for the business sense |
| environment | network / island | deployment target in a cluster | fix in the lexicon (ADR-005 already uses both senses) |
| domain | security domain (R6) | DDD domain / bounded context | **say "security domain" or "bounded context" in full, always** |
| quantum | Ford/Richards architecture quantum — what deploys independently with its own data (R8) | used loosely as "bounded context" or "microservice" | a Floor is a bounded context; it becomes its own *quantum* only when promoted — see R8 §7 |
| user | a person | an account, a device, a service | fix in the lexicon (R4 glossary) |
| transfer | physical movement | cross-domain crossing | two |
| alert | needs action | for information | alert vs notification |

## 4. From needs to Floors

Once the needs list exists:

1. **Cluster needs by vocabulary**, not by who asked. Needs sharing a lexicon card are one candidate context.
2. **Classify** each candidate core / supporting / generic (R1 §5.1). Generic ones (identity, notification, audit log) are Building-level services or bought; they are not Floors.
3. **Candidate Floors = core + supporting contexts with their own language.** Sub-clusters inside a Floor's language are Suites. Single needs that are tools rather than areas are Offices.
4. **Run the Boundary Test** on every same-word hit from §3 before naming anything.
5. **Name for the capability**, customer-neutral, one meaning per word, and record the lexicon card with the name. That list goes to the decision register as the first draft of the Floor list — Graham rules it (register Q1).

## What this is not

Not a requirements list, not a feature backlog, not a claim about what RR does. Anything from this catalog that ends up in the Floor list gets there because an expert on the island put its events on the wall.
