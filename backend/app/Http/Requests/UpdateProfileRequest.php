<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'home_lat' => ['required', 'numeric', 'between:-90,90'],
            'home_lng' => ['required', 'numeric', 'between:-180,180'],
        ];
    }
}
