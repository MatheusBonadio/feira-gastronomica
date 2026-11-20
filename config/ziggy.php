<?php

return [
    'skip-route-function' => true,

    'groups' => [
        'publico' => ['login', 'idioma'],
        'admin' => ['admin.*', 'logout', 'idioma', 'senha.*'],
        'barraquinha' => ['barraquinha.*', 'logout', 'idioma', 'senha.*'],
    ],
];
