# JaynStan

JaynStan is a creative services portfolio, being upgraded into a platform where creatives can manage profiles, promote services, and share work.

## Monorepo layout

- `apps/client` - TypeScript React and Vite client (port 2000)
- `apps/server` - TypeScript NestJS API (port 2500)
- `docker-compose.yml` - local PostgreSQL (port 2555) and Redis (port 2525)

All environment configuration lives in the repository root. The API loads `./.env` from the root, and Vite reads its environment variables from the same location.

## Local development

1. Install Node.js and Docker Desktop.
2. Copy `.env.example` to `.env` in the repository root and update the values.
3. Install dependencies with `npm install`.
4. Start PostgreSQL, Redis, the API and client with `npm run dev:all`.

Use `npm run dev` to run only the client and API. Use `npm run db:up` and `npm run db:down` to manage the data services separately.

The API welcome page is `http://localhost:2500/`, Swagger is at `/api/docs`, and the health dashboard is at `/health` (with `/health/live`, `/health/ready`, `/health/data`, `/health/keep-alive/toggle`, and `/health/ping`). The client runs at `http://localhost:2000` and proxies `/api` requests to the API during development. Keep-alive is off by default; enable it from the dashboard to persist the setting in Redis and ping the API every ten minutes.

Cloudinary and Brevo credentials are reserved in the root environment template for image and email features. Account creation, uploads, and the superadmin seed workflow are planned next.

Authentication is planned to support Google OAuth and three application roles: `user`, `admin`, and `superadmin`.

See [the platform flow document](docs/platform-flows.md) for the agreed signup, provider review, service contact, messaging, support, and listing flows.
