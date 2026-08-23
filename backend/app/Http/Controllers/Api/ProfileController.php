<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->profile;

        return response()->json([
            'home_lat' => $profile?->home_lat,
            'home_lng' => $profile?->home_lng,
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $profile = $request->user()->profile()->updateOrCreate([], $request->validated());

        return response()->json([
            'home_lat' => $profile->home_lat,
            'home_lng' => $profile->home_lng,
        ]);
    }
}
