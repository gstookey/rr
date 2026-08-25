#!/usr/bin/env node
/**
 * corpus-graph.mjs — the Project Road Runner (RR) in-repo corpus graph (adopted from TrAIdit 2026-08-25) (CORPUS-GRAPH-01, slices CG-1 through CG-4).
 *
 * Created: 2026-07-17 | Last updated: 2026-07-17 (CG-4: the doc-contents sidecar
 * JS as a fourth generated `index` artifact, lazy-loaded by the viewer's Contents
 * tab; CG-3: the self-contained graph viewer HTML; CG-2: founder-source status,
 * exclusion mechanism, coverage subcommand)
 *
 * Participating docs under `docs/` carry YAML frontmatter (schema `corpus-doc/v1`):
 *
 *   ---
 *   schema: corpus-doc/v1
 *   status: doctrine | accepted | active | exploratory | founder-source | historical | superseded
 *   title: <short human title>
 *   areas: [kebab-case-concept-tags]            # from scripts/corpus-graph-areas.txt
 *   claims: ["namespace:slug"]                  # OPTIONAL — shared UI resources this doc claims
 *   governs: ["repo/path/globs/**"]             # ONLY for docs that bind implementation
 *   related: ["repo-relative/paths/to/docs.md"] # edges; targets must exist
 *   superseded_by: <repo-relative path>         # only when status: superseded
 *   updated: YYYY-MM-DD
 *   ---
 *
 * Status meanings (CG-1 set + the CG-2 addition):
 *   doctrine     — binds implementation; the lookup's first-class citizens
 *   accepted     — accepted design direction / process contract of record
 *   active       — living operating doc, maintained as truth changes
 *   exploratory  — proposal/candidate material; not yet accepted, not a record
 *   founder-source — Graham-authored primary source material (braindumps, session
 *                  specs, personal notes): the raw input doctrine distills FROM
 *                  (RULED by Graham 2026-07-17). By convention founder-source docs
 *                  carry NO `governs` (source material does not bind code) —
 *                  surface any exception in review rather than tagging it.
 *   historical   — record of completed work (ledgers, review records, working notes)
 *   superseded   — replaced; `superseded_by` names the successor
 *
 * Claims (optional): `claims` names the shared UI resources a doc claims — a
 * region, a piece of shared state, a utility window, a shared primitive, a
 * user-facing name, a route — each written `namespace:slug`. The NAMESPACE must
 * appear in scripts/corpus-graph-claim-namespaces.txt; the slug is free-form
 * kebab-case and is deliberately not vocabulary-checked. `check` reports
 * CONTENTION when two docs claim the same `namespace:slug` without citing each
 * other in `related:` — the "two design docs quietly redesigning the same
 * region" failure mode. Docs with status `superseded` or `historical` are
 * records, not live claims: their claims never contend (in either direction).
 *
 * Exclusions (CG-2): scripts/corpus-graph-exclusions.txt lists repo-relative
 * path prefixes/globs that are OUT-OF-UNIVERSE for the graph (high-churn logs,
 * archive/snapshot layers, generated artifacts). Excluded paths never
 * participate, are never counted as coverage gaps, and `check` fails if an
 * excluded path carries corpus frontmatter (contradiction) or an exclusion
 * entry matches nothing (rot).
 *
 * Commands (run from anywhere; paths resolve against the repo root):
 *   node scripts/corpus-graph.mjs lookup <repo-path-or-term>
 *       The fleet's pre-build reflex: docs whose `governs` globs match the given
 *       repo path, or whose title/areas contain the term (case-insensitive).
 *       Grouped by status, doctrine first.
 *   node scripts/corpus-graph.mjs index [--check]
 *       Regenerates docs/context/corpus_graph_index_v0.md,
 *       docs/context/corpus-graph.json, docs/context/corpus_graph_viewer.html
 *       (the clickable graph GUI, rendered from
 *       scripts/corpus-graph-viewer.template.html with the graph JSON inlined —
 *       fully offline, works from file://), and docs/context/corpus_graph_content.js
 *       (the doc-contents sidecar: every tagged doc's body, frontmatter stripped,
 *       keyed by repo path — the viewer's Contents tab script-injects it lazily,
 *       because fetch/XHR are blocked on file:// while script tags are not).
 *       One frontmatter read, four artifacts; deterministic output — stable
 *       diffs, no timestamps.
 *       --check: fail (exit 1) if any generated file is stale, without writing.
 *   node scripts/corpus-graph.mjs check
 *       Lints the graph: schema/field/status violations, dangling edges,
 *       zero-match governs globs, off-vocabulary areas, malformed/off-vocabulary
 *       claims, claim contention, exclusion contradictions. Exit 1 on violations.
 *   node scripts/corpus-graph.mjs coverage
 *       Tagged / untagged / excluded counts, total and per top-level directory
 *       (sorted by untagged desc; fully-covered directories aggregate to one
 *       line). A report, not a gate — always exits 0.
 *
 * Deliberate constraints: node stdlib only (no yaml lib, no deps); the
 * frontmatter parser handles exactly the subset above — plain/quoted scalars,
 * inline flow lists, and flat block (`- item`) lists. Prose date-stamps in doc
 * bodies remain authoritative for humans; frontmatter serves machines.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS_DIR = "docs";
const AREAS_FILE = "scripts/corpus-graph-areas.txt";
const CLAIM_NAMESPACES_FILE = "scripts/corpus-graph-claim-namespaces.txt";
const EXCLUSIONS_FILE = "scripts/corpus-graph-exclusions.txt";
const GENERATED_MD = "docs/context/corpus_graph_index_v0.md";
const GENERATED_JSON = "docs/context/corpus-graph.json";
const GENERATED_HTML = "docs/context/corpus_graph_viewer.html";
const GENERATED_CONTENT = "docs/context/corpus_graph_content.js";
const TEMPLATE_HTML = "scripts/corpus-graph-viewer.template.html";
const SCHEMA_ID = "corpus-doc/v1";

/** Fixed status vocabulary and display order (doctrine always first; records last). */
const STATUS_ORDER = ["doctrine", "accepted", "active", "exploratory", "founder-source", "historical", "superseded"];

