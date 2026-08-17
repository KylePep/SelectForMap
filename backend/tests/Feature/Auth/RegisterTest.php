<?php

use App\Models\User;

test('a user can register and receives a token', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Ada Lovelace',
        'email' => 'ada@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token']);

    expect(User::where('email', 'ada@example.com')->exists())->toBeTrue();
});

test('registration fails with a duplicate email', function () {
    User::factory()->create(['email' => 'ada@example.com']);

    $response = $this->postJson('/api/register', [
        'name' => 'Ada Lovelace',
        'email' => 'ada@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(422)->assertJsonValidationErrors('email');
});

test('registration is rate limited after repeated attempts', function () {
    for ($attempt = 0; $attempt < 6; $attempt++) {
        $this->postJson('/api/register', [
            'name' => 'Ada Lovelace',
            'email' => "ada{$attempt}@example.com",
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();
    }

    $this->postJson('/api/register', [
        'name' => 'Ada Lovelace',
        'email' => 'ada-too-many@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertStatus(429);
});
