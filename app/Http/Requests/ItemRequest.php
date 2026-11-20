<?php

namespace App\Http\Requests;

use App\Enums\Canal;
use App\Support\Formato;
use App\Support\Loja;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $precos = [];
        foreach ((array) $this->input('precos', []) as $canal => $valor) {
            $precos[$canal] = Formato::lerDecimal($valor);
        }

        $this->merge([
            'precos' => $precos,
            'custo' => Formato::lerDecimal($this->input('custo')),
            'ativo' => $this->boolean('ativo'),
        ]);
    }

    public function rules(): array
    {
        $barraquinha = app(Loja::class)->barraquinha();

        return [
            'nome' => ['required', 'string', 'max:120', Rule::unique('itens', 'nome')
                ->where('barraquinha_id', $barraquinha->id)
                ->ignore($this->route('item'))],
            'categoria_id' => ['required', 'integer', Rule::exists('categorias', 'id')],
            'descricao' => ['nullable', 'string', 'max:500'],
            'custo' => ['nullable', 'numeric', 'min:0', 'max:999999'],
            'estoque_inicial' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'ativo' => ['boolean'],
            'precos' => ['required', 'array'],
            'precos.'.Canal::PADRAO->value => ['required', 'numeric', 'gt:0', 'max:999999'],
            'precos.'.Canal::PreVenda->value => ['nullable', 'numeric', 'gt:0', 'max:999999'],
            'precos.'.Canal::PosEvento->value => ['nullable', 'numeric', 'gt:0', 'max:999999'],
        ];
    }

    public function attributes(): array
    {
        return [
            'nome' => __('nome'),
            'categoria_id' => __('categoria'),
            'descricao' => __('descrição'),
            'custo' => __('custo unitário'),
            'estoque_inicial' => __('estoque inicial'),
            'precos.'.Canal::Feira->value => __('preço na feira'),
            'precos.'.Canal::PreVenda->value => __('preço na pré-venda'),
            'precos.'.Canal::PosEvento->value => __('preço no pós-evento'),
        ];
    }
}
