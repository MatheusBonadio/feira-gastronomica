<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Toda frase passada a __() (PHP) ou t() (React) precisa estar em lang/en.json,
 * com os mesmos :parametros. As chaves são as frases em português.
 */
class TraducoesTest extends TestCase
{
    private const CATEGORIAS_PADRAO = ['Comida', 'Bebida', 'Sobremesa'];

    public function test_todas_as_frases_tem_traducao_em_ingles(): void
    {
        $raiz = dirname(__DIR__, 2);
        $dicionario = json_decode((string) file_get_contents("$raiz/lang/en.json"), true, flags: JSON_THROW_ON_ERROR);

        $chaves = [];
        $this->coletar("$raiz/app", ['php'], "/__\(\s*'((?:[^'\\\\]|\\\\.)*)'/", fn ($k) => str_replace("\\'", "'", $k), $chaves);
        // Todo o front: páginas, kit (ui, painel, graficos, app), layouts e hooks.
        $this->coletar("$raiz/resources/js", ['ts', 'tsx'], '/\bt\(\s*"((?:[^"\\\\]|\\\\.)*)"/', 'stripcslashes', $chaves);
        $chaves = array_filter(array_keys($chaves), fn ($k) => ! str_starts_with($k, 'formato.'));

        $faltando = array_values(array_diff([...$chaves, ...self::CATEGORIAS_PADRAO], array_keys($dicionario)));
        $this->assertSame([], $faltando, 'Frases sem tradução em lang/en.json');

        foreach ($dicionario as $chave => $traducao) {
            preg_match_all('/:(\w+)/', $chave, $a);
            preg_match_all('/:(\w+)/', $traducao, $b);
            sort($a[1]);
            sort($b[1]);
            $this->assertSame($a[1], $b[1], "Parâmetros diferentes em: {$chave}");
        }
    }

    private function coletar(string $dir, array $extensoes, string $regex, callable $limpar, array &$chaves): void
    {
        $arquivos = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS));
        foreach ($arquivos as $arquivo) {
            if (in_array($arquivo->getExtension(), $extensoes, true)) {
                preg_match_all($regex, (string) file_get_contents($arquivo->getPathname()), $m);
                foreach ($m[1] as $chave) {
                    $chaves[$limpar($chave)] = true;
                }
            }
        }
    }
}
