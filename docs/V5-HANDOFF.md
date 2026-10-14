# V5 premium marketplace — Stage 1

Branch: feature/premium-marketplace-v5. Base: agent/hustle-mvp-foundation.

## Implemented
- Original lavender/cream hero, CSS portfolio artwork, Manrope Cyrillic typography, coherent Lucide icons.
- Home, Explore, nine service routes and nine seller routes; reused V4 sample catalog.
- MN/EN, dark/light, search, all nine categories, price sort, persistent local saved services.
- Responsive layouts, keyboard labels, reduced motion, empty state and link sharing.
- Previous homepage retained at app/legacy-home.tsx; previous editorial/showcase routes intact.
- Existing Supabase server helper cookie parameter now typed using installed SDK types.
- Lockfile committed. No database changes and no payment integration.

## Build/deploy
- npm run typecheck
- npm run build: runtime Next.js build (Cloudflare Pages automatically selects static preview).
- npm run build:preview: sample-only static output under out/. A disposable .preview-build preserves runtime source, replacing runtime login with an explicit preview notice.
- node --test tests/preview-access.mjs
- functions/_middleware.ts protects every preview resource with Basic auth, username hustle, PREVIEW_PASSWORD from preview-only encrypted environment variable. Missing configuration returns 503; absent/wrong credentials return 401. No passwords in source.
- Existing Pages project hustle-mn-preview auto-builds feature branches. Its production branch is feature/homepage-ui-v1: never push there.
- Cloudflare Access is not enabled. Attempt to create Access organization was rejected by automatic approval review; owner approval needed for account-level Access setup. Do not remove preview protection to bypass that blocker.

## Verification and limitations
- Local runtime build and static build pass; typecheck passes.
- Middleware tests verify denial, fail-closed configuration, successful auth and no shared caching.
- Browser interaction/desktop/mobile visual QA not completed: no browser-control plugin available in session.
- No standalone lint configuration inherited; Next build performs its built-in checks.
- Listings, sellers, portfolios and prices are explicitly fictional samples. No fabricated ratings displayed.
- Auth, database RLS, orders and dashboards are not verified operational. Current preview has no live accounts or order processing.
- Social links work; dynamic branded Open Graph image generation remains Stage 3. Private previews cannot be scraped by Facebook.

## Next
Approve/configure preview access and verify live URL. Get visual feedback, then connect server-backed Supabase buyer/seller profiles, listings, orders and role checks. Keep production/DNS untouched.
