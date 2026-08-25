#!/usr/bin/env node
/**
 * gen-tool-cards.mjs — HARNESS-01 HN-S3 (HN-D2-A): generate the layer-3
 * per-tool card SKELETONS from the committed quant contract snapshots.
 *
 * THE ANTI-DRIFT MECHANISM (the `gen:quant-types` idiom, applied to doctrine):
 * a tool card's factual skeleton — id, family, dispatch shape, parameters with
 * bounds, output schema, authority posture — is emitted from the committed
 * contract artifacts, never hand-written, so a card cannot drift from the code
 * it describes. The WISDOM layer (misreads, interplay) is hand-authored
 * separately (`packages/shared/src/harness-tool-wisdom-v1.ts`) and merged at
 * assembly; this script never touches it.
 *
 * Inputs (both committed, consumed READ-ONLY):
 *   - apps/api/src/quant/contract/quant-service-tools-0.27.0.json
 *       the GET /tools registry body (registration order, camelCase) plus each
 *       tool's parameter JSON-schema and dispatch shape, serialized from the
 *       quant repo source of truth (see the snapshot's own `note`).
 *       REGENERATION RECIPE (quant repo checkout, read-only; only alongside a
 *       contract version bump): build_default_registry(), then per contract in
 *       list_contracts() order emit model_dump(by_alias=True, mode="json") +
 *       `dispatch` (single-series | pair | cross-sectional from the
 *       RegisteredTool) + `parameterJsonSchema` = parameter_model
 *       .model_json_schema() with the MODEL-level `description` (the class
 *       docstring — repo-internal prose) popped; wrap as { note,
 *       contractVersion: CONTRACT_VERSION, toolCount, tools }, json indent=2.
 *   - apps/api/src/quant/contract/quant-service-openapi-0.27.0.json
 *       the wire contract: version parity pin + the edge/discovery
 *       READ-SURFACE operations (the OpenAPI carries no per-tool ids — the
 *       registry surface is dynamic — which is why the tools snapshot exists).
 *
 * Output:
 *   - packages/shared/src/harness-tool-cards.generated.ts (eslint-ignored,
 *     NEVER hand-edited; `--check` byte-compares a regeneration against the
 *     committed file the way the twin-identity spec guards the quant types —
 *     regen must produce zero diff).
 *
 * Usage:
 *   node scripts/gen-tool-cards.mjs          # write the generated file
 *   node scripts/gen-tool-cards.mjs --check  # exit 1 if committed file differs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOOLS_SNAPSHOT = join(ROOT, "apps/api/src/quant/contract/quant-service-tools-0.27.0.json");
const OPENAPI_SNAPSHOT = join(ROOT, "apps/api/src/quant/contract/quant-service-openapi-0.27.0.json");
const OUTPUT = join(ROOT, "packages/shared/src/harness-tool-cards.generated.ts");

/**
 * The 7-family lattice taxonomy (HN-D2-A). This map is generation CONFIG —
 * code-reviewed here, emitted into every card, and census-pinned in
 * packages/shared/test/harness-tool-doctrine.spec.ts (7 families exactly;
 * every registry tool mapped; every family briefed). Semantics follow the
 * quant library's own wave structure (src/quant_service/library/__init__.py)
 * refined into reading families:
 *  - trend-momentum          direction persistence and its strength
 *  - mean-reversion-regime   stretch from an anchor + revert-vs-trend nature
 *  - volatility-structure    range width, band shape, expansion/compression
 *  - volume-liquidity-context participation, tradability, session context
 *  - risk-tail-measurement   was it good or lucky: risk-adjusted, tails, drawdowns
 *  - cross-sectional-breadth market internals over a member universe
 *  - pair-relative-value     co-movement, lead/lag, spread between two legs
 *
 * A snapshot tool with no entry here FAILS generation loudly (the generator
 * refuses to guess a family), and a stale entry with no snapshot tool fails
 * the other way — membership drift is impossible to miss.
 */
