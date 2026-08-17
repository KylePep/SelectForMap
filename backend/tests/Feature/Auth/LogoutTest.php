<?php

use App\Models\User;

test('an authenticated user can log out, revoking their token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('sfm')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer $token")
        ->postJson('/api/logout');

    $response->assertNoContent();
    expect($user->tokens()->count())->toBe(0);
});

test('logout requires authentication', function () {
    $response = $this->postJson('/api/logout');

    $response->assertUnauthorized();
});
