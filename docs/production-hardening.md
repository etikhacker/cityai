# CityAI production hardening

## Required environment variables

Use Vercel project settings for production values; never commit them.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL used by the browser SDK. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public/publishable Supabase key used only for signed browser uploads. The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains a fallback. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for validated API database and Storage operations, including the private rate-limit RPC. Do not prefix it with `NEXT_PUBLIC_`. |
| `CITYAI_SERVER_SECRET` | Random server-only HMAC secret, at least 32 characters, used for admin sessions and temporary media proofs. Keep identical across all app instances. |
| `CITYAI_ADMIN_PASSWORD` | Strong, unique operator password (12–256 characters). Login fails closed if it is absent or shorter than 12 characters. |
| `GEMINI_API_KEY` | Server-only Gemini credential used by image/video analysis and comparison. |
| `GEMINI_MODEL` | Optional server-side model identifier; default is `gemini-3.8-flash`. Only set a model confirmed to support the requested input types and free-tier use. |

No Upstash/Redis service or additional rate-limit environment variables are needed. Shared rate limits use the existing Supabase Postgres project and `SUPABASE_SERVICE_ROLE_KEY`.

## Admin secrets

In Vercel Project Settings → Environment Variables, add `CITYAI_ADMIN_PASSWORD` and `CITYAI_SERVER_SECRET` to Production as secret values. Use a password-manager-generated, unique admin password (12–256 characters) and a separate random server secret with at least 32 characters. Do not put either value in source code, GitHub, screenshots, or chat. For local work, use the ignored `.env.local` file and never commit it. Changing `CITYAI_SERVER_SECRET` invalidates existing admin sessions and outstanding media proofs; deploy after changing either variable.

For local setup, generate each value in a password manager. Store them only in the local ignored `.env.local` or directly in Vercel's secret-value field; do not paste them into chat or terminal commands that may be saved in shell history. Set `CITYAI_ADMIN_PASSWORD` to a unique password of at least 12 characters and `CITYAI_SERVER_SECRET` to at least 32 random bytes encoded as hex/base64. Keep the server secret stable across app instances. Treat a rotation as a session/proof invalidation event.

## Gemini verification

`GEMINI_API_KEY` is read by the server routes (`/api/analyze` and `/api/compare`) and sent to Google only in the `x-goog-api-key` request header. It is not exposed through a `NEXT_PUBLIC_` variable. Requests set `store: false` so interaction payloads are not retained as server-side interaction state. The default `gemini-3.8-flash` supports video input and is listed with free-tier standard token pricing in Google's pricing guide. A configured key may still be attached to a paid-billing project; confirm the project's tier in AI Studio before live tests.

Video input is sent as actual `type: video` content, not as an extracted still frame. Because Vercel Function request bodies are limited to 4.5 MB by default, the synchronous AI-analysis request accepts at most 3 MB to leave multipart overhead; larger video files remain attachable to complaints but require manual description. This request limit is separate from the 20 MB Storage upload limit.

The complaint form displays a disclosure and requires explicit consent before sending selected media to Gemini. This is important because content on the Gemini Free tier may be used to improve Google products.

Automated unit tests mock the provider and are safe to run without a Gemini account. An opt-in real request test is available at `src/lib/city-analysis.live.test.ts`; it sends only a generated 1x1 transparent PNG and prints no key or provider output. To run it locally, first make sure the key belongs to a confirmed Free-tier project, then set `GEMINI_API_KEY` in the current shell through your password manager/secret store, set `CITYAI_RUN_GEMINI_LIVE=1`, and run `npm run test -- src/lib/city-analysis.live.test.ts`. Do not run against a key with unknown billing status. Google says Free-tier token access is free, but account billing tier and model eligibility must be checked by the owner; requests under Paid tier may incur usage charges. Free-tier content may be used to improve Google products.

## Database rollout order

Do not apply these migrations in production until the owner authorizes it. The API intentionally returns `503` when the shared rate-limit RPC is missing, so it cannot silently fall back to a process-local quota.

1. Apply `20261120190000_cityai_distributed_rate_limits.sql` first. It adds a private table and an RPC executable only by `service_role`; it does not change existing complaint rows or public complaint policies.
2. Configure the required Vercel environment variables and deploy the hardened application. This replaces the old browser-side DB flows with validated server APIs.
3. Apply `20261120200000_cityai_private_complaints.sql` after the hardened app is live. It removes public complaint reads/writes and grants the server role the API requires. Applying it before replacing the old frontend would interrupt its direct anonymous DB reads/writes.

Before applying the privacy migration, check for duplicate non-null `media_fayllar.storage_path` values. The new unique index fails the migration safely if duplicates exist; review any duplicates manually and do not delete rows as an automatic repair.

Read-only duplicate check (run in the intended database before migration; returns only duplicate paths and counts):

```sql
select storage_path, count(*) as row_count
from public.media_fayllar
where storage_path is not null
group by storage_path
having count(*) > 1
order by row_count desc;
```

## Zero-cost local migration test

The repository migrations were applied from a clean local Supabase database with `supabase db reset --no-seed`. The baseline (`20261120173220`) and least-privilege grant migration (`20261120173734`) were reconstructed from read-only production catalog metadata because their original SQL files were missing from the repository. Production already records those version IDs as applied. No production rows were queried or copied. Because the original migration source is unavailable, compare the current production schema metadata with the baseline before any future rollout; do not treat the reconstructed SQL text as the original historical source.

Local verification on 2026-11-21:

