# V46 — Original Hustle.mn Open Beta rollout

Applies **only** to the original `dulguundalais/Hustle.mn` code and the original Supabase `pgrxsphkjudvfbpaudbd` database. Never apply to HUSTLE-COLLAB.

## Access changes
- `auth.users` on email confirmation auto-creates `public.beta_allowlist` with `role=member`, `enabled=true`.
- Unconfirmed, anonymous and banned users are not enrolled.
- `ON CONFLICT DO NOTHING` keeps manually disabled emails disabled; pre-existing admin and partner grants stay unchanged.
- A verified user can be a buyer or set up a seller profile without separate user approval. Seller listings still require moderation/publishing rules.
- No payment processing, escrow, or public-domain launch is enabled.

## Operations checklist
1. Confirm **Supabase Auth → Providers → Email → Confirm email** is ON before inviting users. Hosted defaults should not be assumed; verify the dashboard.
2. Configure a production-grade SMTP provider and email rate limits before broadly sharing signup. The built-in email sender may be rate limited; the frontend does not bypass this.
3. Apply `supabase/migrations/20261025024500_open_beta_verified_signup.sql` to original beta database only, with a verified backup/rollback plan.
4. Verify trigger and privileges by SQL introspection. Test a *real new test account*: unconfirmed user has no `beta_allowlist` row, confirmed user receives member automatically, after login sees buyer dashboard, can open Seller Studio.
5. Verify a **disabled** email stays blocked after confirmation event; verify existing admin/partner roles are unchanged. Avoid using real customer accounts as test fixtures.
6. Verify seller service starts `draft/pending` and moderation is required before `published`; test order/chat/file cross-account RLS.
7. GitHub Actions tests, build, Playwright mock-browser QA and Cloudflare preview must pass before reviewing/merging the PR.

## Rollback
If onboarding misbehaves, immediately disable new enrollment by dropping only the new auth trigger:
```sql
drop trigger if exists hustle_open_beta_on_verified_email on auth.users;
```
Leave all existing RLS policies in place. Already enrolled verified accounts remain enabled; review any account-specific impact before revoking access. Rollback of UI is a separate branch revert.

This does not change the official `hustle.mn` production domain. PR merge and public-domain release remain owner-approved actions.
