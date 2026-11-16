<?php

namespace App\Support\Xlsx;

use RuntimeException;
use ZipArchive;

/**
 * Gerador mínimo de .xlsx (Office Open XML) com várias abas, usando só a
 * extensão zip. Suficiente para relatórios tabulares: texto, números e
 * linhas em negrito. Evita uma dependência pesada só para exportar planilhas.
 */
class XlsxWriter
{
    private const ESTILO_NORMAL = 0;
    private const ESTILO_NEGRITO = 1;
    private const ESTILO_DINHEIRO = 2;
    private const ESTILO_DINHEIRO_NEGRITO = 3;

    /** @var list<array{nome: string, linhas: list<array{celulas: list<mixed>, negrito: bool}>}> */
    private array $abas = [];

    public function adicionarAba(string $nome): self
    {
        $this->abas[] = ['nome' => $this->nomeDeAbaValido($nome), 'linhas' => []];

        return $this;
    }

    /** @param list<mixed> $celulas floats viram número com 2 casas; int, número inteiro; o resto, texto */
    public function linha(array $celulas, bool $negrito = false): self
    {
        if (! $this->abas) {
            $this->adicionarAba('Planilha');
        }

        $this->abas[array_key_last($this->abas)]['linhas'][] = ['celulas' => array_values($celulas), 'negrito' => $negrito];

        return $this;
    }

    public function salvar(string $caminho): void
    {
        $zip = new ZipArchive;
        if ($zip->open($caminho, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException("Não foi possível criar {$caminho}");
        }

        $zip->addFromString('[Content_Types].xml', $this->contentTypes());
        $zip->addFromString('_rels/.rels', $this->relsRaiz());
        $zip->addFromString('xl/workbook.xml', $this->workbook());
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->relsWorkbook());
        $zip->addFromString('xl/styles.xml', $this->estilos());

        foreach ($this->abas as $i => $aba) {
            $zip->addFromString('xl/worksheets/sheet'.($i + 1).'.xml', $this->planilha($aba['linhas']));
        }

        $zip->close();
    }

    private function planilha(array $linhas): string
    {
        $xml = '';
        foreach ($linhas as $l => $linha) {
            $numeroLinha = $l + 1;
            $xml .= "<row r=\"{$numeroLinha}\">";
            foreach ($linha['celulas'] as $c => $valor) {
                $xml .= $this->celula($this->coluna($c).$numeroLinha, $valor, $linha['negrito']);
            }
            $xml .= '</row>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<sheetData>'.$xml.'</sheetData></worksheet>';
    }

    private function celula(string $ref, mixed $valor, bool $negrito): string
    {
        if ($valor === null || $valor === '') {
            return '';
        }

        if (is_float($valor)) {
            $estilo = $negrito ? self::ESTILO_DINHEIRO_NEGRITO : self::ESTILO_DINHEIRO;

            return "<c r=\"{$ref}\" s=\"{$estilo}\"><v>".round($valor, 2).'</v></c>';
        }

        $estilo = $negrito ? self::ESTILO_NEGRITO : self::ESTILO_NORMAL;

        if (is_int($valor)) {
            return "<c r=\"{$ref}\" s=\"{$estilo}\"><v>{$valor}</v></c>";
        }

        $texto = htmlspecialchars((string) $valor, ENT_XML1 | ENT_QUOTES, 'UTF-8');

        return "<c r=\"{$ref}\" s=\"{$estilo}\" t=\"inlineStr\"><is><t xml:space=\"preserve\">{$texto}</t></is></c>";
    }

    private function coluna(int $indice): string
    {
        $nome = '';
        for ($n = $indice + 1; $n > 0; $n = intdiv($n - 1, 26)) {
            $nome = chr(65 + ($n - 1) % 26).$nome;
        }

        return $nome;
    }

    private function nomeDeAbaValido(string $nome): string
    {
        $nome = trim(mb_substr(preg_replace('/[\[\]\:\*\?\/\\\\]/', ' ', $nome), 0, 31)) ?: 'Planilha';
        $existentes = array_column($this->abas, 'nome');
        $base = $nome;
        for ($i = 2; in_array($nome, $existentes, true); $i++) {
            $nome = mb_substr($base, 0, 27)." ({$i})";
        }

        return $nome;
    }

    private function contentTypes(): string
    {
        $abas = '';
        foreach (array_keys($this->abas) as $i) {
            $abas .= '<Override PartName="/xl/worksheets/sheet'.($i + 1).'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            .$abas.'</Types>';
    }

    private function relsRaiz(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'</Relationships>';
    }

    private function workbook(): string
    {
        $abas = '';
        foreach ($this->abas as $i => $aba) {
            $nome = htmlspecialchars($aba['nome'], ENT_XML1 | ENT_QUOTES, 'UTF-8');
            $abas .= '<sheet name="'.$nome.'" sheetId="'.($i + 1).'" r:id="rId'.($i + 1).'"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets>'.$abas.'</sheets></workbook>';
    }

    private function relsWorkbook(): string
    {
        $rels = '';
        foreach (array_keys($this->abas) as $i) {
            $rels .= '<Relationship Id="rId'.($i + 1).'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'.($i + 1).'.xml"/>';
        }
        $idEstilos = count($this->abas) + 1;
        $rels .= '<Relationship Id="rId'.$idEstilos.'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>';

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'.$rels.'</Relationships>';
    }

    private function estilos(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts>'
            .'<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
            .'<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
            .'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
            .'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            .'<cellXfs count="4">'
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            .'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
            .'<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
            .'<xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>'
            .'</cellXfs></styleSheet>';
    }
}
