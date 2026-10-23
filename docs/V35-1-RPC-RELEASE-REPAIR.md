# V35.1 public seller profile smoke regression — beta fix

V34's schema-level `REVOKE ALL ON SCHEMA hustle_private FROM public,anon,authenticated` removed the required `USAGE` grants. Public `public_seller` and `marketplace_catalog` RPC wrappers are `SECURITY INVOKER` and delegate to `hustle_private`; without schema USAGE they fail even when the public RPC has EXECUTE permission.

Fix: restore `GRANT USAGE ON SCHEMA hustle_private TO anon, authenticated` only. No new table privileges, no bypass of RLS, no change in already guarded private SECURITY DEFINER functions. Functions remain callable only where their own EXECUTE privileges allow. V34 trigger helpers explicitly revoke execute from public, anon and authenticated.

QA: execute `public.public_seller('test-freelancer')` and `public.marketplace_catalog()` as anon, verify `/p/test-freelancer` returns 200 on the existing beta preview, verify public portfolio image access, and rerun exact-commit preview smoke. Do not publish official hustle.mn domain.
