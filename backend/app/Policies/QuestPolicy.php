<?php

namespace App\Policies;

use App\Models\Quest;
use App\Models\User;

class QuestPolicy
{
    public function update(User $user, Quest $quest): bool
    {
        return $user->id === $quest->user_id;
    }

    public function delete(User $user, Quest $quest): bool
    {
        return $user->id === $quest->user_id;
    }
}
