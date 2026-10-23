# Hustle.mn V25 Messenger 2.0 — implementation and evidence

Date: 2026-10-21. Head: `feature/v25-messenger-2-20261021`. Draft PR #22.

## Implemented
- Additive chat schema: private `chat-attachments` storage bucket, `chat_attachments` metadata tied to exact sender, recipient and message, RLS for participants, storage policies, transaction-safe `send_chat_attachment` RPC.
- Restricted MIME types and 10MB file-size validation, short-lived signed URLs for opening/download, inline image previews.
- Emoji composer, received-message unread count/badges, recipient-only read receipts, private opt-in activity heartbeat and last seen.
- Aggregate seller first-response metric only when at least 3 valid samples; no fabricated number. Order context, MN/EN, dark/light friendly CSS.
- Existing messages, orders, reviews unchanged.

## Verification
- CI: https://github.com/dulguundalais/Hustle.mn/actions/runs/39605206376 — both validate and real Chromium browser jobs PASS. Browser uses mock accounts, not real users.
- Browser matrix: 390px, 768px, 1440px. Screenshots and Playwright traces uploaded as CI artifact.
- Supabase migration executed successfully on closed-beta project `pgrxsphkjudvfbpaudbd`, private bucket `public=false`.
- SQL post-migration: chat attachments=0, presence=0, existing messages=2, orders=1, reviews=1.
- Unapproved simulated identity SELECT showed 0 messages, 0 presence records and 0 attachments.

## Remaining gates — not represented as passed
- Authenticated *two-account* cross-tenant upload, download, signed URL, metadata spoofing, and read receipt HTTP negative tests.
- Browser test with real staging auth and actual PDF/image upload + download + notification delivery (existing browser run uses mocks).
- Preview deployment of PR branch with beta schema, manual MN/EN and light/dark screenshots and accessible mobile touch QA.
- Security review of MIME sniffing/virus-scanning options, signed URL expiry, client-side error recovery and orphan upload cleanup.
- RLS posture: sender's own uploads may be read prior to metadata creation; third-party recipient cannot read without linked metadata. Human QA still required.

## Release policy
Do not merge or deploy production without owner approval. PR remains Draft. Closed-beta schema was changed additively; no payments or user data deleted.
