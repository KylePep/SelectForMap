# Select For Map (SFM) — Core Loop Design

**Date:** 2026-08-10
**Status:** Approved for planning
**Codename:** Select For Map (originally conceived as "DateKnight")

## Summary

SFM is an interactive map/event-planner web app that borrows visual language from video games (16-bit JRPG overworld style) to make geographically organized event planning feel fun and personal. The user's location is shown as a small pixel-art avatar rather than a directional arrow. This spec covers the **core loop only**: viewing a game-styled map, seeing your avatar on it, and creating/viewing/editing/deleting your own geo-linked "quests" (events).

### Explicitly out of scope for this spec

- Event discovery/aggregation from external sources (Meetup, etc.)
- Inviting other users / shared or multiplayer quests / any social graph
- Avatar customization or character selection
- Quest recurrence/scheduling beyond a single date/time
- Notifications/reminders

These are natural follow-on specs once the core loop is live and are intentionally decomposed out of this design.

### Portfolio context

This project is being built as a portfolio piece, partly to practice and demonstrate a Laravel + Vue stack (the combination that has gotten the most interview traction so far) as a decoupled SPA + API, rather than an Inertia-style monolith — this better demonstrates independent API design and Docker-based service separation. Testing is a deliberate emphasis: a recent interview went poorly due to an unexpectedly testing-heavy interview, so the implementation plan should treat tests as a first-class deliverable alongside each feature, not a final pass.

## 1. Architecture

- **Backend:** Laravel (latest), pure JSON API — no Blade/Inertia views. Auth via Laravel Sanctum using API tokens (not cookie-based SPA auth), which keeps auth simple to reason about and demo, and doesn't require frontend and backend to share a top-level domain.
- **Frontend:** Vue 3 (Composition API) + Vite, a fully separate SPA. Talks to the Laravel API over HTTP with the Sanctum token attached (e.g. `Authorization: Bearer`).
- **Map layer:** Mapbox GL JS, with a custom Mapbox Studio style for the reskinned/game-like look. Avatar and quest markers are custom DOM/marker overlays positioned by lat/lng, layered on top of the vector tile style — not baked into the tiles themselves.
- **Database:** MySQL (Laravel default). The `quests` table uses plain indexed `lat`/`lng` decimal columns — no PostGIS/spatial extension needed, since v1 only requires bounding-box (viewport) queries, not radius/distance math.
- **Local dev & deployment:** Docker Compose with separate services — `app` (PHP-FPM/Laravel), `web` (nginx), `db` (MySQL), and a `frontend` service (Vite dev server locally; built static assets served by nginx in production). Deployed to the user's existing AWS EC2 instance, with nginx reverse-proxying `/api` to Laravel and serving the built Vue static assets for everything else.

## 2. Data Model

- **users** — standard Laravel fields (`id`, `name`, `email`, `password`) plus Sanctum personal access tokens. No profile/avatar customization fields in v1 — every user gets the same default pixel avatar.
- **quests** — `id`, `user_id` (owner, FK), `title`, `description`, `category` (enum: `food`, `movie`, `outdoors`, `nightlife`, `shopping`, `other`), `lat` (decimal), `lng` (decimal), `starts_at` (datetime), timestamps. Indexed on `lat`/`lng` and `user_id` to support fast viewport bounding-box queries scoped to the owner.
- Quests are single-owner/private-to-owner in v1 — a user only ever sees their own quests on the map. No participants/invites table exists yet; that arrives with the future invites spec.

## 3. Core Interaction Flow

1. **Sign up / log in** — email + password. Sanctum token issued on login and stored client-side (e.g. Pinia store + localStorage), attached to subsequent API requests.
2. **Map load** — request browser geolocation. On success, center the map there and place the avatar marker at that position. On denial/failure, fall back to a default location (e.g. center of the contiguous US, or the user's last-known saved position) and show a lightweight prompt to search or click to set a starting position manually.
3. **Viewport-scoped quest loading** — on initial load, and on an explicit "Explore this area" action (not on every pan/zoom tick), the SPA sends the current map bounding box to `GET /api/quests?bounds=...`. Laravel returns only the logged-in user's quests within that box. Panning far enough from the last-loaded area surfaces the "Explore this area" affordance rather than auto-fetching continuously — this is the "switch zones" behavior, chosen to avoid the perceived sluggishness of maps that constantly re-fetch on every movement.
4. **Quest markers** — each returned quest renders as a category-specific pixel-art icon pinned at its lat/lng. Clicking a marker opens a popup/panel showing title, time, and description.
5. **Creating a quest** — a "drop a quest here" interaction on the map (click/tap placement) opens a form (title, category, date/time, description); submitting calls `POST /api/quests` and the new quest renders immediately.
6. **Editing/deleting** — from the same popup/panel, the owner can edit (`PUT /api/quests/{id}`) or delete (`DELETE /api/quests/{id}`) their quest.

## 4. Visual / Asset Strategy

- **Art source:** Existing free/CC-licensed 16-bit pixel art asset packs (e.g. itch.io, OpenGameArt) for the avatar sprite and category icons, rather than commissioned custom art — keeps the project achievable solo and on-timeline. Licensing is checked and noted per asset used.
- **Avatar:** A single static/simple-idle sprite — no walk-cycle animation needed since the app isn't navigation-oriented, just a marker with personality. A subtle CSS idle bounce/breathing animation is a nice-to-have polish item.
- **Category icons:** One distinct pixel-art icon per category (Food, Movie, Outdoors, Nightlife, Shopping, Other), small (e.g. 32x32) sprites rendered as Mapbox custom markers.
- **Map style:** Custom Mapbox Studio style using a **light, pastel base** (roads/terrain/water) with **bold, saturated** quest markers and UI on top — a light-to-bold contrast rather than a dark/muted-to-bright one. Default labels/POI clutter turned off so quest icons stay the visual focus.
- **UI chrome:** Game-HUD-inspired panels (quest popup, quest creation form) — bordered panel styling, pixel-friendly font — rather than generic Material/Bootstrap-style components.

Exact asset picks (specific packs, fonts, hex values) happen during implementation, not locked in this spec.

## 5. Error Handling & Edge Cases

- **Geolocation denied/unavailable:** fall back to a default map center and show a banner/prompt to search or click to set a starting position manually — never a hard failure.
- **API errors:** SPA shows inline toast/banner messaging — e.g. "Session expired, please log in again" on a 401, field-level validation errors on a 422 from quest creation/editing. No silent failures.
- **Empty states:** an empty viewport shows friendly messaging ("No quests here yet — drop a pin to add one") instead of a blank map.
- **Mapbox load failure:** (bad API key, network down) shows a fallback error state instead of a blank/broken page.

## 6. Testing Approach

- **Backend (Laravel):** Feature tests (Pest or PHPUnit) covering auth flows (register/login/token issuance), quest CRUD, viewport bounding-box filtering, and authorization (a user cannot view/edit/delete another user's quests).
- **Frontend (Vue):** Component/unit tests (Vitest) for key pieces — the quest form and quest list/marker rendering logic. Mapbox rendering itself is impractical to meaningfully unit test and is instead verified manually/visually.
- Testing is a deliberate emphasis on this project (see Portfolio Context above): tests are written alongside each feature as it's built, not as a final pass, and coverage should be demonstrable and well-reasoned rather than exhaustive.

## 7. Success Criteria

A deployed, working demo (target: the user's existing AWS EC2 instance) where a user can: sign up/log in, see the game-styled map with their avatar placed via geolocation, create a quest by dropping a pin with a category/title/time/description, see it rendered on the map as a category icon, and edit/delete it.
