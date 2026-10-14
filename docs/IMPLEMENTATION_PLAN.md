# AI Agent Implementation Plan

## Phase 0: repository audit
- Inventory existing routes, components, package versions and build scripts.
- Confirm Next.js compatibility with Cloudflare's current deployment adapter.
- Check existing Supabase and Cloudflare projects before provisioning anything.

## Phase 1: safe foundations
- Add CI, formatting, environment validation and structured logging.
- Implement Supabase client setup using current official guidance.
- Create migrations for profiles, beta allowlist and role policies; review SQL before applying.
- Add tests for unauthorized access and role boundaries.

## Phase 2: marketplace MVP
- Buyer/seller onboarding, seller profile and portfolio, category browsing and listings.
- Service requests, orders, messages and admin moderation.
- Configurable versioned commercial rules and simulated referral/commission ledger.
- Mongolian/English, dark/light mode, social-share previews.

## Phase 3: closed beta
- Approved emails only, no real payments.
- Test core journeys, rate limits, security, backups and rollback.
- Cloudflare preview deployment; production only after approval.

## Acceptance criteria
All core flows tested; no exposed secrets; RLS verified; CI green; production deployment explicitly approved.
