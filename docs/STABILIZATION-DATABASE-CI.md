# V52 isolated database verification

This first stabilization increment replays every committed migration, in filename order, against a disposable PostgreSQL 17 service in GitHub Actions. It then executes column-privilege assertions and existing V47/V50/V52 actor tests. No Supabase token, production URL or remote database secret is used.

The bootstrap only supplies minimal Auth/Storage SQL contracts. It is not a Supabase migration, a complete Supabase clone, a paid staging project, or evidence of email delivery, Storage HTTP downloads, realtime events or authenticated browser E2E.

## Audit corrections

The initial audit confused table-level privilege absence with absent effective write access. Live column_privileges confirms the three moderation tables grant only specific INSERT/UPDATE columns. Do not fix this by granting table-wide writes. The new SQL check verifies allowed fields and denies protected fields.

Live hustle_private.referral_guard already sets eligibility/status and rejects attribution rewrites. The frontend payload does not establish a server-ownership vulnerability. Overbroad Partner code visibility and legacy TRUNCATE privileges remain separate open findings.

## Migration reconciliation still pending

Fresh replay tests repository bootstrap compatibility; it does not reconcile original migration history. V50 and V52 live versions differ from repository filenames, V33 has no matching history entry, and live backup/restore entries need separate review. Do not rename, repair or push migration history based solely on this workflow.

## Acceptance

- Replay succeeds on an empty disposable database.
- Effective column grants and existing actor fixtures pass.
- Changes remain independent of V53 PR #70 and preserve V52 UI.
- Production and original Supabase remain unchanged.
- Hosted isolated preview/backend, cross-account HTTP tests and marketplace-wide grant hardening remain the next increments.
