<?php

namespace App\Services\Financeiro;

use App\Enums\Canal;
use App\Enums\FormaPagamento;
use App\Models\VendaLinha;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

final class Filtro
{
    public function __construct(
        public readonly ?Carbon $de = null,
        public readonly ?Carbon $ate = null,
        public readonly ?Canal $canal = null,
        public readonly ?string $tag = null,
        public readonly ?FormaPagamento $pagamento = null,
    ) {}

    public static function daRequisicao(Request $request): self
    {
        $data = fn (string $campo) => rescue(fn () => $request->filled($campo) ? Carbon::parse($request->input($campo)) : null, null, false);
        $tag = $request->input('tag');

        return new self(
            de: $data('de')?->startOfDay(),
            ate: $data('ate')?->endOfDay(),
            canal: Canal::tryFrom((string) $request->input('canal')),
            tag: ($tag === VendaLinha::TAG_COMUM || preg_match('/^combo:\d+$/', (string) $tag)) ? $tag : null,
            pagamento: FormaPagamento::tryFrom((string) $request->input('pagamento')),
        );
    }

    public function aplicarEmVendas(Builder $query): Builder
    {
        $tabela = $query->getModel()->getTable();

        return $query
            ->when($this->de, fn ($q) => $q->where("{$tabela}.data_hora", '>=', $this->de))
            ->when($this->ate, fn ($q) => $q->where("{$tabela}.data_hora", '<=', $this->ate))
            ->when($this->canal, fn ($q) => $q->where("{$tabela}.canal", $this->canal->value))
            ->when($this->pagamento, fn ($q) => $q->where("{$tabela}.pagamento", $this->pagamento->value))
            ->when($this->tag, fn ($q) => $q->whereHas('linhas', fn ($l) => $this->aplicarTag($l)));
    }

    public function aplicarTag(Builder $linhas): Builder
    {
        if ($this->tag === VendaLinha::TAG_COMUM) {
            return $linhas->where('tag', VendaLinha::TAG_COMUM);
        }

        return $linhas->where('tag', VendaLinha::TAG_COMBO)->where('combo_numero', (int) substr($this->tag, 6));
    }

    public function aceitaLinha(VendaLinha $linha): bool
    {
        return match (true) {
            $this->tag === null => true,
            $this->tag === VendaLinha::TAG_COMUM => $linha->tag === VendaLinha::TAG_COMUM,
            default => $linha->tag === VendaLinha::TAG_COMBO && $linha->combo_numero === (int) substr($this->tag, 6),
        };
    }

    public function aplicarEmLancamentos(Builder $query): Builder
    {
        return $query
            ->when($this->de, fn ($q) => $q->whereDate('data', '>=', $this->de))
            ->when($this->ate, fn ($q) => $q->whereDate('data', '<=', $this->ate));
    }

    public function descricao(): array
    {
        return array_filter([
            __('Período') => $this->de || $this->ate
                ? (data_formatada($this->de) ?: '…').' – '.(data_formatada($this->ate) ?: '…')
                : null,
            __('Canal') => $this->canal?->label(),
            __('Tag') => $this->tag ? VendaLinha::rotuloTag(
                str_starts_with($this->tag, 'combo') ? VendaLinha::TAG_COMBO : VendaLinha::TAG_COMUM,
                str_starts_with($this->tag, 'combo') ? (int) substr($this->tag, 6) : null,
            ) : null,
            __('Pagamento') => $this->pagamento?->label(),
        ]);
    }

    public function paraQuery(): array
    {
        return array_filter([
            'de' => $this->de?->toDateString(),
            'ate' => $this->ate?->toDateString(),
            'canal' => $this->canal?->value,
            'tag' => $this->tag,
            'pagamento' => $this->pagamento?->value,
        ]);
    }
}
