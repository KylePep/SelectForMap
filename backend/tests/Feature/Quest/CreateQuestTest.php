<?php

use App\Models\User;

test('an authenticated user can create a quest', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/quests', [
        'title' => 'Movie night',
        'description' => 'See the new sci-fi release',
        'category' => 'movie',
        'lat' => 40.7128,
        'lng' => -74.0060,
        'starts_at' => '2026-09-01 18:00:00',
    ]);

    $response->assertCreated()
        ->assertJsonPath('title', 'Movie night')
        ->assertJsonPath('category', 'movie');

    expect($user->fresh()->quests()->count())->toBe(1);
});

test('creating a quest requires authentication', function () {
    $response = $this->postJson('/api/quests', ['title' => 'Movie night']);

    $response->assertUnauthorized();
});

test('creating a quest validates required fields and category', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/quests', [
        'title' => '',
        'category' => 'not-a-real-category',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['title', 'category', 'lat', 'lng', 'starts_at']);
});
