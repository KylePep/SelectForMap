<?php

use App\Models\Quest;
use App\Models\User;
use App\Policies\QuestPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('only the owner can update or delete their quest', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();
    $quest = Quest::factory()->create(['user_id' => $owner->id]);

    $policy = new QuestPolicy();

    expect($policy->update($owner, $quest))->toBeTrue();
    expect($policy->delete($owner, $quest))->toBeTrue();
    expect($policy->update($stranger, $quest))->toBeFalse();
    expect($policy->delete($stranger, $quest))->toBeFalse();
});
