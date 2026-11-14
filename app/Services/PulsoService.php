<?php

namespace App\Services;

use App\Models\Lancamento;
use App\Models\Scopes\BarraquinhaScope;
use App\Models\Venda;
use Illuminate\Support\Facades\DB;

/**
 * "Pulso" do painel em tempo real: uma assinatura barata do estado das vendas
 * e lançamentos. O navegador consulta a cada poucos segundos e só recarrega
 * os dados do painel quando a assinatura muda (nova venda, cancelamento,
 * lançamento criado, alterado ou excluído).
 */
class PulsoService
{
    /** @param list<int> $barraquinhaIds */
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

        // Inclui os excluídos (exclusão lógica também atualiza updated_at).
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

    /** Alterações do admin nas barraquinhas (nome, status, vagas) também mudam o painel da feira. */
    public function versaoBarraquinhas(int $feiraId): string
    {
        $linha = DB::table('barraquinhas')->where('feira_id', $feiraId)->selectRaw('COUNT(*) as qtd, MAX(updated_at) as alterado')->first();

        return $linha->qtd.'|'.$linha->alterado;
    }
}
