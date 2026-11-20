<?php

return [

    'login' => [
        'max_tentativas' => (int) env('FEIRA_LOGIN_MAX_TENTATIVAS', 5),
        'bloqueio_minutos' => (int) env('FEIRA_LOGIN_BLOQUEIO_MINUTOS', 15),
    ],

    'idiomas' => [
        'pt_BR' => 'Português (Brasil)',
        'en' => 'English',
    ],

    'por_pagina' => (int) env('FEIRA_POR_PAGINA', 20),

];
