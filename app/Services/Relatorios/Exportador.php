<?php

namespace App\Services\Relatorios;

use App\Support\Formato;
use App\Support\Tema;
use App\Support\Xlsx\XlsxWriter;
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class Exportador
{
    public const FORMATOS = ['xlsx', 'csv', 'pdf'];

    public function responder(Relatorio $relatorio, string $formato): Response
    {
        return match ($formato) {
            'csv' => $this->csv($relatorio),
            'pdf' => $this->pdf($relatorio),
            default => $this->xlsx($relatorio),
        };
    }

    private function xlsx(Relatorio $relatorio): BinaryFileResponse
    {
        $planilha = new XlsxWriter;

        foreach ($relatorio->abas as $aba) {
            $planilha->adicionarAba($aba['nome']);
            foreach ($relatorio->cabecalho() as $rotulo => $valor) {
                $planilha->linha([$rotulo, $valor]);
            }
            foreach ($aba['blocos'] as $bloco) {
                $planilha->linha([]);
                if ($bloco['titulo']) {
                    $planilha->linha([$bloco['titulo']], true);
                }
                $planilha->linha($bloco['colunas'], true);
                foreach ($bloco['linhas'] as $linha) {
                    $planilha->linha($linha);
                }
                if ($bloco['rodape']) {
                    $planilha->linha($bloco['rodape'], true);
                }
            }
        }

        $arquivo = tempnam(sys_get_temp_dir(), 'rel').'.xlsx';
        $planilha->salvar($arquivo);

        return response()->download($arquivo, $relatorio->nomeArquivo('xlsx'), [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend();
    }

    private function csv(Relatorio $relatorio): StreamedResponse
    {
        $separador = __('formato.csv_separador');

        return response()->streamDownload(function () use ($relatorio, $separador) {
            $saida = fopen('php://output', 'w');
            fwrite($saida, "\xEF\xBB\xBF");
            $escrever = fn (array $linha) => fputcsv($saida, array_map([$this, 'textoCsv'], $linha), $separador, '"', '');

            foreach ($relatorio->cabecalho() as $rotulo => $valor) {
                $escrever([$rotulo, $valor]);
            }
            foreach ($relatorio->abas as $aba) {
                $escrever([]);
                $escrever(['## '.$aba['nome']]);
                foreach ($aba['blocos'] as $bloco) {
                    if ($bloco['titulo']) {
                        $escrever([$bloco['titulo']]);
                    }
                    $escrever($bloco['colunas']);
                    array_map($escrever, $bloco['linhas']);
                    if ($bloco['rodape']) {
                        $escrever($bloco['rodape']);
                    }
                    $escrever([]);
                }
            }
            fclose($saida);
        }, $relatorio->nomeArquivo('csv'), ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function pdf(Relatorio $relatorio): Response
    {
        return Pdf::loadView('relatorios.pdf', [
            'relatorio' => $relatorio,
            'cor' => fn (string $token, string $padrao = '#000000') => Tema::cor($token, $padrao),
        ])->setPaper('a4', 'landscape')->download($relatorio->nomeArquivo('pdf'));
    }

    public function textoCsv(mixed $valor): string
    {
        return match (true) {
            is_float($valor) => Formato::numero($valor),
            $valor === null => '',
            default => (string) $valor,
        };
    }
}
