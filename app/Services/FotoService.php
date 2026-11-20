<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Fotos de perfil e de barraquinha, no disco "fotos" (public/fotos).
 *
 * O navegador já manda a foto recortada e reduzida (resources/js/lib/imagem.ts),
 * então o servidor só valida e guarda: não depende da extensão GD. O nome do
 * arquivo é aleatório e a extensão vem do conteúdo, nunca do nome enviado.
 */
class FotoService
{
    public const DISCO = 'fotos';

    /** Regras de validação do arquivo enviado. */
    public const REGRAS = ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'];

    /** Guarda a foto nova e apaga a anterior. Devolve o caminho no disco. */
    public function substituir(?string $atual, UploadedFile $foto, string $pasta): string
    {
        $caminho = $foto->store($pasta, self::DISCO);
        $this->remover($atual);

        return $caminho;
    }

    public function remover(?string $caminho): void
    {
        if ($caminho) {
            Storage::disk(self::DISCO)->delete($caminho);
        }
    }

    /** Caminho a partir da raiz do site (public/fotos), sem depender do APP_URL. */
    public static function url(?string $caminho): ?string
    {
        return $caminho ? '/fotos/'.ltrim($caminho, '/') : null;
    }
}
