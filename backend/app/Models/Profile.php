<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    protected $fillable = ['user_id', 'home_lat', 'home_lng'];

    protected $casts = [
        'home_lat' => 'float',
        'home_lng' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
