<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('an authenticated user can set a home base', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this->patchJson('/api/profile', ['home_lat' => 40.7128, 'home_lng' => -74.0060]);

    $response->assertOk()
        ->assertJsonPath('home_lat', 40.7128)
        ->assertJsonPath('home_lng', -74.0060);

    expect($user->fresh()->profile->home_lat)->toBe(40.7128);
});

test('setting a home base requires authentication', function () {
    $response = $this->patchJson('/api/profile', ['home_lat' => 40.7128, 'home_lng' => -74.0060]);

    $response->assertUnauthorized();
});

test('setting a home base validates coordinates', function () {
    Sanctum::actingAs(User::factory()->create());

    $response = $this->patchJson('/api/profile', ['home_lat' => 200, 'home_lng' => -74.0060]);

    $response->assertStatus(422)->assertJsonValidationErrors(['home_lat']);
});

test('a user can overwrite their existing home base', function () {
    $user = User::factory()->create();
    $user->profile()->create(['home_lat' => 40.7128, 'home_lng' => -74.0060]);
    Sanctum::actingAs($user);

    $response = $this->patchJson('/api/profile', ['home_lat' => 51.5, 'home_lng' => -0.12]);

    $response->assertOk()->assertJsonPath('home_lat', 51.5);
    expect($user->fresh()->profile()->count())->toBe(1);
});

test('a user cannot modify another users home base', function () {
    $other = User::factory()->create();
    $other->profile()->create(['home_lat' => 40.7128, 'home_lng' => -74.0060]);
    Sanctum::actingAs(User::factory()->create());

    $this->patchJson('/api/profile', ['home_lat' => 51.5, 'home_lng' => -0.12]);

    expect($other->fresh()->profile->home_lat)->toBe(40.7128);
});
