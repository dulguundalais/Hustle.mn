# V35.4 — Global Notification Center (closed-beta)

## Scope
- One reusable authenticated bell on Homepage, Explore and Buyer/Seller Dashboards.
- Existing RLS tables `project_notifications`, `order_notifications` and recipient-scoped unread `messages` are read via the existing Supabase **public** client; no additional schema, triggers or privileged keys.
- Chat events are grouped by sender with real message count (up to first 100 returned); a chat becomes read **only when the conversation is opened**, never via the notification bell.
- Explicit per-alert and bulk mark-read changes only `read_at` of **recipient-owned project/order notification rows**; RLS and column-level grants enforce this.
- Direct links: buyer project dashboard, seller project inbox, buyer/seller order tabs, messages tab.
- Poll while visible every 45s; refresh on focus/open; on sign-out the component unmounts, and session switching removes the previous account's cached inbox.
- Incomplete V34/V35 beta schema: partial, visible "Some notifications could not be loaded" warning rather than breaking homepage.
- Responsive MN/EN, light/dark, keyboard Escape/outside click and focus-restoring behavior.

## Dependencies / release
- **V34 Draft PR #41 and V35 Draft PR #42 are still open.** Their beta Supabase migrations were previously applied, but their source migrations are not in the active preview branch. Do **not** claim this component alone represents a production-ready notification backend.
- Keep PR Draft until review of migration/code history and approval of integration. Public production domain `hustle.mn` is untouched.
- Quality gates: Node unit/security tests, TypeScript, lint, static build, browser E2E 390px and 1440px, logout/account-switch, local links, RLS actor matrix.
- Note: recent messages are capped at 100 rows and recent project/order notifications at 75 each. Badge at 99+ is approximate for extremely large unread backlogs.
