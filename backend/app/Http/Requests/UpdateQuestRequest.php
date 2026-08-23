<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('quest'));
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['type' => $this->input('type', 'quest')]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['required', 'in:food,movie,outdoors,nightlife,shopping,other'],
            'type' => ['required', 'in:quest,recurring_quest,memory'],
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'starts_at' => ['nullable', 'required_if:type,quest', 'date'],
            'completed_at' => ['nullable', 'date'],
        ];
    }
}
