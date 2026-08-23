# Quest Pin Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every pin on the map an explicit `type` (`quest` | `recurring_quest` | `memory`), and rework the creation/edit/completion flows around it — a type-picker bar on map click, a shared modal for the create/edit form, and a "Complete" action on Quests that lets the owner erase them or convert them into a Recurring Quest or Memory.

**Architecture:** Single `quests` table extended with `type` and `completed_at` columns (`starts_at` becomes nullable) — no new tables or endpoints. The existing `PUT`/`DELETE` routes handle every transition, including quest completion/conversion, via ordinary update/delete payloads. On the frontend, a new `PinTypePicker` component replaces the bottom-anchored create form, and the existing `Modal` component (already used for the home-base/menu flows) now hosts `QuestForm` for both creating and editing any pin type.

**Tech Stack:** Laravel 13 / Pest (sqlite in-memory tests) on the backend; Vue 3 Composition API / Vitest (jsdom) on the frontend.

**Spec:** `docs/superpowers/specs/2026-08-22-quest-pin-types-design.md`

## Global Constraints

- No new database tables and no new API endpoints — every pin type shares the `quests` table and the existing `GET/POST/PUT/DELETE /api/quests` routes.
- `category` stays required on all three types (`quest`, `recurring_quest`, `memory`).
- `starts_at` is required only when `type = quest`; `completed_at` is set only when a Quest is completed/converted.
- A pin's `type` is not editable through the normal edit form — it only changes via the Quest-completion flow (Erase / Keep as Recurring Quest / Keep as Memory).
- No recurrence schedules, no "suggest nearby" feature, no distinct map-marker icons per type — all explicitly out of scope for this plan.
- Follow existing repo conventions: Pest `test(...)` closures (not PHPUnit classes) on the backend; Vitest `describe`/`it` with `@vue/test-utils` `mount` on the frontend; `data-test` attributes for anything a test needs to find.

---

## Task 1: Data layer — migration, `Quest` model, factory

**Files:**
- Create: `backend/database/migrations/2026_08_22_120000_add_type_and_completed_at_to_quests_table.php`
- Modify: `backend/app/Models/Quest.php`
- Modify: `backend/database/factories/QuestFactory.php`
- Test: `backend/tests/Unit/QuestTypeColumnTest.php`

**Interfaces:**
- Produces: `Quest` model with `type` (string: `quest`|`recurring_quest`|`memory`) and `completed_at` (nullable datetime) in `$fillable`/`$casts`; `starts_at` nullable at the DB level. `QuestFactory` defaults `type` to `'quest'`. Later tasks (2, 5, 6) rely on these column/attribute names exactly.

- [ ] **Step 1: Write the failing test**

```php
<?php
// backend/tests/Unit/QuestTypeColumnTest.php

use App\Models\Quest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('a quest can be created as a recurring quest with no starts_at and a completed_at', function () {
    $quest = Quest::factory()->create([
        'user_id' => User::factory(),
        'type' => 'recurring_quest',
        'starts_at' => null,
        'completed_at' => '2026-08-22 10:00:00',
    ]);

    $fresh = $quest->fresh();

    expect($fresh->type)->toBe('recurring_quest');
    expect($fresh->starts_at)->toBeNull();
    expect($fresh->completed_at)->not->toBeNull();
});

test('a quest defaults to type quest via the factory', function () {
    $quest = Quest::factory()->create();

    expect($quest->type)->toBe('quest');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && php artisan test --filter=QuestTypeColumnTest`
Expected: FAIL — either an unknown-column SQL error or an `Illuminate\Database\Eloquent\MassAssignmentException` for `type`, since the column and model support don't exist yet.

- [ ] **Step 3: Add the `doctrine/dbal` dependency**

`starts_at` needs to change from `NOT NULL` to nullable on an existing column, which Laravel's schema builder requires `doctrine/dbal` for.

Run: `cd backend && composer require doctrine/dbal`

- [ ] **Step 4: Write the migration**

```php
<?php
// backend/database/migrations/2026_08_22_120000_add_type_and_completed_at_to_quests_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quests', function (Blueprint $table) {
            $table->enum('type', ['quest', 'recurring_quest', 'memory'])->default('quest')->after('category');
            $table->timestamp('completed_at')->nullable()->after('starts_at');
            $table->dateTime('starts_at')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('quests', function (Blueprint $table) {
            $table->dateTime('starts_at')->nullable(false)->change();
            $table->dropColumn(['type', 'completed_at']);
        });
    }
};
```

- [ ] **Step 5: Update the `Quest` model**

In `backend/app/Models/Quest.php`, replace the `$fillable` and `$casts` arrays:

```php
    protected $fillable = ['user_id', 'title', 'description', 'category', 'type', 'lat', 'lng', 'starts_at', 'completed_at'];

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
        'starts_at' => 'datetime',
        'completed_at' => 'datetime',
    ];
```

- [ ] **Step 6: Update the `QuestFactory` default**

In `backend/database/factories/QuestFactory.php`, add a `type` key to the `definition()` array:

```php
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'category' => fake()->randomElement(['food', 'movie', 'outdoors', 'nightlife', 'shopping', 'other']),
            'type' => 'quest',
            'lat' => fake()->latitude(),
            'lng' => fake()->longitude(),
            'starts_at' => fake()->dateTimeBetween('now', '+2 weeks'),
        ];
    }
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd backend && php artisan test --filter=QuestTypeColumnTest`
Expected: PASS (2 tests)

- [ ] **Step 8: Run the full backend suite to confirm nothing else broke**

Run: `cd backend && php artisan test`
Expected: PASS — existing Quest tests don't reference `type`/`completed_at`, and the factory's new `type` default keeps them valid.

- [ ] **Step 9: Commit**

```bash
git add backend/database/migrations/2026_08_22_120000_add_type_and_completed_at_to_quests_table.php backend/app/Models/Quest.php backend/database/factories/QuestFactory.php backend/tests/Unit/QuestTypeColumnTest.php backend/composer.json backend/composer.lock
git commit -m "Add type and completed_at columns to quests"
```

