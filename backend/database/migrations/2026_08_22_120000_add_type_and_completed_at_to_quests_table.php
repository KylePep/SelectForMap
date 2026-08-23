<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quests', function (Blueprint $table) {
            $table->enum('type', ['quest', 'recurring_quest', 'memory'])->default('quest')->after('category');
            $table->timestamp('completed_at')->nullable()->after('starts_at');
            $table->dateTime('starts_at')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('quests', function (Blueprint $table) {
            $table->dateTime('starts_at')->nullable(false)->change();
            $table->dropColumn(['type', 'completed_at']);
        });
    }
};
