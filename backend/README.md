# Dark Bot AI — Affiliate Backend Foundation

This backend layer is designed for the current business flow:

**Landing page → affiliate referral → Telegram chat → manual payment → manual setup → commission**

No Telegram bot is required.

## Recommended stack
- Vercel for the website/serverless API
- Supabase PostgreSQL for the database and authentication
- Supabase Auth for Admin/Affiliate login

The current repository is still frontend-first, so this phase adds the credential-free database schema and client-side attribution foundation. The live API, authentication, and dashboards should be added only after the database project is configured.

## Database
Run `schema.sql` in the Supabase SQL editor.

Core tables:
- `affiliates` — promoter accounts and commission terms
- `referral_events` — referral visits and Telegram clicks
- `customers` — attributed customers and manual payment/setup status
- `commissions` — commission calculations and payout status

## Environment variables (server-side only)
```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SECRET=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_SECRET` in frontend code.

## Current attribution behavior
`js/affiliate.js` captures `?ref=...`, stores it in localStorage, and adds the referral code plus a visitor reference to the pre-filled Telegram message. This is only the client-side foundation; production attribution must be persisted server-side.

## Next implementation phase
1. Create Supabase project and apply `schema.sql`.
2. Add Vercel serverless endpoints for referral events and customer creation.
3. Add admin authentication and Admin Dashboard.
4. Add affiliate authentication and isolated Affiliate Dashboard.
5. Add commission automation and payout tracking.

## Security requirements
Use HTTPS, secure authentication, server-side authorization, rate limiting, input validation, parameterized database operations, security headers, audit logs, and regular backups. Never trust affiliate IDs or commission values supplied by the browser.
