# Hustle.mn V24 — Security & E2E evidence register
Date: 2026-10-21. Branch: `feature/v24-e2e-security-release-gates-20261021`.

## Automated PR gates
- Node unit/security assertions (`npm test`), TypeScript, lint, runtime build and static preview build.
- Real headless Chromium browser tests launched by `.github/workflows/beta-quality.yml`. Browser API requests are intercepted: NO real signup email, payment, order, or mutation is issued.
- Visual proof consists of screenshots taken by the browser at widths 360/390/430/768/1024/1440 and language/theme cases, attached as CI artifacts. Screenshots demonstrate renders, NOT expert/manual aesthetic signoff.
- Published service card test asserts a single service is not compressed into a narrow third, and package tier selection updates the actual displayed figures.
- Auth simulation covers guest registration, unconfirmed-email response, forgot-password request and guest absence of private orders/admin.
- Release smoke no longer checks the stale V12 release marker; it checks HTTP 200 responses for the current public preview routes. HTTP 200 is NOT proof the newest GitHub commit reached the CDN.

## Security authorization inventory (reviewed; tests still required)
- Orders: buyer/seller/admin SELECT, buyer INSERT, participants UPDATE with status/price guard.
- Messages: sender/recipient SELECT and sender INSERT; sender identity check. Negative cross-room selection and Realtime permission withdrawal require isolated tester accounts.
- Reviews: INSERT requires completed owned order; one review per order enforced by unique key; verify duplicate denial with authenticated staging HTTP test.
- Referral: related partner/referred/admin SELECT; admin-only verification; reward ledger and payout automation OUT OF SCOPE and incomplete.
- Portfolio: storage ownership and public opt-in policies exist. Need signed URL expiry and revoked access validation, plus deliverable-file HTTP checks.
- Admin: allowlist and moderation role isolation; audit log SELECT restricted to admin.
- No real checkout, QPay, escrow, seller payout or money movement.

## Manual P0 gate checklist (not green until witnessed)
| Area | Required evidence | Status |
|---|---|---|
| Registration | New user email confirmation delivers and returns to correct preview redirect | UNVERIFIED |
| Recovery | Real reset email, expiry/replay denial, completed reset | UNVERIFIED |
| Buyer/Seller | Fresh two-account order requested → accepted → in-progress → delivered → revision → completed → review | ONE USER-REPORTED FLOW PASSED, unattended repeat needed |
| Cancel/reject | Seller reject, buyer cancel and invalid status changes denied | UNVERIFIED |
| Chat | Two authorized users; third party HTTP read/insert rejected | UNVERIFIED |
| Files | Seller upload, buyer download, unrelated user denied, revoked access | UNVERIFIED |
| Admin/referral | Non-admin write denial, partner cross-visibility, audit trail | UNVERIFIED |
| Visual | Browser artifact review at 360/390/430/768/1024/1440 desktop/tablet/mobile, MN/EN, light/dark | AUTOMATED ONLY |
| Restore | Database backup restore and rollback drill | UNVERIFIED |

## Release decision
This PR is a QA foundation, not approval for public or production deployment. Do not mark these P0 gates complete merely because a build, route smoke, or mocked browser test succeeds.
