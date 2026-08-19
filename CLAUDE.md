# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Select For Map (SFM) is a game-styled interactive map/event-planner (16-bit JRPG visual language — the user's location is a pixel-art avatar, events are "quests" pinned to real-world coordinates). It's a **portfolio piece** built to demonstrate a decoupled Laravel + Vue stack for full-stack job interviews — favor decisions that are demonstrable/defensible in an interview over ones that are merely expedient, and don't scope-creep toward production concerns (scaling, moderation, etc.).

Full design spec: `docs/superpowers/specs/2026-08-10-select-for-map-core-design.md`. Note the spec says "Mapbox"; the app has since migrated to **MapLibre GL JS** against OpenFreeMap's free hosted tiles (`frontend/src/components/MapCanvas.vue`) — no map API key/account needed.

## Repo layout

Two independent projects, no shared root `package.json`/build:

- `backend/` — Laravel 13 API-only app (no Blade/Inertia views), PHP 8.3+
- `frontend/` — Vue 3 (Composition API) + Vite SPA, talks to the API over HTTP
- `docker/` — nginx and PHP Dockerfiles/configs for both dev and prod compose stacks
- `docs/superpowers/` — specs, plans, and `plans/deployment-notes.md` (EC2/Docker deploy steps and nginx gotchas — read before touching nginx configs or the prod compose file)

## Commands

### Backend (`backend/`)

```sh
composer install
php artisan migrate

# Run everything (server + queue listener + logs + Vite) concurrently:
composer dev

# Tests (Pest, sqlite in-memory — see phpunit.xml)
composer test
php artisan test
php artisan test --filter=CreateQuestTest       # single test file
php artisan test tests/Feature/Quest/CreateQuestTest.php

# Lint/format
vendor/bin/pint
vendor/bin/pint --dirty     # only files changed vs. git
```

### Frontend (`frontend/`)

```sh
npm install
npm run dev              # Vite dev server (port 5173)
npm run build             # production build
npm run test:unit         # Vitest (jsdom environment)
npx vitest run src/stores/__tests__/quests.spec.js   # single test file
```

### Full stack via Docker Compose (dev)

```sh
docker compose up -d --build
```
Brings up `app` (PHP-FPM), `web` (nginx, `:8080`), `db` (MySQL, exposed on host `3307`), and `frontend` (Vite dev server, `:5173`). `web` proxies `/api` to Laravel.

Production stack (`docker-compose.prod.yml`) builds the SPA into `web`'s nginx image rather than running a separate frontend container — see `docs/superpowers/plans/deployment-notes.md` before changing it, especially the note on why the PHP-FPM `location` block must be a top-level sibling of `location /api`, not nested inside it.

## Architecture

**Auth:** Laravel Sanctum, token-based (`Authorization: Bearer`) — not cookie-based SPA auth. This is deliberate: it keeps auth simple to reason about and doesn't require frontend/backend to share a top-level domain. Register/login return `{ user, token }`; the SPA stores both in Pinia + `localStorage` (`frontend/src/stores/auth.js`) and attaches the token via an axios interceptor (`frontend/src/lib/apiClient.js`). A 401 response triggers `attachUnauthorizedInterceptor`'s callback, which clears the local session and bounces to `/login` (see `router/index.js`'s `beforeEach` guard on `meta.requiresAuth`).

**Quests (core domain object):** `id, user_id, title, description, category (enum), lat, lng, starts_at`. Single-owner/private in v1 — no sharing/invites yet (deferred per spec). Ownership is enforced via `App\Policies\QuestPolicy` (`update`/`delete`), invoked from each `FormRequest`'s `authorize()` (see `UpdateQuestRequest`) or explicitly in the controller (`QuestController::destroy`) — `StoreQuestRequest::authorize()` is unconditionally `true` since creation has no owner to check yet.

**Viewport-scoped loading:** the map never fetches on every pan/zoom tick. The SPA sends `min_lat/max_lat/min_lng/max_lng` query params to `GET /api/quests` (validated in `QuestController::index`); `frontend/src/utils/bounds.js`'s `boundsChangedSignificantly` decides when a pan is large enough (>50% of viewport span by default) to surface an explicit "Explore this area" refetch prompt rather than auto-fetching continuously. Keep this param naming convention in sync between `QuestController::index` and `bounds.js`/`stores/quests.js` if either changes.

**Frontend structure:** `stores/` (Pinia: `auth`, `quests`) hold API-derived state; `lib/apiClient.js` is the single axios instance + interceptor setup; `components/` are presentational (`MapCanvas`, `AvatarMarker`, `QuestMarker`, `QuestForm`, `QuestPanel`); `views/` compose components + stores per route; `composables/useGeolocation.js` wraps browser geolocation with the spec's fallback behavior (denied/unavailable → default center + manual-set prompt, never a hard failure).

**Testing:** a deliberate first-class emphasis, not a final pass — tests are written alongside each feature. Backend: Pest feature tests per auth/quest flow under `tests/Feature/`, plus policy unit tests under `tests/Unit/`. Frontend: Vitest specs live in `__tests__/` siblings next to the code they cover (e.g. `components/__tests__/`, `stores/__tests__/`). Mapbox/MapLibre rendering itself isn't meaningfully unit-testable and is verified manually.