const FAMILY_BY_KIND = {
  someToolKind: "tool-name",
  someToolKind2: "tool-name2",
  macd: "trend-momentum",
  rateOfChange: "trend-momentum",
  rollingReturn: "trend-momentum",
  donchianBreakout: "trend-momentum",
  adxDmi: "trend-momentum",

  rsi: "mean-reversion-regime",
  zScore: "mean-reversion-regime",
  percentB: "mean-reversion-regime",
  ouHalfLife: "mean-reversion-regime",
  varianceRatio: "mean-reversion-regime",
  hurst: "mean-reversion-regime",
  autocorrelation: "mean-reversion-regime",
  regimeLabel: "mean-reversion-regime",

  atr: "volatility-structure",
  bollingerBands: "volatility-structure",
  rollingVolatility: "volatility-structure",
  keltnerChannels: "volatility-structure",
  rangeVolatility: "volatility-structure",
  rangeExpansion: "volatility-structure",

  relativeVolume: "volume-liquidity-context",
  vwap: "volume-liquidity-context",
  dollarVolume: "volume-liquidity-context",
  amihudIlliquidity: "volume-liquidity-context",
  obv: "volume-liquidity-context",
  gapStatistics: "volume-liquidity-context",
  timeOfDayProfile: "volume-liquidity-context",
  outlierMove: "volume-liquidity-context",
  barsAroundEvents: "volume-liquidity-context",
  barCount: "volume-liquidity-context",

  sharpe: "risk-tail-measurement",
  sortino: "risk-tail-measurement",
  calmar: "risk-tail-measurement",
  probabilisticSharpe: "risk-tail-measurement",
  varHistorical: "risk-tail-measurement",
  cvar: "risk-tail-measurement",
  downsideDeviation: "risk-tail-measurement",
  skewness: "risk-tail-measurement",
  kurtosis: "risk-tail-measurement",
  drawdown: "risk-tail-measurement",
  drawdownDuration: "risk-tail-measurement",

  marketBreadth: "cross-sectional-breadth",
  pctAboveSma: "cross-sectional-breadth",
  newHighsLows: "cross-sectional-breadth",
  sectorAggregate: "cross-sectional-breadth",
  marketPosture: "cross-sectional-breadth",

  correlation: "pair-relative-value",
  beta: "pair-relative-value",
  relativeStrength: "pair-relative-value",
  leadLagCorrelation: "pair-relative-value",
  pairSpread: "pair-relative-value",
};

/**
 * The edge/discovery READ SURFACES a mind's evidence may cite (generated from
 * the OpenAPI operations — these are API paths, not registry tools; their
 * reading doctrine is the referenced Assayer evidence doctrine, never copied
 * here). Orchestration-lane operations (run submission, vault, rescore) are
 * deliberately absent: a mind reads evidence, it does not drive the engine.
 */
const READ_SURFACES = [
  { id: "edge/score", method: "post", path: "/edge/score" },
  { id: "discovery/presentation", method: "get", path: "/discovery/presentation" },
  { id: "discovery/conjectures", method: "get", path: "/discovery/conjectures/{genome_hash}" },
];

function fail(message) {
  console.error(`gen-tool-cards: ${message}`);
  process.exit(1);
}

const toolsSnapshot = JSON.parse(readFileSync(TOOLS_SNAPSHOT, "utf8"));
const openapi = JSON.parse(readFileSync(OPENAPI_SNAPSHOT, "utf8"));

// Version parity pin: the two committed snapshots must describe the SAME contract.
if (toolsSnapshot.contractVersion !== openapi.info.version) {
  fail(
    `snapshot version mismatch: tools snapshot is ${toolsSnapshot.contractVersion}, ` +
      `OpenAPI is ${openapi.info.version} — regenerate the pair together`
  );
}
if (toolsSnapshot.tools.length !== toolsSnapshot.toolCount) {
  fail(`tools snapshot is inconsistent: toolCount=${toolsSnapshot.toolCount}, tools=${toolsSnapshot.tools.length}`);
}

// Family census: refuse to guess, in both directions.
const snapshotIds = new Set(toolsSnapshot.tools.map((t) => t.toolId));
for (const t of toolsSnapshot.tools) {
  if (!(t.toolId in FAMILY_BY_KIND)) {
    fail(`tool '${t.toolId}' has no family in FAMILY_BY_KIND — assign one (never guessed)`);
  }
}
for (const id of Object.keys(FAMILY_BY_KIND)) {
  if (!snapshotIds.has(id)) {
    fail(`FAMILY_BY_KIND entry '${id}' matches no snapshot tool — remove the stale entry`);
  }
}

/** Extract a flat, typed parameter row from one JSON-schema property. */
function parameterRows(jsonSchema) {
  const properties = jsonSchema?.properties ?? {};
  const required = new Set(jsonSchema?.required ?? []);
  return Object.entries(properties).map(([name, prop]) => {
    // Pydantic optionals emit anyOf [{type}, {type:"null"}]; flatten honestly.
    let node = prop;
    let nullable = false;
    if (Array.isArray(prop.anyOf)) {
      const nonNull = prop.anyOf.filter((v) => v.type !== "null");
      nullable = prop.anyOf.length !== nonNull.length;
      node = nonNull.length === 1 ? { ...nonNull[0], ...prop, anyOf: undefined } : prop;
    }
    const row = {
      name,
      type: node.type ?? (Array.isArray(prop.anyOf) ? prop.anyOf.map((v) => v.type ?? "object").join(" | ") : "object"),
      required: required.has(name),
    };
    if (nullable) row.nullable = true;
    if ("default" in prop) row.default = prop.default;
    for (const [from, to] of [
      ["minimum", "min"],
      ["maximum", "max"],
      ["exclusiveMinimum", "exclusiveMin"],
      ["exclusiveMaximum", "exclusiveMax"],
      ["minLength", "minLength"],
      ["maxLength", "maxLength"],
      ["minItems", "minItems"],
      ["maxItems", "maxItems"],
    ]) {
      if (from in node) row[to] = node[from];
      else if (from in prop) row[to] = prop[from];
    }
    if (node.enum) row.enum = node.enum;
    const description = prop.description ?? node.description;
    if (description) row.description = description;
    return row;
  });
}

