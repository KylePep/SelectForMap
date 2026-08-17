<?php
// backend/tests/Feature/Quest/DeleteQuestTest.php

use App\Models\Quest;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('the owner can delete their quest', function () {
    $user = User::factory()->create();
    $quest = Quest::factory()->create(['user_id' => $user->id]);
    Sanctum::actingAs($user);

    $response = $this->deleteJson("/api/quests/{$quest->id}");

    $response->assertNoContent();
    expect(Quest::find($quest->id))->toBeNull();
});

test('a non-owner cannot delete the quest', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();
    $quest = Quest::factory()->create(['user_id' => $owner->id]);
    Sanctum::actingAs($stranger);

    $response = $this->deleteJson("/api/quests/{$quest->id}");

    $response->assertForbidden();
    expect(Quest::find($quest->id))->not->toBeNull();
});

test('deleting a quest requires authentication', function () {
    $quest = Quest::factory()->create(['user_id' => User::factory()->create()->id]);

    $response = $this->deleteJson("/api/quests/{$quest->id}");

    $response->assertUnauthorized();
    expect(Quest::find($quest->id))->not->toBeNull();
});
