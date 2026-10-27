# Hustle.mn MVP Architecture (proposed)

## Existing baseline
Development branch starts from feature/premium-design-system-v4 to preserve the existing Next.js UI. Verify actual dependencies and routes before modifying runtime files.

## Components
- Web: Next.js + TypeScript, responsive bilingual UI, theme tokens.
- Data: Supabase Postgres with versioned migrations and RLS on all exposed tables.
- Auth: Supabase Auth; invite/approved-email closed beta, enforced server-side.
- Storage: Supabase Storage for portfolio media with bucket policies and size/type limits.
- Hosting: Cloudflare Workers, adapter choice confirmed against current Next.js and Cloudflare compatibility before deployment.
- CI: GitHub Actions lint/typecheck/build/test and dependency checks.

## Domain model (planned)
profiles, beta_allowlist, seller_profiles, portfolios, services, service_categories, orders, order_events, messages, referrals, partner_attributions, commercial_rule_versions, simulated_ledger_entries, audit_events.

## Access
Buyers can manage their own orders and messages. Sellers can manage their own services and see only assigned orders. Admin actions require server-validated roles. Apply ownership-scoped RLS policies, avoid relying on editable user metadata.

## Future payment integration
Define PaymentProvider and EscrowProvider interfaces; store payment state as a state machine with idempotency keys, webhook verification and reconciliation. Initial MVP uses simulated transitions only; no actual deposits, holds, transfers or payouts.

## Design
Preserve existing UI; introduce design tokens and Figma handoff only after design approval. Social shares should generate rich Open Graph previews with portfolio/service image, title and canonical link.

## Deployment gates
No production release until secrets, RLS tests, auth flows, audit logging, error monitoring, backups, rollback and payment-free closed-beta restrictions have been verified.
