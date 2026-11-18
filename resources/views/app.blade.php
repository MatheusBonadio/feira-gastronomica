<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" href="/favicon.ico">
    {{-- Aplica o tema (claro, escuro ou o do sistema) antes da pintura, para não piscar. --}}
    <script>
        (function () {
            var preferencia = 'sistema';
            try { preferencia = localStorage.getItem('tema') || 'sistema'; } catch (_) {}
            var escuro = preferencia === 'escuro' || (preferencia === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('dark', escuro);
        })();
    </script>
    <meta name="color-scheme" content="light dark">
    {{-- Só as rotas do perfil logado chegam ao navegador (config/ziggy.php). --}}
    @routes(auth()->check() ? auth()->user()->perfil->value : 'publico')
    @vite(['resources/js/styles/app.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
