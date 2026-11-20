<?php

namespace App\Http;

use App\Http\Controllers\Loja;
use Illuminate\Support\Facades\Route;

class RotasDaLoja
{
    public static function registrar(bool $admin): void
    {
        Route::get('/', [Loja\PainelController::class, 'index'])->name('painel');
        Route::get('pulso', [Loja\PainelController::class, 'pulso'])->name('pulso');
        if (! $admin) {
            Route::get('pendencias', [Loja\PainelController::class, 'pendencias'])->name('pendencias');
        }

        Route::resource('itens', Loja\ItemController::class)->except('show')->parameters(['itens' => 'item']);
        Route::resource('combos', Loja\ComboController::class)->except('show');
        Route::patch('combos/{combo}/alternar', [Loja\ComboController::class, 'alternar'])->name('combos.alternar');

        Route::get('vendas', [Loja\VendaController::class, 'index'])->name('vendas.index');
        if (! $admin) {
            Route::get('vendas/nova', [Loja\VendaController::class, 'create'])->name('vendas.create');
            Route::post('vendas', [Loja\VendaController::class, 'store'])->name('vendas.store');
            Route::post('vendas/simular', [Loja\VendaController::class, 'simular'])->name('vendas.simular');
        }
        Route::get('vendas/{venda}', [Loja\VendaController::class, 'show'])->name('vendas.show');
        Route::patch('vendas/{venda}/cancelar', [Loja\VendaController::class, 'cancelar'])->name('vendas.cancelar');

        Route::resource('lancamentos', Loja\LancamentoController::class)->except('show');
        Route::get('lancamentos/{lancamento}/comprovante', [Loja\LancamentoController::class, 'comprovante'])->name('lancamentos.comprovante');

        Route::get('configuracoes', [Loja\ConfiguracaoController::class, 'edit'])->name('configuracoes');
        Route::put('configuracoes/checkout', [Loja\ConfiguracaoController::class, 'checkout'])->name('configuracoes.checkout');
        Route::post('configuracoes/foto', [Loja\ConfiguracaoController::class, 'foto'])->name('configuracoes.foto');
        Route::delete('configuracoes/foto', [Loja\ConfiguracaoController::class, 'removerFoto'])->name('configuracoes.foto.remover');

        if (! $admin) {
            Route::get('relatorios', [Loja\RelatorioController::class, 'index'])->name('relatorios.index');
            Route::get('relatorios/exportar', [Loja\RelatorioController::class, 'exportar'])->name('relatorios.exportar');
        }
    }
}
