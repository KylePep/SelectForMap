<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('an authenticated user can create a quest', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/quests', [
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

test('a quest can be created with a real bearer token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('sfm')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer $token")
        ->postJson('/api/quests', [
            'title' => 'Trail run',
            'description' => 'Sunrise loop',
            'category' => 'outdoors',
            'lat' => 40.7128,
            'lng' => -74.0060,
            'starts_at' => '2026-09-01 06:00:00',
        ]);

    $response->assertCreated()->assertJsonPath('title', 'Trail run');

    expect($user->fresh()->quests()->count())->toBe(1);
});

test('creating a quest requires authentication', function () {
    $response = $this->postJson('/api/quests', ['title' => 'Movie night']);

    $response->assertUnauthorized();
});

test('creating a quest validates required fields and category', function () {
    Sanctum::actingAs(User::factory()->create());

    $response = $this->postJson('/api/quests', [
        'title' => '',
        'category' => 'not-a-real-category',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['title', 'category', 'lat', 'lng', 'starts_at']);
});

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
