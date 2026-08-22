# Select For Map (SFM)

An interactive map/event-planner web app that borrows visual language from 16-bit JRPGs to make geographically organized event planning feel personal and fun — your location is a pixel-art avatar, not a directional arrow, and events are "quests" pinned to real-world coordinates.

Built as a decoupled **Laravel API + Vue 3 SPA**, deployed via Docker Compose.

## Overview

SFM's core loop: sign up, see yourself placed on a game-styled map via geolocation, and drop pins ("quests") — a title, category, date/time, and description tied to a real location — that render back as category-specific pixel icons. Quests are private to their owner; viewport-scoped fetching keeps map panning fast by loading only what's on screen and prompting an explicit "Explore this area" refetch on a large pan, rather than re-querying on every movement.

This is a solo portfolio project, built to demonstrate designing and shipping a full-stack app as two independently deployable services — a pure JSON API and a separate SPA — rather than a server-rendered monolith.

## Tech Stack

**Backend**
- [Laravel 13](https://laravel.com/) (PHP 8.3+) — JSON API only, no Blade/Inertia views
- [Laravel Sanctum](https://laravel.com/docs/sanctum) — token-based API authentication
- MySQL 8
- [Pest](https://pestphp.com/) / PHPUnit — feature and policy tests

**Frontend**
- [Vue 3](https://vuejs.org/) (Composition API) + [Vite](https://vite.dev/)
- [Pinia](https://pinia.vuejs.org/) — auth/session and quest state
- [MapLibre GL JS](https://maplibre.org/) — map rendering, using [OpenFreeMap](https://openfreemap.org/)'s free hosted tiles (no API key required)
- [Vitest](https://vitest.dev/) + Vue Test Utils

**Infrastructure**
- Docker Compose (separate `app`, `web`, `db`, and `frontend` services in dev; a built static SPA baked into the nginx image in production)
- nginx reverse-proxying `/api` to PHP-FPM and serving the built SPA for everything else

## Architecture

```
┌─────────────────┐      Bearer token       ┌──────────────────────┐
│   Vue 3 SPA      │ ───────────────────────▶│   Laravel API         │
│  (Vite / Pinia)  │◀─────────────────────── │  (Sanctum-guarded)    │
└─────────────────┘        JSON              └──────────┬────────────┘
                                                          │
                                                          ▼
                                                     ┌──────────┐
                                                     │  MySQL   │
                                                     └──────────┘
```

- **Auth** is token-based (`Authorization: Bearer <token>`) via Sanctum's API token guard rather than cookie-based SPA auth — this keeps the two services independently deployable without sharing a top-level domain.
- **Authorization**: quests are single-owner; a `QuestPolicy` enforces that only the owning user can update or delete their own quests.
- **Quest queries** are scoped to the current map viewport (`min_lat`/`max_lat`/`min_lng`/`max_lng` bounding box), not the whole dataset, and are validated server-side.

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) and Docker Compose

### Local development

```sh
git clone https://github.com/KylePep/SelectForMap.git
cd SelectForMap
docker compose up -d --build
```

This starts:
| Service | URL | Description |
|---|---|---|
| `web` | http://localhost:8080 | nginx, proxies `/api` to Laravel |
| `frontend` | http://localhost:5173 | Vite dev server (hot reload) |
| `db` | `localhost:3307` | MySQL 8 |

Then run migrations:

```sh
docker compose exec app php artisan migrate
```

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env` before first run, and generate an app key:

```sh
docker compose exec app php artisan key:generate
```

Visit **http://localhost:5173** to use the app.

### Running without Docker

<details>
<summary>Backend (PHP 8.3+, Composer, MySQL)</summary>

```sh
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
composer dev   # runs the server, queue listener, log tailer, and Vite concurrently
```
</details>

<details>
<summary>Frontend (Node ^22.18 || >=24.12)</summary>

```sh
cd frontend
npm install
npm run dev
```
</details>

## Testing

Tests are written alongside each feature, not as a final pass — coverage spans auth flows, quest CRUD, viewport filtering, and per-user authorization on the backend, and key component/store logic on the frontend.

```sh
# Backend — Pest feature tests + policy unit tests
cd backend && composer test

# Frontend — Vitest
cd frontend && npm run test:unit
```

## Deployment

Production runs on the same Docker Compose model with a build that bakes the compiled SPA into the nginx image (`docker-compose.prod.yml`), so the frontend needs no separate runtime container:

```sh
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force
```

See [`docs/superpowers/plans/deployment-notes.md`](docs/superpowers/plans/deployment-notes.md) for full environment configuration and nginx routing details.

## Local Backend Demo Setup

Running the EC2 stack around the clock isn't worth it for occasional demos, so live demos instead run the Laravel API **locally** and expose it to the internet with a [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/). The frontend is deployed separately (e.g. Vercel) and points at the tunnel's public URL.

### What the tunnel does

`cloudflared` opens an outbound-only connection from this machine to Cloudflare's edge, which proxies `https://api-demo.kylepep.dev` to `http://localhost:8080` — the nginx `web` service from `docker compose up`, which reverse-proxies `/api` to the Laravel app (see [Architecture](#architecture)). No inbound ports need to be opened on the router/firewall.

### One-time setup

1. Install [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) and authenticate it, then create the tunnel and route a hostname to it:
   ```sh
   cloudflared tunnel login
   cloudflared tunnel create demo-backend
   cloudflared tunnel route dns demo-backend api-demo.kylepep.dev
   ```
2. Point the tunnel at the local backend port in `C:\Users\kaize\.cloudflared\config.yml`:
   ```yaml
   tunnel: demo-backend
   credentials-file: C:\Users\kaize\.cloudflared\<tunnel-id>.json
   ingress:
     - hostname: api-demo.kylepep.dev
       service: http://localhost:8080
     - hostname: db-demo.kylepep.dev
       service: tcp://localhost:3307
     - service: http_status:404
   ```
   The second rule (see [Remote DB access](#remote-db-access-optional) below) is optional — drop it if you only need the API tunneled.
3. In `backend/.env`, set `FRONTEND_URL` to the deployed frontend's origin (e.g. `https://your-app.vercel.app`). `config/cors.php` only allows the single origin in `FRONTEND_URL`, so the API will reject requests from anywhere else — update this and restart the backend whenever the frontend's URL changes.

### Starting a demo

Two things need to be running: the backend itself, and the tunnel.

```sh
# 1. Start the backend (from repo root — brings up db, app, and nginx on :8080; the
#    frontend container isn't needed since the frontend runs on Vercel, not locally)
docker compose up app web db

# 2. In another terminal, start the tunnel
cloudflared tunnel run demo-backend
```

Or start both together with one command:

```sh
cd backend
composer demo
```

`composer demo` runs `docker compose up app web db` and `cloudflared tunnel run demo-backend` concurrently and stops both if either exits (see the `demo`/`tunnel` scripts in [`backend/composer.json`](backend/composer.json)). `composer tunnel` runs just the tunnel on its own.

### Remote DB access (optional)

The `api-demo` hostname above only tunnels HTTP to the Laravel app — it doesn't expose MySQL. To connect a DB client (TablePlus, MySQL Workbench, etc.) to the local `db` container from another machine, MySQL's wire protocol needs a separate **TCP** ingress rule (`db-demo.kylepep.dev` → `tcp://localhost:3307`, already in the `config.yml` above), plus a Cloudflare Access policy gating it — a bare TCP forward has no login prompt of its own, so without Access anyone who knows the hostname could attempt a connection.

1. In the [Cloudflare Zero Trust dashboard](https://one.dash.cloudflare.com/) → Access → Applications, create a **Self-hosted** application for `db-demo.kylepep.dev` with a policy that allows only your own identity (e.g. your email).
2. Route the DB hostname the same way as the API one: `cloudflared tunnel route dns demo-backend db-demo.kylepep.dev`.
3. On the machine you want to connect *from*, run cloudflared's client-side proxy (this is what actually enforces the Access login — it opens a browser to authenticate before it'll forward anything):
   ```sh
   cloudflared access tcp --hostname db-demo.kylepep.dev --url localhost:13307
   ```
4. Point your DB client at `localhost:13307` on that machine, using the credentials from `backend/.env` (`DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD`).

This only works while `cloudflared tunnel run demo-backend` is running on the host machine — same process as the API tunnel, just a second ingress rule on it.

### Gotchas

- **The laptop must stay awake and online** for the entire demo — sleep, a dropped connection, or closing the terminal kills the tunnel and `api-demo.kylepep.dev` stops resolving. Disable sleep/screen-lock before a live demo.
- **CORS** is single-origin (`FRONTEND_URL` in `backend/.env`) — a new Vercel preview URL or custom domain needs that value updated and the backend restarted, or the frontend's requests will be rejected.
- **The DB tunnel is a real security boundary**, not just convenience — dev credentials (`sfm`/`sfm`) are weak on purpose for local dev, so don't route `db-demo` without the Access policy in step 1 above actually configured.

## Project Status & Roadmap

The current build covers the **core loop**: authentication, geolocation-based avatar placement, and private quest CRUD on a viewport-scoped map. Intentionally deferred to future iterations:

- Event discovery/aggregation from external sources (e.g. Meetup)
- Inviting other users / shared or multiplayer quests
- Avatar customization
- Quest recurrence and notifications/reminders
