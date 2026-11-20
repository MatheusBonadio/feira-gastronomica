<?php

namespace App\Http\Requests;

use App\Enums\TipoDesconto;
use App\Support\Formato;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ComboRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $itens = [];
        foreach ((array) $this->input('selecionado', []) as $itemId => $marcado) {
            if ($marcado) {
                $itens[$itemId] = (int) ($this->input("quantidade.{$itemId}") ?: 1);
            }
        }

        $this->merge([
            'itens' => $itens,
            'valor' => Formato::lerDecimal($this->input('valor')),
            'confirmar_sem_desconto' => $this->boolean('confirmar_sem_desconto'),
        ]);
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:120'],
            'tipo_desconto' => ['required', Rule::enum(TipoDesconto::class)],
            'valor' => ['required', 'numeric', 'gt:0', 'max:999999'],
            'itens' => ['required', 'array'],
            'itens.*' => ['integer', 'min:1', 'max:99'],
            'confirmar_sem_desconto' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return ['itens.required' => __('Marque os itens que compõem o combo.')];
    }

    public function attributes(): array
    {
        return [
            'nome' => __('nome do combo'),
            'tipo_desconto' => __('forma de desconto'),
            'valor' => __('valor do desconto'),
        ];
    }
}
