# Hustle.mn V35 — Collaboration / Order events

Stacked from V34 until its beta QA and merge. Use private beta only.

## Implementation
- Buyer can contact a proposal's public, opted-in seller via existing secured messenger entry route.
- Seller can revise pending proposal through V33's server-authorized submit RPC; withdraw via new owner-checked RPC.
- Withdrawn proposals cannot be awarded; previous buyer proposal remains visible with explicit withdrawn state.
- Status change of a real order records a new private `order_notifications` event. Revision request is distinguished from ordinary start/restart.
- Buyer and seller dashboards can mark their own order notices read. No outbound email, no payment.

## Mandatory release checks
1. Check V34 PR #41 readiness and current V34 beta migration. V35 targets `feature/v34-project-notifications-management-20261023` first.
2. Pass node/unit/security, TypeScript, lint, static and browser CI.
3. Review and apply V35 migration to Hustle beta Supabase only, never to unrelated projects or production.
4. Transactionally test synthetic buyer/seller/outsider/nonapproved roles: confidential order notification, seller withdrawal, rejected buyer/outsider withdrawal, no data mutation after rollback.
5. Browser test as approved buyer and seller: proposal chat deep-link, seller amend/withdraw, buyer award blocked after withdrawal, order notifications with cancellation, revision and delivery.
6. Security advisor re-check and mobile/MN/EN smoke before merge.
7. Do not publish hustle.mn or integrate QPay/escrow.
