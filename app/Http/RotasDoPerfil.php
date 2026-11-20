<?php

namespace App\Http;

use App\Http\Controllers\PerfilController;
use Illuminate\Support\Facades\Route;

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
