<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuestFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'category' => fake()->randomElement(['food', 'movie', 'outdoors', 'nightlife', 'shopping', 'other']),
            'lat' => fake()->latitude(),
            'lng' => fake()->longitude(),
            'starts_at' => fake()->dateTimeBetween('now', '+2 weeks'),
        ];
    }
}
