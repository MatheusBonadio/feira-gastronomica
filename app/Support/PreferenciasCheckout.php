<?php

namespace App\Support;

use App\Enums\Canal;
use App\Enums\FormaPagamento;
use Illuminate\Validation\Rule;

/**
 * Como o PDV de uma barraquinha funciona, escolhido pelo gestor dela
 * (barraquinhas.checkout, JSON). Sem nada salvo, vale o PDV padrão: todas as
 * formas de pagamento, itens em grade por categoria e em ordem alfabética.
 */
final class PreferenciasCheckout
{
    public const EXIBICOES = ['grade', 'lista'];

    public const ORDENS = ['nome', 'mais_vendidos'];

    /** @param list<string> $pagamentos */
    public function __construct(
        public readonly array $pagamentos,
        public readonly ?string $pagamentoPadrao,
        public readonly ?string $canalPadrao,
        public readonly string $exibicao,
        public readonly bool $agruparCategorias,
        public readonly string $ordem,
        public readonly bool $mostrarCombos,
        public readonly bool $calcularTroco,
        public readonly ?string $chavePix,
        public readonly bool $confirmarAntes,
    ) {}

    /** Lê o JSON salvo, ignorando valores que não existem mais (ex.: forma de pagamento removida). */
    public static function de(?array $dados): self
    {
        $dados ??= [];
        $todas = array_column(FormaPagamento::cases(), 'value');
        $pagamentos = array_values(array_intersect($todas, (array) ($dados['pagamentos'] ?? $todas))) ?: $todas;
        $padrao = in_array($dados['pagamento_padrao'] ?? null, $pagamentos, true) ? $dados['pagamento_padrao'] : null;
        $chave = trim((string) ($dados['chave_pix'] ?? ''));

        return new self(
            pagamentos: $pagamentos,
            // Uma forma só: já vem marcada.
            pagamentoPadrao: $padrao ?? (count($pagamentos) === 1 ? $pagamentos[0] : null),
            canalPadrao: Canal::tryFrom((string) ($dados['canal_padrao'] ?? ''))?->value,
            exibicao: in_array($dados['exibicao'] ?? null, self::EXIBICOES, true) ? $dados['exibicao'] : 'grade',
            agruparCategorias: (bool) ($dados['agrupar_categorias'] ?? true),
            ordem: in_array($dados['ordem'] ?? null, self::ORDENS, true) ? $dados['ordem'] : 'nome',
            mostrarCombos: (bool) ($dados['mostrar_combos'] ?? true),
            calcularTroco: (bool) ($dados['calcular_troco'] ?? false),
            chavePix: $chave !== '' && in_array(FormaPagamento::Pix->value, $pagamentos, true) ? $chave : null,
            confirmarAntes: (bool) ($dados['confirmar_antes'] ?? false),
        );
    }

    /** Regras do formulário de configuração (nomes em snake_case, como no JSON). */
    public static function regras(): array
    {
        return [
            'pagamentos' => ['required', 'array', 'min:1'],
            'pagamentos.*' => ['distinct', Rule::enum(FormaPagamento::class)],
            'pagamento_padrao' => ['nullable', Rule::enum(FormaPagamento::class), 'in_array:pagamentos.*'],
            'canal_padrao' => ['nullable', Rule::enum(Canal::class)],
            'exibicao' => ['required', Rule::in(self::EXIBICOES)],
            'agrupar_categorias' => ['boolean'],
            'ordem' => ['required', Rule::in(self::ORDENS)],
            'mostrar_combos' => ['boolean'],
            'calcular_troco' => ['boolean'],
            'chave_pix' => ['nullable', 'string', 'max:140'],
            'confirmar_antes' => ['boolean'],
        ];
    }

    public static function atributos(): array
    {
        return [
            'pagamentos' => __('formas de pagamento aceitas'),
            'pagamento_padrao' => __('forma de pagamento padrão'),
            'canal_padrao' => __('canal padrão'),
            'exibicao' => __('exibição dos itens'),
            'ordem' => __('ordem dos itens'),
            'chave_pix' => __('chave Pix'),
        ];
    }

    /** Para salvar em barraquinhas.checkout. */
    public function paraJson(): array
    {
        return [
            'pagamentos' => $this->pagamentos,
            'pagamento_padrao' => $this->pagamentoPadrao,
            'canal_padrao' => $this->canalPadrao,
            'exibicao' => $this->exibicao,
            'agrupar_categorias' => $this->agruparCategorias,
            'ordem' => $this->ordem,
            'mostrar_combos' => $this->mostrarCombos,
            'calcular_troco' => $this->calcularTroco,
            'chave_pix' => $this->chavePix,
            'confirmar_antes' => $this->confirmarAntes,
        ];
    }

    /** Para o React (camelCase, como o resto das props). */
    public function paraTela(): array
    {
        return [
            'pagamentos' => $this->pagamentos,
            'pagamentoPadrao' => $this->pagamentoPadrao,
            'canalPadrao' => $this->canalPadrao,
            'exibicao' => $this->exibicao,
            'agruparCategorias' => $this->agruparCategorias,
            'ordem' => $this->ordem,
            'mostrarCombos' => $this->mostrarCombos,
            'calcularTroco' => $this->calcularTroco,
            'chavePix' => $this->chavePix,
            'confirmarAntes' => $this->confirmarAntes,
        ];
    }
}
