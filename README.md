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

## Project Status & Roadmap

The current build covers the **core loop**: authentication, geolocation-based avatar placement, and private quest CRUD on a viewport-scoped map. Intentionally deferred to future iterations:

- Event discovery/aggregation from external sources (e.g. Meetup)
- Inviting other users / shared or multiplayer quests
- Avatar customization
- Quest recurrence and notifications/reminders
