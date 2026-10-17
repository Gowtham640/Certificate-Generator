# Plunk (local, same repo as Certificate Generator)

Self-hosted Plunk dashboard + API next to the Next.js certificate app.

Homelab reference: `~/plunk` on `anassyed-homelab`, public hostnames on tunnel `crave_circle_backend`. This Mac stack is a **local copy**: ntfy on **8083**, Plunk HTTP on **8085**, no CraveCircle tunnel network.

## URLs (after `npm run plunk:up`)

| Surface | URL |
|---|---|
| Dashboard | http://app.localhost:8085 |
| API | http://mail-api.localhost:8085 |
| Landing | http://email.localhost:8085 |
| Docs | http://docs.localhost:8085 |
| ntfy | http://127.0.0.1:8083 |
| MinIO console | http://127.0.0.1:9001 |

Open the dashboard with the **app.localhost** hostname. `http://127.0.0.1:8085` hits the API default vhost.

Certificate Generator stays at **http://localhost:3001**.

## Commands

```bash
# from repo root (Colima must be running)
npm run plunk:up
npm run plunk:logs
npm run plunk:down
```

First boot: copy `plunk/.env.example` → `plunk/.env` and set `DB_PASSWORD`, `JWT_SECRET`, and MinIO passwords (`openssl rand -base64 32`). SES keys are optional for the dashboard; sending mail needs AWS SES.
