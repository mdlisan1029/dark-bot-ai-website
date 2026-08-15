# Dark Bot AI — Backend Security Blueprint

## Never expose these in frontend code
- Paddle API key
- Paddle webhook signing secret
- Database credentials
- Telegram bot token
- License signing private key
- Any AI provider secret key

## Environment variables
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
DATABASE_URL=
LICENSE_PRIVATE_KEY=
TELEGRAM_BOT_TOKEN=
ADMIN_SECRET=

## MVP flow
Payment -> manual verification -> Telegram support -> application delivery -> Installation ID -> signed activation key.

## License security
Use asymmetric signatures where practical:
- private signing key: backend/admin only
- public verification key: embedded in the application
Never embed the private key in the desktop application.

## Future automation
Paddle webhook -> backend -> verify signature -> idempotent order processing -> license record -> download entitlement.

## Hardening
HTTPS; secure cookies; CSRF protection where applicable; rate limiting; input validation; parameterized SQL; security headers; brute-force protection; admin 2FA; audit logs; backups; dependency updates; secret rotation; least-privilege API permissions.
