<?php

namespace App\Services;

use App\Enums\AcaoAuditoria;
use App\Enums\BarraquinhaStatus;
use App\Enums\Perfil;
use App\Models\AuditoriaLog;
use App\Models\Barraquinha;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Só o admin cria e controla os acessos das barraquinhas: um login por barraquinha.
 * A senha é guardada com hash (bcrypt, com salt): o admin nunca vê uma senha
 * existente, só gera outra. Ao trocar a senha, as sessões abertas caem.
 */
class CredencialService
{
    /** @return array{usuario: string, senha: string} a senha em texto aparece só esta vez */
    public function gerar(Barraquinha $barraquinha): array
    {
        return $this->definir($barraquinha, $this->sugerirUsuario($barraquinha), $this->gerarSenha());
    }

    /** @return array{usuario: string, senha: string} */
    public function definir(Barraquinha $barraquinha, string $usuario, string $senha): array
    {
        $existente = $barraquinha->usuario;

        DB::transaction(function () use ($barraquinha, $usuario, $senha, $existente) {
            $user = $existente ?? new User(['perfil' => Perfil::Barraquinha, 'barraquinha_id' => $barraquinha->id]);
            $user->fill([
                'nome' => $barraquinha->nomeExibicao(),
                'usuario' => Str::lower(trim($usuario)),
                'password' => $senha,
                'ativo' => true,
                'trocar_senha' => true,
            ])->save();

            $this->encerrarSessoes($user);

            AuditoriaLog::registrar(
                $existente ? AcaoAuditoria::CredencialAlterada : AcaoAuditoria::CredencialCriada,
                $user,
                detalhe: ['usuario' => $user->usuario],
                barraquinhaId: $barraquinha->id,
            );
        });

        return ['usuario' => Str::lower(trim($usuario)), 'senha' => $senha];
    }

    /** @return array{usuario: string, senha: string} */
    public function redefinirSenha(Barraquinha $barraquinha): array
    {
        $user = $barraquinha->usuario;
        abort_unless($user, 404);

        $senha = $this->gerarSenha();
        $user->update(['password' => $senha, 'trocar_senha' => true]);
        $this->encerrarSessoes($user);

        AuditoriaLog::registrar(AcaoAuditoria::SenhaRedefinida, $user, barraquinhaId: $barraquinha->id);

        return ['usuario' => $user->usuario, 'senha' => $senha];
    }

    /** Bloquear não apaga dados: só impede o acesso até ser reativada. */
    public function bloquear(Barraquinha $barraquinha): void
    {
        $barraquinha->update(['status' => BarraquinhaStatus::Bloqueada]);
        if ($barraquinha->usuario) {
            $this->encerrarSessoes($barraquinha->usuario);
        }

        AuditoriaLog::registrar(AcaoAuditoria::AcessoBloqueado, $barraquinha, barraquinhaId: $barraquinha->id);
    }

    public function reativar(Barraquinha $barraquinha): void
    {
        $barraquinha->update(['status' => BarraquinhaStatus::Ativa]);

        AuditoriaLog::registrar(AcaoAuditoria::AcessoReativado, $barraquinha, barraquinhaId: $barraquinha->id);
    }

    public function sugerirUsuario(Barraquinha $barraquinha): string
    {
        $base = Str::slug($barraquinha->nome ?: 'barraquinha-'.$barraquinha->posicao).'-'.$barraquinha->feira->data_inicio->format('Y');
        $usuario = $base;

        for ($i = 2; User::where('usuario', $usuario)->where('barraquinha_id', '!=', $barraquinha->id)->exists(); $i++) {
            $usuario = "{$base}-{$i}";
        }

        return $usuario;
    }

    /** 12 caracteres sem ambíguos (0/O, 1/l/I), fáceis de ditar para a equipe. */
    public function gerarSenha(): string
    {
        $alfabeto = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
        do {
            $senha = '';
            for ($i = 0; $i < 12; $i++) {
                $senha .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
            }
        } while (! preg_match('/\d/', $senha) || ! preg_match('/[a-zA-Z]/', $senha));

        return $senha;
    }

    /**
     * Sessões no banco são apagadas na hora. Com outro driver de sessão, o
     * middleware auth.session derruba a sessão quando o hash da senha muda,
     * e o GarantirAcessoAtivo derruba barraquinhas bloqueadas.
     */
    private function encerrarSessoes(User $user): void
    {
        if (config('session.driver') === 'database') {
            DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
        }
    }
}
