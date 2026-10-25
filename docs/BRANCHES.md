# Branch inventory (2026-10-25)

Reference point: `cleanup/consolidate-v46-20261025` = `feature/v46-open-beta-self-service-onboarding-20261025` (which already contains `feature/interactive-functional-v6`, V37 and V39–V46) plus the migration-file reconciliation.

Classification method: Git ancestry, then a trial merge of every remaining branch into the cleanup branch. "Content already present" means the trial merge adds no new files or changes outside conflicts with newer versions of the same code (the work was carried forward by later squash/consolidation PRs such as #48).

Nothing was deleted. Suggested follow-up, only with the owner's approval: tag each non-active branch as `archive/<name>` and then delete the branch, leaving `main`, `feature/interactive-functional-v6` and `feature/homepage-ui-v1` (Cloudflare Pages production branch).

## Fully contained in the cleanup branch (33)

| Last commit | Branch |
|---|---|
| 2026-10-14 | `agent/hustle-mvp-foundation` |
| 2026-10-14 | `feature/editorial-premium-v3` |
| 2026-10-14 | `feature/homepage-ui-v1` |
| 2026-10-14 | `feature/premium-marketplace-v2` |
| 2026-10-14 | `feature/premium-marketplace-v5` |
| 2026-10-14 | `main` |
| 2026-10-14 | `origin` |
| 2026-10-21 | `fix/v21-buyer-order-validation-20261021` |
| 2026-10-22 | `feature/v27-beta-reliability-20261022` |
| 2026-10-22 | `feature/v28-live-listing-details-20261022` |
| 2026-10-22 | `feature/v28-live-marketplace-discovery-20261022` |
| 2026-10-22 | `feature/v29-buyer-seller-order-e2e-20261022` |
| 2026-10-22 | `feature/v31-problem-first-business-discovery-20261022` |
| 2026-10-22 | `feature/v32-2-unified-layout-20261022` |
| 2026-10-22 | `feature/v32-premium-personal-business-guide-20261022` |
| 2026-10-22 | `fix/v26-verified-preview-gates-20261022` |
| 2026-10-22 | `fix/v30-preview-config-runtime-diagnostics-20261022` |
| 2026-10-22 | `fix/v30-public-profile-service-portfolio-20261022` |
| 2026-10-22 | `fix/v31-public-portfolio-signed-redirect-20261022` |
| 2026-10-22 | `fix/v31-public-portfolio-storage-auth-20261022` |
| 2026-10-22 | `fix/v31-public-profile-live-smoke-20261022` |
| 2026-10-22 | `fix/v32-3-restore-wide-aligned-layout-20261022` |
| 2026-10-23 | `feature/interactive-functional-v6` |
| 2026-10-23 | `feature/v33-project-requests-smart-matching-20261023` |
| 2026-10-23 | `feature/v37-favorites-compare-20261023` |
| 2026-10-24 | `feature/v39-premium-creative-marketplace-20261024` |
| 2026-10-24 | `feature/v40-seller-portfolio-story-20261024` |
| 2026-10-24 | `feature/v41-seller-avatar-photos-20261024` |
| 2026-10-24 | `feature/v42-seller-profile-cover-edit-20261024` |
| 2026-10-25 | `feature/v43-premium-editorial-polish-20261025` |
| 2026-10-25 | `feature/v44-navigation-chat-notifications-20261025` |
| 2026-10-25 | `feature/v45-editorial-premium-marketplace-20261025` |
| 2026-10-25 | `feature/v46-open-beta-self-service-onboarding-20261025` |

## Content already present, history differs (27)

| Last commit | Branch | Trial merge |
|---|---|---|
| 2026-10-21 | `feature/preview-smart-search-20261021` | conflicts=5, clean_changes=0 |
| 2026-10-21 | `feature/v10-messaging-order-workflow-20261021` | conflicts=4, clean_changes=0 |
| 2026-10-21 | `feature/v11-buyer-seller-entry-20261021` | conflicts=5, clean_changes=0 |
| 2026-10-21 | `feature/v12-role-workspaces-20261021` | conflicts=2, clean_changes=0 |
| 2026-10-21 | `feature/v14-premium-auth-20261021` | conflicts=3, clean_changes=0 |
| 2026-10-21 | `feature/v17-service-packages-20261021` | conflicts=4, clean_changes=0 |
| 2026-10-21 | `feature/v18-signature-homepage-20261021` | conflicts=5, clean_changes=0 |
| 2026-10-21 | `feature/v19-marketplace-home-polish-20261021` | conflicts=5, clean_changes=0 |
| 2026-10-21 | `feature/v20-footer-knowledge-center-20261021` | conflicts=4, clean_changes=0 |
| 2026-10-21 | `feature/v22-verified-reviews-20261021` | conflicts=2, clean_changes=0 |
| 2026-10-21 | `feature/v23-premium-readability-20261021` | conflicts=5, clean_changes=0 |
| 2026-10-21 | `feature/v25-messenger-2-20261021` | conflicts=4, clean_changes=0 |
| 2026-10-21 | `fix/seller-slug-profile-20261021` | conflicts=1, clean_changes=0 |
| 2026-10-21 | `fix/v13-seller-contact-routing-20261021` | conflicts=2, clean_changes=0 |
| 2026-10-21 | `fix/v23-single-service-grid-20261021` | conflicts=1, clean_changes=0 |
| 2026-10-21 | `fix/v26-auth-redirect-beta-approval-20261021` | conflicts=2, clean_changes=0 |
| 2026-10-21 | `fix/v26-home-session-aware-navigation-20261021` | conflicts=3, clean_changes=0 |
| 2026-10-22 | `feature/v26-closed-beta-stability-20261021` | conflicts=6, clean_changes=0 |
| 2026-10-23 | `feature/v34-project-notifications-management-20261023` | conflicts=2, clean_changes=0 |
| 2026-10-23 | `feature/v35-1-global-account-menu-20261023` | conflicts=4, clean_changes=0 |
| 2026-10-23 | `feature/v35-2-3-seamless-ux-20261023` | conflicts=5, clean_changes=0 |
| 2026-10-23 | `feature/v35-4-global-notifications-20261023` | conflicts=4, clean_changes=0 |
| 2026-10-23 | `feature/v36-smart-search-2-20261023` | conflicts=2, clean_changes=0 |
| 2026-10-23 | `fix/beta-stable-preview-notifications-20261023` | conflicts=0, clean_changes=0 |
| 2026-10-23 | `fix/chat-attachment-explicit-send-20261023` | conflicts=1, clean_changes=0 |
| 2026-10-23 | `fix/v35-1-public-rpc-schema-usage-20261023` | conflicts=0, clean_changes=0 |
| 2026-10-23 | `fix/v35-6-notifications-chat-combined-20261023` | conflicts=6, clean_changes=0 |

## Has work that is not in the cleanup branch (7)

| Last commit | Branch | What is left behind |
|---|---|---|
| 2026-10-14 | `feature/premium-design-system-v4` | Abandoned V4 design system (`app/v4`, `components/v4-marketplace.tsx`); replaced by later designs. |
| 2026-10-20 | `fix/auth-portfolio-security-20261020` | Earlier auth callback variant plus `docs/AUTH-PORTFOLIO-SECURITY-GATE.md`; superseded. |
| 2026-10-21 | `feature/v24-e2e-security-release-gates-20261021` | Adds `docs/V24-QA-EVIDENCE.md`, `tests/v24-security-gates.mjs` and an older `tests/sql/marketplace-rls.sql`; not carried forward. |
| 2026-10-21 | `fix/auth-confirmation-messaging-20261021` | Adds `tests/auth-confirmation-copy.mjs` only. |
| 2026-10-21 | `fix/ssr-auth-session-20261021` | Alternative cookie-based (`@supabase/ssr`) browser session and `/workspace/` redirect; not adopted. The main line keeps the localStorage client. |
| 2026-10-23 | `feature/v35-order-collaboration-20261023` | Only an older CI trigger list differs. |
| 2026-10-24 | `feature/v38-premium-ux-refinement-20261023` | PR #52 was closed without merging; V39 continued from V37 instead. Compact homepage grid and Explore incremental listing were not carried forward. |