/** The closed frontmatter field set. Anything else is a check violation. */
const KNOWN_FIELDS = ["schema", "status", "title", "areas", "claims", "governs", "related", "superseded_by", "updated"];
const REQUIRED_FIELDS = ["schema", "status", "title", "areas", "updated"];
const LIST_FIELDS = new Set(["areas", "claims", "governs", "related"]);

/** A claim slug: kebab-case, no leading/trailing/double hyphens. */
const CLAIM_SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Statuses whose claims never contend. A superseded or historical doc is a
 * RECORD of a claim once made, not a live claim on the resource — contending
 * with it would make every retired design doc a permanent blocker.
 */
const CONTENTION_EXEMPT_STATUSES = new Set(["superseded", "historical"]);

/** Directory basenames never walked (generated output, deps, VCS, worktrees). */
const EXCLUDED_DIRS = new Set([".git", "node_modules", "dist", "coverage", ".angular", ".claude", ".vite", ".venv"]);

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

/** Stable code-unit string compare (locale-independent, deterministic). */
function byCodeUnit(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Convert an absolute path to a repo-relative posix path. */
function relPath(abs) {
  return path.relative(REPO_ROOT, abs).split(path.sep).join("/");
}

/** Recursively list files below `absDir`, skipping EXCLUDED_DIRS, sorted. */
function walkFiles(absDir, out = []) {
  let entries;
  try {
    entries = readdirSync(absDir, { withFileTypes: true });
  } catch {
    return out;
  }
  entries.sort((a, b) => byCodeUnit(a.name, b.name));
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      walkFiles(path.join(absDir, entry.name), out);
    } else if (entry.isFile()) {
      out.push(path.join(absDir, entry.name));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Frontmatter parsing (hand-rolled for the corpus-doc/v1 subset only)
// ---------------------------------------------------------------------------

/** Strip one layer of matching single or double quotes. */
function unquote(s) {
  if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) {
    return s.slice(1, -1);
  }
  return s;
}

/** Split an inline flow-list body on commas, respecting quoted items. */
function splitInlineList(body) {
  const items = [];
  let cur = "";
  let quote = null;
  for (const ch of body) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === ",") {
      items.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim() !== "") items.push(cur.trim());
  return items.filter((x) => x !== "").map(unquote);
}

/**
 * Parse a corpus-doc/v1 frontmatter block from full file text.
 * Returns null when the file does not open with a `---` fence (non-participant),
 * else `{ fields, errors, body }` — `body` is the doc text after the closing
 * fence with leading blank lines dropped (the frontmatter-stripped "pure body"
 * the CG-4 contents sidecar emits). Parse errors surface through `check`.
 */
