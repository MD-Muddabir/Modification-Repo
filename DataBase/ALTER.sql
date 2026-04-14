-- ================================================================
-- Feature Gate Migration: Assignment + Finances & Transport
-- Run this on the production/dev database once.
-- ================================================================

-- 1. Add new feature flags to the institutes table (per-institute overrides)
ALTER TABLE institutes
    ADD COLUMN IF NOT EXISTS current_feature_assignment  BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS current_feature_transport   BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add new feature flags to the plans table (plan-level defaults)
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS feature_assignment  BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS feature_transport   BOOLEAN NOT NULL DEFAULT FALSE;

-- Verification queries
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'institutes'
  AND column_name IN ('current_feature_assignment', 'current_feature_transport');

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'plans'
  AND column_name IN ('feature_assignment', 'feature_transport');
