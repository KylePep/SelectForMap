<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuestRequest;
use App\Http\Resources\QuestResource;
use Illuminate\Http\JsonResponse;

class QuestController extends Controller
{
    public function store(StoreQuestRequest $request): JsonResponse
    {
        $quest = $request->user()->quests()->create($request->validated());

        return response()->json(new QuestResource($quest), 201);
    }
}
