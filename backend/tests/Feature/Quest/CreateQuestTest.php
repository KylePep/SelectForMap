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
