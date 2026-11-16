<?php

// Formatação usada nas exportações e no PDF (App\Support\Formato). Na tela, o React usa Intl.
return [
    'decimal' => ',',
    'milhar' => '.',
    'moeda' => 'R$ :valor',
    'data' => 'd/m/Y',
    'data_hora' => 'd/m/Y H:i',
    // ";" para o Excel em português abrir o CSV em colunas.
    'csv_separador' => ';',
];
