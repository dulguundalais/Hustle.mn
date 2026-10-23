# V26 Closed Beta Stability — QA evidence & release decision

## Changes (branch `feature/v26-closed-beta-stability-20261021`)
- PR #23 pending confirmed signup approval screen integrated, preserving admin-only access. Already-applied `list_pending_beta_signups` function tracked by migration.
- PR #21 rollback-only SQL fixture repaired for the 3-tier package-based order guard, without copying its obsolete/incomplete UI scripts.
- Additional transaction-scoped cross-account RLS test for Buyer/Seller messages, private storage object, attachment metadata, recipient-only read receipt, outsider access denial and admin pending-signup isolation.
- UI inbox query no longer repeats `read_at`; realtime refresh includes it.
- Browser tests for signup redirect, forgot password, missing/expired reset, guest beta pending, admin approval, mobile layout, MN/EN dark mode, dashboard session continuity and Messenger retained.
- New explicit V26 release marker and matching Cloudflare preview smoke to detect stale deployments.

## Verified SQL (using connected closed-beta Supabase project)
1. `tests/sql/marketplace-rls.sql`: **PASS**: seller moderation, immutable profile, admin isolation, order price snapshot and lifecycle, outsider order rejection, audit, referral verification, anonymous denial. Synthetic fixtures rolled back.
2. `tests/sql/v26-cross-account-security.sql`: **PASS**: Buyer/Seller private chat and file permission, receipt, unrelated member denied for message, metadata and storage, attempted spoofing denied, admin-only list of confirmed pending signup. All synthetic changes rolled back.
3. The previously deployed `public.list_pending_beta_signups()` is already present. Nothing destructive deployed.

## Important limitations / manual acceptance gates
- Browser E2E in GitHub Actions uses **mocked Supabase** and does not send real emails. Fresh email confirmation delivery and a real recovery link must be tested with dedicated beta accounts.
- Supabase Auth URL Configuration **Site URL** and allowed redirect URLs may still require owner review to ensure no localhost target. These settings are not editable with the available connected Supabase tools.
- No dedicated production domain is in use. Changes only target existing internal Cloudflare preview.
- Cross-account SQL tests cover row and storage metadata RLS, **not** the complete HTTP signed URL lifecycle or blob virus-scan. Perform additional live two-account upload/download and signed URL expiry checks before public signup.
- Admin beta approval is a manual approval step; the app must never self-authorize newly registered users.

## Release acceptance
- CI must pass Node unit tests, typecheck, lint, runtime/static builds, browser tests with desktop/tablet/mobile screenshots.
- Merge only after tests pass; verify actual Cloudflare URL includes V26 marker plus HTTP 200 routes.
- No public rollout, no money/QPay/escrow changes and no blanket removal of the beta allowlist.
