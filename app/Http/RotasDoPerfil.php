<?php

namespace App\Http;

use App\Http\Controllers\PerfilController;
use Illuminate\Support\Facades\Route;

/**
 * Perfil do usuário logado, registrado dentro da área de cada perfil
 * (admin.perfil, barraquinha.perfil): a tela tem o menu da área e cada perfil
 * recebe só as próprias rotas no navegador (config/ziggy.php).
 */
class RotasDoPerfil
{
    public static function registrar(): void
    {
        Route::get('perfil', [PerfilController::class, 'edit'])->name('perfil');
        Route::put('perfil', [PerfilController::class, 'update'])->name('perfil.update');
        Route::post('perfil/foto', [PerfilController::class, 'foto'])->name('perfil.foto');
        Route::delete('perfil/foto', [PerfilController::class, 'removerFoto'])->name('perfil.foto.remover');
    }
}
