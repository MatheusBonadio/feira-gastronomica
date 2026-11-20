<?php

namespace App\Services\Relatorios;

use Illuminate\Support\Carbon;

final class Relatorio
{
    public array $abas = [];

    public function __construct(
        public readonly TipoRelatorio $tipo,
        public readonly string $feira,
        public readonly string $escopo,
        public readonly array $filtros,
        public readonly Carbon $geradoEm,
    ) {}

    public function aba(string $nome): self
    {
        $this->abas[] = ['nome' => $nome, 'blocos' => []];

        return $this;
    }

    public function bloco(array $colunas, array $linhas, ?array $rodape = null, ?string $titulo = null): self
    {
        $this->abas[array_key_last($this->abas)]['blocos'][] = [
            'titulo' => $titulo,
            'colunas' => $colunas,
            'linhas' => $linhas,
            'rodape' => $rodape,
        ];

        return $this;
    }

    public function cabecalho(): array
    {
        return [
            __('Relatório') => $this->tipo->label(),
            __('Feira') => $this->feira,
            __('Barraquinha') => $this->escopo,
            __('Período') => $this->filtros[__('Período')] ?? __('Todo o período'),
            __('Filtros') => collect($this->filtros)->except(__('Período'))->map(fn ($v, $k) => "{$k}: {$v}")->implode('; ') ?: __('Nenhum'),
            __('Gerado em') => data_formatada($this->geradoEm, true),
        ];
    }

    public function nomeArquivo(string $extensao): string
    {
        return str($this->tipo->label().' '.$this->escopo.' '.$this->geradoEm->format('Y-m-d His'))->slug().'.'.$extensao;
    }
}
