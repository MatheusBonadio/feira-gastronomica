<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use RuntimeException;
use Tests\TestCase;

/** Visitas Inertia nunca podem receber HTML de erro: o front abriria o diálogo de erro por cima da tela. */
class RespostasDeErroTest extends TestCase
{
    public function test_metodo_nao_permitido_numa_visita_inertia_vira_a_pagina_de_erro(): void
    {
        $this->withHeaders(['X-Inertia' => 'true'])
            ->patch('/login')
            ->assertStatus(405)
            ->assertHeader('X-Inertia', 'true')
            ->assertJsonPath('component', 'Erro')
            ->assertJsonPath('props.status', 405);
    }

    public function test_pagina_de_erro_sai_mesmo_quando_os_dados_compartilhados_falham(): void
    {
        Route::middleware('web')->post('/_teste/proibido', fn () => abort(403));
        Inertia::share('quebra', fn () => throw new RuntimeException('banco fora do ar'));

        $this->withHeaders(['X-Inertia' => 'true'])
            ->post('/_teste/proibido')
            ->assertStatus(403)
            ->assertHeader('X-Inertia', 'true')
            ->assertJsonPath('component', 'Erro')
            ->assertJsonPath('props.status', 403)
            ->assertJsonPath('props.auth', null)
            ->assertJsonPath('props.app.nome', config('app.name'))
            ->assertJsonMissingPath('props.quebra');
    }
}
