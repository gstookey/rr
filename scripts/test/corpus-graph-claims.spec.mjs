import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * corpus-graph `claims:` — the optional shared-resource claim field and the
 * CONTENTION lint over it.
 *
 * WHY THESE ASSERTIONS: the field exists to catch two design docs quietly
 * redesigning the same region/state/window/primitive/name/route. So the specs
 * pin the *product* behaviors, not the plumbing:
 *   - a claim is only meaningful if its namespace comes from ONE vocabulary
 *     (an off-vocabulary namespace is a typo'd claim that would never contend);
 *   - contention must FIRE between live docs, and must NOT fire when the docs
 *     cite each other (mutual awareness = deliberate overlap);
 *   - superseded/historical docs are RECORDS — a retired design doc must never
 *     become a permanent blocker on the resource it once claimed;
 *   - `claims` stays optional: a corpus with no claims lints exactly as before.
 *
 * Every expected string/exit code below is hand-authored from the intended
 * contract, never copied out of a run.
 *
 * Mechanics: each case builds a throwaway single-purpose repo in a temp dir
 * (the tool resolves its own root from its file location), copies the REAL
 * script + the REAL claim-namespace vocabulary into it, and runs the tool as a
 * subprocess — so the specs exercise the shipped artifact, not a re-import.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.resolve(HERE, "..");
const TOOL = path.join(SCRIPTS_DIR, "corpus-graph.mjs");
const CLAIM_NAMESPACES = path.join(SCRIPTS_DIR, "corpus-graph-claim-namespaces.txt");
const VIEWER_TEMPLATE = path.join(SCRIPTS_DIR, "corpus-graph-viewer.template.html");

/** The fixture corpus' own area vocabulary — one tag, so `areas:` never distracts. */
const FIXTURE_AREAS = "# fixture area vocabulary\nlab\n";

/**
 * Build a temp repo containing the real tool + the given docs, run one
 * subcommand, and return `{ status, stdout, stderr, graphJson }` — `graphJson`
 * is the generated machine artifact's text when the run produced one (the temp
 * repo is deleted before returning, so anything a spec needs is read here).
 * `docs` maps a `docs/context/…` relative path to full file text.
 */
function runTool(subcommand, docs) {
  const root = mkdtempSync(path.join(tmpdir(), "rr-corpus-claims-"));
  try {
    mkdirSync(path.join(root, "scripts"), { recursive: true });
    mkdirSync(path.join(root, "docs", "context"), { recursive: true });
    copyFileSync(TOOL, path.join(root, "scripts", "corpus-graph.mjs"));
    copyFileSync(CLAIM_NAMESPACES, path.join(root, "scripts", "corpus-graph-claim-namespaces.txt"));
    copyFileSync(VIEWER_TEMPLATE, path.join(root, "scripts", "corpus-graph-viewer.template.html"));
    writeFileSync(path.join(root, "scripts", "corpus-graph-areas.txt"), FIXTURE_AREAS, "utf8");
    for (const [rel, text] of Object.entries(docs)) {
      mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
      writeFileSync(path.join(root, rel), text, "utf8");
    }
    const result = spawnSync(process.execPath, [path.join(root, "scripts", "corpus-graph.mjs"), subcommand], {
      encoding: "utf8",
    });
    const graphAbs = path.join(root, "docs", "context", "corpus-graph.json");
    return {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      graphJson: existsSync(graphAbs) ? readFileSync(graphAbs, "utf8") : undefined,
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/** A minimal valid corpus doc; `extra` adds frontmatter lines verbatim. */
function doc({ title, status = "active", extra = [] }) {
  return [
    "---",
    "schema: corpus-doc/v1",
    `status: ${status}`,
    `title: ${title}`,
    "areas: [lab]",
    ...extra,
    "updated: 2026-08-12",
    "---",
    "",
    `# ${title}`,
    "",
  ].join("\n");
}

describe("corpus-graph claims — the field", () => {
  it("passes a doc with well-formed, in-vocabulary claims", () => {
    const run = runTool("check", {
      "docs/context/alpha.md": doc({ title: "Alpha", extra: ['claims: ["region:lab-left-registry", "window:settings"]'] }),
    });
    assert.equal(run.status, 0, `expected a clean exit; stderr:\n${run.stderr}`);
    assert.match(run.stdout, /corpus-graph check OK/);
  });

  it("stays OPTIONAL — a corpus with no claims at all is still clean", () => {
    const run = runTool("check", {
      "docs/context/alpha.md": doc({ title: "Alpha" }),
      "docs/context/beta.md": doc({ title: "Beta" }),
    });
    assert.equal(run.status, 0, `expected a clean exit; stderr:\n${run.stderr}`);
  });

  it("rejects a claim whose NAMESPACE is off-vocabulary", () => {
    const run = runTool("check", {
      "docs/context/alpha.md": doc({ title: "Alpha", extra: ['claims: ["widget:top-bar"]'] }),
    });
    assert.equal(run.status, 1);
    assert.ok(
      run.stderr.includes(
        "docs/context/alpha.md: claim namespace not in vocabulary (scripts/corpus-graph-claim-namespaces.txt): widget (in widget:top-bar)",
      ),
      `unexpected stderr:\n${run.stderr}`,
    );
  });

  it("rejects a malformed SLUG (kebab-case only)", () => {
    const run = runTool("check", {
      "docs/context/alpha.md": doc({ title: "Alpha", extra: ['claims: ["region:Lab_Left Registry"]'] }),
    });
    assert.equal(run.status, 1);
    assert.ok(
      run.stderr.includes(
        "docs/context/alpha.md: claim slug must be kebab-case (got: Lab_Left Registry in region:Lab_Left Registry)",
      ),
      `unexpected stderr:\n${run.stderr}`,
    );
  });

  it("rejects a claim that is not `namespace:slug` at all", () => {
    const run = runTool("check", {
      "docs/context/alpha.md": doc({ title: "Alpha", extra: ['claims: ["region", "region:lab:left", ":orphan"]'] }),
    });
    assert.equal(run.status, 1);
    for (const bad of ["region", "region:lab:left", ":orphan"]) {
      assert.ok(
        run.stderr.includes(`docs/context/alpha.md: malformed claim (expected namespace:slug): ${bad}`),
        `expected a malformed-claim violation for "${bad}"; stderr:\n${run.stderr}`,
      );
    }
  });

  it("rejects an empty claims list — omit the field rather than claim nothing", () => {
    const run = runTool("check", {
      "docs/context/alpha.md": doc({ title: "Alpha", extra: ["claims: []"] }),
    });
    assert.equal(run.status, 1);
    assert.ok(
      run.stderr.includes("docs/context/alpha.md: claims is empty (omit the field rather than claiming nothing)"),
      `unexpected stderr:\n${run.stderr}`,
    );
  });
});

describe("corpus-graph claims — contention", () => {
  it("FAILS when two live docs claim the same resource, naming both paths and the claim", () => {
    const run = runTool("check", {
      "docs/context/alpha.md": doc({ title: "Alpha", extra: ['claims: ["region:lab-left-registry"]'] }),
      "docs/context/beta.md": doc({ title: "Beta", extra: ['claims: ["region:lab-left-registry"]'] }),
    });
    assert.equal(run.status, 1);
    assert.ok(
      run.stderr.includes(
        "docs/context/alpha.md: claim contention on 'region:lab-left-registry': also claimed by docs/context/beta.md",
      ),
      `unexpected stderr:\n${run.stderr}`,
    );
  });

  it("does NOT contend on merely adjacent claims in the same namespace", () => {
    const run = runTool("check", {
      "docs/context/alpha.md": doc({ title: "Alpha", extra: ['claims: ["region:lab-left-registry"]'] }),
      "docs/context/beta.md": doc({ title: "Beta", extra: ['claims: ["region:lab-right-context"]'] }),
    });
    assert.equal(run.status, 0, `expected a clean exit; stderr:\n${run.stderr}`);
  });

  it("PASSES when the claimants cite each other — one `related:` edge is enough (either direction)", () => {
    const citedByFirst = runTool("check", {
      "docs/context/alpha.md": doc({
        title: "Alpha",
        extra: ['claims: ["region:lab-left-registry"]', 'related: ["docs/context/beta.md"]'],
      }),
      "docs/context/beta.md": doc({ title: "Beta", extra: ['claims: ["region:lab-left-registry"]'] }),
    });
    assert.equal(citedByFirst.status, 0, `expected a clean exit; stderr:\n${citedByFirst.stderr}`);

    const citedBySecond = runTool("check", {
      "docs/context/alpha.md": doc({ title: "Alpha", extra: ['claims: ["region:lab-left-registry"]'] }),
      "docs/context/beta.md": doc({
        title: "Beta",
        extra: ['claims: ["region:lab-left-registry"]', 'related: ["docs/context/alpha.md"]'],
      }),
    });
    assert.equal(citedBySecond.status, 0, `expected a clean exit; stderr:\n${citedBySecond.stderr}`);
  });

  it("EXEMPTS a superseded doc — a replaced design never blocks its successor's claim", () => {
    const run = runTool("check", {
      "docs/context/alpha.md": doc({
        title: "Alpha",
        status: "superseded",
        extra: ['claims: ["region:lab-left-registry"]', "superseded_by: docs/context/beta.md"],
      }),
      "docs/context/beta.md": doc({ title: "Beta", extra: ['claims: ["region:lab-left-registry"]'] }),
    });
    assert.equal(run.status, 0, `expected a clean exit; stderr:\n${run.stderr}`);
  });

  it("EXEMPTS a historical doc — a record of past work is not a live claim", () => {
    const run = runTool("check", {
      "docs/context/alpha.md": doc({ title: "Alpha", status: "historical", extra: ['claims: ["window:settings"]'] }),
      "docs/context/beta.md": doc({ title: "Beta", extra: ['claims: ["window:settings"]'] }),
    });
    assert.equal(run.status, 0, `expected a clean exit; stderr:\n${run.stderr}`);

    const bothRecords = runTool("check", {
      "docs/context/alpha.md": doc({ title: "Alpha", status: "historical", extra: ['claims: ["window:settings"]'] }),
      "docs/context/gamma.md": doc({ title: "Gamma", status: "historical", extra: ['claims: ["window:settings"]'] }),
    });
    assert.equal(bothRecords.status, 0, `expected a clean exit; stderr:\n${bothRecords.stderr}`);
  });

  it("still fires between the two LIVE docs when a third, retired doc shares the claim", () => {
    const run = runTool("check", {
      "docs/context/alpha.md": doc({ title: "Alpha", extra: ['claims: ["state:selected-agent-id"]'] }),
      "docs/context/beta.md": doc({ title: "Beta", extra: ['claims: ["state:selected-agent-id"]'] }),
      "docs/context/gamma.md": doc({ title: "Gamma", status: "historical", extra: ['claims: ["state:selected-agent-id"]'] }),
    });
    assert.equal(run.status, 1);
    assert.ok(
      run.stderr.includes(
        "docs/context/alpha.md: claim contention on 'state:selected-agent-id': also claimed by docs/context/beta.md",
      ),
      `unexpected stderr:\n${run.stderr}`,
    );
    assert.ok(
      !run.stderr.includes("docs/context/gamma.md"),
      `the retired doc must not appear in any contention violation; stderr:\n${run.stderr}`,
    );
  });
});

describe("corpus-graph claims — vocabulary + generated index", () => {
  it("seeds exactly the six agreed namespaces", () => {
    const listed = readFileSync(CLAIM_NAMESPACES, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line !== "" && !line.startsWith("#"));
    assert.deepEqual(listed, ["region", "state", "window", "primitive", "name", "route"]);
  });

  it("emits claims into the generated graph JSON for claiming docs, and omits the key otherwise", () => {
    const run = runTool("index", {
      "docs/context/alpha.md": doc({ title: "Alpha", extra: ['claims: ["route:lab", "primitive:viz-spinner"]'] }),
      "docs/context/beta.md": doc({ title: "Beta" }),
    });
    assert.equal(run.status, 0, `expected a clean exit; stderr:\n${run.stderr}`);
    const graph = JSON.parse(run.graphJson);
    const alpha = graph.nodes.find((n) => n.path === "docs/context/alpha.md");
    const beta = graph.nodes.find((n) => n.path === "docs/context/beta.md");
    assert.deepEqual(alpha.claims, ["route:lab", "primitive:viz-spinner"], "claims survive into the machine artifact in order");
    assert.equal("claims" in beta, false, "a doc claiming nothing carries no claims key");
  });
});