---

## Task 2: Backend validation & resource — conditional `starts_at`, type-aware conversion

**Files:**
- Modify: `backend/app/Http/Requests/StoreQuestRequest.php`
- Modify: `backend/app/Http/Requests/UpdateQuestRequest.php`
- Modify: `backend/app/Http/Resources/QuestResource.php`
- Test: `backend/tests/Feature/Quest/CreateQuestTest.php` (append)
- Test: `backend/tests/Feature/Quest/UpdateQuestTest.php` (append)

**Interfaces:**
- Consumes: `Quest` model's `type`/`completed_at`/nullable-`starts_at` support from Task 1.
- Produces: `POST /api/quests` and `PUT /api/quests/{id}` accept an optional `type` field (defaults to `quest` when omitted) and require `starts_at` only when `type = quest`; `PUT` also accepts `completed_at`. `QuestResource` includes `type` and `completed_at` in every JSON response. Frontend tasks (4, 5, 6) rely on the response always including `type`, and on `PUT` accepting `{ type, starts_at: null, completed_at }` to perform a conversion.

- [ ] **Step 1: Write the failing tests**

Append to `backend/tests/Feature/Quest/CreateQuestTest.php`:

```php
test('a recurring quest can be created without a starts_at', function () {
    Sanctum::actingAs(User::factory()->create());

    $response = $this->postJson('/api/quests', [
        'title' => 'Walk the dog',
        'description' => 'Neighborhood loop',
        'category' => 'outdoors',
        'type' => 'recurring_quest',
        'lat' => 40.7128,
        'lng' => -74.0060,
    ]);

    $response->assertCreated()
        ->assertJsonPath('type', 'recurring_quest')
        ->assertJsonPath('starts_at', null);
});

test('a memory can be created without a starts_at', function () {
    Sanctum::actingAs(User::factory()->create());

    $response = $this->postJson('/api/quests', [
        'title' => "Brother's house",
        'description' => 'Where holidays happen',
        'category' => 'other',
        'type' => 'memory',
        'lat' => 40.7128,
        'lng' => -74.0060,
    ]);

    $response->assertCreated()
        ->assertJsonPath('type', 'memory')
        ->assertJsonPath('starts_at', null);
});

test('a quest still requires a starts_at even when type is explicit', function () {
    Sanctum::actingAs(User::factory()->create());

    $response = $this->postJson('/api/quests', [
        'title' => 'Movie night',
        'category' => 'movie',
        'type' => 'quest',
        'lat' => 40.7128,
        'lng' => -74.0060,
    ]);

    $response->assertStatus(422)->assertJsonValidationErrors(['starts_at']);
});

test('creating a quest rejects an invalid type', function () {
    Sanctum::actingAs(User::factory()->create());

    $response = $this->postJson('/api/quests', [
        'title' => 'Movie night',
        'category' => 'movie',
        'type' => 'not-a-real-type',
        'lat' => 40.7128,
        'lng' => -74.0060,
        'starts_at' => '2026-09-01 18:00:00',
    ]);

    $response->assertStatus(422)->assertJsonValidationErrors(['type']);
});
```

Append to `backend/tests/Feature/Quest/UpdateQuestTest.php`:

```php
test('completing a quest can convert it into a recurring quest', function () {
    $user = User::factory()->create();
    $quest = Quest::factory()->create(['user_id' => $user->id, 'type' => 'quest']);
    Sanctum::actingAs($user);

    $response = $this->putJson("/api/quests/{$quest->id}", [
        'title' => $quest->title,
        'description' => $quest->description,
        'category' => $quest->category,
        'lat' => $quest->lat,
        'lng' => $quest->lng,
        'type' => 'recurring_quest',
        'starts_at' => null,
        'completed_at' => '2026-08-22 10:00:00',
    ]);

    $response->assertOk()
        ->assertJsonPath('type', 'recurring_quest')
        ->assertJsonPath('starts_at', null);
    expect($quest->fresh()->completed_at)->not->toBeNull();
});

test('completing a quest can convert it into a memory', function () {
    $user = User::factory()->create();
    $quest = Quest::factory()->create(['user_id' => $user->id, 'type' => 'quest']);
    Sanctum::actingAs($user);

    $response = $this->putJson("/api/quests/{$quest->id}", [
        'title' => $quest->title,
        'description' => $quest->description,
        'category' => $quest->category,
        'lat' => $quest->lat,
        'lng' => $quest->lng,
        'type' => 'memory',
        'starts_at' => null,
        'completed_at' => '2026-08-22 10:00:00',
    ]);

    $response->assertOk()->assertJsonPath('type', 'memory');
    expect($quest->fresh()->completed_at)->not->toBeNull();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd backend && php artisan test --filter=CreateQuestTest && php artisan test --filter=UpdateQuestTest`
Expected: FAIL — `type` isn't a validated/accepted field yet, so a `recurring_quest`/`memory` create still 422s on the missing `starts_at`, and the conversion tests get a 422 on the `type` field being silently dropped or rejected.

- [ ] **Step 3: Update `StoreQuestRequest`**

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['type' => $this->input('type', 'quest')]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['required', 'in:food,movie,outdoors,nightlife,shopping,other'],
            'type' => ['required', 'in:quest,recurring_quest,memory'],
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'starts_at' => ['nullable', 'required_if:type,quest', 'date'],
        ];
    }
}
```

- [ ] **Step 4: Update `UpdateQuestRequest`**

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('quest'));
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['type' => $this->input('type', 'quest')]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['required', 'in:food,movie,outdoors,nightlife,shopping,other'],
            'type' => ['required', 'in:quest,recurring_quest,memory'],
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'starts_at' => ['nullable', 'required_if:type,quest', 'date'],
            'completed_at' => ['nullable', 'date'],
        ];
    }
}
```

