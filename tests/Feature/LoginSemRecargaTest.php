<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LoginSemRecargaTest extends TestCase
{
    public function test_primeira_pagina_depois_do_login_leva_as_rotas_do_perfil(): void
    {
        $admin = $this->criarAdmin();

        $this->post(route('login'), ['usuario' => $admin->usuario, 'password' => 'senha1234'])
            ->assertRedirect(route('admin.painel'));

        $this->get(route('admin.painel'))->assertInertia(fn (Assert $p) => $p
            ->where('rotas.routes', fn ($rotas) => $rotas->has('admin.painel') && ! $rotas->has('barraquinha.painel')));

        $this->get(route('admin.painel'))->assertInertia(fn (Assert $p) => $p->where('rotas', null));
    }

    public function test_rotas_chegam_mesmo_com_troca_de_senha_obrigatoria_no_caminho(): void
    {
        $usuario = $this->usuarioDa($this->criarBarraquinha(), ['trocar_senha' => true]);

        $this->post(route('login'), ['usuario' => $usuario->usuario, 'password' => 'senha1234']);

        $this->get(route('barraquinha.painel'))->assertRedirect(route('senha.edit'));
        $this->get(route('senha.edit'))->assertInertia(fn (Assert $p) => $p
            ->component('auth/Senha')
            ->where('rotas.routes', fn ($rotas) => $rotas->has('senha.update') && $rotas->has('barraquinha.painel')));
    }

    public function test_idioma_diferente_recarrega_a_pagina(): void
    {
        $admin = $this->criarAdmin();
        $admin->forceFill(['idioma' => 'en'])->save();

        $this->post(route('login'), ['usuario' => $admin->usuario, 'password' => 'senha1234'], ['X-Inertia' => 'true'])
            ->assertStatus(409)
            ->assertHeader('X-Inertia-Location', route('admin.painel'));
    }
}
