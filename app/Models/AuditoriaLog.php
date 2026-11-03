<?php

namespace App\Models;

use App\Enums\AcaoAuditoria;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class AuditoriaLog extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'auditoria_logs';

    protected $guarded = ['*'];

    protected function casts(): array
    {
        return [
            'acao' => AcaoAuditoria::class,
            'detalhe' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function barraquinha(): BelongsTo
    {
        return $this->belongsTo(Barraquinha::class);
    }

    /**
     * Grava sem RETURNING: no PostgreSQL com RLS a barraquinha pode inserir
     * na trilha, mas não ler, e um RETURNING exigiria a leitura.
     */
    public static function registrar(
        AcaoAuditoria $acao,
        Model|string|null $entidade = null,
        ?int $entidadeId = null,
        array $detalhe = [],
        ?User $usuario = null,
        ?int $barraquinhaId = null,
    ): void {
        $usuario ??= auth()->user();

        if ($entidade instanceof Model) {
            $entidadeId ??= $entidade->getKey();
            $entidade = class_basename($entidade);
        }

        DB::table('auditoria_logs')->insert([
            'user_id' => $usuario?->id,
            'barraquinha_id' => $barraquinhaId ?? $usuario?->barraquinha_id,
            'acao' => $acao->value,
            'entidade' => $entidade,
            'entidade_id' => $entidadeId,
            'detalhe' => $detalhe ? json_encode($detalhe, JSON_UNESCAPED_UNICODE) : null,
            'ip' => request()?->ip(),
            'created_at' => now(),
        ]);
    }
}
