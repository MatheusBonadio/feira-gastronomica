<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FotoService
{
    public const DISCO = 'fotos';

    public const REGRAS = ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'];

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

    public static function url(?string $caminho): ?string
    {
        return $caminho ? '/fotos/'.ltrim($caminho, '/') : null;
    }
}
