# Dark Bot AI — Affiliate System Setup

## 1) Supabase frontend config
Edit `config/supabase-config.js` and set:
- `url` = Supabase Project URL
- `anonKey` = Supabase publishable/anon key

Never put the Supabase service-role/secret key in this file.

## 2) Supabase SQL
Use the SQL that created the tables/policies in `backend/schema.sql` from this project. If you already ran it, do not rerun unless you intentionally want to update the schema.

## 3) Admin account
Your first admin user must have `profiles.role = 'admin'`. The existing account you created was already promoted to admin.

## 4) Mojnu Khan affiliate
Mojnu must have an Auth user first. Then open Admin Dashboard -> Create Affiliate and enter his Auth UID, name, brand, email, code and commission rate.
Recommended code: `mojnu-khan`.
His referral URL will automatically be:
`https://YOUR-LIVE-DOMAIN/?ref=mojnu-khan`

## 5) Vercel server environment
Add these environment variables in Vercel Project Settings -> Environment Variables:
- `SUPABASE_URL` = Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY` = Supabase service-role/secret key

This secret is used only by `/api/referral.js` on Vercel. Never expose it to the browser, GitHub, or chat.

## 6) Vercel deployment
Deploy the project root. Vercel will serve the static site and `/api/referral.js` as a serverless function.

## 7) Telegram attribution flow
Affiliate shares:
`https://YOUR-LIVE-DOMAIN/?ref=affiliate-code`

The landing page stores the code, logs the visit via `/api/referral`, and rewrites Telegram links so the outgoing message contains:
`Referral: affiliate-code`
and
`Reference: visitor_xxx`

No Telegram bot is required.

## 8) Manual payment flow
When a customer messages Telegram, use the Referral + Reference shown in the prefilled message. In Admin Dashboard -> Record Customer / Payment, save the customer with that affiliate and reference. When Payment = Received, a commission record is created automatically for that customer using the affiliate's current commission rate.

Commission status can later be changed to Approved or Paid from the Admin Dashboard.

## 9) Affiliate dashboard
Affiliate login:
`/pages/affiliate-login.html`

Affiliate dashboard:
`/pages/affiliate-dashboard.html`

Admin login:
`/pages/admin-login.html`

Admin dashboard:
`/pages/admin-dashboard.html`