function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== "---") return null;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) return { fields: {}, errors: ["unterminated frontmatter block (no closing ---)"], body: "" };

  let bodyStart = end + 1;
  while (bodyStart < lines.length && lines[bodyStart].trim() === "") bodyStart++;
  const body = lines.slice(bodyStart).join("\n");

  const fields = {};
  const errors = [];
  let i = 1;
  while (i < end) {
    const raw = lines[i];
    if (raw.trim() === "") {
      i++;
      continue;
    }
    const m = raw.match(/^([A-Za-z_][A-Za-z0-9_]*):(.*)$/);
    if (!m) {
      errors.push(`unparseable frontmatter line: ${raw.trim()}`);
      i++;
      continue;
    }
    const key = m[1];
    const rest = m[2].trim();
    if (Object.prototype.hasOwnProperty.call(fields, key)) errors.push(`duplicate field: ${key}`);

    if (rest === "") {
      // Flat block list: subsequent indented `- item` lines.
      const items = [];
      let j = i + 1;
      while (j < end && /^\s+-\s+\S/.test(lines[j])) {
        items.push(unquote(lines[j].replace(/^\s+-\s+/, "").trim()));
        j++;
      }
      if (items.length === 0) {
        errors.push(`field '${key}' has no value`);
        i++;
        continue;
      }
      fields[key] = items;
      i = j;
      continue;
    }

    if (rest.startsWith("[")) {
      if (!rest.endsWith("]")) {
        errors.push(`field '${key}': inline list must open and close on the same line`);
        i++;
        continue;
      }
      fields[key] = splitInlineList(rest.slice(1, -1));
    } else {
      fields[key] = unquote(rest);
    }
    i++;
  }
  return { fields, errors, body };
}

// ---------------------------------------------------------------------------
// Glob matching (supports ** and * only — the governs subset)
// ---------------------------------------------------------------------------

/**
 * Compile a governs glob to a RegExp.
 * Semantics: `*` matches within one path segment; `**` matches any characters
 * across segments; a segment-position `**` (written between slashes) also
 * matches zero intermediate segments. Single-pass tokenizer — no placeholders.
 */
function globToRegExp(glob) {
  let out = "";
  let i = 0;
  while (i < glob.length) {
    if (glob.startsWith("/**/", i)) {
      out += "/(?:[^/]+/)*";
      i += 4;
    } else if (glob.startsWith("**", i)) {
      out += ".*";
      i += 2;
    } else if (glob[i] === "*") {
      out += "[^/]*";
      i += 1;
    } else {
      out += "\\^$.|?+()[]{}".includes(glob[i]) ? "\\" + glob[i] : glob[i];
      i += 1;
    }
  }
  return new RegExp("^" + out + "$");
}

// ---------------------------------------------------------------------------
// Graph loading
// ---------------------------------------------------------------------------

/** Load a one-term-per-line vocabulary file (# comments, blank lines ignored). */
function loadTermFile(relFile) {
  const abs = path.join(REPO_ROOT, relFile);
  if (!existsSync(abs)) return { vocab: new Set(), missing: true };
  const vocab = new Set(
    readFileSync(abs, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l !== "" && !l.startsWith("#")),
  );
  return { vocab, missing: false };
}

/** Load the area vocabulary (one kebab-case tag per line; # comments). */
function loadVocabulary() {
  return loadTermFile(AREAS_FILE);
}

/** Load the claim-namespace vocabulary (one namespace per line; # comments). */
function loadClaimNamespaces() {
  return loadTermFile(CLAIM_NAMESPACES_FILE);
}

