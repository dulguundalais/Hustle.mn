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

## Beta database source reconciliation (resolved 2026-10-25)
`supabase/migrations/` now mirrors `supabase_migrations.schema_migrations` of the beta database (`pgrxsphkjudvfbpaudbd`) exactly: same version prefixes, same names, and SQL that matches the applied statements (compared by whitespace-insensitive hash). Three migrations that existed only in the database (`marketplace_collaboration`, `public_marketplace_discovery`, `restrict_private_portfolio_to_own_or_public`) were added, and the two whose files had drifted (`v10_messages_realtime`, `restore_public_rpc_schema_usage`) now carry the applied SQL.

`20261023050000_v33_project_requests.sql` is the one exception: V33 was applied to the database outside the migration history. Its file is kept so a fresh environment can be rebuilt in order (V34 depends on it); it is timestamped just before V34 for that reason. Do not re-run it against the beta database.

## Manual sign-off checklist
1. Signed-in homepage: notification bell visible, correct buyer/seller recipient, unread 1→0.
2. File picker: attachment locally staged; no message before Send; remove works; Send succeeds once; invalid files blocked; Enter/Shift+Enter behavior.
3. Project request → opt-in published seller invite → proposal notification → edit/withdraw → award → order status and notification.
4. MN/EN, light/dark, desktop and phone layouts; full auth/redirect/back navigation; no data loss when switching account.
