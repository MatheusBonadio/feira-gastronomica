<?php

namespace App\Services;

use App\Enums\AcaoAuditoria;
use App\Models\AuditoriaLog;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Mensagem genérica para usuário ou senha errados (sem dizer qual) e
     * bloqueio temporário após N falhas seguidas do mesmo usuário + IP.
     */
    public function autenticar(string $usuario, string $senha, string $ip): User
    {
        $usuario = Str::lower(trim($usuario));
        $chave = 'login:'.sha1($usuario.'|'.$ip);
        $max = config('feira.login.max_tentativas');

        if (RateLimiter::tooManyAttempts($chave, $max)) {
            throw ValidationException::withMessages(['usuario' => __(
                'Muitas tentativas. Tente de novo em :min minutos.',
                ['min' => (int) ceil(RateLimiter::availableIn($chave) / 60)],
            )]);
        }

        $user = User::where('usuario', $usuario)->first();

        // Hash::check mesmo sem usuário, para o tempo de resposta não revelar se ele existe.
        $senhaConfere = Hash::check($senha, $user?->password ?? '$2y$12$'.str_repeat('a', 53));

        if (! $user || ! $senhaConfere) {
            RateLimiter::hit($chave, config('feira.login.bloqueio_minutos') * 60);
            $bloqueou = RateLimiter::tooManyAttempts($chave, $max);

            AuditoriaLog::registrar(
                $bloqueou ? AcaoAuditoria::LoginBloqueado : AcaoAuditoria::LoginFalhou,
                'User',
                $user?->id,
                ['usuario' => $usuario],
                usuario: null,
            );

            throw ValidationException::withMessages(['usuario' => __('Usuário ou senha inválidos.')]);
        }

        if (! $user->podeEntrar()) {
            throw ValidationException::withMessages(['usuario' => __('Acesso bloqueado. Procure a coordenação da feira.')]);
        }

        RateLimiter::clear($chave);
        $user->forceFill(['ultimo_acesso_em' => now()])->save();
        AuditoriaLog::registrar(AcaoAuditoria::Login, $user, usuario: $user);

        return $user;
    }
}
