<?php

namespace App\Http\Requests;

use App\Enums\LancamentoCategoria;
use App\Support\Formato;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LancamentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['valor' => Formato::lerDecimal($this->input('valor'))]);
    }

    public function rules(): array
    {
        return [
            'categoria' => ['required', Rule::enum(LancamentoCategoria::class)],
            'descricao' => ['required', 'string', 'max:255'],
            'valor' => ['required', 'numeric', 'gt:0', 'max:9999999'],
            'data' => ['required', 'date'],
            'comprovante' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    public function attributes(): array
    {
        return [
            'categoria' => __('categoria'),
            'descricao' => __('descrição'),
            'valor' => __('valor'),
            'data' => __('data'),
            'comprovante' => __('comprovante'),
        ];
    }
}
