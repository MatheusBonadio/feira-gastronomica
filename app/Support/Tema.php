<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Lê as cores em hex do bloco :root de resources/js/styles/tokens.css, a fonte
 * única do design system. Usado onde CSS var() não funciona, como nos PDFs.
 */
class Tema
{
    public const ARQUIVO = 'js/styles/tokens.css';

    /** @return array<string, string> token (sem "--") => cor hexadecimal do tema claro */
    public static function tokens(): array
    {
        $arquivo = resource_path(self::ARQUIVO);

        return Cache::store('array')->rememberForever('tema:'.filemtime($arquivo), function () use ($arquivo) {
            if (! preg_match('/:root\s*\{(.*?)\n\}/s', (string) file_get_contents($arquivo), $bloco)) {
                return [];
            }

            preg_match_all('/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/', $bloco[1], $pares, PREG_SET_ORDER);

            return collect($pares)->mapWithKeys(fn ($p) => [$p[1] => $p[2]])->all();
        });
    }

    public static function cor(string $token, string $padrao = '#000000'): string
    {
        return self::tokens()[$token] ?? $padrao;
    }
}
