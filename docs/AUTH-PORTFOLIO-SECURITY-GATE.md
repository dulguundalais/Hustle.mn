# Authentication and portfolio security gate (2026-10-20)

## Implemented in this branch
- PKCE callback redirects successful sessions to /workspace/ instead of the legacy /beta page.
- The anonymous /api/portfolio-image endpoint now fails closed (404). Public seller pages render portfolio titles/placeholders instead of broken or potentially unsafe private-storage image requests.
- No service-role credentials are introduced. No production changes, migrations or privileged admin assignments.

## Important remaining work before release
1. **Email confirmation:** The workspace currently uses Supabase JS signUp with emailRedirectTo=/login/. This is a browser-managed implicit/PKCE flow, separate from the server /auth/callback route. Test actual confirmation with a fresh allowlisted email and Supabase Auth URL Configuration. For a unified server PKCE flow, change signup redirect to /auth/callback and ensure the same storage/cookie flow is used end to end; do not change redirect blindly.
2. **Public portfolio images:** Implement a server-side consent-aware image delivery endpoint or separate public-only bucket. Check seller public_profile, enabled beta membership and portfolio object ownership at request time; issue short-lived signed URLs; verify revocation and caching. Until then public previews intentionally show titles/placeholders.
3. **Security:** Review all SQL RLS/storage policies; execute authenticated buyer/seller/admin browser E2E, upload/download, authorization denial and mobile QA.
4. **Deployment:** Cloudflare static preview functions and Next runtime routes are different. Validate both paths. Keep production unchanged.

## Manual QA
- Confirm /auth/callback?code=<valid PKCE code> lands in /workspace/ with an authenticated session.
- Confirm /auth/callback with no code returns login error.
- Confirm /api/portfolio-image?path=<valid path> returns 404 without leaking private files.
- Confirm public seller HTML shows portfolio titles without private image URLs.
- Confirm private portfolio images remain visible to authorized sellers via their existing signed URLs.

## Source of truth
Review the current PR #3 handoff and migration files before merging. This branch is deliberately a narrow fail-closed mitigation, not proof of full E2E readiness.
