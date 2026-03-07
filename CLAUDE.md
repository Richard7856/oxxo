# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build (uses --webpack + postbuild push handler injection)
npm run lint         # Run ESLint
npm run db:types     # Regenerate Supabase TypeScript types (requires SUPABASE_PROJECT_ID in env)
node scripts/generate-vapid-keys.js  # Generate VAPID keys for push notifications
```

There are no tests (planned but not implemented).

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_ID`
- `ANTHROPIC_API_KEY` — used for both ticket extraction (Claude Vision) and chat resolution analysis
- `N8N_VALIDATE_STORE_URL`, `N8N_TEMPLATE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

## Architecture

### Role-Based Structure
Three user roles each have their own App Router segment:
- `/app/conductor/` — driver dashboard (create/manage delivery reports)
- `/app/comercial/` — commercial agent dashboard (monitor/resolve zone incidents)
- `/app/admin/` — administrator panel (user, zone, and export management)

Home page (`app/page.tsx`) performs role-based routing. The middleware (`middleware.ts`) refreshes Supabase sessions and guards protected routes.

### Report State Machine
`lib/state-machines/reporte-state.ts` implements the reporte lifecycle with transition guards:
```
draft → submitted → resolved_by_driver | timed_out → completed → archived
```
Five report types: complete rejection, partial rejection, return, shortage, surplus. Submitted reports timeout after 20 minutes.

### Supabase Integration
- `lib/supabase/server.ts` — server-side client (uses cookies)
- `lib/supabase/client.ts` — browser-side client
- `lib/supabase/middleware.ts` — session management for middleware
- Row-Level Security (RLS) is enforced on all tables. Key tables: `user_profiles`, `stores`, `reportes`, `messages`, `processed_tickets`
- Storage bucket `ticket-images` holds report photo evidence

**Database setup**: Run migrations in `supabase/migrations/` sequentially (001 → 025) in the Supabase SQL editor.

### AI Integrations (`lib/ai/`)
- `extract-ticket-data.ts` — Google Gemini Vision extracts structured data from ticket photos (includes retry logic and JSON parsing)
- `analyze-resolution.ts` — OpenAI GPT-4 analyzes chat conversations for resolution assessment
- API routes exposing these: `app/api/tickets/extract/route.ts`, invoked client-side during report creation flow

### Push Notifications / PWA
- Service worker lives in `public/sw.js` (injected post-build by `scripts/inject-push-handler.js`)
- `components/push-notification-manager.tsx` handles subscription lifecycle
- API routes: `app/api/push/` (subscribe, send, send-chat-notification, vapid-public-key)
- `lib/push/send-chat-notification.ts` is the shared utility for sending notifications server-side
- PWA manifest at `public/manifest.json`

### API Routes (`app/api/`)
- `stores/validate/` — validates store codes via n8n webhook
- `reportes/create/` and `reportes/[id]/` — create and update report records
- `chat/upload-image/` — image upload for in-chat evidence
- `tickets/extract/` — Gemini Vision ticket analysis

### Path Alias
`@/*` resolves to the repository root (configured in `tsconfig.json`).
