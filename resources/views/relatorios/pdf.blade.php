@php
    /** @var \App\Services\Relatorios\Relatorio $relatorio */
    $formatar = fn ($valor) => match (true) {
        is_float($valor) => moeda($valor),
        is_int($valor) => numero($valor),
        default => $valor ?? '',
    };
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <title>{{ $relatorio->tipo->label() }}</title>
    {{-- Cores lidas de resources/js/styles/tokens.css (dompdf não entende var()). --}}
    <style>
        @page { margin: 28px 32px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 9.5px; color: {{ $cor('impressao-titulo') }}; }
        h1 { font-size: 16px; margin: 0 0 2px; color: {{ $cor('impressao-titulo') }}; }
        h2 { font-size: 12px; margin: 18px 0 6px; color: {{ $cor('impressao-destaque') }}; border-bottom: 1px solid {{ $cor('impressao-destaque') }}; padding-bottom: 3px; }
        h3 { font-size: 10px; margin: 12px 0 4px; }
        .cabecalho td { padding: 1px 8px 1px 0; color: {{ $cor('tinta-suave') }}; }
        .cabecalho td.valor { color: {{ $cor('impressao-titulo') }}; }
        table.dados { width: 100%; border-collapse: collapse; margin-top: 4px; }
        table.dados th { background: {{ $cor('impressao-cabecalho') }}; color: #ffffff; text-align: left; padding: 4px 5px; font-weight: bold; }
        table.dados td { padding: 3px 5px; border-bottom: 1px solid {{ $cor('impressao-borda') }}; }
        table.dados tr:nth-child(even) td { background: {{ $cor('impressao-zebra') }}; }
        table.dados tfoot td { font-weight: bold; border-top: 1px solid {{ $cor('impressao-titulo') }}; background: #ffffff; }
        .num { text-align: right; white-space: nowrap; }
        .quebra { page-break-before: always; }
    </style>
</head>
<body>
    <h1>{{ $relatorio->tipo->label() }}</h1>
    <table class="cabecalho">
        @foreach($relatorio->cabecalho() as $rotulo => $valor)
            <tr><td>{{ $rotulo }}</td><td class="valor">{{ $valor }}</td></tr>
        @endforeach
    </table>

    @foreach($relatorio->abas as $indice => $aba)
        <h2 @class(['quebra' => $indice > 0 && count($relatorio->abas) > 1])>{{ $aba['nome'] }}</h2>

        @foreach($aba['blocos'] as $bloco)
            @if($bloco['titulo'])
                <h3>{{ $bloco['titulo'] }}</h3>
            @endif
            <table class="dados">
                <thead>
                    <tr>
                        @foreach($bloco['colunas'] as $coluna)
                            <th>{{ $coluna }}</th>
                        @endforeach
                    </tr>
                </thead>
                <tbody>
                    @forelse($bloco['linhas'] as $linha)
                        <tr>
                            @foreach($linha as $valor)
                                <td @class(['num' => is_int($valor) || is_float($valor)])>{{ $formatar($valor) }}</td>
                            @endforeach
                        </tr>
                    @empty
                        <tr><td colspan="{{ count($bloco['colunas']) }}">—</td></tr>
                    @endforelse
                </tbody>
                @if($bloco['rodape'])
                    <tfoot>
                        <tr>
                            @foreach($bloco['rodape'] as $valor)
                                <td @class(['num' => is_int($valor) || is_float($valor)])>{{ $formatar($valor) }}</td>
                            @endforeach
                        </tr>
                    </tfoot>
                @endif
            </table>
        @endforeach
    @endforeach
</body>
</html>
