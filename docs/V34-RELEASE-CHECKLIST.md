# Hustle.mn V34 — Smart Matching reliability & buyer management

Target: **private closed-beta preview only**. Do not publish `hustle.mn`; do not handle money, escrow or outbound email.

## Scope
- Buyer filters own projects by status and sorts incoming freelancer proposals by newest, price, or delivery days; previously existing cancel/award RPCs remain authoritative.
- Seller and buyer view recipient-only durable in-app events (invite, proposal, award, cancellation). Users can acknowledge notifications without changing content or recipient.
- Existing opt-in project matching and direct freelancer hiring remain unchanged.
- Seller-declined invitations no longer show a misleading proposal action.

## Database rollout gate — manual review required
1. Confirm V33 deployed objects in beta: `project_requests`, `project_invitations`, `project_proposals`, opt-in seller profiles, and server RPCs.
2. Review `supabase/migrations/20261023060757_v34_project_notifications.sql`; apply **only** to the Hustle.mn beta database once approved. The SQL is additive, transaction-wrapped, creates no client INSERT permission, and never sends external email.
3. Inspect `pg_policies` and `information_schema.role_table_grants`: authenticated SELECT own notifications, UPDATE(read_at) own rows, anonymous no access, no client INSERT/DELETE.
4. Run authenticated actor tests (buyer A, seller B invited, unrelated C, nonapproved D): A sees only proposal events, B only invitation/award/cancel for assigned projects, C/D see none; writing different recipient or deleting/inserting should be rejected.
5. Exercise buyer request→seller inbox→proposal→buyer accept and cancel using real allowed beta accounts. Confirm no duplicate rows (unique key), counts change on reload, and original orders/chat remain intact.
6. Smoke desktop at 1440px, notebook 1280px and mobile 390px; MN/EN strings, navigation, loading states and no regression in direct hiring.
7. After review + CI success, merge into `feature/interactive-functional-v6` and verify its existing preview URL, **not** the production domain.

## Limitations
- V34 intentionally provides in-app notifications, not email/push delivery.
- Historical V33 invitations/proposals are not automatically backfilled.
- Browser CI green alone does not prove authenticated multi-user RLS; conduct the actor test before declaring live reliability.
- If the V34 migration is pending, existing buyer/seller workflows continue and the UI clearly shows notifications are pending beta activation.

## Actual beta deployment verification — 2026-10-23

- **Applied** V34 migration via connected Supabase migration service to Hustle.mn beta project `pgrxsphkjudvfbpaudbd` (Singapore), success returned.
- **Verified** `project_notifications` RLS is enabled.
- **Verified** `anon` lacks SELECT; `authenticated` has SELECT and UPDATE(`read_at`) only, and lacks INSERT, DELETE and UPDATE(`recipient_id`).
- **Verified** participant-only SELECT/UPDATE RLS policies and all four project event triggers exist and are enabled.
- **Not yet verified** real distinct beta-account (buyer/seller/outsider) transaction E2E or beta preview UI. Leave PR draft until those checks pass.
- **Security advisor warnings** currently include intentional client RPC SECURITY DEFINER warnings and leaked-password protection; review separately: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable and https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

