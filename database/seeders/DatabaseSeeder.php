<?php

namespace Database\Seeders;

use App\Enums\Perfil;
use App\Models\Categoria;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public static function senhaDemo(): string
    {
        return env('FEIRA_SENHA_DEMO', 'feira2027');
    }

    public function run(): void
    {
        foreach (Categoria::PADRAO as $nome) {
            Categoria::firstOrCreate(['nome' => $nome]);
        }

        User::updateOrCreate(['usuario' => 'coordenacao'], [
            'nome' => 'Coordenação da Feira (professor)',
            'password' => self::senhaDemo(),
            'perfil' => Perfil::Admin,
            'ativo' => true,
            'trocar_senha' => false,
        ]);

        $this->call([Feira2026Seeder::class, Feira2027Seeder::class]);

        $this->command?->info('Admin: coordenacao / '.self::senhaDemo());
        $this->command?->info('Barraquinhas 2027: <slug>-2027 / '.self::senhaDemo().' (ex.: senhor-dos-pasteis-2027)');
    }
}
