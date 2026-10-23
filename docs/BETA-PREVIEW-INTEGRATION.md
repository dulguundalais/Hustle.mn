# Hustle.mn — One canonical Closed Beta preview

## Canonical browser URL — KEEP THIS HOSTNAME
**Always use and share:** https://feature-interactive-function.hustle-mn-preview.pages.dev

This is the Cloudflare Pages **stable branch alias** for `feature/interactive-functional-v6`. Cloudflare confirmed the alias from the successful V36 merge deployment. Each new merge automatically updates the content at the **same host**. Keep this stable alias in QA instructions and user messages.

**Never share an immutable hashed deployment URL** such as `https://840b83f5.hustle-mn-preview.pages.dev` as the main beta link. Never suggest `https://hustle-mn-preview.pages.dev` as the beta link either: that project's configured production branch is `feature/homepage-ui-v1`, not `feature/interactive-functional-v6`. These hosts are different browser origins.

**Why this matters:** Supabase JS stores authentication in browser storage scoped to each origin. Users logged in on one hash/branch/root URL are not automatically logged in on a different one. The homepage intentionally renders the recipient-only global notification bell only when `sessionState==='signed-in'`. Switching hostnames makes it seem that notifications have disappeared, when the user is actually a guest on the new origin. A bell must not expose private notifications to unauthenticated users.

**Recovery:** open the canonical stable alias above, sign in there once, and continue using **the same URL** through successive releases. If the bell is still missing while the account menu shows a signed-in user, investigate auth lifecycle and responsive CSS rather than assuming a host mismatch. Do not ask users to share credentials.

## Policy
- The shared testing deployment tracks `feature/interactive-functional-v6` only.
- Develop fixes on a dedicated branch, then merge to that **same** beta branch after automated CI, Cloudflare preview and relevant buyer/seller flow checks.
- Do not send feature-branch previews as the new canonical preview. Feature previews are temporary QA links only.
- Do not overwrite the beta branch from an older feature branch. Rebase or reconcile concurrent features first.
- In this release, PR #48 consolidates PR #41 (V34), #42 (V35), #46 (V35.4), #47 (chat file confirmation), and preserves the already-merged V35.1/V35.2/V35.3 improvements.
- The homepage signed-in notification bell, smart matching, proposal editing, order events, drafts, and explicit Send file behavior are regression tested together.
- After preview merge, verify homepage notification, buyer↔seller messaging read counts, file selection/Send, matching invitations and order transitions with approved test accounts. CI mocks alone are not real account QA.
- Keep main, public `hustle.mn`, production database, secrets, payment and escrow untouched; rolling back is a targeted revert PR.

## Beta database source reconciliation gate
V34 and V35 migrations have **already** been applied in the separate Hustle beta Supabase database under its existing migration history versions (`20261023060757`, `20261023062451`). Source files restored here use earlier PR filenames (`20261023150000_v34_project_notifications.sql`, `20261023180000_v35_order_collaboration.sql`); this history mismatch must be reconciled before anyone uses automatic `supabase db push` or deploys the database to another environment. Do not re-run them blindly. Their presence in Git is for reviewed source traceability and actor tests, not an instruction to apply SQL during web deployment.

## Manual sign-off checklist
1. Signed-in homepage: notification bell visible, correct buyer/seller recipient, unread 1→0.
2. File picker: attachment locally staged; no message before Send; remove works; Send succeeds once; invalid files blocked; Enter/Shift+Enter behavior.
3. Project request → opt-in published seller invite → proposal notification → edit/withdraw → award → order status and notification.
4. MN/EN, light/dark, desktop and phone layouts; full auth/redirect/back navigation; no data loss when switching account.
