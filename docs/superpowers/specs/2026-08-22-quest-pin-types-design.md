# Quest Pin Types — Quest / Recurring Quest / Memory

**Date:** 2026-08-22
**Status:** Approved for planning
**Builds on:** `2026-08-10-select-for-map-core-design.md`

## Summary

Today every pin on the map is a `Quest`: title, description, category, lat/lng, and a required `starts_at`. In practice, three different kinds of pins have emerged from real usage:

- **Quest** — a one-time, dated, completable thing to do ("axe throwing, Sept 5"). Matches today's behavior.
- **Recurring Quest** — a standing, always-available activity with no specific date and no pass/fail completion ("walk the dog at the dog park"). Suggestible/actionable, unlike a Memory.
- **Memory** — a point of personal significance, not actionable and not suggested as "something to do" (a sibling's house, a regular hangout bar). Uses the same `description` field to hold the "why this matters" narrative — no separate field needed.

This spec gives each pin an explicit `type` and adapts the creation, viewing, and completion flows around it, while keeping the existing single-table/single-endpoint architecture.

### Explicitly out of scope for this spec

- Recurrence schedules or reminders for Recurring Quests (no "every Tuesday" rule — "recurring" means "always available," not "scheduled")
- Surfacing Recurring Quests as proactive suggestions ("things to do nearby") — the category field is retained for this future use but no suggestion feature is built now
- Converting a Recurring Quest or Memory back into a Quest, or between each other, outside the Quest-completion flow
- Changing an existing pin's `type` via the normal edit form
- Distinct map icons/visual treatment per type (visual design happens at implementation time)

## 1. Data Model

Extends the existing `quests` table — no new tables:

- `type` — new enum column: `quest` | `recurring_quest` | `memory`. Defaults to `quest`, so existing rows and tests remain valid without a data migration.
- `starts_at` — becomes **nullable**. Required only when `type = quest`.
- `completed_at` — new nullable timestamp. Set when a `quest` is completed and converted into a Recurring Quest or Memory (see §3); stays null for pins created directly as `recurring_quest` or `memory`, and for quests that are erased outright (the row is deleted, so there's nothing to timestamp). It's provenance — "this was a one-off quest, completed Aug 30, now kept as a memory" — not a feature with its own UI beyond optionally displaying it.
- `category` stays required on all three types. It's what drives the pin's marker styling regardless of type, and is retained for a future "suggest nearby" feature even though that feature isn't built now.

## 2. Backend Behavior

- `StoreQuestRequest` / `UpdateQuestRequest`: `starts_at` changes from unconditionally required to `required_if:type,quest`. `type` is validated as `in:quest,recurring_quest,memory`.
- **No new endpoints.** Completing/converting a Quest is a normal `PUT /api/quests/{id}` call with `{ type: 'recurring_quest' | 'memory', starts_at: null, completed_at: <now> }` in the payload; erasing is the existing `DELETE`. `QuestPolicy::update`/`destroy` already cover ownership for both, so no new authorization logic is needed.
- The `QuestFactory` gets a default `type` (`quest`) so existing tests that don't specify one keep passing unchanged.

## 3. Frontend Flow

**Creation:** map click sets `pendingPin = {lat, lng}` as today, but instead of immediately rendering `QuestForm`, a small bottom bar appears with three buttons — Quest / Recurring Quest / Memory — plus a dismiss. Clicking one sets `pendingPin.type` and opens the shared `Modal` component (already used elsewhere in `MapView.vue`) with `QuestForm` inside, titled for the chosen type (e.g. "New Quest"). `QuestForm` drops its own fixed-to-bottom-of-viewport CSS, since it now sits inside `Modal`'s content box instead of being pinned to the screen edge itself; `starts_at` only renders (and is only required) when `type === 'quest'`.

**Editing:** `QuestPanel`'s Edit button opens the same `Modal` + `QuestForm`, pre-filled from the existing pin, instead of swapping the form in inline as it does today. One form, one container, for both create and edit. `type` is not editable from this form — it's fixed at creation and only changes via the completion flow below.

**Viewing (`QuestPanel`):**
- `starts_at` is only displayed for `type === 'quest'`.
- `type === 'quest'` gets a **Complete** action alongside Edit/Delete.
- `type !== 'quest'` (Recurring Quest, Memory) gets only Edit/Delete — there's no lifecycle to complete.

**Completing a Quest:** clicking Complete opens a lightweight inline sub-view within `QuestPanel` (not the modal — it's a quick confirmation, not a field-entry form) with three choices:
- **Erase** — `DELETE /api/quests/{id}`, same as the existing delete flow.
- **Keep as Recurring Quest** — `PUT` with `{ type: 'recurring_quest', starts_at: null, completed_at: now }`.
- **Keep as Memory** — `PUT` with `{ type: 'memory', starts_at: null, completed_at: now }`.

## 4. Testing

- **Backend:** Pest cases for `starts_at`'s conditional validation per `type`, and for the update-based conversion path (type change + `completed_at` set, ownership enforced via existing policy tests).
- **Frontend:** Vitest specs for the new type-picker bottom bar, `QuestForm`'s conditional `starts_at` rendering, `QuestForm`/`QuestPanel` now routing through `Modal` for both create and edit, and `QuestPanel`'s new Complete → conversion sub-flow (including the Erase/Recurring/Memory branches).

## 5. Success Criteria

A user can drop a pin and choose Quest, Recurring Quest, or Memory from the map-click bar; each opens a modal form appropriate to that type (Quest requires a date/time, the other two don't). Editing any pin reuses the same modal. A Quest's panel has a Complete action that lets the user erase it, or convert it into a Recurring Quest or Memory — preserving the pin (and its history) rather than losing it. Recurring Quests and Memories persist on the map indefinitely with no completion lifecycle.