const toolCards = toolsSnapshot.tools.map((t) => ({
  toolId: t.toolId,
  name: t.name,
  family: FAMILY_BY_KIND[t.toolId],
  category: t.category,
  dispatch: t.dispatch,
  description: t.description,
  inputSchema: t.inputSchema,
  outputSchema: t.outputSchema,
  parameterSchema: t.parameterSchema,
  parameters: parameterRows(t.parameterJsonSchema),
  allowedEnvironments: t.allowedEnvironments,
  failureModes: t.failureModes,
  sourceDependencies: t.sourceDependencies,
  authorityBoundary: t.authorityBoundary,
  contractVersion: t.contractVersion,
  implementationVersion: t.implementationVersion,
}));

const readSurfaceCards = READ_SURFACES.map(({ id, method, path }) => {
  const operation = openapi.paths?.[path]?.[method];
  if (!operation) fail(`read surface ${method.toUpperCase()} ${path} is absent from the OpenAPI snapshot`);
  return {
    surfaceId: id,
    method: method.toUpperCase(),
    path,
    summary: operation.summary ?? "",
    description: operation.description ?? "",
  };
});

const banner = `// GENERATED FILE — DO NOT EDIT.
//
// Emitted by scripts/gen-tool-cards.mjs from the committed quant contract
// snapshots (tools + OpenAPI, ${toolsSnapshot.contractVersion}). Regenerate with
// \`pnpm gen:tool-cards\`; the census spec byte-checks that a regeneration
// produces zero diff (the twin-identity discipline applied to doctrine).
// HARNESS-01 HN-S3 (HN-D2-A): these are card SKELETONS — factual contract
// surface only. The hand-authored wisdom layer lives in
// harness-tool-wisdom-v1.ts and is merged at assembly, never here.

/** One flattened tool parameter: name, type, bounds, meaning — from the tool's parameter JSON-schema. */
export type GeneratedToolParameter = {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly nullable?: boolean;
  readonly default?: unknown;
  readonly min?: number;
  readonly max?: number;
  readonly exclusiveMin?: number;
  readonly exclusiveMax?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly enum?: readonly unknown[];
  readonly description?: string;
};

/** One generated tool-card skeleton: the contract facts a card may never drift from. */
export type GeneratedToolCard = {
  readonly toolId: string;
  readonly name: string;
  readonly family: string;
  readonly category: string;
  readonly dispatch: "single-series" | "pair" | "cross-sectional";
  readonly description: string;
  readonly inputSchema: string;
  readonly outputSchema: string;
  readonly parameterSchema: string;
  readonly parameters: readonly GeneratedToolParameter[];
  readonly allowedEnvironments: readonly string[];
  readonly failureModes: readonly string[];
  readonly sourceDependencies: readonly string[];
  readonly authorityBoundary: string;
  readonly contractVersion: string;
  readonly implementationVersion: string;
};

/** One generated edge/discovery read-surface card (OpenAPI operation facts). */
export type GeneratedReadSurfaceCard = {
  readonly surfaceId: string;
  readonly method: string;
  readonly path: string;
  readonly summary: string;
  readonly description: string;
};

/** The quant contract version both snapshots agreed on at generation time. */
export const GENERATED_TOOL_DOCTRINE_CONTRACT_VERSION = ${JSON.stringify(toolsSnapshot.contractVersion)};
`;

const body =
  `\n/** Every registry tool's card skeleton, in registry (registration) order. */\n` +
  `export const GENERATED_TOOL_CARDS: readonly GeneratedToolCard[] = ${JSON.stringify(toolCards, null, 2)};\n` +
  `\n/** The edge/discovery read-surface cards, in declaration order. */\n` +
  `export const GENERATED_READ_SURFACE_CARDS: readonly GeneratedReadSurfaceCard[] = ${JSON.stringify(readSurfaceCards, null, 2)};\n`;

const generated = banner + body;

if (process.argv.includes("--check")) {
  let committed;
  try {
    committed = readFileSync(OUTPUT, "utf8");
  } catch {
    fail(`--check: committed file missing at ${OUTPUT}; run \`pnpm gen:tool-cards\``);
  }
  if (committed !== generated) {
    fail(
      `--check: ${OUTPUT} differs from a fresh regeneration — ` +
        `it was hand-edited or the snapshots changed; run \`pnpm gen:tool-cards\` and commit`
    );
  }
  console.log(`gen-tool-cards --check: zero diff (${toolCards.length} tool cards, ${readSurfaceCards.length} read-surface cards, contract ${toolsSnapshot.contractVersion})`);
} else {
  writeFileSync(OUTPUT, generated);
  console.log(`gen-tool-cards: wrote ${OUTPUT} (${toolCards.length} tool cards, ${readSurfaceCards.length} read-surface cards, contract ${toolsSnapshot.contractVersion})`);
}
