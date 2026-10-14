# Cloudflare preview deployment plan

Current Next.js app uses static export; server-side Supabase auth requires Next.js runtime.
Change next.config.ts to remove output: 'export' only when ready to test runtime deployment.
Cloudflare's current recommended Workers adapter is vinext; verify compatibility against Next.js 15 and existing routes before adopting it.
See https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/

1. Configure an isolated Cloudflare Workers preview environment, never production.
2. Install and pin the tested adapter and Wrangler versions; commit lockfile.
3. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in preview build settings.
4. Restrict access via closed-beta authorization at server endpoints and protect the preview hostname separately if required.
5. Run Next.js build, adapter build, smoke tests, auth tests, then deploy preview.
6. Do not attach hustle.mn production domain or deploy production until approved.

Status: configuration draft only; no Cloudflare deployment performed.
