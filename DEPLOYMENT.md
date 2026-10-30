# Cloudflare Pages preview

Project: `hustle-mn-preview`

Production branch: `feature/homepage-ui-v1`

Build command: `npm run build`

Output directory: `out`

The Pages build uses Next.js static export with existing Pages Functions for public configuration/profile/image routes. Previews can connect to the original Supabase backend; they are not isolated staging databases. Do not run mutating acceptance fixtures there.

Full Auth/API/Storage acceptance runs against disposable loopback Supabase services in GitHub CI. See [integration rehearsal](docs/INTEGRATION-REHEARSAL.md) for the exact environment boundary and remaining Workers configuration failure. No production publish or real payment processing is authorized by the stabilization PRs.
