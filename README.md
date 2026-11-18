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

## Deploying to Vercel and Render

The client is a static Vite app for Vercel. The NestJS API runs as a Render web service and needs PostgreSQL and Redis. Keep this repository's root `package-lock.json` as the lockfile for both deployments.

### Render API

Create a Render Web Service from this repository with the repository root as its Root Directory:

- Build command: `npm ci --include=dev && npm run build:server`
- Start command: `npm run start:server`
- Health check path: `/health/live`

Create a Redis service (Render Key Value) and a Supabase project. In the Supabase dashboard, open **Connect**, choose **Session pooler**, and copy its connection string into Render's `DATABASE_URL`. Use the supplied host, username, and port (session mode uses port `5432`); don't substitute the direct database endpoint or transaction pooler URL. Add `sslmode=require` to the URL query if Supabase's copied string does not already require SSL. URL-encode special characters in the database password. The Render server can use Supabase's shared pooler over IPv4.

For `REDIS_URL`, copy the **Internal URL** from the Render Key Value service's **Connect** menu. It must be a URL such as `redis://red-xxxxxxxxxxxxxxxxxxxx:6379` (or `rediss://...` when using the external URL), not just the Render service ID. Keep the API and Key Value service in the same Render region to use the internal URL.

Set these API environment variables in Render:

- `NODE_ENV=production`
- `DATABASE_URL` to the Supabase **Session pooler** connection string
- `REDIS_URL` to the Render Key Value internal URL
- `JWT_SECRET` to a long random secret
- `FRONTEND_URL` and `PUBLIC_URL` to the deployed Vercel site origin, with no trailing slash
- `BACKEND_URL` to the public Render service URL, with no trailing slash
- `SWAGGER_ENABLED=false`

Add optional integration variables when those features are configured: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` (the Render URL plus `/api/auth/google/callback`), Cloudinary credentials, and Brevo credentials. For account invitation emails, also set `MAIL_ENABLED=true`, `BREVO_API_KEY`, and `BREVO_SENDER_EMAIL`. Set the OAuth provider's callback URL to the same callback URL. Render supplies `PORT`; the API uses it automatically. Database migrations are applied when the API starts.

### Vercel client

Import this repository as a Vercel project and set Root Directory to `apps/client`. Enable access to files outside the root directory so the workspace lockfile and packages can be used. Configure:

- Install command: `cd ../.. && npm ci`
- Build command: `cd ../.. && npm run build:client`
- Output directory: `dist`
- Environment variable: `VITE_API_URL` set to the public Render service URL, with no trailing slash

The existing `apps/client/vercel.json` rewrite supports client side routes. Vite embeds `VITE_API_URL` during the build, so redeploy the Vercel project after changing it. Check the Render health endpoint at `/health/live` and the site API connection after both deployments finish.

After building locally, `npm run start:server` starts the production API and `npm run start:client` serves the built client preview. For development, use `npm run dev:server` and `npm run dev:client`.
