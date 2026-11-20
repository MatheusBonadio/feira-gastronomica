<?php

namespace App\Http\Middleware;

use App\Models\Barraquinha;
use App\Support\Loja;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LojaCoerente
{
    public function __construct(private readonly Loja $loja) {}

    public function handle(Request $request, Closure $next): Response
    {
        $barraquinha = $request->route('barraquinha');
        abort_unless($barraquinha instanceof Barraquinha, 404);

        foreach ($request->route()->parameters() as $parametro) {
            if ($parametro instanceof Model && isset($parametro->barraquinha_id)
                && (int) $parametro->barraquinha_id !== (int) $barraquinha->id) {
                abort(404);
            }
        }

        $this->loja->focar($barraquinha);
        $request->route()->forgetParameter('barraquinha');

        return $next($request);
    }
}
