<?php
// backend/tests/Feature/Quest/DeleteQuestTest.php

use App\Models\Quest;
use App\Models\User;

test('the owner can delete their quest', function () {
    $user = User::factory()->create();
    $quest = Quest::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->deleteJson("/api/quests/{$quest->id}");

    $response->assertNoContent();
    expect(Quest::find($quest->id))->toBeNull();
});

test('a non-owner cannot delete the quest', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();
    $quest = Quest::factory()->create(['user_id' => $owner->id]);

    $response = $this->actingAs($stranger)->deleteJson("/api/quests/{$quest->id}");

    $response->assertForbidden();
    expect(Quest::find($quest->id))->not->toBeNull();
});
