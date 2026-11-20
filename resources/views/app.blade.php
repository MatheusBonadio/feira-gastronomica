<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @php
        $nome = config('app.name');
        $descricao = __('Vendas, caixa e resultados de todas as barraquinhas em um só lugar.');
        $previa = asset('brand/previa.png');
    @endphp
    <title inertia>{{ $nome }}</title>
    <meta name="description" content="{{ $descricao }}">
    <meta name="application-name" content="{{ $nome }}">
    <meta name="apple-mobile-web-app-title" content="{{ __('Feira UNAERP') }}">
    <meta name="author" content="UNAERP · {{ __('Projeto PEG') }}">
    <meta name="theme-color" content="#f2f2f3" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="{{ $nome }}">
    <meta property="og:title" content="{{ $nome }}">
    <meta property="og:description" content="{{ $descricao }}">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:locale" content="{{ app()->getLocale() === 'en' ? 'en_US' : 'pt_BR' }}">
    <meta property="og:image" content="{{ $previa }}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="{{ $nome }}: {{ $descricao }}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $nome }}">
    <meta name="twitter:description" content="{{ $descricao }}">
    <meta name="twitter:image" content="{{ $previa }}">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png">
    <script>
        (function () {
            var preferencia = 'sistema';
            try { preferencia = localStorage.getItem('tema') || 'sistema'; } catch (_) {}
            var escuro = preferencia === 'escuro' || (preferencia === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('dark', escuro);
        })();
    </script>
    <meta name="color-scheme" content="light dark">
    @routes(auth()->check() ? auth()->user()->perfil->value : 'publico')
    @vite(['resources/js/styles/app.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
