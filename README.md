# Dark Bot AI Website

Product: **Dark Bot AI**
AI character/assistant: **HINA**
Launch price: **$25 Lifetime Access**
Platforms: **Windows + Linux**
Android: **Coming Soon**
Model/API usage: **BYOK — paid directly by the customer to their provider**

## Before launch
1. Replace the logo and screenshot placeholders if needed.
2. Replace Telegram channel/group/support placeholders in `config/public-config.js`.
3. Replace support email.
4. Review the Privacy, Terms and Refund pages before launch and make sure they match your actual business practices and applicable law.
5. Confirm the manual payment instructions shown on the landing page.

## Security
Never put a database credential, Telegram bot token, AI provider secret, license signing private key, or other server-side secret in frontend files. Keep those server-side/environment-only.

## MVP activation
Customer contacts official Telegram support -> payment instructions -> manual payment verification -> application delivery -> Installation ID -> signed activation key.

## Local preview
Run a static server in the project folder, e.g. `python -m http.server 8080`, then open `http://localhost:8080`.

## Affiliate portal setup
1. Rename `config/supabase-config.js` only if needed; it is already included as the public client config file.
2. Set your Supabase project URL and publishable/anon key in `config/supabase-config.js`.
3. Keep the Supabase service-role/secret key off the website.
4. Affiliate login: `pages/affiliate-login.html`.
5. Affiliate password setup/reset: `pages/affiliate-reset-password.html`.
6. Affiliate dashboard: `pages/affiliate-dashboard.html`.
7. An affiliate user must have a matching row in `public.affiliates` with `user_id = auth.users.id` and `profiles.role = 'affiliate'`.
8. The affiliate dashboard is intentionally read-only; customer/payment/commission writes remain admin/server-side work.
