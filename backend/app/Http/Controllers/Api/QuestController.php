<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuestRequest;
use App\Http\Requests\UpdateQuestRequest;
use App\Http\Resources\QuestResource;
use App\Models\Quest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QuestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $bounds = Validator::make($request->query(), [
            'min_lat' => ['required', 'numeric', 'between:-90,90'],
            'max_lat' => ['required', 'numeric', 'between:-90,90'],
            'min_lng' => ['required', 'numeric', 'between:-180,180'],
            'max_lng' => ['required', 'numeric', 'between:-180,180'],
        ])->validate();

        $quests = $request->user()->quests()
            ->whereBetween('lat', [$bounds['min_lat'], $bounds['max_lat']])
            ->whereBetween('lng', [$bounds['min_lng'], $bounds['max_lng']])
            ->get();

        return response()->json(QuestResource::collection($quests)->resolve());
    }

    public function store(StoreQuestRequest $request): JsonResponse
    {
        $quest = $request->user()->quests()->create($request->validated());

        return response()->json(new QuestResource($quest), 201);
    }

    public function update(UpdateQuestRequest $request, Quest $quest): JsonResponse
    {
        $quest->update($request->validated());

        return response()->json(new QuestResource($quest));
    }

    public function destroy(Request $request, Quest $quest): JsonResponse
    {
        $request->user()->can('delete', $quest) || abort(403);

        $quest->delete();

        return response()->json(null, 204);
    }
}
