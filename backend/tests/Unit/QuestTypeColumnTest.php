<?php

use App\Models\Quest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('a quest can be created as a recurring quest with no starts_at and a completed_at', function () {
    $quest = Quest::factory()->create([
        'user_id' => User::factory(),
        'type' => 'recurring_quest',
        'starts_at' => null,
        'completed_at' => '2026-08-22 10:00:00',
    ]);

    $fresh = $quest->fresh();

    expect($fresh->type)->toBe('recurring_quest');
    expect($fresh->starts_at)->toBeNull();
    expect($fresh->completed_at)->not->toBeNull();
});

test('a quest defaults to type quest via the factory', function () {
    $quest = Quest::factory()->create();

    expect($quest->type)->toBe('quest');
});
