# B04 — private partner codes (2026-10-31)

Stacked on PR #79 (`4122c50`). No UI redesign, payment change, V53 feature, hosted Supabase change or production deployment.

## Finding
`codes_read` (`20261014101004_marketplace_closed_beta.sql:120`) let every beta member read every row of `public.partner_codes`. The browser then looked up the partner by code and inserted the referral row itself (`components/workspace.tsx`). Verified on disposable PostgreSQL: before this change a partner sees other partners' codes (`tests/sql/b04-partner-codes.sql` fails at its first check).

## Change
- `supabase/migrations/20261031090000_partner_code_visibility.sql`
  - `codes_read`: own row or administrator only.
  - `public.claim_referral(p_code text)`: `SECURITY DEFINER`, empty `search_path`, authenticated only. Requires beta access, an enabled partner/admin code owner, no self-referral and no existing referral. One generic error for unknown, inactive or own codes. `hustle_private.referral_guard` still sets `created_at`, `eligible_until`, `status` and enforces the attribution window.
  - Idempotent: applying it twice succeeds.
- `components/workspace.tsx`: the code form calls `claim_referral`; existing copy, layout and the `?ref=` prefill are unchanged.
- The existing `referrals_add` policy is kept (guarded by `referral_guard`) so an older client fails safely instead of opening a new path.

This adds one intended `SECURITY DEFINER` RPC; the advisor count will rise from 9 to 10 and needs the same reviewed disposition as the others.

## Evidence
- `tests/sql/b04-partner-codes.sql` (added to `stabilization-postgres.yml`): owner/admin visibility, member/unrelated denial, unknown/disabled/self/null codes, single claim, server-owned attributes, member cannot review, attribution window, unverified and anon denial. Red before, green after, on a fresh replay with all other SQL suites and the 133-object V33 comparison still passing.
- `tests/b04-partner-codes.mjs`: the browser no longer reads codes by value or writes attribution.
- `qa/staging/auth.spec.mjs`: real GoTrue/PostgREST checks for list denial and single claim. The isolated Supabase workflow now holds this migration with the grant hardening and applies both to the populated database.

## Deployment
Not applied to the original database. Apply only through the target-specific migration plan (backup, rehearsal, approval). The UI change and this migration must ship together: with the migration alone, the old UI's code lookup returns "Code not found".
