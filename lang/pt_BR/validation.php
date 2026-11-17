<?php

// Mensagens das regras usadas no projeto. Em inglês vale o padrão do Laravel.
return [
    'accepted' => 'O campo :attribute precisa ser aceito.',
    'after_or_equal' => 'A :attribute deve ser igual ou posterior a :date.',
    'array' => 'O campo :attribute é inválido.',
    'boolean' => 'O campo :attribute deve ser verdadeiro ou falso.',
    'confirmed' => 'A confirmação de :attribute não confere.',
    'current_password' => 'A senha está incorreta.',
    'date' => 'O campo :attribute não é uma data válida.',
    'different' => 'O campo :attribute deve ser diferente de :other.',
    'email' => 'O campo :attribute deve ser um e-mail válido.',
    'enum' => 'O valor de :attribute é inválido.',
    'exists' => 'O valor de :attribute não existe.',
    'file' => 'O campo :attribute deve ser um arquivo.',
    'gt' => [
        'numeric' => 'O campo :attribute deve ser maior que :value.',
    ],
    'in' => 'O valor de :attribute é inválido.',
    'integer' => 'O campo :attribute deve ser um número inteiro.',
    'max' => [
        'array' => 'O campo :attribute não pode ter mais de :max itens.',
        'file' => 'O arquivo :attribute não pode passar de :max kilobytes.',
        'numeric' => 'O campo :attribute não pode ser maior que :max.',
        'string' => 'O campo :attribute não pode ter mais de :max caracteres.',
    ],
    'mimes' => 'O arquivo :attribute deve ser do tipo: :values.',
    'min' => [
        'array' => 'O campo :attribute deve ter pelo menos :min itens.',
        'file' => 'O arquivo :attribute deve ter pelo menos :min kilobytes.',
        'numeric' => 'O campo :attribute deve ser pelo menos :min.',
        'string' => 'O campo :attribute deve ter pelo menos :min caracteres.',
    ],
    'numeric' => 'O campo :attribute deve ser um número.',
    'password' => [
        'letters' => 'A :attribute deve ter pelo menos uma letra.',
        'mixed' => 'A :attribute deve ter letras maiúsculas e minúsculas.',
        'numbers' => 'A :attribute deve ter pelo menos um número.',
        'symbols' => 'A :attribute deve ter pelo menos um símbolo.',
        'uncompromised' => 'Esta :attribute apareceu em um vazamento de dados. Escolha outra.',
    ],
    'regex' => 'O formato de :attribute é inválido.',
    'required' => 'O campo :attribute é obrigatório.',
    'string' => 'O campo :attribute deve ser um texto.',
    'unique' => 'Este :attribute já está em uso.',

    'attributes' => [],
];