- All four migrations applied in version order: database baseline, grants, distributed rate limits, private complaints.
- Auth and Storage health endpoints returned HTTP 200. PostgreSQL was healthy. The local Vector/log collector kept restarting (see below); the other CityAI and unrelated containers were left running.
- RLS was enabled on all complaint, rate-limit, and Storage tables. Final privacy policies were absent for direct browser table access; `anon` and `authenticated` had no complaint table privileges. `service_role` had the expected server privileges. Rate-limit RPC was `SECURITY DEFINER`, had an empty `search_path`, and was executable only by `service_role` among application roles.
- Three child foreign keys used `ON DELETE CASCADE`. The signed upload → submit → tracking → orphan cleanup flow passed; linked media was protected from cleanup. Admin login/logout, brute-force 429, and safe 503 when the RPC was unavailable passed.
- Twenty concurrent RPC calls with a limit of five produced exactly five allowed and fifteen denied. Null RPC input was rejected with SQLSTATE `22023`.
- Synthetic complaint/media/Storage fixtures were cleaned by the integration test. The test generated rate-limit buckets locally; they are short-lived limiter state and expire through the migration's bounded cleanup. No production data was accessed.

The Vector container restart is isolated to its Docker log source: its logs report a refused connection to Docker API TCP port 2375. Docker Desktop is not exposing that endpoint. Postgres, Auth, Storage, and the other local services remained healthy. No other container was stopped or removed.

For a backup/restore rehearsal without production data, create a disposable local database, load only synthetic fixture rows, make a local-only dump, restore into a second disposable database, then compare migration versions, catalog fingerprints, constraints, and application smoke-test results. Do not use production credentials in this rehearsal. A future production backup/restore proof requires an explicitly authorized backup location and a disposable restore target; neither was used here.

## Current rollout gate (2026-11-21)

- Vercel Production has `GEMINI_API_KEY`, Supabase URL/publishable key, and service-role key configured (presence checked without decrypting values). `GEMINI_MODEL` is not set, so code uses the `gemini-3.8-flash` default.
- Vercel Production is missing `CITYAI_ADMIN_PASSWORD` and `CITYAI_SERVER_SECRET`; admin login and media proofs will fail closed until the owner sets these as sensitive values. Never send either value in chat.
- Production migration, production duplicate-path query, and backup/restore verification remain unperformed. Production must not be changed until the owner explicitly authorizes a rollout and a production backup restore has been proven.
- Current code verification: 26 tests passed, one opt-in live Gemini test skipped; TypeScript, ESLint, and production build pass. Gemini's actual project billing tier was not confirmed, so no live Gemini request was sent.
- The test suite and local integration generated short-lived rate-limit rows in the disposable local database. They contain hashed test keys, no raw IPs, and expire through the RPC cleanup. No complaint, media, or Storage objects remained after integration cleanup.

## Pre-rollout verification checklist

- [x] In a disposable local Supabase stack, apply migrations in order; inspect RPC security, NULL validation, and execute grants. Confirm `anon` and `authenticated` cannot execute it and `service_role` can.
- [x] Exercise concurrent requests against the RPC: exactly the configured number are allowed; subsequent calls are denied consistently.
- [x] Apply privacy migration and verify RLS, table grants, Storage privacy, foreign keys, and service-role API access.
- [x] Exercise signed upload → proof → complaint submission → tracking → cleanup, admin login/logout, brute-force throttling, `429`, and missing-RPC `503` against the local stack.
- [ ] Repeat proof expiry, duplicate path rejection, and proof reuse tests; confirm browser-facing signed URL lifetime against the current API contract.
- [ ] Confirm production tracking isolation, public status-change denial, and production duplicate-path query after rollout authorization.
- [ ] Run admin cookie/CSRF/session-expiration checks against the live deployment after rollout authorization.
- [ ] Run Gemini mocked tests routinely; run the explicit live smoke test only after confirming the key's Free tier and consent to Google Free-tier data terms.
- [ ] Rehearse a local-only backup/restore using synthetic data; record a verified production backup and rollback point before any authorized rollout. Deploy hardened APIs before privacy migration because the old browser API depends on public table access.

Read-only catalog queries for the disposable test database:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname in ('public', 'storage')
  and tablename in ('muracietler', 'ai_analizler', 'media_fayllar', 'status_tarix', 'cityai_rate_limit_buckets', 'objects')
order by schemaname, tablename;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

select table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema in ('public', 'storage')
  and grantee in ('anon', 'authenticated', 'service_role')
order by table_schema, table_name, grantee, privilege_type;

select has_function_privilege('anon', 'public.cityai_check_rate_limit(text,integer,integer)', 'EXECUTE') as anon_can_execute,
       has_function_privilege('authenticated', 'public.cityai_check_rate_limit(text,integer,integer)', 'EXECUTE') as authenticated_can_execute,
       has_function_privilege('service_role', 'public.cityai_check_rate_limit(text,integer,integer)', 'EXECUTE') as service_role_can_execute;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;
```

These catalog queries are read-only; use them against the local disposable project, and do not print secret values from platform settings.

The new limiter stores only SHA-256 hashes of endpoint scope + client IP and periodically removes expired buckets. The private rate-limit table grows with unique client/scope combinations; monitor its size and add scheduled cleanup if traffic warrants it.

## Local build

The app uses local system font stacks so production builds do not depend on fetching Google Fonts. A build without Supabase public variables can fail during page prerender because the browser SDK validates its URL at module load. For offline/local build verification, provide harmless placeholder values for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the build process only. Do not use those placeholders for a real deployment.
