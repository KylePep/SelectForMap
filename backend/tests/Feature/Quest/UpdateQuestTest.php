<?php
// backend/tests/Feature/Quest/UpdateQuestTest.php

use App\Models\Quest;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('the owner can update their quest', function () {
    $user = User::factory()->create();
    $quest = Quest::factory()->create(['user_id' => $user->id, 'title' => 'Old title']);
    Sanctum::actingAs($user);

    $response = $this->putJson("/api/quests/{$quest->id}", [
        'title' => 'New title',
        'description' => $quest->description,
        'category' => $quest->category,
        'lat' => $quest->lat,
        'lng' => $quest->lng,
        'starts_at' => $quest->starts_at->toDateTimeString(),
    ]);

    $response->assertOk()->assertJsonPath('title', 'New title');
});

test('a non-owner cannot update the quest', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();
    $quest = Quest::factory()->create(['user_id' => $owner->id, 'title' => 'Original title']);
    Sanctum::actingAs($stranger);

    $response = $this->putJson("/api/quests/{$quest->id}", [
        'title' => 'Hijacked',
        'category' => $quest->category,
        'lat' => $quest->lat,
        'lng' => $quest->lng,
        'starts_at' => $quest->starts_at->toDateTimeString(),
    ]);

    $response->assertForbidden();
    expect($quest->fresh()->title)->toBe('Original title');
});

test('updating a quest requires authentication', function () {
    $quest = Quest::factory()->create(['user_id' => User::factory()->create()->id]);

    $response = $this->putJson("/api/quests/{$quest->id}", ['title' => 'Anonymous edit']);

    $response->assertUnauthorized();
});

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
