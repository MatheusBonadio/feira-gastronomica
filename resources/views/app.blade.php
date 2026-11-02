<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" href="/favicon.ico">
    {{-- Aplica o tema salvo (BotaoTema) antes da pintura, para não piscar. --}}
    <script>
        try {
            document.documentElement.classList.toggle('dark', localStorage.getItem('tema') === 'escuro');
        } catch (_) {}
    </script>
    {{-- Só as rotas do perfil logado chegam ao navegador (config/ziggy.php). --}}
    @routes(auth()->check() ? auth()->user()->perfil->value : 'publico')
    @vite(['resources/js/styles/app.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
