<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('a user can log in with correct credentials', function () {
    User::factory()->create([
        'email' => 'ada@example.com',
        'password' => Hash::make('password123'),
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'ada@example.com',
        'password' => 'password123',
    ]);

    $response->assertOk()->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token']);
});

test('login fails with incorrect password', function () {
    User::factory()->create([
        'email' => 'ada@example.com',
        'password' => Hash::make('password123'),
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'ada@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(422)->assertJsonValidationErrors('email');
});
