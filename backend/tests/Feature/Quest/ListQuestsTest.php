<?php

use App\Models\Quest;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('listing quests only returns the authenticated users quests within bounds', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $inBounds = Quest::factory()->create(['user_id' => $user->id, 'lat' => 40.71, 'lng' => -74.00]);
    Quest::factory()->create(['user_id' => $user->id, 'lat' => 51.50, 'lng' => -0.12]); // out of bounds
    Quest::factory()->create(['user_id' => $otherUser->id, 'lat' => 40.71, 'lng' => -74.00]); // other user

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/quests?min_lat=40&max_lat=41&min_lng=-75&max_lng=-73');

    $response->assertOk()->assertJsonCount(1);
    $response->assertJsonPath('0.id', $inBounds->id);
});

test('listing quests works with a real bearer token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('sfm')->plainTextToken;
    $inBounds = Quest::factory()->create(['user_id' => $user->id, 'lat' => 40.71, 'lng' => -74.00]);

    $response = $this->withHeader('Authorization', "Bearer $token")
        ->getJson('/api/quests?min_lat=40&max_lat=41&min_lng=-75&max_lng=-73');

    $response->assertOk()->assertJsonCount(1)->assertJsonPath('0.id', $inBounds->id);
});

test('listing quests requires authentication', function () {
    $response = $this->getJson('/api/quests?min_lat=40&max_lat=41&min_lng=-75&max_lng=-73');

    $response->assertUnauthorized();
});

test('listing quests validates the bounds params are present', function () {
    Sanctum::actingAs(User::factory()->create());

    $response = $this->getJson('/api/quests');

    $response->assertStatus(422)->assertJsonValidationErrors(['min_lat', 'max_lat', 'min_lng', 'max_lng']);
});
