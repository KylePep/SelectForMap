# Home Base — Design

**Date:** 2026-08-22
**Status:** Approved for planning
**Builds on:** `docs/superpowers/specs/2026-08-10-select-for-map-core-design.md`

## Summary

A "home base" is a single, user-set map location distinct from live GPS position — the player's persistent base of operations. It renders as its own marker on the map, and a HUD button flies the camera to it on demand. It is modeled as part of a new per-user **profile**, not as a `Quest`, since it has no title/category/date and is a singleton per user rather than a repeatable event.

### Explicitly out of scope for this spec

- Reverse geocoding / addresses (the user only ever sets home base by physical current-location click or button — no search box, no typed address)
- Any other profile field (avatar choice, display name, settings) — the `profiles` table is deliberately built to hold those later, but none are added now
- Removing/clearing a home base once set (only set/overwrite)
- Multiple home bases, or sharing a home base with other users

## 1. Data Model

New `profiles` table, one-to-one with `users`:

- `id`
- `user_id` (FK, unique, cascade on delete)
- `home_lat` (`decimal(10,7)`, nullable)
- `home_lng` (`decimal(10,7)`, nullable)
- timestamps

`Profile belongsTo User`; `User hasOne Profile`. No row is created at registration — the first `PATCH /api/profile` call `updateOrCreate`s it. A user who has never set a home base simply has no `profiles` row; `GET /api/profile` handles that by returning a null-shaped payload rather than a 404, so the frontend never needs to special-case "row doesn't exist yet" vs. "row exists with null coordinates."

This mirrors the `quests` table's lat/lng precision (`decimal(10,7)`) for consistency.

## 2. API

`App\Http\Controllers\ProfileController`, both actions behind `auth:sanctum`, both operating on `$request->user()` — there's no id in the route and no policy, since a profile is never addressed by anyone other than its owner:

- `GET /api/profile` → `{ home_lat, home_lng }` (nulls if unset)
- `PATCH /api/profile` → validates `home_lat`/`home_lng` as required-together, valid latitude/longitude ranges; `updateOrCreate(['user_id' => $request->user()->id], [...])`; returns the updated profile

Named `/api/profile` rather than `/api/home-base` since this is intentionally the seed of a broader profile resource.

## 3. Frontend State

New `stores/profile.js` Pinia store, following the same shape as `stores/quests.js`:

- State: `homeLat`, `homeLng`
- `hasHomeBase` getter (`homeLat !== null && homeLng !== null`)
- `fetchProfile()` — `GET /api/profile`, populates state
- `setHomeLocation({ lat, lng })` — `PATCH /api/profile`, updates state from the response

`QuestMap.vue` calls `fetchProfile()` in its `onMapReady` alongside the existing `loadQuests()` call, since it already owns `useQuestsStore` directly in the same way.

## 4. Map Interaction & UI

**Home marker** — new `HomeMarker.vue`, modeled on `AvatarMarker.vue` (a MapLibre `Marker` with a plain styled `div`, same 32px/background-image-with-fallback-color pattern), rendered by `QuestMap.vue` whenever `profileStore.hasHomeBase`. Visually distinct fallback color/shape from the avatar's blue circle so the two are never confused at a glance.

**Home button** — a HUD button in `QuestMap.vue`, alongside the existing "Explore this area" button, rendered only when `profileStore.hasHomeBase`. Calls the existing `centerOnPosition`/`flyTo` helper targeting `{ lat: homeLat, lng: homeLng }`.

**Setting home base — two entry points, one action (`profileStore.setHomeLocation`):**

1. **First-time nudge via the avatar.** `AvatarMarker.vue` gains a click handler, wired up by `QuestMap.vue` only when `!profileStore.hasHomeBase`. The handler calls `event.stopPropagation()` (so the click doesn't also bubble into the map's own click handler and open the quest-creation flow) and emits an event up through `QuestMap` to `MapView.vue`. `MapView` shows a Yes/No confirmation using the existing `Modal.vue` ("Set as home location?"); Yes calls `profileStore.setHomeLocation(position)`. Once a home base exists, this click handler is not attached — clicking the avatar again does nothing special.
2. **Deliberate set/overwrite via the off-canvas.** The already-stubbed "Home Base" modal in `MapView.vue` (opened from the off-canvas menu) gets a "Set current location as Home Base" button. This is the only way to *change* an existing home base, and works identically to entry point 1 (no confirmation step needed here since clicking a labeled button *is* the confirmation) — it directly calls `profileStore.setHomeLocation(position)` using the live geolocation position.

Entry point 2 needs the live geolocation `position` (currently private to `QuestMap.vue`) available in `MapView.vue`. `QuestMap.vue` already emits a `status` object upward on every position/error change; `position` (`{ lat, lng }` or `null`) is added to that same payload rather than introducing a second emit.

**Initial centering fallback.** Today, `QuestMap.vue`'s `onMounted` requests geolocation and centers on `position.value`, which `useGeolocation` sets to a hardcoded contiguous-US default on denial/failure. New rule: if geolocation failed (there's a location `error`) **and** `profileStore.hasHomeBase`, center on the home base instead of that hardcoded default. If geolocation succeeds, behavior is unchanged — the avatar's real position is used, and home base only comes into play via the explicit Home button (or the failure fallback). This means the profile fetch needs to resolve before this decision is made in `onMounted`/`onMapReady`, so `fetchProfile()` is awaited there the same way `requestLocation()` already is.

## 5. Error Handling & Edge Cases

- If geolocation has failed/denied (no live `position` available), the off-canvas "Set current location as Home Base" button is disabled with a short inline note (e.g. "Location unavailable") rather than sending a request with no coordinates — there is nothing to set as home in that state. Same guard applies to the avatar-click entry point, though it's moot there since a missing position also means the avatar marker itself isn't rendered to click.
- `PATCH /api/profile` validation failure (e.g. out-of-range coordinates) surfaces the same way other CRUD errors do in `MapView.vue` — through `apiErrorMessage` into the existing `crudError` banner.
- If `fetchProfile()` fails (network/API error) on load, treat it the same as "no home base set" (button and marker simply don't render) rather than blocking the map — home base is a convenience feature, not on the critical path to a usable map.
- A profile row with only one of `home_lat`/`home_lng` set should never occur since the API validates them as required-together; `hasHomeBase` checks both being non-null defensively.

## 6. Testing Approach

- **Backend:** Pest feature tests for `ProfileController` — unauthenticated requests rejected; `GET` before any home base is set returns nulls; `PATCH` validation (missing/invalid coordinates); `PATCH` persists and is reflected in a subsequent `GET`; a second user's `GET`/`PATCH` never reads or writes the first user's row.
- **Frontend:** `stores/__tests__/profile.spec.js` covering `fetchProfile`/`setHomeLocation` against a mocked `apiClient`. Updated `QuestMap`/`MapView` specs covering: the avatar click handler firing only when no home base is set, the Home button rendering only when one is set, and the initial-centering fallback preferring home base over the hardcoded default on geolocation failure.

## 7. Success Criteria

A user with geolocation working can click their avatar once, confirm "Set as home location?", and see a distinct home marker appear plus a Home button that flies the map to it. A user can later change it via the off-canvas Home Base menu's "Set current location as Home Base" button. A user who denies/loses geolocation but has a home base set lands centered on their home base on load instead of the generic US-center default.
