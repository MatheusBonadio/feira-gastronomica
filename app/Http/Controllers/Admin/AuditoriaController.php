<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AcaoAuditoria;
use App\Http\Controllers\Controller;
use App\Models\AuditoriaLog;
use Illuminate\Http\Request;
use App\Http\Apresentacao;
use Inertia\Inertia;
use Inertia\Response;

class AuditoriaController extends Controller
{
    public function index(Request $request): Response
    {
        $acao = AcaoAuditoria::tryFrom((string) $request->query('acao'));

        $registros = AuditoriaLog::with(['usuario', 'barraquinha'])
            ->when($acao, fn ($q) => $q->where('acao', $acao->value))
            ->when($request->boolean('sensiveis'), fn ($q) => $q->whereIn('acao', array_map(
                fn ($a) => $a->value,
                array_filter(AcaoAuditoria::cases(), fn ($a) => $a->sensivel()),
            )))
            ->latest('created_at')
            ->latest('id')
            ->paginate(config('feira.por_pagina'))
            ->withQueryString();

        return Inertia::render('admin/Auditoria', [
            'registros' => Apresentacao::paginacao($registros, fn (AuditoriaLog $r) => [
                'id' => $r->id,
                'quando' => $r->created_at->toIso8601String(),
                'acao' => Apresentacao::enum($r->acao),
                'sensivel' => $r->acao->sensivel(),
                'usuario' => $r->usuario?->nome ?? ($r->detalhe['usuario'] ?? null),
                'barraquinha' => $r->barraquinha?->nomeExibicao(),
                'entidade' => $r->entidade ? $r->entidade.($r->entidade_id ? " #{$r->entidade_id}" : '') : null,
                'detalhe' => $r->detalhe,
                'ip' => $r->ip,
            ]),
            'acao' => $acao?->value,
            'sensiveis' => $request->boolean('sensiveis'),
            'acoes' => Apresentacao::opcoes(AcaoAuditoria::cases()),
        ]);
    }
}