/** Normalize a parsed field to an array (absent → empty, scalar → single item). */
function asArray(value) {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

/**
 * Split a `namespace:slug` claim string. Returns null when the shape is wrong —
 * exactly one colon, both halves non-empty. Shape only; the caller checks the
 * namespace against the vocabulary and the slug against CLAIM_SLUG_RE.
 */
function splitClaim(raw) {
  const parts = raw.split(":");
  if (parts.length !== 2) return null;
  const [namespace, slug] = parts;
  if (namespace === "" || slug === "") return null;
  return { namespace, slug };
}

/**
 * Load the exclusion list (CG-2): repo-relative path prefixes or globs, one per
 * line, each preceded by a `#` comment stating WHY it is out-of-universe.
 * A plain entry matches itself and everything beneath it (prefix semantics);
 * an entry containing `*` uses the same glob dialect as `governs`.
 */
function loadExclusions() {
  const abs = path.join(REPO_ROOT, EXCLUSIONS_FILE);
  if (!existsSync(abs)) return [];
  return readFileSync(abs, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#"))
    .map((raw) => {
      const entry = raw.replace(/\/+$/, "");
      if (entry.includes("*")) {
        const re = globToRegExp(entry);
        return { entry, test: (rel) => re.test(rel) };
      }
      return { entry, test: (rel) => rel === entry || rel.startsWith(entry + "/") };
    });
}

/** True when a repo-relative path is out-of-universe per the exclusion list. */
function isExcluded(rel, exclusions) {
  return exclusions.some((e) => e.test(rel));
}

/**
 * Scan docs/ for participating corpus docs.
 * A doc participates when it opens with a frontmatter fence containing at least
 * one known corpus field. Docs without frontmatter are simply not in the graph
 * (coverage grows at closeouts). Generated outputs and exclusion-listed paths
 * are out-of-universe — an excluded path carrying corpus frontmatter is a
 * contradiction surfaced as a problem (check fails on it) rather than a member.
 */
function loadGraph() {
  const docs = [];
  const problems = []; // { path, message }
  const exclusions = loadExclusions();
  const files = walkFiles(path.join(REPO_ROOT, DOCS_DIR)).filter((f) => f.endsWith(".md"));
  for (const abs of files) {
    const rel = relPath(abs);
    if (rel === GENERATED_MD) continue;
    const text = readFileSync(abs, "utf8");
    const parsed = parseFrontmatter(text);
    if (parsed === null) continue;
    const hasKnown = KNOWN_FIELDS.some((k) => Object.prototype.hasOwnProperty.call(parsed.fields, k));
    if (!hasKnown && parsed.errors.length === 0) continue; // a --- fence that is not ours
    if (isExcluded(rel, exclusions)) {
      problems.push({
        path: rel,
        message: `excluded path carries corpus frontmatter (${EXCLUSIONS_FILE}) — remove the frontmatter or the exclusion`,
      });
      continue;
    }
    for (const e of parsed.errors) problems.push({ path: rel, message: e });
    docs.push({ path: rel, fields: parsed.fields, body: parsed.body });
  }
  docs.sort((a, b) => byCodeUnit(a.path, b.path));
  return { docs, problems };
}

/** Normalize a doc's parsed fields into a typed node (best effort; check validates). */
function toNode(doc) {
  const f = doc.fields;
  return {
    path: doc.path,
    title: typeof f.title === "string" ? f.title : String(f.title ?? ""),
    status: typeof f.status === "string" ? f.status : String(f.status ?? ""),
    areas: asArray(f.areas),
    claims: asArray(f.claims),
    governs: asArray(f.governs),
    related: asArray(f.related),
    supersededBy: typeof f.superseded_by === "string" ? f.superseded_by : undefined,
    updated: typeof f.updated === "string" ? f.updated : String(f.updated ?? ""),
  };
}

// ---------------------------------------------------------------------------
// check
// ---------------------------------------------------------------------------

/** Full graph lint. Returns violation list; empty means green. */
function runCheckCollect() {
  const violations = [];
  const { vocab, missing } = loadVocabulary();
  if (missing) violations.push({ path: AREAS_FILE, message: "area vocabulary file is missing" });
  const { vocab: claimNamespaces, missing: claimNamespacesMissing } = loadClaimNamespaces();
  if (claimNamespacesMissing) {
    violations.push({ path: CLAIM_NAMESPACES_FILE, message: "claim-namespace vocabulary file is missing" });
  }

  const { docs, problems } = loadGraph();
  for (const p of problems) violations.push(p);

  const docPaths = new Set(docs.map((d) => d.path));
  const repoFiles = walkFiles(REPO_ROOT).map(relPath);

  // Exclusion-list rot: an entry matching no markdown file under docs/ points at
  // something renamed or deleted — fix the list rather than let it silently lie.
  const docsMd = walkFiles(path.join(REPO_ROOT, DOCS_DIR))
    .map(relPath)
    .filter((f) => f.endsWith(".md"));
  for (const ex of loadExclusions()) {
    if (!docsMd.some((f) => ex.test(f))) {
      violations.push({ path: EXCLUSIONS_FILE, message: `exclusion entry matches no docs/ markdown file: ${ex.entry}` });
    }
  }

  // claim string -> live claimants, in doc-path order (docs arrive sorted).
  const claimants = new Map();

  for (const doc of docs) {
    const rel = doc.path;
    const f = doc.fields;
    const flag = (message) => violations.push({ path: rel, message });

    for (const key of Object.keys(f)) {
      if (!KNOWN_FIELDS.includes(key)) flag(`unknown field: ${key}`);
    }
    for (const key of REQUIRED_FIELDS) {
      if (f[key] === undefined) flag(`missing required field: ${key}`);
    }
    for (const key of Object.keys(f)) {
      if (LIST_FIELDS.has(key) && !Array.isArray(f[key])) flag(`field '${key}' must be a list`);
      if (!LIST_FIELDS.has(key) && Array.isArray(f[key])) flag(`field '${key}' must be a scalar`);
    }
    if (typeof f.schema === "string" && f.schema !== SCHEMA_ID) flag(`unknown schema: ${f.schema} (expected ${SCHEMA_ID})`);
    if (typeof f.status === "string" && !STATUS_ORDER.includes(f.status)) {
      flag(`unknown status: ${f.status} (allowed: ${STATUS_ORDER.join(" | ")})`);
    }
    if (typeof f.title === "string" && f.title.trim() === "") flag("title is empty");
    if (typeof f.updated === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(f.updated)) {
      flag(`updated must be YYYY-MM-DD (got: ${f.updated})`);
    }
    if (Array.isArray(f.areas)) {
      if (f.areas.length === 0) flag("areas is empty");
      for (const a of f.areas) {
        if (!vocab.has(a)) flag(`area not in vocabulary (${AREAS_FILE}): ${a}`);
      }
    }
    if (Array.isArray(f.claims)) {
      if (f.claims.length === 0) flag("claims is empty (omit the field rather than claiming nothing)");
      for (const c of f.claims) {
        const parsed = splitClaim(c);
        if (parsed === null) {
          flag(`malformed claim (expected namespace:slug): ${c}`);
          continue;
        }
        if (!claimNamespaces.has(parsed.namespace)) {
          flag(`claim namespace not in vocabulary (${CLAIM_NAMESPACES_FILE}): ${parsed.namespace} (in ${c})`);
          continue;
        }
        if (!CLAIM_SLUG_RE.test(parsed.slug)) {
          flag(`claim slug must be kebab-case (got: ${parsed.slug} in ${c})`);
          continue;
        }
        // Only well-formed, in-vocabulary claims on live docs enter contention:
        // a malformed claim is already flagged above, and a record's claim is
        // history rather than a live hold on the resource.
        if (CONTENTION_EXEMPT_STATUSES.has(f.status)) continue;
        if (!claimants.has(c)) claimants.set(c, []);
        const holders = claimants.get(c);
        if (!holders.some((h) => h.path === rel)) holders.push({ path: rel, related: new Set(asArray(f.related)) });
      }
    }
    if (Array.isArray(f.governs)) {
      for (const g of f.governs) {
        const re = globToRegExp(g);
        if (!repoFiles.some((file) => re.test(file))) flag(`governs glob matches zero existing files: ${g}`);
      }
    }
    if (Array.isArray(f.related)) {
      for (const r of f.related) {
        if (!existsSync(path.join(REPO_ROOT, r))) flag(`dangling related path: ${r}`);
        else if (r.endsWith(".md") && !docPaths.has(r) && r !== GENERATED_MD) {
          // Existing file but not (yet) a graph participant — allowed, coverage grows at closeouts.
        }
      }
    }
    if (f.status === "superseded" && f.superseded_by === undefined) flag("status is superseded but superseded_by is missing");
    if (f.superseded_by !== undefined) {
      if (f.status !== "superseded") flag("superseded_by is only allowed when status: superseded");
      if (typeof f.superseded_by === "string" && !existsSync(path.join(REPO_ROOT, f.superseded_by))) {
        flag(`dangling superseded_by path: ${f.superseded_by}`);
      }
    }
  }

  // Claim contention: two LIVE docs holding the same `namespace:slug` are
  // redesigning the same resource. Mutual awareness is the discharge — either
  // doc citing the other in `related:` says the overlap is deliberate (a
  // successor, a companion, an explicit hand-off) rather than a collision.
  for (const claim of [...claimants.keys()].sort(byCodeUnit)) {
    const holders = claimants.get(claim);
    for (let a = 0; a < holders.length; a++) {
      for (let b = a + 1; b < holders.length; b++) {
        const [first, second] = [holders[a], holders[b]];
        if (first.related.has(second.path) || second.related.has(first.path)) continue;
        violations.push({
          path: first.path,
          message: `claim contention on '${claim}': also claimed by ${second.path} — resolve the overlap, or cite the other doc in \`related:\` to declare it deliberate`,
        });
      }
    }
  }
  return { violations, docs };
}

function cmdCheck() {
  const { violations, docs } = runCheckCollect();
  if (violations.length > 0) {
    console.error(`corpus-graph check: ${violations.length} violation(s)\n`);
    for (const v of violations) console.error(`  ${v.path}: ${v.message}`);
    process.exit(1);
  }
  const nodes = docs.map(toNode);
  const edgeCount = nodes.reduce((n, d) => n + d.related.length + (d.supersededBy ? 1 : 0), 0);
  console.log(`corpus-graph check OK — ${nodes.length} docs, ${edgeCount} edges, statuses: ${summarizeStatuses(nodes)}`);
}

function summarizeStatuses(nodes) {
  return STATUS_ORDER.map((s) => `${s} ${nodes.filter((n) => n.status === s).length}`).join(" · ");
}

// ---------------------------------------------------------------------------
// lookup
// ---------------------------------------------------------------------------

function cmdLookup(arg) {
  if (!arg) {
    console.error("usage: node scripts/corpus-graph.mjs lookup <repo-path-or-term>");
    process.exit(2);
  }
  const { docs } = loadGraph();
  const nodes = docs.map(toNode);
  const probe = arg.replace(/\\/g, "/").replace(/^\.\//, "");
  const term = arg.toLowerCase();

  const matches = nodes.filter(
    (n) =>
      n.governs.some((g) => globToRegExp(g).test(probe)) ||
      n.title.toLowerCase().includes(term) ||
      n.areas.some((a) => a.toLowerCase().includes(term)),
  );

  if (matches.length === 0) {
    console.log(`No corpus docs match "${arg}".`);
    console.log("(Graph coverage grows at closeouts — absence of a match is not proof no doctrine exists.)");
    return;
  }

  console.log(`${matches.length} doc(s) match "${arg}":\n`);
  for (const status of STATUS_ORDER) {
    const group = matches.filter((n) => n.status === status).sort((a, b) => byCodeUnit(a.path, b.path));
    if (group.length === 0) continue;
    for (const n of group) {
      console.log(`${n.status} · ${n.title} · ${n.path} · ${n.areas.join(", ")}`);
    }
    console.log("");
  }
}

// ---------------------------------------------------------------------------
// index (generation + staleness check)
// ---------------------------------------------------------------------------

/** Build the human-readable generated index (deterministic — no run timestamps). */
function buildIndexMd(nodes) {
  const lines = [];
  lines.push("<!-- GENERATED FILE — do not edit by hand. Regenerate: node scripts/corpus-graph.mjs index -->");
  lines.push("<!-- Source of truth: per-doc YAML frontmatter (schema corpus-doc/v1). Lint: node scripts/corpus-graph.mjs check -->");
  lines.push("");
  lines.push("# Corpus Graph Index v0");
  lines.push("");
  lines.push(
    "**Created:** 2026-07-17 (generated artifact — a regeneration date is deliberately omitted so diffs stay meaningful; per-doc currency lives in each doc's `updated` frontmatter field and its prose date-stamp)",
  );
  lines.push("");
  lines.push("Lookup (the pre-build reflex): `node scripts/corpus-graph.mjs lookup <repo-path-or-term>`");
  lines.push("");
  for (const status of STATUS_ORDER) {
    const group = nodes.filter((n) => n.status === status).sort((a, b) => byCodeUnit(a.path, b.path));
    lines.push(`## ${status} (${group.length})`);
    lines.push("");
    for (const n of group) {
      const areas = n.areas.join(", ");
      lines.push(`- ${n.title} — \`${n.path}\` — areas: ${areas} — governs: ${n.governs.length} — related: ${n.related.length}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Build the machine graph object (nodes + typed edges) — shared by the JSON
 * artifact and the viewer.
 *
 * `claims` is emitted only for the docs that carry one. The field is optional
 * and (today) rare, so an always-present `"claims": []` would add one dead line
 * per doc to a ~2,000-node checked-in artifact and churn the diff for nothing;
 * omission keeps the generated files byte-stable until a claim actually exists.
 * Consumers read it as "absent means none".
 */
function buildGraphObject(nodes) {
  const outNodes = nodes
    .slice()
    .sort((a, b) => byCodeUnit(a.path, b.path))
    .map((n) => ({
      path: n.path,
      title: n.title,
      status: n.status,
      areas: n.areas,
      governs: n.governs,
      ...(n.claims.length > 0 ? { claims: n.claims } : {}),
    }));
  // `related:`/`superseded_by:` may legitimately cite non-doc paths (source
  // files, packet directories) — check only requires the target to exist on
  // disk. The emitted graph must stay well-formed (every edge endpoint a
  // node), so citations of non-corpus paths are doc metadata, not edges.
  const docPaths = new Set(nodes.map((n) => n.path));
  const edges = [];
  for (const n of nodes) {
    for (const r of n.related) if (docPaths.has(r)) edges.push({ from: n.path, to: r, type: "related" });
    if (n.supersededBy && docPaths.has(n.supersededBy))
      edges.push({ from: n.path, to: n.supersededBy, type: "superseded_by" });
  }
  edges.sort((a, b) => byCodeUnit(a.from, b.from) || byCodeUnit(a.to, b.to) || byCodeUnit(a.type, b.type));
  return { schema: "corpus-graph/v1", nodes: outNodes, edges };
}

/** Serialize the machine graph artifact (byte-stable pretty JSON). */
function buildGraphJson(nodes) {
  return JSON.stringify(buildGraphObject(nodes), null, 2) + "\n";
}

/**
 * JSON-stringify for embedding in a plain script file. U+2028/U+2029 are legal
 * inside JSON strings but are line terminators to pre-ES2019 JS parsers —
 * escaping them is free, byte-stable insurance.
 */
function jsString(s) {
  return JSON.stringify(s).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

/**
 * Build the doc-contents sidecar (CG-4): every tagged doc's body, frontmatter
 * stripped at generation, keyed by repo-relative path on
 * `window.__CORPUS_DOC_CONTENT__`. The viewer's Contents tab script-injects it
 * on first use — fetch/XHR are blocked on file://, `<script src>` is not.
 *
 * Deliberately plain text (no compression/base64): git delta-compresses
 * regenerations, and one path-sorted entry per line keeps diffs line-scoped and
 * the bytes stable when nothing changed. Anomalies fail generation loudly
 * rather than emitting a lying artifact.
 */
function buildContentJs(docs) {
  const lines = [
    "// GENERATED FILE — do not edit by hand. Regenerate: node scripts/corpus-graph.mjs index",
    "// Doc bodies (frontmatter stripped) keyed by repo-relative path; lazy-loaded by",
    "// corpus_graph_viewer.html's Contents tab. Plain text on purpose: git delta-compresses",
    "// regenerations, and one path-sorted entry per line keeps diffs line-scoped.",
    "window.__CORPUS_DOC_CONTENT__ = {",
  ];
  const seen = new Set();
  for (const doc of docs) {
    if (typeof doc.body !== "string") {
      console.error(`corpus-graph index: no body captured for ${doc.path} (frontmatter parser drift?)`);
      process.exit(1);
    }
    const head = doc.body.slice(0, 512);
    if (head.startsWith("---") && head.includes(`schema: ${SCHEMA_ID}`)) {
      console.error(`corpus-graph index: frontmatter leaked into the contents body for ${doc.path}`);
      process.exit(1);
    }
    if (seen.has(doc.path)) {
      console.error(`corpus-graph index: duplicate contents key: ${doc.path}`);
      process.exit(1);
    }
    seen.add(doc.path);
    lines.push(`${jsString(doc.path)}: ${jsString(doc.body)},`);
  }
  lines.push("};");
  return lines.join("\n") + "\n";
}

/**
 * Build the self-contained graph viewer HTML (CG-3) from the authored template,
 * substituting the SAME graph data the other artifacts are generated from —
 * one frontmatter read, three artifacts, so the viewer can never drift.
 * The emitted file is generated-only and fully offline (no external requests).
 */
function buildViewerHtml(nodes) {
  const templateAbs = path.join(REPO_ROOT, TEMPLATE_HTML);
  if (!existsSync(templateAbs)) {
    console.error(`corpus-graph index: viewer template missing: ${TEMPLATE_HTML}`);
    process.exit(1);
  }
  const template = readFileSync(templateAbs, "utf8");
  const docBlock = /<!-- TEMPLATE-DOC[\s\S]*?TEMPLATE-DOC -->/;
  const placeholders = ["__CG_NODE_COUNT__", "__CG_EDGE_COUNT__", "__CG_GRAPH_JSON__", "__CG_CONTENT_SRC__"];
  for (const token of placeholders) {
    // The TEMPLATE-DOC block also *mentions* the tokens; require them outside it.
    if (!template.replace(docBlock, "").includes(token)) {
      console.error(`corpus-graph index: viewer template is missing placeholder ${token} (${TEMPLATE_HTML})`);
      process.exit(1);
    }
  }
  if (!docBlock.test(template)) {
    console.error(`corpus-graph index: viewer template is missing its TEMPLATE-DOC header block (${TEMPLATE_HTML})`);
    process.exit(1);
  }

  const graph = buildGraphObject(nodes);
  // `<` is escaped inside JSON strings so `</script>` can never terminate the
  // inline data tag; the escape round-trips through JSON.parse untouched.
  const json = JSON.stringify(graph).replace(/</g, "\\u003c");
  const header = [
    "<!-- GENERATED FILE — do not edit by hand. Regenerate: node scripts/corpus-graph.mjs index -->",
    `<!-- Authored source: ${TEMPLATE_HTML} + per-doc YAML frontmatter (schema corpus-doc/v1). Lint: node scripts/corpus-graph.mjs check -->`,
  ].join("\n");

  // Function replacements so `$`-sequences in doc titles can never be
  // interpreted as replacement patterns. The content-sidecar reference is the
  // emitted file's basename — the two artifacts are directory siblings, so the
  // viewer's lazy <script src> stays relative (file://-legal) by construction.
  const html = template
    .replace(docBlock, () => header)
    .replaceAll("__CG_NODE_COUNT__", () => String(graph.nodes.length))
    .replaceAll("__CG_EDGE_COUNT__", () => String(graph.edges.length))
    .replaceAll("__CG_GRAPH_JSON__", () => json)
    .replaceAll("__CG_CONTENT_SRC__", () => path.posix.basename(GENERATED_CONTENT));

  if (html.includes("__CG_") || html.includes("TEMPLATE-DOC")) {
    console.error(`corpus-graph index: unsubstituted placeholder left in the emitted viewer (${TEMPLATE_HTML} drifted?)`);
    process.exit(1);
  }
  return html;
}

function cmdIndex(checkOnly) {
  const { violations, docs } = runCheckCollect();
  if (violations.length > 0) {
    console.error("corpus-graph index: refusing to generate from an invalid graph — run `check` first:\n");
    for (const v of violations) console.error(`  ${v.path}: ${v.message}`);
    process.exit(1);
  }
  const nodes = docs.map(toNode);
  const md = buildIndexMd(nodes);
  const json = buildGraphJson(nodes);
  const html = buildViewerHtml(nodes);
  const contentJs = buildContentJs(docs);

  if (checkOnly) {
    let stale = [];
    for (const [rel, content] of [
      [GENERATED_MD, md],
      [GENERATED_JSON, json],
      [GENERATED_HTML, html],
      [GENERATED_CONTENT, contentJs],
    ]) {
      const abs = path.join(REPO_ROOT, rel);
      if (!existsSync(abs) || readFileSync(abs, "utf8") !== content) stale.push(rel);
    }
    if (stale.length > 0) {
      console.error(`corpus-graph index --check: STALE generated file(s): ${stale.join(", ")}`);
      console.error("Regenerate with: node scripts/corpus-graph.mjs index");
      process.exit(1);
    }
    console.log("corpus-graph index --check OK — generated files are current");
    return;
  }

  writeFileSync(path.join(REPO_ROOT, GENERATED_MD), md);
  writeFileSync(path.join(REPO_ROOT, GENERATED_JSON), json);
  writeFileSync(path.join(REPO_ROOT, GENERATED_HTML), html);
  writeFileSync(path.join(REPO_ROOT, GENERATED_CONTENT), contentJs);
  console.log(
    `corpus-graph index: wrote ${GENERATED_MD}, ${GENERATED_JSON}, ${GENERATED_HTML} and ${GENERATED_CONTENT} (${nodes.length} docs)`,
  );
}

// ---------------------------------------------------------------------------
// coverage (CG-2 — a report, not a gate; always exits 0)
// ---------------------------------------------------------------------------

/**
 * Group a repo-relative doc path into its coverage directory bucket:
 * `docs/design/v2/<area>`, `docs/context/<area>`, else the first three path
 * segments (files sitting directly in a bucket root fall to that root).
 */
function coverageGroup(rel) {
  const segs = rel.split("/");
  segs.pop(); // drop the filename
  if (segs[0] === "docs" && segs[1] === "design" && segs[2] === "v2") {
    return segs.slice(0, Math.min(4, segs.length)).join("/");
  }
  if (segs[0] === "docs" && segs[1] === "context") {
    return segs.slice(0, Math.min(3, segs.length)).join("/");
  }
  return segs.slice(0, Math.min(3, segs.length)).join("/") || "docs";
}

/** Coverage burn-down: tagged / untagged / excluded, total + per directory. */
function cmdCoverage() {
  const exclusions = loadExclusions();
  const { docs } = loadGraph();
  const tagged = new Set(docs.map((d) => d.path));
  const files = walkFiles(path.join(REPO_ROOT, DOCS_DIR))
    .map(relPath)
    .filter((f) => f.endsWith(".md"));

  const groups = new Map(); // group -> { tagged, untagged, excluded }
  const totals = { tagged: 0, untagged: 0, excluded: 0 };
  for (const rel of files) {
    const kind = tagged.has(rel) ? "tagged" : isExcluded(rel, exclusions) ? "excluded" : "untagged";
    totals[kind]++;
    const g = coverageGroup(rel);
    if (!groups.has(g)) groups.set(g, { tagged: 0, untagged: 0, excluded: 0 });
    groups.get(g)[kind]++;
  }

  console.log(
    `corpus-graph coverage — total ${files.length} · tagged ${totals.tagged} · untagged ${totals.untagged} · excluded ${totals.excluded}`,
  );
  const gaps = [...groups.entries()]
    .filter(([, c]) => c.untagged > 0)
    .sort((a, b) => b[1].untagged - a[1].untagged || byCodeUnit(a[0], b[0]));
  if (gaps.length > 0) {
    console.log("");
    console.log("untagged  tagged  excluded  directory");
    for (const [g, c] of gaps) {
      console.log(`${String(c.untagged).padStart(8)}  ${String(c.tagged).padStart(6)}  ${String(c.excluded).padStart(8)}  ${g}`);
    }
  }
  const covered = [...groups.values()].filter((c) => c.untagged === 0);
  const coveredTagged = covered.reduce((n, c) => n + c.tagged, 0);
  const coveredExcluded = covered.reduce((n, c) => n + c.excluded, 0);
  console.log("");
  console.log(
    `${covered.length} directorie(s) fully covered (${coveredTagged} tagged, ${coveredExcluded} excluded); ${gaps.length} with gaps.`,
  );
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function main() {
  const [, , cmd, ...rest] = process.argv;
  switch (cmd) {
    case "lookup":
      cmdLookup(rest.join(" "));
      break;
    case "index":
      cmdIndex(rest.includes("--check"));
      break;
    case "check":
      cmdCheck();
      break;
    case "coverage":
      cmdCoverage();
      break;
    default:
      console.error("usage: node scripts/corpus-graph.mjs <lookup <path-or-term> | index [--check] | check | coverage>");
      process.exit(2);
  }
}

main();
