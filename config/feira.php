<?php

return [

    // Bloqueio temporário de login após N falhas seguidas (usuário + IP).
    'login' => [
        'max_tentativas' => (int) env('FEIRA_LOGIN_MAX_TENTATIVAS', 5),
        'bloqueio_minutos' => (int) env('FEIRA_LOGIN_BLOQUEIO_MINUTOS', 15),
    ],

    // Idiomas oferecidos no seletor. O primeiro é o padrão.
    'idiomas' => [
        'pt_BR' => 'Português (Brasil)',
        'en' => 'English',
    ],

    // Row Level Security no MySQL/MariaDB (views + triggers, ver App\Support\Rls\RlsMysql).
    // Ignorado em outros bancos, como o SQLite dos testes.
    'rls' => (bool) env('FEIRA_RLS', true),

    'por_pagina' => (int) env('FEIRA_POR_PAGINA', 20),

];
