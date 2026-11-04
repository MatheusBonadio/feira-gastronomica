<?php

namespace Tests\Feature;

use App\Enums\BarraquinhaStatus;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/** Seção 3: login único, mensagem genérica, bloqueio por tentativas e gestão de acessos pelo admin. */
class AutenticacaoTest extends TestCase
{
    public function test_cada_perfil_vai_para_a_sua_area(): void
    {
        $admin = $this->criarAdmin();
        $barraquinha = $this->usuarioDa($this->criarBarraquinha());

        $this->post('/login', ['usuario' => $admin->usuario, 'password' => 'senha1234'])->assertRedirect(route('admin.painel'));
        $this->post('/logout');
        $this->post('/login', ['usuario' => $barraquinha->usuario, 'password' => 'senha1234'])->assertRedirect(route('barraquinha.painel'));
    }

    public function test_mensagem_de_erro_e_a_mesma_para_usuario_ou_senha_errados(): void
    {
        $user = $this->usuarioDa($this->criarBarraquinha());

        $senhaErrada = $this->post('/login', ['usuario' => $user->usuario, 'password' => 'errada123'])->assertSessionHasErrors('usuario');
        $usuarioErrado = $this->post('/login', ['usuario' => 'nao-existe', 'password' => 'errada123'])->assertSessionHasErrors('usuario');

        $this->assertSame(session('errors')->first('usuario'), 'Usuário ou senha inválidos.');
        $this->assertGuest();
    }

    public function test_bloqueio_temporario_apos_cinco_tentativas(): void
    {
        $user = $this->usuarioDa($this->criarBarraquinha());

        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', ['usuario' => $user->usuario, 'password' => 'errada123']);
        }

        // Nem a senha certa entra durante o bloqueio.
        $this->post('/login', ['usuario' => $user->usuario, 'password' => 'senha1234'])->assertSessionHasErrors('usuario');
        $this->assertGuest();
        $this->assertDatabaseHas('auditoria_logs', ['acao' => 'login_bloqueado']);
    }

    public function test_barraquinha_bloqueada_nao_entra_e_perde_a_sessao(): void
    {
        $barraquinha = $this->criarBarraquinha();
        $user = $this->usuarioDa($barraquinha);

        $this->actingAs($user)->get(route('barraquinha.painel'))->assertOk();

        $barraquinha->update(['status' => BarraquinhaStatus::Bloqueada]);

        // Cada requisição real recarrega o usuário; fresh() simula isso no teste.
        $this->actingAs($user->fresh())->get(route('barraquinha.painel'))->assertRedirect(route('login'));
        $this->post('/logout');
        $this->post('/login', ['usuario' => $user->usuario, 'password' => 'senha1234'])->assertSessionHasErrors('usuario');
        $this->assertGuest();
    }

    public function test_admin_gera_credenciais_e_a_senha_e_exibida_uma_vez_com_hash_no_banco(): void
    {
        $admin = $this->criarAdmin();
        $barraquinha = $this->criarBarraquinha();

        $resposta = $this->actingAs($admin)->post(route('admin.barraquinhas.credenciais.gerar', $barraquinha));
        $resposta->assertRedirect(route('admin.barraquinhas.edit', $barraquinha));

        $credenciais = session('inertia.flash_data')['credenciais'] ?? null;
        $this->assertNotNull($credenciais, 'A senha deve ir no flash do Inertia.');

        $user = User::where('barraquinha_id', $barraquinha->id)->first();
        $this->assertNotSame($credenciais['senha'], $user->password);
        $this->assertTrue(Hash::check($credenciais['senha'], $user->password));
        $this->assertTrue($user->trocar_senha);
    }

    public function test_redefinir_senha_invalida_a_antiga_na_hora(): void
    {
        $admin = $this->criarAdmin();
        $barraquinha = $this->criarBarraquinha();
        $user = $this->usuarioDa($barraquinha);

        $this->actingAs($admin)->post(route('admin.barraquinhas.credenciais.redefinir', $barraquinha))->assertRedirect();

        $this->assertFalse(Hash::check('senha1234', $user->fresh()->password));
        $this->assertDatabaseHas('auditoria_logs', ['acao' => 'senha_redefinida', 'barraquinha_id' => $barraquinha->id]);
    }

    public function test_primeiro_acesso_com_senha_gerada_exige_troca(): void
    {
        $user = $this->usuarioDa($this->criarBarraquinha(), ['trocar_senha' => true]);

        $this->actingAs($user)->get(route('barraquinha.itens.index'))->assertRedirect(route('senha.edit'));

        $this->actingAs($user)->put(route('senha.update'), [
            'senha_atual' => 'senha1234',
            'senha' => 'novaSenha2027',
            'senha_confirmation' => 'novaSenha2027',
        ])->assertRedirect(route('barraquinha.painel'));

        $this->assertFalse($user->fresh()->trocar_senha);
        $this->actingAs($user->fresh())->get(route('barraquinha.itens.index'))->assertOk();
    }
}