- [ ] **Step 5: Update `QuestResource`**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category,
            'type' => $this->type,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
        ];
    }
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd backend && php artisan test --filter=CreateQuestTest && php artisan test --filter=UpdateQuestTest`
Expected: PASS

- [ ] **Step 7: Run the full backend suite**

Run: `cd backend && php artisan test`
Expected: PASS — existing create/update tests never send `type`, so `prepareForValidation()` defaults it to `'quest'`, matching their existing expectations; `ListQuestsTest`/`DeleteQuestTest`/`QuestPolicyTest` don't assert exact JSON shape so the new resource fields don't break them.

- [ ] **Step 8: Commit**

```bash
git add backend/app/Http/Requests/StoreQuestRequest.php backend/app/Http/Requests/UpdateQuestRequest.php backend/app/Http/Resources/QuestResource.php backend/tests/Feature/Quest/CreateQuestTest.php backend/tests/Feature/Quest/UpdateQuestTest.php
git commit -m "Validate quest type and support completing/converting a quest via update"
```

---

## Task 3: `PinTypePicker` component

**Files:**
- Create: `frontend/src/components/PinTypePicker.vue`
- Test: `frontend/src/components/__tests__/PinTypePicker.spec.js`

**Interfaces:**
- Produces: a presentational component with no props, emitting `select` with one of `'quest' | 'recurring_quest' | 'memory'`, and `cancel`. Buttons carry `data-test="type-quest"`, `data-test="type-recurring_quest"`, `data-test="type-memory"`, `data-test="cancel"`. Task 6 mounts this component in `MapView.vue`.

- [ ] **Step 1: Write the failing test**

```js
// frontend/src/components/__tests__/PinTypePicker.spec.js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PinTypePicker from '../PinTypePicker.vue'

