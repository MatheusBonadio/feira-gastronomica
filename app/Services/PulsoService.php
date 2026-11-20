<?php

namespace App\Services;

use App\Models\Lancamento;
use App\Models\Scopes\BarraquinhaScope;
use App\Models\Venda;
use Illuminate\Support\Facades\DB;

class PulsoService
{
    public function versao(array $barraquinhaIds, ?string $extra = null): string
    {
        if (! $barraquinhaIds) {
            return sha1('vazio|'.$extra);
        }

        $vendas = Venda::withoutGlobalScopes()
            ->whereIn('barraquinha_id', $barraquinhaIds)
            ->toBase()
            ->selectRaw('COUNT(*) as qtd, MAX(id) as ultimo, MAX(updated_at) as alterado')
            ->first();

        $lancamentos = Lancamento::withoutGlobalScope(BarraquinhaScope::class)
            ->withTrashed()
            ->whereIn('barraquinha_id', $barraquinhaIds)
            ->toBase()
            ->selectRaw('COUNT(*) as qtd, MAX(updated_at) as alterado')
            ->first();

        return sha1(implode('|', [
            $vendas->qtd, $vendas->ultimo, $vendas->alterado,
            $lancamentos->qtd, $lancamentos->alterado,
            $extra,
        ]));
    }

    public function versaoBarraquinhas(int $feiraId): string
    {
        $linha = DB::table('barraquinhas')->where('feira_id', $feiraId)->selectRaw('COUNT(*) as qtd, MAX(updated_at) as alterado')->first();

        return $linha->qtd.'|'.$linha->alterado;
    }
}
