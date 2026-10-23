-- Closed-beta hotfix: restore schema USAGE required by public, filtered RPC wrappers.
-- V34's blanket schema REVOKE removed the existing grants and caused
-- public_seller/marketplace_catalog to fail with permission denied (preview HTTP 503).
-- USAGE permits name resolution, not reading private tables or changing RLS policies.
-- Access to private helper routines remains constrained by per-function EXECUTE grants.
begin;
grant usage on schema hustle_private to anon, authenticated;
commit;
