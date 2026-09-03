---
schema: corpus-doc/v1
status: exploratory
title: R5 — Mandatory Access Control (MAC) stores and label-based data research brief v0
areas: [research, access-control, security, backend]
related: ["docs/context/platform/research/README.md", "docs/context/platform/research/identity_stores_brief_v0.md", "docs/context/platform/research/cross_domain_solution_integration_brief_v0.md", "docs/context/platform/research/data_fabric_brief_v0.md"]
updated: 2026-09-03
---

# R5 — Mandatory Access Control (MAC) stores and label-based data research brief v0

**Created:** 2026-09-03 | **Last updated:** 2026-09-03 | **Author:** research agent under Axium (R5) | **Status:** exploratory — not doctrine

> **Interpretation note.** This brief reads "MAC stores / DBs" as **Mandatory Access Control** data stores: stores where access is decided by comparing a **security label on the data** against **attributes of the subject** (clearance, compartments, citizenship), enforced by the system rather than at the data owner's discretion. That is what "MAC" means in NIST SP 800-53 (AC-3(3)) and in the defense marking world, and it is the reading that fits the per-group data privilege requirement this brief feeds.
>
> **If a different "MAC" was meant, correct the commission:** (a) **Media Access Control** address stores — hardware-address inventories for network asset management (NAC/CMDB territory, not an access-control model); (b) **Message Authentication Code** stores — HMAC/tag storage for integrity verification (a cryptography topic that overlaps with the Trusted Data Format's integrity bindings, mentioned below, but is otherwise out of scope). Neither is covered further here.

## 1. TL;DR

- **MAC is a policy shape, not a product.** Data carries a label; the subject carries attributes; a rule the user cannot override compares them. NIST SP 800-53 Rev 5 AC-3(3): the policy "is uniformly enforced over all subjects and objects to which the system has control. Otherwise, the access control policy can be circumvented" [NIST, SP 800-53 Rev 5 (OSCAL), 2020](https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json). One enforcement path, everywhere.
- **Graham's per-group data privilege model is a compartment model** — the non-hierarchical half of a MAC label. "Group X may see records tagged X" is a label-vs-attribute rule, not per-group `WHERE` clauses hand-written into each service. ABAC "can be implemented as either a mandatory or discretionary form of access control" (AC-3(13)); the vocabulary is interchangeable, the discipline is not.
- **Enforcement belongs in the database and in one policy decision point (PDP); never in the UI.** The UI *displays*; the gateway *carries attributes*; the PDP *decides*; the store *enforces last*.
- **Cell-level stores (Accumulo, HBase) are mature but bring the Hadoop stack** (HDFS + ZooKeeper) [Apache Accumulo, README](https://github.com/apache/accumulo/blob/main/README.md) — a heavy tax on an island with no vendor. Take it only if requirements prove mixed-label cells inside one record, or Bigtable-scale volume.
- **The evidence points at PostgreSQL row-level security + a policy engine (OPA or Cedar) as the honest first release**: default-deny policies driven by per-transaction subject attributes, a small `Marking` value object in `common/`, and marking-rendering primitives in the Angular base library. All Apache-2.0 or PostgreSQL-licensed, all with Kubernetes operators.
- **Two PostgreSQL facts shape the design:** `sepgsql` explicitly *does not* do row-level control, and RLS is bypassed by superusers, `BYPASSRLS` roles and — by default — table owners [PostgreSQL, Row Security Policies](https://github.com/postgres/postgres/blob/master/doc/src/sgml/ddl.sgml). The application role must be none of these.
- **"You cannot see this exists" is a data-model requirement, not a UI style.** Absent, not disabled; counts, pagination totals, suggestions and 403-vs-404 leak existence as surely as a greyed-out row.
- **The unclassified base library carries marking *primitives*, never marking *data*.** Levels, compartment names, colours and banner text arrive as runtime configuration on the island, via the ConfigMap path the gateway already serves at `/api/config`.

## 2. Core concepts and vocabulary

| Term | Meaning (one meaning per word) |
|---|---|
| **MAC** (Mandatory Access Control) | System-enforced comparison of object labels against subject attributes; subjects cannot pass information or privileges on, or alter labels (NIST AC-3(3)). |
| **DAC** (Discretionary) | The owner decides who gets access and may pass that right on (AC-3(4)). Unix permissions, SQL `GRANT`. |
| **RBAC** | Permissions attached to roles. Coarse, administrable, label-blind. |
| **ABAC** | Rules over subject, action, environment and resource attributes; "can be implemented as either a mandatory or discretionary form" (AC-3(13)). How MAC is built today. |
| **Security attribute / label** | Metadata bound to information "in storage, in process, and/or in transmission" and "retained with the information" (AC-16a–b). |
| **Classification level** | The hierarchical, ordered part of a label (U < C < S < TS). |
| **Compartment / category** | The non-hierarchical part (SCI compartments, SAP names, project tags, "groups"). Set-valued, compared by subset. |
| **Dissemination control** | Caveats such as NOFORN, REL TO, ORCON constraining *who* may receive, keyed on citizenship or organisation rather than clearance. |
| **Clearance** | The subject's label: maximum level plus compartment set (plus citizenship/affiliation for dissemination). |
| **Dominance / lattice** | A dominates B if A's level ≥ B's *and* A's categories ⊇ B's [SELinux Notebook, MLS/MCS](https://github.com/SELinuxProject/selinux-notebook/blob/main/src/mls_mcs.md). Levels × category-sets form a lattice. |
| **No read up / no write down** | Bell–LaPadula's simple-security and *-properties, for confidentiality [Bell & LaPadula, MITRE MTR-2547, 1973] `[UNVERIFIED]`. |
| **Biba** | The integrity dual: no read down, no write up [Biba, MITRE MTR-3153, 1977] `[UNVERIFIED]`. Governs who may *taint* a record. |
| **MLS** | One system stores several levels and enforces between them. High assurance, rare in application software. |
| **MSL** | Separate systems per level joined by guards — the two-island/CDS model (R6). |
| **System-high** | The enclave runs at the highest level present; everyone is cleared to it; internal labels serve handling and need-to-know, not level separation. |
| **Marking** | The human-readable rendering of a label. |
| **Portion mark** | Parenthetical mark on each paragraph/field: `(U)`, `(S//NF)`. |
| **Banner line** | Overall marking at top and bottom of a page or screen. |
| **Enforcement vs display** | Enforcement stops a byte reaching a subject (AC-3). Display renders a mark so a human handles it correctly (AC-16(5)). |
| **Visibility expression** | Accumulo's boolean label grammar, e.g. `(A|B)&(C|D)` [Apache Accumulo, `ColumnVisibility` Javadoc](https://github.com/apache/accumulo/blob/main/core/src/main/java/org/apache/accumulo/core/security/ColumnVisibility.java). |
| **Authorizations** | Accumulo's term for the subject's token set; a scan may request only a subset of it. |
| **PDP / PEP** | Policy Decision Point (evaluates) vs Policy Enforcement Point (acts). OPA and Cedar are PDPs. |
| **Reference monitor** | The always-invoked, tamper-proof, verifiable mediator MAC presupposes (AC-25, cited by AC-3(3)). |
| **Regrading** | Changing a label "only via regrading mechanisms validated" by the organisation (AC-16(9)); never an ordinary `UPDATE`. |
| **TDF** | Trusted Data Format — encrypted payload plus a manifest carrying policy and key-access information [OpenTDF, spec](https://github.com/opentdf/spec). |

## 3. Canonical sources

- **Models.** Bell & LaPadula, *Secure Computer Systems: Mathematical Foundations* (MITRE, 1973); Biba, *Integrity Considerations for Secure Computer Systems* (MITRE, 1977) `[UNVERIFIED — DTIC blocked in-session]`.
- **History.** DoD 5200.28-STD, *Trusted Computer System Evaluation Criteria* ("Orange Book", 1985): from class B1 "Labeled Security Protection" upward, sensitivity labels and MAC are evaluation requirements; superseded by the Common Criteria `[UNVERIFIED]`.
- **Controls.** NIST SP 800-53 Rev 5: AC-3 with enhancements (3) MAC, (4) DAC, (13) ABAC; AC-4 and AC-4(1) (attribute-based flow: "an information object labeled Secret would be allowed to flow to a destination object labeled Secret, but an information object labeled Top Secret would not"); AC-16 with (1) dynamic association, (5) display on output, (7) consistent interpretation, (8) binding, (9) regrading — all verified verbatim from NIST's OSCAL catalog [NIST, oscal-content](https://github.com/usnistgov/oscal-content). NIST SP 800-162 is the ABAC guide `[UNVERIFIED]`.
- **Markings.** DoD Manual 5200.01 Vol 2, *Marking of Information*, and the ODNI CAPCO *Register and Manual* — the authoritative marking vocabulary `[UNVERIFIED — dni.gov and esd.whs.mil blocked]`.
- **Machine-readable markings.** IC specifications ISM.XML (attributes such as `classification`, `ownerProducer`, `SCIcontrols`, `disseminationControls`, `releasableTo`), NTK.XML and the IC TDF `[UNVERIFIED — attribute names from memory]`. OpenTDF is the open JSON successor, BSD-3-Clause-Clear [OpenTDF, spec README](https://github.com/opentdf/spec).
- **OS enforcement.** *The SELinux Notebook*, MLS/MCS chapter [SELinuxProject](https://github.com/SELinuxProject/selinux-notebook/blob/main/src/mls_mcs.md); Oracle Solaris Trusted Extensions (Trusted Solaris's descendant) `[UNVERIFIED]`.
- **Store documentation.** Accumulo authorizations [Apache](https://github.com/apache/accumulo-website/blob/main/_docs-2/security/authorizations.md); HBase `VisibilityController` [Apache](https://github.com/apache/hbase/blob/master/hbase-server/src/main/java/org/apache/hadoop/hbase/security/visibility/VisibilityController.java); PostgreSQL *Row Security Policies* and `CREATE POLICY` [PostgreSQL](https://github.com/postgres/postgres/blob/master/doc/src/sgml/ref/create_policy.sgml); `sepgsql` [PostgreSQL](https://github.com/postgres/postgres/blob/master/doc/src/sgml/sepgsql.sgml); Oracle Label Security guide `[UNVERIFIED]`; OpenSearch DLS/FLS [OpenSearch](https://github.com/opensearch-project/documentation-website/blob/main/_security/access-control/document-level-security.md); Elasticsearch DLS/FLS [Elastic](https://github.com/elastic/docs-content/blob/main/deploy-manage/users-roles/cluster-or-deployment-auth/controlling-access-at-document-field-level.md); MongoDB `$redact` and Queryable Encryption [MongoDB](https://github.com/mongodb/docs/blob/main/content/manual/manual/source/reference/operator/aggregation/redact.txt).
- **Policy engines.** OPA [CNCF, Apache-2.0](https://github.com/open-policy-agent/opa); Cedar [AWS, Apache-2.0](https://github.com/cedar-policy/cedar).

## 4. How it is done in practice

### 4.1 Where enforcement lives

```mermaid
flowchart LR
  U[Angular UI<br/>renders markings<br/>no enforcement] -->|bearer token| G[Express gateway<br/>authN, attribute injection<br/>route-level PEP]
  G -->|subject attrs + request| S[Domain service<br/>PEP]
  S -->|"subject, action, resource label"| P[PDP: OPA / Cedar<br/>label vs attribute rule]
  P -->|allow / deny| S
  S -->|SET LOCAL subject attrs<br/>in transaction| DB[(PostgreSQL<br/>RLS policies<br/>default-deny)]
  I[(Identity store R4<br/>clearance, groups,<br/>citizenship)] -->|claims| G
  DB -.->|label carried in events| B[[Event bus R3]]
  B -.->|consumers re-enforce| S
  style U fill:#333,color:#fff
```

Each layer gives a different guarantee, and the layers are not interchangeable:

| Layer | What it can honestly guarantee | What it cannot |
|---|---|---|
| **OS kernel (SELinux MLS/MCS)** | Process-to-file/socket flow control under a reference monitor; MCS is "a transparent isolation mechanism for sandbox, container, and virtualization runtimes" [SELinux Notebook](https://github.com/SELinuxProject/selinux-notebook/blob/main/src/mls_mcs.md). | Rows inside one database file. `sepgsql` bridges SELinux into Postgres for tables/columns/functions, but "PostgreSQL supports row-level access, but sepgsql does not" and it "does not try to hide the existence of a certain object" [PostgreSQL, sepgsql](https://github.com/postgres/postgres/blob/master/doc/src/sgml/sepgsql.sgml). |
| **Database (RLS, label security, cell visibility)** | The last line: survives application bugs, ad-hoc queries and forgotten `WHERE` clauses. Postgres evaluates the policy "for each row prior to any conditions or functions coming from the user's query". | Rich policy (time, purpose, citizenship) gets awkward in SQL; cross-store consistency (AC-16(7)) is not the store's job. |
| **Service + PDP (OPA/Cedar)** | Expressive, testable, one source of policy. Cedar is default-deny with analysable policies [Cedar](https://github.com/cedar-policy/cedar); OPA is a "general-purpose policy engine that enables unified, context-aware policy enforcement across the entire stack" [OPA](https://github.com/open-policy-agent/opa). | Only as good as the PEP that calls it; a code path that skips the call is an open door — hence the DB layer stays on. |
| **Gateway** | Token validation, attribute extraction, route-level coarse checks, audit. | Anything needing the object's label — the gateway does not have the row. |
| **UI** | Correct marking display (AC-16(5)), handling cues, no-leak presentation. | Enforcement of any kind. The browser is the subject's machine. |

The practical pattern is **defense in two depths**: the PDP at the service boundary (the decision you can reason about) and RLS in the store (the decision that cannot be forgotten).

### 4.2 The candidate stores

| Store | Granularity | Label model (verified source) | Maturity | Ops weight | Offline / Kubernetes | Licence |
|---|---|---|---|---|---|---|
| **Apache Accumulo** | **Cell** | Boolean expression over tokens, e.g. `(admin\|system)&audit`; users hold token sets; `VisibilityConstraint` "prevents users from writing data they cannot read" [Accumulo, Authorizations](https://github.com/apache/accumulo-website/blob/main/_docs-2/security/authorizations.md) | Very mature; the defense-community canonical (NSA origin 2008, Apache TLP 2012 `[UNVERIFIED dates]`); Bigtable-inspired [Accumulo, Design](https://github.com/apache/accumulo-website/blob/main/_docs-2/getting-started/design.md) | **Heavy**: HDFS + ZooKeeper + Java ops | No official operator found | Apache-2.0 |
| **Apache HBase** | **Cell** | Expressions evaluated by the `VisibilityController` coprocessor ("both the MasterObserver and RegionObserver"); write-side auth checks optional (`checkAuths`); system/superusers bypass [HBase, source](https://github.com/apache/hbase/blob/master/hbase-server/src/main/java/org/apache/hadoop/hbase/security/visibility/VisibilityController.java) | Mature; less label-centric culture | Heavy: HDFS + ZooKeeper | Stackable operator (OSL-3.0) [Stackable](https://github.com/stackabletech/hbase-operator) | Apache-2.0 |
| **PostgreSQL RLS** | **Row** (column via views) | SQL predicate per command; `USING` filters, `WITH CHECK` validates; permissive policies OR, restrictive AND [PostgreSQL, CREATE POLICY](https://github.com/postgres/postgres/blob/master/doc/src/sgml/ref/create_policy.sgml) | Mature (9.5+) | Light | CloudNativePG (CNCF sandbox, Apache-2.0) [CNPG](https://github.com/cloudnative-pg/cloudnative-pg); Crunchy PGO (Apache-2.0) [Crunchy](https://github.com/CrunchyData/postgres-operator) | PostgreSQL |
| **Oracle Label Security** | **Row** | Level + compartments + groups per row, compared to user authorisations `[UNVERIFIED — docs.oracle.com blocked]` | Mature commercial | Oracle DBA + licence regime | Oracle k8s operator `[UNVERIFIED]` | Commercial |
| **OpenSearch security plugin** | **Document + field** (+ masking) | DLS = query DSL on a role with `${user.name}` / `${attr.*}` substitution; "It does not restrict write operations"; roles merge with OR [OpenSearch, DLS](https://github.com/opensearch-project/documentation-website/blob/main/_security/access-control/document-level-security.md) | Mature; bundled | Moderate (JVM cluster) | Official operator (Apache-2.0) [OpenSearch](https://github.com/opensearch-project/opensearch-k8s-operator) | Apache-2.0 [security plugin](https://github.com/opensearch-project/security) |
| **Elasticsearch** | **Document + field** | Same shape (`query`, `field_security`); "meant to operate with read-only privileged accounts" [Elastic](https://github.com/elastic/docs-content/blob/main/deploy-manage/users-roles/cluster-or-deployment-auth/controlling-access-at-document-field-level.md) | Mature | Moderate | ECK operator | DLS/FLS in a paid tier `[UNVERIFIED]` |
| **MongoDB** | **Sub-document** (`$redact`); field encryption (QE) | `$redact` walks each level with `$$DESCEND/$$PRUNE/$$KEEP` against in-document tags (docs' example: `["G","STLW"]`) [MongoDB, $redact](https://github.com/mongodb/docs/blob/main/content/manual/manual/source/reference/operator/aggregation/redact.txt); QE supports "equality and range searches", automatic mode Atlas/Enterprise only [QE compat](https://github.com/mongodb/docs/blob/main/content/manual/manual/source/includes/queryable-encryption/compat/qe-mongodb-compat.rst) | `$redact` is a pipeline stage, not a policy | Moderate | MCK operator (Apache-2.0) [MongoDB](https://github.com/mongodb/mongodb-kubernetes) | SSPL |
| **Label column + PDP** (any store) | Whatever the column holds | Your value object; PDP decides | As mature as your discipline | Light | Any | — |
| **TDF / OpenTDF** | **Object** (file/message), portable | `dataAttributes` URIs `{Namespace}/attr/{Name}/value/{Value}` + optional `dissem`; KAS releases the key only if entitlements satisfy *all* attributes (allOf / anyOf / hierarchy) [OpenTDF, access control](https://github.com/opentdf/spec/blob/main/concepts/access_control.md) | Newer; Go, gRPC, LDAP/JWT entity resolution [platform](https://github.com/opentdf/platform) | Adds KAS + policy service | Containerised; Helm `[UNVERIFIED]` | BSD-3-Clause-Clear |

The cloud analogues — AWS Lake Formation LF-Tags and BigQuery policy tags (taxonomy-driven column access) — are the same idea as managed services `[UNVERIFIED — doc sites blocked]`; "label on the object, policy on the tag" is the industry-normal shape, not a defense curiosity.

### 4.3 The data model — how a label is represented and carried

Three representations recur; RR needs a mapping between them, not a choice of one:

1. **A domain value object** (`common/`) mirroring ISM's attribute names so it serialises without translation: `{ classification, ownerProducer, sciControls[], disseminationControls[], releasableTo[] }`. Store the level twice — code (`S`) and integer rank — because dominance needs an order and `ORDER BY` on strings will betray you.
2. **A visibility expression for enforcement**, Accumulo-style, derived from (1): `S&ALPHA&(USA|GBR)`. Even on Postgres a canonical expression string is a stable audit artefact and a cheap bridge to a cell store later.
3. **A portable policy for transfer**: TDF's policy object when data leaves as a file or message; ISM XML when a guard must parse it (R6).

Subject attributes arrive from the identity store (R4) as claims — clearance rank, compartment/group set, citizenship, organisation. The gateway injects them, services forward them, and the DB receives them per transaction:

```sql
-- policy keyed on per-transaction settings the service SETs (SET LOCAL ...)
CREATE POLICY read_dominated ON observation FOR SELECT USING (
  level_rank <= current_setting('rr.clearance_rank', true)::int
  AND compartments <@ string_to_array(current_setting('rr.compartments', true), ',')
  AND NOT ('NOFORN' = ANY(dissem) AND current_setting('rr.citizenship', true) <> 'USA')
);
```

RLS is "default-deny … meaning that no rows are visible" once enabled with no matching policy [PostgreSQL, Row Security](https://github.com/postgres/postgres/blob/master/doc/src/sgml/ddl.sgml), so a request that forgets to set its attributes sees nothing — the failure is closed. Two documented caveats need design: policies "are not applied when the system is performing internal referential integrity checks or validating constraints" (a unique violation can confirm a hidden row exists), and `LEAKPROOF` functions "may be evaluated before policy expressions" — never mark untrusted functions leakproof.

**Across the event bus (R3):** the label rides in envelope *and* payload; consumers re-enforce (a topic ACL is coarse, a message is not); a topic that must mix labels needs either topic-per-label or TDF-style per-object encryption with the key server as PEP. **Across domains (R6):** serialise the marking in the guard's vocabulary, never an internal enum.

### 4.4 Labels and DDD

Labels are a **cross-cutting concern with a domain footprint**. The marking value object is shared kernel — deliberately tiny: the type, its serialisation, dominance arithmetic. *Policy* is not shared kernel; it lives in one PDP so that AC-16(7)'s "consistent interpretation … between distributed system components" is achieved by having one interpreter. The anti-pattern is a label-aware kernel that grows until every bounded context imports policy helpers and the reference monitor is smeared across forty services.

On an aggregate the **root carries the overall marking** (the banner), children may carry **portion marks**, and the invariant is that the root dominates every portion (AC-16(1): aggregation can raise the whole). Regrading is a domain command with its own audit trail, not a field edit.

Read models: filtering by label at query time (RLS) is cheap; materialising per-clearance projections multiplies storage by the number of subject profiles and rots when a label changes. Prefer filtered queries until a measurement forces otherwise.

## 5. Trade-offs, anti-patterns, failure modes

- **UI-only enforcement.** The classic failure; the API is one `curl` away. Treat any front-end `*ngIf="canSee"` as decoration.
- **Existence leaks.** Counts ("1 of 27"), pagination totals, autocomplete, sort positions, `403` vs `404`, and constraint errors all reveal hidden rows. `sepgsql` is explicit that it does not hide existence; Postgres RLS is explicit about constraint side channels.
- **The privileged application role.** One shared DB role with `BYPASSRLS` or ownership silently disables the whole model. The application connects as a non-owner, non-superuser role, always.
- **Read-only assumptions in search stores.** OpenSearch and Elastic both warn DLS/FLS does not restrict writes; a searcher with index rights can overwrite documents it cannot read.
- **Role-union surprises.** Multiple roles OR their DLS queries (OpenSearch, Elastic) and permissive RLS policies OR too. Adding a role can widen access; use restrictive policies for the ceiling.
- **Labels as strings without order.** Ranking by `'SECRET' > 'CONFIDENTIAL'` alphabetically is wrong by luck alone; store rank integers.
- **Mixed-label cells forced into a row store.** If one record genuinely holds fields at different levels visible to different people, a row model needs either field-level splitting into child rows or a document/cell store. Discover this *before* choosing the store.
- **Cell-level store adopted for prestige.** Accumulo's grammar is elegant, but the operational cost is the Hadoop stack, on an island where nobody can phone Cloudera.
- **Policy in two places.** A PDP rule and an RLS policy that drift apart give two answers; keep the RLS policy mechanical (dominance) and put the nuance in the PDP.
- **Colour as the only marking.** Fails accessibility and prints in greyscale; the text is normative.

## 6. RR lens

**Enclave posture first.** Each island is almost certainly a *system-high* enclave, connected — if at all — by a CDS (R6). Inside it, level separation is done by the network; the live requirement is **compartment / need-to-know separation between groups**, the non-hierarchical half of a MAC label. That decides the store: a full MLS store is over-engineering for a system-high enclave unless a real mixed-level dataset is demonstrated.

**A minimal honest first release** (design direction, not implementation truth):

- **PostgreSQL** via CloudNativePG or Crunchy PGO, chart and images carried in the one-way bundle; RLS on every labelled table, default-deny, application role without `BYPASSRLS`; subject attributes set per transaction from gateway-forwarded claims.
- **One PDP.** OPA as a sidecar or Go binary with bundles delivered offline; or Cedar, a Rust library with default-deny semantics. Both Apache-2.0, neither needs a network. Node bindings `[UNVERIFIED — not checked]`; OPA's HTTP API from Express is the fallback.
- **`common/` carries the `Marking` value object** and dominance helpers — nothing else policy-shaped.
- **OpenSearch** only when search is required, DLS/FLS mirrored from the same attribute vocabulary, read-only search roles.
- **Defer** Accumulo/HBase (Hadoop stack), Oracle Label Security (licensing plus an Oracle estate), TDF (when data must leave the enclave as self-protecting objects — R6 territory).

**Two-island synchronisation.** The marking vocabulary is *data*, versioned and bundled like any config; the rendering and comparison code is identical on both islands. Legacy Island's Angular 19-or-22 target constrains the primitives' dependency floor, not the model.

**The front end — Building / Floor / Suite / Office.** The Building level (base library) ships marking-rendering primitives — `banner`, `portion-mark`, `marking-chip` — driven entirely by a `Marking` value and a vocabulary object delivered at runtime from `/api/config`. It ships **no** level names, compartment names, colours or banner strings; those arrive on the island. Banners render top and bottom of every screen, window and print view; portion marks precede each field or paragraph. The community colour convention (TS orange, S red, C blue, U green, TS//SCI yellow) comes from the vocabulary object, never hard-coded, never the sole cue `[UNVERIFIED as to authoritative source]`. NgRx SignalStore holds the subject's attribute set as a **display** convenience — choosing which primitives to render, never filtering data the API returned unfiltered, because the API must never return it. AstroUXDS supplies the chrome; markings are an overlay applied as tokens.

**No-leak contract with the API:** absent rows are absent from responses, totals and cursors; forbidden and non-existent resources yield the same response; suggestions are computed post-RLS.

**Per-group privileges.** "A group sees its own data" becomes: group membership = subject compartment set (R4); record tag = object compartment set; rule = subset dominance. Adding a group is adding a compartment value, not a code change.

## 7. Open questions for Graham

1. Is each island a **system-high** enclave, or does either genuinely store more than one classification level that must be separated inside the system?
2. What is the **marking vocabulary** on the target: how many levels, how many compartments/groups, which dissemination controls, and who owns changes to it?
3. Is "group" a **compartment** (need-to-know tag on data) or an **organisation** (ownership/tenancy)? The answer decides whether the rule is dominance or tenancy.
4. Does any single record hold **fields at different labels** visible to different people? This is the only fact that forces cell- or field-level storage.
5. Do markings need to be **parsed by a guard** (which format — ISM XML, TDF, custom)? That fixes the serialisation, not the store.
6. Where do **clearance and citizenship** come from on the island — an enterprise attribute service, LDAP attributes, or hand-maintained?
7. Are **regrading**, **audit of label changes** (AC-16e) and **aggregation up-labeling** (AC-16(1)) required in release one?
8. Is **search** a first-release requirement (pulls OpenSearch in) or later?
9. Will the app's database role be provisioned by the island's DBAs — and can we guarantee it is never owner or `BYPASSRLS`?

## 8. Sources

Verified in-session (fetched and quoted):

- NIST SP 800-53 Rev 5 catalog (OSCAL JSON) — AC-3, AC-3(3), AC-3(4), AC-3(13), AC-4, AC-4(1), AC-16 and enhancements. https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json
- Apache Accumulo, *Authorizations* (2.x docs source). https://github.com/apache/accumulo-website/blob/main/_docs-2/security/authorizations.md (published at https://accumulo.apache.org/docs/2.x/security/authorizations)
- Apache Accumulo, *Features* and *Design*. https://github.com/apache/accumulo-website/blob/main/_docs-2/getting-started/features.md · https://github.com/apache/accumulo-website/blob/main/_docs-2/getting-started/design.md
- Apache Accumulo, `ColumnVisibility` Javadoc. https://github.com/apache/accumulo/blob/main/core/src/main/java/org/apache/accumulo/core/security/ColumnVisibility.java
- Apache Accumulo, README (licence, HDFS/ZooKeeper). https://github.com/apache/accumulo/blob/main/README.md
- Apache HBase, `VisibilityController` source. https://github.com/apache/hbase/blob/master/hbase-server/src/main/java/org/apache/hadoop/hbase/security/visibility/VisibilityController.java
- PostgreSQL, *Row Security Policies* (ddl.sgml) and `CREATE POLICY`. https://github.com/postgres/postgres/blob/master/doc/src/sgml/ddl.sgml · https://github.com/postgres/postgres/blob/master/doc/src/sgml/ref/create_policy.sgml
- PostgreSQL, `sepgsql`. https://github.com/postgres/postgres/blob/master/doc/src/sgml/sepgsql.sgml
- OpenSearch, *Document-level security*, *Field-level security*, security plugin, k8s operator. https://github.com/opensearch-project/documentation-website/blob/main/_security/access-control/document-level-security.md · https://github.com/opensearch-project/documentation-website/blob/main/_security/access-control/field-level-security.md · https://github.com/opensearch-project/security · https://github.com/opensearch-project/opensearch-k8s-operator
- Elastic, *Controlling access at document and field level*. https://github.com/elastic/docs-content/blob/main/deploy-manage/users-roles/cluster-or-deployment-auth/controlling-access-at-document-field-level.md
- MongoDB, `$redact`; *Queryable Encryption*; QE compatibility; MongoDB Controllers for Kubernetes. https://github.com/mongodb/docs/blob/main/content/manual/manual/source/reference/operator/aggregation/redact.txt · https://github.com/mongodb/docs/blob/main/content/manual/manual/source/core/queryable-encryption.txt · https://github.com/mongodb/docs/blob/main/content/manual/manual/source/includes/queryable-encryption/compat/qe-mongodb-compat.rst · https://github.com/mongodb/mongodb-kubernetes
- The SELinux Notebook, *MLS and MCS*. https://github.com/SELinuxProject/selinux-notebook/blob/main/src/mls_mcs.md
- OpenTDF specification (README, policy object, attribute object, access-control concepts) and platform. https://github.com/opentdf/spec · https://github.com/opentdf/spec/blob/main/schema/OpenTDF/policy.md · https://github.com/opentdf/spec/blob/main/schema/OpenTDF/attributes.md · https://github.com/opentdf/spec/blob/main/concepts/access_control.md · https://github.com/opentdf/platform
- Open Policy Agent (README, Apache-2.0 LICENSE). https://github.com/open-policy-agent/opa
- Cedar policy language. https://github.com/cedar-policy/cedar
- CloudNativePG; Crunchy Data PGO; Stackable HBase operator. https://github.com/cloudnative-pg/cloudnative-pg · https://github.com/CrunchyData/postgres-operator · https://github.com/stackabletech/hbase-operator

Cited but **not fetched in-session** (`[UNVERIFIED]` — egress blocked; confirm before quoting):

- Bell, D.E. & LaPadula, L.J., *Secure Computer Systems: Mathematical Foundations*, MITRE MTR-2547 / ESD-TR-73-278, 1973. https://apps.dtic.mil/sti/citations/AD0770768
- Biba, K.J., *Integrity Considerations for Secure Computer Systems*, MITRE MTR-3153 / ESD-TR-76-372, 1977. https://apps.dtic.mil/sti/citations/ADA039324
- DoD 5200.28-STD, *Trusted Computer System Evaluation Criteria*, 1985. https://csrc.nist.gov/publications/history
- DoD Manual 5200.01 Volume 2, *Marking of Information*. https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodm/520001m_vol2.pdf
- ODNI/CAPCO, *Authorized Classification and Control Markings Register and Manual*; IC technical specifications (ISM.XML, NTK.XML, TDF). https://www.dni.gov/index.php/who-we-are/organizations/ic-cio/ic-cio-related-menus/ic-cio-related-links/ic-technical-specifications
- NIST SP 800-162, *Guide to Attribute Based Access Control (ABAC) Definition and Considerations*. https://nvlpubs.nist.gov/nistpubs/specialpublications/NIST.sp.800-162.pdf
- Oracle, *Oracle Label Security Administrator's Guide*. https://docs.oracle.com/en/database/oracle/oracle-database/23/olsag/
- Oracle, *Trusted Extensions Configuration and Administration* (Solaris 11). https://docs.oracle.com/cd/E53394_01/html/E54835/
- Apache HBase Reference Guide, *Visibility Labels*. https://hbase.apache.org/book.html#hbase.visibility.labels
- Elastic, *Subscriptions* (tier for DLS/FLS). https://www.elastic.co/subscriptions
- AWS Lake Formation, *Tag-based access control*. https://docs.aws.amazon.com/lake-formation/latest/dg/tag-based-access-control.html
- Google BigQuery, *Introduction to column-level access control*. https://cloud.google.com/bigquery/docs/column-level-security-intro
- Apache Incubator, *Accumulo proposal* (NSA origin). https://cwiki.apache.org/confluence/display/incubator/AccumuloProposal
