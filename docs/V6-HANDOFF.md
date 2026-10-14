# V6 handoff — 2026-10-14

Branch: feature/interactive-functional-v6. Draft PR: https://github.com/dulguundalais/Hustle.mn/pull/3 (stacked on V5).
Preview: https://feature-interactive-function.hustle-mn-preview.pages.dev

Implemented: pointer-reactive CSS 3D hero with reduced-motion fallback; Supabase email/password auth UI; approved-beta workspace; seller profile, explicit public sharing consent, portfolio storage, service draft/edit/moderation; buyer search/order requests; server-enforced order transitions and immutable price snapshots; admin membership, moderation, audit and business configuration; basic referral attribution without money movement. Public profile HTML /p/slug has escaped metadata and branded OG image. No payments, payout, escrow or production deployment.

Runtime: Next.js routes for normal hosting; Cloudflare Pages static export plus functions for config and public profiles. Preview env has only Supabase URL and publishable key. Never add service-role credentials. The sample homepage remains public. Live workspace is auth + enabled beta membership protected. Public profiles require explicit seller consent and enabled membership.

Database: both versioned migrations applied to pgrxsphkjudvfbpaudbd. SQL test fixtures are transaction-local and rolled back. Owner explicitly approved admin assignment on 2026-10-14. dulguundalai.s@gmail.com is now enabled with role admin; verified by SELECT. Account registration/email confirmation and browser sign-in remain unverified.

Verified: lint, TypeScript, Next runtime build and Cloudflare static build; six Node tests including HTML escaping/path rejection; SQL RLS test for seller moderation denial, admin isolation, order snapshots/lifecycle, unrelated-user denial, audit/referral eligibility, anonymous denial and public profile opt-in/revocation. Supabase security advisor returned no lints. Browser tested homepage language/theme/category filter.

Remaining release gates: authenticated browser buyer/seller/admin flows after member provisioning; actual confirmation email and redirect configuration; portfolio upload/download via HTTP; real seller social crawler preview; mobile device testing. Build success and SQL tests do not imply these browser tests passed. Existing optional-preview-auth tests concern optional middleware only; public preview does not enable it.

Next: approve/provision initial owner admin, register and confirm that account, add two test members from admin workspace, perform complete browser seller publication and buyer order flow, then mobile/accessibility polish. Service-specific live OG pages remain future work (profile page already has published services); sample service routes already include sample OG metadata.

V7 visual revision: midnight green hero, orange CSS sculpture, lime accent, unified category icon tiles, card hierarchy and mobile category scrolling. Build, lint, typecheck and six Node tests passed. Commit ba38591a59e9855f103468b83cc781854c458a06.
