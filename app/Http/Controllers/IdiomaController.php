<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Http\Request;

class IdiomaController extends Controller
{
    public function __invoke(Request $request, string $idioma): Response
    {
        abort_unless(array_key_exists($idioma, config('feira.idiomas')), 404);

        $request->session()->put('idioma', $idioma);
        $request->user()?->update(['idioma' => $idioma]);

        // Recarga completa para o dicionário (enviado uma vez por carga) vir no idioma novo.
        return Inertia::location(url()->previous('/'));
    }
}
