<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('category', ['food', 'movie', 'outdoors', 'nightlife', 'shopping', 'other']);
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->dateTime('starts_at');
            $table->timestamps();

            $table->index(['user_id', 'lat', 'lng']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quests');
    }
};
