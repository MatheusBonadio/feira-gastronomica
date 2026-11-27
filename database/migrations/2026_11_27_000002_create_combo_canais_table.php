<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const CANAIS = ['pre_venda', 'feira', 'pos_evento'];

    public function up(): void
    {
        Schema::create('combo_canais', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barraquinha_id')->constrained('barraquinhas')->cascadeOnDelete();
            $table->foreignId('combo_id')->constrained('combos')->cascadeOnDelete();
            $table->string('canal', 20);
            $table->string('tipo_desconto', 20);
            $table->decimal('valor', 12, 2);

            $table->unique(['combo_id', 'canal']);
        });

        // Até aqui o combo tinha uma regra só, valendo em todos os canais: ela é copiada para cada um.
        foreach (DB::table('combos')->get(['id', 'barraquinha_id', 'tipo_desconto', 'valor']) as $combo) {
            DB::table('combo_canais')->insert(array_map(fn (string $canal) => [
                'barraquinha_id' => $combo->barraquinha_id,
                'combo_id' => $combo->id,
                'canal' => $canal,
                'tipo_desconto' => $combo->tipo_desconto,
                'valor' => $combo->valor,
            ], self::CANAIS));
        }

        Schema::table('combos', function (Blueprint $table) {
            $table->dropColumn(['tipo_desconto', 'valor']);
        });
    }

    public function down(): void
    {
        Schema::table('combos', function (Blueprint $table) {
            $table->string('tipo_desconto', 20)->default('preco_fechado')->after('numero');
            $table->decimal('valor', 12, 2)->default(0)->after('tipo_desconto');
        });

        foreach (DB::table('combo_canais')->orderByRaw("canal = 'feira' desc")->get() as $regra) {
            DB::table('combos')->where('id', $regra->combo_id)->where('valor', 0)
                ->update(['tipo_desconto' => $regra->tipo_desconto, 'valor' => $regra->valor]);
        }

        Schema::dropIfExists('combo_canais');
    }
};