describe('PinTypePicker', () => {
  it('emits select with "quest" when the Quest button is clicked', async () => {
    const wrapper = mount(PinTypePicker)

    await wrapper.find('[data-test="type-quest"]').trigger('click')

    expect(wrapper.emitted('select')[0]).toEqual(['quest'])
  })

  it('emits select with "recurring_quest" when the Recurring Quest button is clicked', async () => {
    const wrapper = mount(PinTypePicker)

    await wrapper.find('[data-test="type-recurring_quest"]').trigger('click')

    expect(wrapper.emitted('select')[0]).toEqual(['recurring_quest'])
  })

  it('emits select with "memory" when the Memory button is clicked', async () => {
    const wrapper = mount(PinTypePicker)

    await wrapper.find('[data-test="type-memory"]').trigger('click')

    expect(wrapper.emitted('select')[0]).toEqual(['memory'])
  })

  it('emits cancel when the cancel button is clicked', async () => {
    const wrapper = mount(PinTypePicker)

    await wrapper.find('[data-test="cancel"]').trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/components/__tests__/PinTypePicker.spec.js`
Expected: FAIL — `PinTypePicker.vue` doesn't exist yet.

- [ ] **Step 3: Write the component**

```vue
<!-- frontend/src/components/PinTypePicker.vue -->
<script setup>
const emit = defineEmits(['select', 'cancel'])
</script>

<template>
  <div class="sfm-pin-type-picker">
    <button data-test="type-quest" type="button" @click="emit('select', 'quest')">Quest</button>
    <button data-test="type-recurring_quest" type="button" @click="emit('select', 'recurring_quest')">
      Recurring Quest
    </button>
    <button data-test="type-memory" type="button" @click="emit('select', 'memory')">Memory</button>
    <button data-test="cancel" type="button" @click="emit('cancel')">Cancel</button>
  </div>
</template>

<style scoped>
.sfm-pin-type-picker {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 2px solid var(--sfm-panel-border);
  background: var(--sfm-panel-bg);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2);
}
</style>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run src/components/__tests__/PinTypePicker.spec.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/PinTypePicker.vue frontend/src/components/__tests__/PinTypePicker.spec.js
git commit -m "Add PinTypePicker component for choosing a new pin's type"
```

---

## Task 4: `QuestForm` — type-aware fields

**Files:**
- Modify: `frontend/src/components/QuestForm.vue`
- Test: `frontend/src/components/__tests__/QuestForm.spec.js` (full replacement)

**Interfaces:**
- Consumes: none (self-contained).
- Produces: `QuestForm` gains a `type` prop (`String`, default `'quest'`), used only when no `quest` prop is given. `submit` payload always includes `type` (the quest's own type when editing, otherwise the `type` prop) and sets `starts_at: null` for any non-`quest` type. The `starts_at` input only renders when the effective type is `'quest'`. The component also drops its own fixed-to-viewport-bottom CSS, since it will be mounted inside `Modal` from Task 6 onward. Tasks 5 and 6 rely on this `type` prop and payload shape.

- [ ] **Step 1: Replace the test file**

```js
// frontend/src/components/__tests__/QuestForm.spec.js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestForm from '../QuestForm.vue'

describe('QuestForm', () => {
  it('emits submit with the entered values, type "quest", and the given coordinates', async () => {
    const wrapper = mount(QuestForm, { props: { lat: 40.7128, lng: -74.006 } })

    await wrapper.find('[data-test="title"]').setValue('Movie night')
    await wrapper.find('[data-test="category"]').setValue('movie')
    await wrapper.find('[data-test="starts_at"]').setValue('2026-09-01T18:00')
    await wrapper.find('[data-test="description"]').setValue('New sci-fi release')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('submit')[0][0]).toEqual({
      title: 'Movie night',
      description: 'New sci-fi release',
      category: 'movie',
      type: 'quest',
      lat: 40.7128,
      lng: -74.006,
      starts_at: '2026-09-01T18:00',
    })
  })

  it('does not emit submit when the title is empty', async () => {
    const wrapper = mount(QuestForm, { props: { lat: 0, lng: 0 } })

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('starts blank with a "Create quest" label when no quest is given', () => {
    const wrapper = mount(QuestForm, { props: { lat: 1, lng: 2 } })

    expect(wrapper.find('[data-test="title"]').element.value).toBe('')
    expect(wrapper.find('[data-test="category"]').element.value).toBe('food')
    expect(wrapper.find('[data-test="submit"]').text()).toBe('Create quest')
  })

  describe('type awareness', () => {
    it('shows starts_at for the default "quest" type', () => {
      const wrapper = mount(QuestForm, { props: { lat: 1, lng: 2 } })

      expect(wrapper.find('[data-test="starts_at"]').exists()).toBe(true)
    })

    it('hides starts_at and submits a null starts_at for a recurring_quest', async () => {
      const wrapper = mount(QuestForm, { props: { lat: 1, lng: 2, type: 'recurring_quest' } })

      expect(wrapper.find('[data-test="starts_at"]').exists()).toBe(false)

      await wrapper.find('[data-test="title"]').setValue('Walk the dog')
      await wrapper.find('[data-test="category"]').setValue('outdoors')
      await wrapper.find('form').trigger('submit.prevent')

      expect(wrapper.emitted('submit')[0][0]).toEqual({
        title: 'Walk the dog',
        description: '',
        category: 'outdoors',
        type: 'recurring_quest',
        lat: 1,
        lng: 2,
        starts_at: null,
      })
    })

    it('hides starts_at for a memory', () => {
      const wrapper = mount(QuestForm, { props: { lat: 1, lng: 2, type: 'memory' } })

      expect(wrapper.find('[data-test="starts_at"]').exists()).toBe(false)
    })

    it("uses the quest's own type when editing, ignoring the type prop", () => {
      const wrapper = mount(QuestForm, {
        props: {
          type: 'quest',
          quest: {
            id: 9,
            title: 'Dog park',
            description: '',
            category: 'outdoors',
            type: 'recurring_quest',
            lat: 1,
            lng: 2,
            starts_at: null,
          },
        },
      })

      expect(wrapper.find('[data-test="starts_at"]').exists()).toBe(false)
    })
  })

  describe('when reused as an edit form', () => {
    const quest = {
      id: 7,
      title: 'Movie night',
      description: 'Sci-fi',
      category: 'movie',
      type: 'quest',
      lat: 40.7128,
      lng: -74.006,
      starts_at: '2026-09-01T18:00:00+00:00',
    }

    it('pre-fills the fields from the quest and labels the submit button "Save quest"', () => {
      const wrapper = mount(QuestForm, { props: { quest } })

      expect(wrapper.find('[data-test="title"]').element.value).toBe('Movie night')
      expect(wrapper.find('[data-test="description"]').element.value).toBe('Sci-fi')
      expect(wrapper.find('[data-test="category"]').element.value).toBe('movie')
      // The ISO-8601 value is narrowed to what <input type="datetime-local"> accepts.
      expect(wrapper.find('[data-test="starts_at"]').element.value).toBe('2026-09-01T18:00')
      expect(wrapper.find('[data-test="submit"]').text()).toBe('Save quest')
    })

    it("emits submit with the edited values, the quest's type, and its own coordinates", async () => {
      const wrapper = mount(QuestForm, { props: { quest } })

      await wrapper.find('[data-test="title"]').setValue('Movie night (rescheduled)')
      await wrapper.find('[data-test="starts_at"]').setValue('2026-09-02T20:30')
      await wrapper.find('form').trigger('submit.prevent')

      expect(wrapper.emitted('submit')[0][0]).toEqual({
        title: 'Movie night (rescheduled)',
        description: 'Sci-fi',
        category: 'movie',
        type: 'quest',
        lat: 40.7128,
        lng: -74.006,
        starts_at: '2026-09-02T20:30',
      })
    })

    it('still refuses to submit an emptied title', async () => {
      const wrapper = mount(QuestForm, { props: { quest } })

      await wrapper.find('[data-test="title"]').setValue('   ')
      await wrapper.find('form').trigger('submit.prevent')

      expect(wrapper.emitted('submit')).toBeUndefined()
    })

    it('handles a space-separated timestamp and a null description', () => {
      const wrapper = mount(QuestForm, {
        props: { quest: { ...quest, description: null, starts_at: '2026-09-01 18:00:00' } },
      })

      expect(wrapper.find('[data-test="description"]').element.value).toBe('')
      expect(wrapper.find('[data-test="starts_at"]').element.value).toBe('2026-09-01T18:00')
    })
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx vitest run src/components/__tests__/QuestForm.spec.js`
Expected: FAIL — the component doesn't accept a `type` prop, always renders `starts_at`, and doesn't include `type` in the submit payload.

- [ ] **Step 3: Update the component**

```vue
<!-- frontend/src/components/QuestForm.vue -->
<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  // Coordinates for a brand new quest (the dropped pin). Optional when editing,
  // because an existing quest already carries its own lat/lng.
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  // Pin type for a brand new quest. Ignored when `quest` is given — an existing
  // quest's own type is fixed and isn't editable through this form.
  type: { type: String, default: 'quest' },
  // When present the form acts as an edit form, pre-filled from this quest.
  quest: { type: Object, default: null },
})
const emit = defineEmits(['submit', 'cancel'])

const title = ref('')
const description = ref('')
const category = ref('food')
const startsAt = ref('')

const isEdit = computed(() => !!props.quest)
const submitLabel = computed(() => (isEdit.value ? 'Save quest' : 'Create quest'))
const latValue = computed(() => (props.quest ? props.quest.lat : props.lat))
const lngValue = computed(() => (props.quest ? props.quest.lng : props.lng))
const effectiveType = computed(() => props.quest?.type ?? props.type)
const showStartsAt = computed(() => effectiveType.value === 'quest')

/**
 * The API returns `starts_at` as an ISO-8601 string ("2026-09-01T18:00:00+00:00")
 * while `<input type="datetime-local">` needs "YYYY-MM-DDTHH:mm". Slicing (rather
 * than going through `Date`) keeps the wall-clock value the user originally typed,
 * matching how the create flow submits it.
 */
function toDateTimeLocal(value) {
  if (!value) return ''
  return String(value).replace(' ', 'T').slice(0, 16)
}

watch(
  () => props.quest,
  (quest) => {
    title.value = quest?.title ?? ''
    description.value = quest?.description ?? ''
    category.value = quest?.category ?? 'food'
    startsAt.value = toDateTimeLocal(quest?.starts_at)
  },
  { immediate: true },
)

function submit() {
  if (!title.value.trim()) return

  emit('submit', {
    title: title.value,
    description: description.value,
    category: category.value,
    type: effectiveType.value,
    lat: latValue.value,
    lng: lngValue.value,
    starts_at: showStartsAt.value ? startsAt.value : null,
  })
}
</script>

<template>
  <form class="sfm-quest-form" @submit.prevent="submit">
    <input data-test="title" v-model="title" placeholder="Quest title" required />
    <textarea data-test="description" v-model="description" placeholder="Description"></textarea>
    <select data-test="category" v-model="category">
      <option value="food">Food</option>
      <option value="movie">Movie</option>
      <option value="outdoors">Outdoors</option>
      <option value="nightlife">Nightlife</option>
      <option value="shopping">Shopping</option>
      <option value="other">Other</option>
    </select>
    <input v-if="showStartsAt" data-test="starts_at" v-model="startsAt" type="datetime-local" required />
    <button data-test="submit" type="submit">{{ submitLabel }}</button>
    <button data-test="cancel" type="button" @click="emit('cancel')">Cancel</button>
  </form>
</template>

<style scoped>
.sfm-quest-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/components/__tests__/QuestForm.spec.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/QuestForm.vue frontend/src/components/__tests__/QuestForm.spec.js
git commit -m "Make QuestForm type-aware and modal-friendly"
```

---

## Task 5: `QuestPanel` — edit event, Complete/convert flow

**Files:**
- Modify: `frontend/src/components/QuestPanel.vue`
- Test: `frontend/src/components/__tests__/QuestPanel.spec.js` (full replacement)

**Interfaces:**
- Consumes: none beyond the `quest` prop shape (`id`, `title`, `description`, `category`, `type`, `lat`, `lng`, `starts_at`).
- Produces: `QuestPanel` no longer renders `QuestForm` inline — Edit now emits `edit` with the quest object, for a parent to handle (Task 6 opens the shared modal). Adds a `Complete` button (only for `type === 'quest'`) that reveals an inline Erase / Keep as Recurring Quest / Keep as Memory choice. Erase emits the existing `delete` event; the two "keep as" choices emit the existing `save` event with `{ title, description, category, lat, lng, type, starts_at: null, completed_at: <ISO now> }`. Task 6's `MapView.vue` wires `@edit` to open the modal and keeps its existing `@save`/`@delete` handlers unchanged.

- [ ] **Step 1: Replace the test file**

```js
// frontend/src/components/__tests__/QuestPanel.spec.js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestPanel from '../QuestPanel.vue'

const quest = {
  id: 1,
  title: 'Movie night',
  description: 'Sci-fi',
  category: 'movie',
  type: 'quest',
  lat: 1,
  lng: 2,
  starts_at: '2026-09-01T18:00:00Z',
}

describe('QuestPanel', () => {
  it('emits delete with the quest id when delete is clicked', async () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    await wrapper.find('[data-test="delete"]').trigger('click')

    expect(wrapper.emitted('delete')[0]).toEqual([1])
  })

  it('emits close when the close button is clicked', async () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    await wrapper.find('[data-test="close"]').trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows the quest details including the scheduled time for a quest', () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    expect(wrapper.text()).toContain('Movie night')
    expect(wrapper.text()).toContain(quest.starts_at)
  })

  it('emits edit with the quest when Edit is clicked', async () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    await wrapper.find('[data-test="edit"]').trigger('click')

    expect(wrapper.emitted('edit')[0]).toEqual([quest])
  })

  it('shows a Complete button for a quest', () => {
    const wrapper = mount(QuestPanel, { props: { quest } })

    expect(wrapper.find('[data-test="complete"]').exists()).toBe(true)
  })

  it('does not show a Complete button or the scheduled time for a recurring quest', () => {
    const wrapper = mount(QuestPanel, {
      props: { quest: { ...quest, type: 'recurring_quest', starts_at: null } },
    })

    expect(wrapper.find('[data-test="complete"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('2026-09-01T18:00:00Z')
  })

  it('does not show a Complete button for a memory', () => {
    const wrapper = mount(QuestPanel, {
      props: { quest: { ...quest, type: 'memory', starts_at: null } },
    })

    expect(wrapper.find('[data-test="complete"]').exists()).toBe(false)
  })

  describe('completing a quest', () => {
    it('shows erase/recurring/memory choices when Complete is clicked', async () => {
      const wrapper = mount(QuestPanel, { props: { quest } })

      await wrapper.find('[data-test="complete"]').trigger('click')

      expect(wrapper.find('[data-test="complete-erase"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="complete-recurring"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="complete-memory"]').exists()).toBe(true)
    })

    it('emits delete when Erase is chosen', async () => {
      const wrapper = mount(QuestPanel, { props: { quest } })

      await wrapper.find('[data-test="complete"]').trigger('click')
      await wrapper.find('[data-test="complete-erase"]').trigger('click')

      expect(wrapper.emitted('delete')[0]).toEqual([1])
    })

    it('emits save with a recurring_quest conversion payload when "Keep as Recurring Quest" is chosen', async () => {
      const wrapper = mount(QuestPanel, { props: { quest } })

      await wrapper.find('[data-test="complete"]').trigger('click')
      await wrapper.find('[data-test="complete-recurring"]').trigger('click')

      const [id, payload] = wrapper.emitted('save')[0]
      expect(id).toBe(1)
      expect(payload).toMatchObject({
        title: 'Movie night',
        category: 'movie',
        type: 'recurring_quest',
        starts_at: null,
      })
      expect(payload.completed_at).toBeTruthy()
    })

    it('emits save with a memory conversion payload when "Keep as Memory" is chosen', async () => {
      const wrapper = mount(QuestPanel, { props: { quest } })

      await wrapper.find('[data-test="complete"]').trigger('click')
      await wrapper.find('[data-test="complete-memory"]').trigger('click')

      const [id, payload] = wrapper.emitted('save')[0]
      expect(id).toBe(1)
      expect(payload).toMatchObject({ type: 'memory', starts_at: null })
      expect(payload.completed_at).toBeTruthy()
    })

    it('returns to the details view when the complete choices are cancelled', async () => {
      const wrapper = mount(QuestPanel, { props: { quest } })

      await wrapper.find('[data-test="complete"]').trigger('click')
      await wrapper.find('[data-test="complete-cancel"]').trigger('click')

      expect(wrapper.find('[data-test="complete-erase"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="edit"]').exists()).toBe(true)
    })
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx vitest run src/components/__tests__/QuestPanel.spec.js`
Expected: FAIL — `QuestPanel` still swaps in `QuestForm` inline for editing (no `edit` event) and has no Complete flow.

- [ ] **Step 3: Update the component**

```vue
<!-- frontend/src/components/QuestPanel.vue -->
<script setup>
import { ref } from 'vue'

const props = defineProps({ quest: { type: Object, required: true } })
const emit = defineEmits(['close', 'delete', 'save', 'edit'])

const showCompleteChoices = ref(false)

function erase() {
  emit('delete', props.quest.id)
  showCompleteChoices.value = false
}

function convertTo(type) {
  emit('save', props.quest.id, {
    title: props.quest.title,
    description: props.quest.description,
    category: props.quest.category,
    lat: props.quest.lat,
    lng: props.quest.lng,
    type,
    starts_at: null,
    completed_at: new Date().toISOString(),
  })
  showCompleteChoices.value = false
}
</script>

<template>
  <div v-if="showCompleteChoices" class="sfm-quest-panel">
    <p>What do you want to do with this quest?</p>
    <div class="sfm-quest-panel__actions">
      <button data-test="complete-erase" @click="erase">Erase</button>
      <button data-test="complete-recurring" @click="convertTo('recurring_quest')">Keep as Recurring Quest</button>
      <button data-test="complete-memory" @click="convertTo('memory')">Keep as Memory</button>
      <button data-test="complete-cancel" @click="showCompleteChoices = false">Cancel</button>
    </div>
  </div>
  <div v-else class="sfm-quest-panel">
    <button data-test="close" class="sfm-quest-panel__close" @click="emit('close')">&times;</button>
    <h3>{{ quest.title }}</h3>
    <p>{{ quest.description }}</p>
    <p v-if="quest.type === 'quest'">{{ quest.category }} &middot; {{ quest.starts_at }}</p>
    <p v-else>{{ quest.category }}</p>
    <div class="sfm-quest-panel__actions">
      <button data-test="edit" @click="emit('edit', quest)">Edit</button>
      <button data-test="delete" @click="emit('delete', quest.id)">Delete</button>
      <button v-if="quest.type === 'quest'" data-test="complete" @click="showCompleteChoices = true">
        Complete
      </button>
    </div>
  </div>
</template>

<style scoped>
.sfm-quest-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 2px solid var(--sfm-panel-border);
  background: var(--sfm-panel-bg);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2);
}

.sfm-quest-panel__close {
  align-self: flex-end;
}

.sfm-quest-panel__actions {
  display: flex;
  gap: 0.5rem;
}
</style>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/components/__tests__/QuestPanel.spec.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/QuestPanel.vue frontend/src/components/__tests__/QuestPanel.spec.js
git commit -m "QuestPanel: emit edit instead of inline-editing, add Complete/convert flow"
```

---

## Task 6: `MapView` — modal-based create/edit flow, type-picker wiring

**Files:**
- Modify: `frontend/src/views/MapView.vue`
- Test: `frontend/src/views/__tests__/MapView.spec.js`

**Interfaces:**
- Consumes: `PinTypePicker` (Task 3, `select`/`cancel` events), `QuestForm`'s `type` prop and payload shape (Task 4), `QuestPanel`'s `edit`/`save`/`delete` events (Task 5), and the existing `Modal` component (`model-value` prop, `update:model-value` event, `title` prop).
- Produces: the complete pin-creation/edit UX described in the spec — no further tasks depend on this one.

- [ ] **Step 1: Update `MapView.vue`**

```vue
<script setup>
import { computed, ref } from 'vue'
import QuestMap from '../components/QuestMap.vue'
import QuestForm from '../components/QuestForm.vue'
import QuestPanel from '../components/QuestPanel.vue'
import PinTypePicker from '../components/PinTypePicker.vue'
import OffCanvas from '../components/OffCanvas.vue'
import { useQuestsStore } from '../stores/quests'
import { useProfileStore } from '../stores/profile'
import { apiErrorMessage } from '../lib/apiClient'
import Modal from '@/components/Modal.vue'

const questsStore = useQuestsStore()
const profileStore = useProfileStore()
const showOffCanvas = ref(false)
const showHomeMenu = ref(false)
const showHomeConfirm = ref(false)
const showMyQuestsMenu = ref(false)
const showSettingsMenu = ref(false)
const selectedQuest = ref(null)
const pendingPin = ref(null) // { lat, lng } while the type-picker bar is open
const showQuestModal = ref(false)
const questModalQuest = ref(null) // set when editing an existing pin; null when creating
const questModalType = ref('quest') // type chosen from the picker, used only when creating
const crudError = ref(null)
const mapStatus = ref({ locationError: null, loadError: null, questsLoaded: false, position: null })

const questTypeLabels = { quest: 'Quest', recurring_quest: 'Recurring Quest', memory: 'Memory' }
const questModalTitle = computed(() => {
  const type = questModalQuest.value?.type ?? questModalType.value
  const label = questTypeLabels[type]
  return questModalQuest.value ? `Edit ${label}` : `New ${label}`
})

function onMapStatus(status) {
  mapStatus.value = status
}

function onPinRequested({ lat, lng }) {
  // Only one HUD panel at a time.
  selectedQuest.value = null
  pendingPin.value = { lat, lng }
}

function onQuestSelected(quest) {
  pendingPin.value = null
  selectedQuest.value = quest
}

function onPinTypeChosen(type) {
  questModalQuest.value = null
  questModalType.value = type
  showQuestModal.value = true
}

function onPinTypeCancelled() {
  pendingPin.value = null
}

function onEditRequested(quest) {
  questModalQuest.value = quest
  showQuestModal.value = true
}

function closeQuestModal() {
  showQuestModal.value = false
  pendingPin.value = null
  questModalQuest.value = null
}

async function submitQuest(payload) {
  crudError.value = null
  const editing = questModalQuest.value
  try {
    if (editing) {
      selectedQuest.value = await questsStore.updateQuest(editing.id, payload)
    } else {
      await questsStore.createQuest(payload)
    }
    closeQuestModal()
  } catch (e) {
    crudError.value = apiErrorMessage(e, editing ? 'Could not save that quest.' : 'Could not create that quest.')
  }
}

async function saveQuest(id, payload) {
  crudError.value = null
  try {
    // Swapping in the freshly returned quest also closes QuestPanel's complete-choices view.
    selectedQuest.value = await questsStore.updateQuest(id, payload)
  } catch (e) {
    crudError.value = apiErrorMessage(e, 'Could not save that quest.')
  }
}

async function deleteSelectedQuest(id) {
  crudError.value = null
  try {
    await questsStore.deleteQuest(id)
    selectedQuest.value = null
  } catch (e) {
    crudError.value = apiErrorMessage(e, 'Could not delete that quest.')
  }
}

function onHomeRequested() {
  showHomeConfirm.value = true
}

async function confirmSetHome() {
  crudError.value = null
  try {
    await profileStore.setHomeLocation(mapStatus.value.position)
    showHomeConfirm.value = false
  } catch (e) {
    crudError.value = apiErrorMessage(e, 'Could not set that as your home base.')
  }
}

async function setHomeFromMenu() {
  crudError.value = null
  try {
    await profileStore.setHomeLocation(mapStatus.value.position)
    showHomeMenu.value = false
  } catch (e) {
    crudError.value = apiErrorMessage(e, 'Could not set that as your home base.')
  }
}
</script>

<template>
  <div class="sfm-canvas-button h-10 w-10 rounded-full bg-blue-500" @click="showOffCanvas = true"></div>

  <QuestMap @pin-requested="onPinRequested" @quest-selected="onQuestSelected" @status="onMapStatus"
    @home-requested="onHomeRequested" />

  <div class="sfm-hud-top">
    <p v-if="mapStatus.locationError" class="sfm-location-banner">
      {{ mapStatus.locationError }} Showing a default location instead.
    </p>
    <!-- A CRUD error is a direct result of the user's last action, so it takes
         priority over a (possibly stale) quest-loading error from QuestMap. -->
    <p v-if="crudError || mapStatus.loadError" class="sfm-api-error" data-test="api-error">
      {{ crudError || mapStatus.loadError }}
    </p>
    <p v-if="mapStatus.questsLoaded && !crudError && !mapStatus.loadError && questsStore.quests.length === 0"
      class="sfm-empty-state" data-test="empty-state">
      No quests here yet — drop a pin to add one.
    </p>
  </div>

  <PinTypePicker v-if="pendingPin && !showQuestModal" @select="onPinTypeChosen" @cancel="onPinTypeCancelled" />

  <Modal :model-value="showQuestModal" :title="questModalTitle" @update:model-value="closeQuestModal">
    <QuestForm :type="questModalType" :lat="pendingPin?.lat" :lng="pendingPin?.lng" :quest="questModalQuest"
      @submit="submitQuest" @cancel="closeQuestModal" />
  </Modal>

  <QuestPanel v-if="selectedQuest" :quest="selectedQuest" @close="selectedQuest = null" @delete="deleteSelectedQuest"
    @save="saveQuest" @edit="onEditRequested" />

  <OffCanvas v-model="showOffCanvas" title="Menu" class="sfm-off-canvas">
    <button type="button" data-test="home-base-menu-button" @click="showHomeMenu = true">Home Base</button>
    <button type="button" @click="showMyQuestsMenu = true">My Quests</button>
    <button type="button" @click="showSettingsMenu = true">Settings</button>
  </OffCanvas>

  <Modal v-model="showHomeConfirm" title="Set Home Base?">
    <p>Set your current location as your home base?</p>
    <div class="sfm-home-confirm__actions">
      <button type="button" data-test="confirm-home-yes" @click="confirmSetHome">Yes</button>
      <button type="button" data-test="confirm-home-no" @click="showHomeConfirm = false">No</button>
    </div>
  </Modal>
  <Modal v-model="showHomeMenu">
    <div class="sfm-home-menu">
      <header>
        <h2>HOME BASE MENU</h2>
      </header>
      <button type="button" data-test="set-home-from-menu" :disabled="!mapStatus.position" @click="setHomeFromMenu">
        Set current location as Home Base
      </button>
    </div>
  </Modal>
  <Modal v-model="showMyQuestsMenu">
    <div class="sfm-my-quests-menu">
      <header>
        <h2>MY QUESTS MENU</h2>
      </header>
    </div>
  </Modal>
  <Modal v-model="showSettingsMenu">
    <div class="sfm-settings-menu">
      <header>
        <h2>SETTINGS MENU</h2>
      </header>
    </div>
  </Modal>
</template>
```

- [ ] **Step 2: Update `MapView.spec.js`**

Replace the `quest` fixture near the top of the file (add `type: 'quest'`):

```js
const quest = {
  id: 1,
  title: 'Movie night',
  description: 'Sci-fi',
  category: 'movie',
  type: 'quest',
  lat: 40.7128,
  lng: -74.006,
  starts_at: '2026-09-01T18:00:00+00:00',
}
```

Replace the `'saves an edited quest through the store and shows the updated values'` test's `apiClient.put` assertion to include `type`:

```js
  it('saves an edited quest through the store and shows the updated values', async () => {
    const wrapper = await mountLoadedMap()
    apiClient.put.mockResolvedValue({ data: { ...quest, title: 'Movie night (rescheduled)' } })

    wrapper.findComponent(QuestMarker).vm.$emit('select', quest)
    await flushPromises()

    await wrapper.find('[data-test="edit"]').trigger('click')
    await wrapper.find('[data-test="title"]').setValue('Movie night (rescheduled)')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(apiClient.put).toHaveBeenCalledWith('/quests/1', {
      title: 'Movie night (rescheduled)',
      description: 'Sci-fi',
      category: 'movie',
      type: 'quest',
      lat: 40.7128,
      lng: -74.006,
      starts_at: '2026-09-01T18:00',
    })
    // The edit form closes and the panel shows the refreshed quest.
    expect(wrapper.findComponent(QuestForm).exists()).toBe(false)
    expect(wrapper.text()).toContain('Movie night (rescheduled)')
    expect(wrapper.find('[data-test="api-error"]').exists()).toBe(false)
  })
```

Replace the `'shows an inline error when creating a quest fails and keeps the form open'` test to go through the type picker:

```js
  it('shows an inline error when creating a quest fails and keeps the form open', async () => {
    const wrapper = await mountLoadedMap()
    apiClient.post.mockRejectedValue({ response: { status: 500, data: {} } })

    state.instances[0].emit('click', { lngLat: { lat: 41, lng: -73 } })
    await flushPromises()
    await wrapper.find('[data-test="type-quest"]').trigger('click')

    await wrapper.find('[data-test="title"]').setValue('New quest')
    await wrapper.find('[data-test="starts_at"]').setValue('2026-09-01T18:00')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('[data-test="api-error"]').text()).toBe('Could not create that quest.')
    expect(wrapper.findComponent(QuestForm).exists()).toBe(true)
  })
```

Replace the `'keeps a create-quest error and a stale quest-load error from rendering on top of each other'` test the same way:

```js
  it('keeps a create-quest error and a stale quest-load error from rendering on top of each other', async () => {
    apiClient.get.mockRejectedValue(new Error('Network Error'))
    const wrapper = mount(MapView)
    await flushPromises()
    state.instances[0].emit('load')
    await flushPromises()
    expect(wrapper.find('[data-test="api-error"]').text()).toContain('Could not reach the server')

    apiClient.post.mockRejectedValue({ response: { status: 500, data: {} } })
    state.instances[0].emit('click', { lngLat: { lat: 41, lng: -73 } })
    await flushPromises()
    await wrapper.find('[data-test="type-quest"]').trigger('click')
    await wrapper.find('[data-test="title"]').setValue('New quest')
    await wrapper.find('[data-test="starts_at"]').setValue('2026-09-01T18:00')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    // Only one error banner exists in the DOM at a time; the CRUD error (a direct
    // result of the user's last action) takes priority over the stale load error.
    expect(wrapper.findAll('[data-test="api-error"]')).toHaveLength(1)
    expect(wrapper.find('[data-test="api-error"]').text()).toBe('Could not create that quest.')
  })
```

Add three new tests (place them near the creation tests, e.g. right after `'shows an inline error when creating a quest fails and keeps the form open'`):

```js
  it('shows the pin type picker after a map click, and opens the modal for the chosen type', async () => {
    const wrapper = await mountLoadedMap()

    state.instances[0].emit('click', { lngLat: { lat: 41, lng: -73 } })
    await flushPromises()

    expect(wrapper.find('[data-test="type-quest"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="type-recurring_quest"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="type-memory"]').exists()).toBe(true)

    await wrapper.find('[data-test="type-memory"]').trigger('click')

    expect(wrapper.find('[data-test="modal-backdrop"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="starts_at"]').exists()).toBe(false)
  })

  it('creates a recurring quest without a starts_at through the modal', async () => {
    const wrapper = await mountLoadedMap()
    apiClient.post.mockResolvedValue({
      data: {
        id: 9,
        title: 'Walk the dog',
        description: '',
        category: 'outdoors',
        type: 'recurring_quest',
        lat: 41,
        lng: -73,
        starts_at: null,
      },
    })

    state.instances[0].emit('click', { lngLat: { lat: 41, lng: -73 } })
    await flushPromises()
    await wrapper.find('[data-test="type-recurring_quest"]').trigger('click')
    await wrapper.find('[data-test="title"]').setValue('Walk the dog')
    await wrapper.find('[data-test="category"]').setValue('outdoors')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith('/quests', {
      title: 'Walk the dog',
      description: '',
      category: 'outdoors',
      type: 'recurring_quest',
      lat: 41,
      lng: -73,
      starts_at: null,
    })
    expect(wrapper.find('[data-test="modal-backdrop"]').exists()).toBe(false)
  })

  it('cancelling the type picker clears the pending pin without opening the modal', async () => {
    const wrapper = await mountLoadedMap()

    state.instances[0].emit('click', { lngLat: { lat: 41, lng: -73 } })
    await flushPromises()
    await wrapper.find('[data-test="cancel"]').trigger('click')

    expect(wrapper.find('[data-test="type-quest"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="modal-backdrop"]').exists()).toBe(false)
  })
```

- [ ] **Step 3: Run the test file to verify it passes**

Run: `cd frontend && npx vitest run src/views/__tests__/MapView.spec.js`
Expected: PASS

- [ ] **Step 4: Run the full frontend suite**

Run: `cd frontend && npm run test:unit`
Expected: PASS

- [ ] **Step 5: Run the full backend suite once more for a final sanity check**

Run: `cd backend && php artisan test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/views/MapView.vue frontend/src/views/__tests__/MapView.spec.js
git commit -m "MapView: route pin creation through the type picker and shared modal"
```

---

## Manual verification (after Task 6)

Automated tests cover the logic, but MapLibre rendering and the actual click-through UX aren't meaningfully unit-testable (per CLAUDE.md). Before calling this done, run `composer dev` (or the frontend/backend dev servers separately) and manually:

1. Click the map — confirm the Quest/Recurring Quest/Memory bar appears, and Cancel dismisses it.
2. Pick each type in turn and confirm the modal opens with the right title, and that `starts_at` only appears for Quest.
3. Create one of each type and confirm all three render as markers.
4. Open a Quest's panel, click Edit, confirm the same modal opens pre-filled, and save a change.
5. Open a Quest's panel, click Complete, and try Erase, then create another Quest and try "Keep as Recurring Quest" / "Keep as Memory" — confirm the pin persists with no Complete button afterward.
