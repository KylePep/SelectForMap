<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('an authenticated user with no home base gets nulls', function () {
    Sanctum::actingAs(User::factory()->create());

    $response = $this->getJson('/api/profile');

    $response->assertOk()->assertJson(['home_lat' => null, 'home_lng' => null]);
});

test('fetching a profile requires authentication', function () {
    $response = $this->getJson('/api/profile');

    $response->assertUnauthorized();
});

test('an authenticated user sees their own saved home base', function () {
    $user = User::factory()->create();
    $user->profile()->create(['home_lat' => 40.7128, 'home_lng' => -74.0060]);
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/profile');

    $response->assertOk()
        ->assertJsonPath('home_lat', 40.7128)
        ->assertJsonPath('home_lng', -74.0060);
});

test('a user never sees another users home base', function () {
    $other = User::factory()->create();
    $other->profile()->create(['home_lat' => 51.5, 'home_lng' => -0.12]);
    Sanctum::actingAs(User::factory()->create());

    $response = $this->getJson('/api/profile');

    $response->assertOk()->assertJson(['home_lat' => null, 'home_lng' => null]);
});
