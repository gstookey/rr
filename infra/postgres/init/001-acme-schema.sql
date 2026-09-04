-- ACME Workshop — first-boot database setup.
--
-- Runs ONCE, on an empty data volume, via the postgres image's
-- /docker-entrypoint-initdb.d hook. It is deliberately tiny: the real schema
-- arrives with the Invent vertical slice (S2), which owns its own migrations.
-- What S0 puts here is the ONE structural decision S2 must not have to argue
-- about — that row-level security is on from the first table, not retrofitted.
--
-- NOT RUN BY THE AGENT FLEET: authored 2026-09-04 with no Docker daemon
-- available, so this file has never been executed. Structural review only.

CREATE SCHEMA IF NOT EXISTS acme;

-- The per-request subject transport (AW-D6 option A): the BFF opens a
-- transaction and issues `SET LOCAL app.subject_level = ...` /
-- `SET LOCAL app.subject_compartments = ...` before it queries. Attributes, not
-- database roles, because the compartment model is an attribute model.
--
-- current_setting(..., true) returns NULL rather than raising when the setting
-- is absent, which makes the policy FAIL CLOSED: a query issued without a
-- subject sees nothing at all, instead of seeing everything.
CREATE OR REPLACE FUNCTION acme.subject_level() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT current_setting('app.subject_level', true) $$;

CREATE OR REPLACE FUNCTION acme.subject_compartments() RETURNS text[]
  LANGUAGE sql STABLE AS $$
    SELECT COALESCE(string_to_array(current_setting('app.subject_compartments', true), ','), ARRAY[]::text[])
  $$;

-- ACME's fictional handling lattice, as data. OPEN < PARTNER < INTERNAL < RESTRICTED.
CREATE TABLE IF NOT EXISTS acme.handling_level (
  id    text PRIMARY KEY,
  rank  int  NOT NULL UNIQUE
);
INSERT INTO acme.handling_level (id, rank) VALUES
  ('OPEN', 0), ('PARTNER', 1), ('INTERNAL', 2), ('RESTRICTED', 3)
ON CONFLICT (id) DO NOTHING;

-- The placeholder table exists for one reason: to prove, on day one, that a
-- marked table with RLS enabled is the DEFAULT shape in this database. S2
-- replaces it with the real device registry; it does not invent the pattern.
CREATE TABLE IF NOT EXISTS acme.marked_row_placeholder (
  id                 text PRIMARY KEY,
  note               text NOT NULL,
  marking_level      text NOT NULL REFERENCES acme.handling_level(id),
  marking_compartments text[] NOT NULL DEFAULT ARRAY[]::text[]
);

ALTER TABLE acme.marked_row_placeholder ENABLE ROW LEVEL SECURITY;
-- FORCE also subjects the table owner to the policy. Without it, the very role
-- the BFF is most likely to connect as is the one role that never sees a fence.
ALTER TABLE acme.marked_row_placeholder FORCE ROW LEVEL SECURITY;

-- The R5 dominance rule, in the one place that cannot be forgotten: the subject
-- must dominate on level AND contain every compartment on the row.
CREATE POLICY marked_row_placeholder_dominance ON acme.marked_row_placeholder
  FOR SELECT
  USING (
    (SELECT rank FROM acme.handling_level WHERE id = acme.subject_level())
      >= (SELECT rank FROM acme.handling_level WHERE id = marking_level)
    AND marking_compartments <@ acme.subject_compartments()
  );

INSERT INTO acme.marked_row_placeholder (id, note, marking_level, marking_compartments) VALUES
  ('ph-open',   'visible to anyone signed in',        'OPEN',       ARRAY[]::text[]),
  ('ph-ttw',    'Tick-Tock Watchworks only',          'INTERNAL',   ARRAY['TTW']),
  ('ph-mer',    'Meridian Wearables only',            'INTERNAL',   ARRAY['MER']),
  ('ph-nwl',    'Northwind Logistics (B2B of TTW)',   'PARTNER',    ARRAY['TTW/NWL'])
ON CONFLICT (id) DO NOTHING;

GRANT USAGE ON SCHEMA acme TO acme;
GRANT SELECT ON ALL TABLES IN SCHEMA acme TO acme;
