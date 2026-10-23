# V29 — Buyer/Seller closed-beta acceptance & rollback plan

## Scope
V29 secures the browser's order-request inputs and adds an isolated, deterministic two-account end-to-end test. **This is not a live-email or live-database acceptance pass.** Nothing is enabled for public production.

## Automated release gates
- Node unit/security tests, TS typecheck, ESLint, Next.js runtime build, Cloudflare static export
- Playwright Chromium: Premium tier chosen on `/listing/?id=...`; auth; Buyer submits order; seller accepts, starts and delivers; buyer marks completed and posts a verified review; seller sees review
- Assert order snapshot equals the Premium package price, timeline and revision entitlement (not the Basic card price)
- Separate third-account private order invisibility test (mock only; DB RLS tests run separately)
- 390px mobile and 768px tablet listing-detail overflow, tier change and request URL screenshots

## Real two-account acceptance — before wider beta
Use **approved isolated test accounts**, not customer accounts, on the private Cloudflare preview.
1. Log in as a seller with a published opt-in public profile and valid 3-tier service, confirm `/p/<slug>` public profile and the new listing detail link.
2. Using a **different approved Buyer** account, choose Premium, submit a 20+ character brief, verify that the quote and dates match the selected service package and no payment occurs.
3. Seller sees the request; test accepting, starting, delivering with a 10+ character note and confirm buyer visibility.
4. Buyer tests requesting a revision (only if included), seller re-delivers, buyer accepts and creates one review; duplicate review must fail gracefully.
5. Third approved account must not see the order/chat/attachments, including direct API read and private storage signed URL attempts.
6. Test session/navigation through home logo, logout/login, mobile width 390px, dark/light and Mongolian/English.
7. Validate genuine browser network calls, Supabase RLS, HTTP signed-URL expiry and Cloudflare deployment SHA independently; mocked CI cannot certify these.
8. Record acceptance evidence (two sanitized screenshots for each role, CI and deploy links) without emails/tokens in Git.

## Known deferred blockers
- Supabase Auth Site URL/redirect and password reset `localhost:3000` issue is **explicitly deferred by the owner**. It remains a release blocker for broader beta.
- Preview may use an opt-in static Pages build, not a full Next.js server runtime. Server-only callbacks must be validated before wider release.
- This PR has no payments, escrow or production-domain deployment.

## Merge/rollback
- Branch: `feature/v29-buyer-seller-order-e2e-20261022`
- Base: `feature/interactive-functional-v6`
- Merge to private beta feature branch only after all CI checks pass; Cloudflare smoke must confirm commit SHA.
- If regression appears, revert the V29 merge on the feature branch; no schema/data migration is involved.
