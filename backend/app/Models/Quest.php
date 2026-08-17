<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quest extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'title', 'description', 'category', 'lat', 'lng', 'starts_at'];

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
        'starts_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
