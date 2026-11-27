<?php

namespace App\Http\Requests;

use App\Enums\Canal;
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

        // Só os canais conhecidos; canal desmarcado não carrega regra.
        $canais = [];
        foreach (Canal::cases() as $canal) {
            $dados = (array) $this->input("canais.{$canal->value}", []);
            $ativo = filter_var($dados['ativo'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $canais[$canal->value] = [
                'ativo' => $ativo,
                'tipo_desconto' => $ativo ? ($dados['tipo_desconto'] ?? null) : null,
                'valor' => $ativo ? Formato::lerDecimal($dados['valor'] ?? null) : null,
            ];
        }

        $this->merge([
            'itens' => $itens,
            'canais' => $canais,
            'confirmar_sem_desconto' => $this->boolean('confirmar_sem_desconto'),
        ]);
    }

    public function rules(): array
    {
        $regras = [
            'nome' => ['required', 'string', 'max:120'],
            'itens' => ['required', 'array'],
            'itens.*' => ['integer', 'min:1', 'max:99'],
            'canais' => ['required', 'array'],
            'confirmar_sem_desconto' => ['boolean'],
        ];

        foreach (Canal::cases() as $canal) {
            $campo = "canais.{$canal->value}";
            $regras["{$campo}.ativo"] = ['boolean'];
            $regras["{$campo}.tipo_desconto"] = ["required_if_accepted:{$campo}.ativo", 'nullable', Rule::enum(TipoDesconto::class)];
            $regras["{$campo}.valor"] = ["required_if_accepted:{$campo}.ativo", 'nullable', 'numeric', 'gt:0', 'max:999999'];
        }

        return $regras;
    }

    public function messages(): array
    {
        return [
            'itens.required' => __('Marque os itens que compõem o combo.'),
            'canais.*.tipo_desconto.required_if_accepted' => __('Escolha a forma de desconto deste canal.'),
            'canais.*.valor.required_if_accepted' => __('Informe o desconto deste canal.'),
        ];
    }

    public function attributes(): array
    {
        $atributos = ['nome' => __('nome do combo')];

        foreach (Canal::cases() as $canal) {
            $atributos["canais.{$canal->value}.tipo_desconto"] = __('forma de desconto (:canal)', ['canal' => $canal->label()]);
            $atributos["canais.{$canal->value}.valor"] = __('valor do desconto (:canal)', ['canal' => $canal->label()]);
        }

        return $atributos;
    }
}
