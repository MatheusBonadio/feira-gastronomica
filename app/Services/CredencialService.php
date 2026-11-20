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

class CredencialService
{
    public function gerar(Barraquinha $barraquinha): array
    {
        return $this->definir($barraquinha, $this->sugerirUsuario($barraquinha), $this->gerarSenha());
    }

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

    private function encerrarSessoes(User $user): void
    {
        if (config('session.driver') === 'database') {
            DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
        }
    }
}
