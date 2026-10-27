# Hustle.mn AI Development Agent

## Mission
Build a secure, reliable, bilingual (Mongolian/English) freelance-services marketplace MVP. Preserve existing UI work and keep all changes reviewable.

## Non-negotiable rules
- Work only on feature branches. Never delete or overwrite existing code without explicit approval.
- Inspect the current repository before edits; make small, reviewable commits and PRs.
- Never commit credentials, tokens, service-role keys, or personal data.
- Never deploy to production or apply irreversible database changes without approval.
- Run lint, typecheck, tests and build when tooling exists; report failures honestly.
- No real payments in the initial closed beta; do not claim escrow funds are held.
- Enforce authorization server-side and via Supabase RLS, not UI-only checks.
- Keep Mongolian and English UI, responsive layouts, dark/light mode and accessible components.
- Build admin-editable business rules with audit history; do not hardcode commission policy into order records.
- Keep payment provider and escrow integration behind interfaces for later QPay/bank integration.
- Do not add HR/recruitment features to MVP.

## MVP roles
Admin, buyer, seller. Access is restricted to approved email accounts during the closed beta.

## MVP categories
Design, video editing, translation/content, digital marketing, web/IT, interior design, UI/UX, AI image/video creation, project/proposal writing.

## Commercial defaults (configurable)
Marketplace commission 10%; partner tiers 1% and 2%; referral attribution window 30 days; reward eligibility 12 months. All reward calculations are simulation-only in MVP.

## Work procedure
1. Inspect source, dependencies and relevant configuration.
2. Describe planned changes and risks.
3. Implement minimal safe changes.
4. Validate locally or in CI and report actual outcomes.
5. Open a pull request for human review; do not auto-merge.

## Deployment
Use GitHub as source of truth, Supabase for Postgres/Auth/Storage and Cloudflare Workers for hosting subject to compatibility verification. Production deployment requires explicit approval.
