<?php

// Cada perfil recebe só as próprias rotas no navegador: a barraquinha
// não fica sabendo nem dos nomes das rotas do admin.
return [
    'skip-route-function' => true,

    'groups' => [
        'publico' => ['login', 'idioma'],
        'admin' => ['admin.*', 'logout', 'idioma', 'senha.*'],
        'barraquinha' => ['barraquinha.*', 'logout', 'idioma', 'senha.*'],
    ],
];
