<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feiras', function (Blueprint $table) {
            $table->dateTime('data_corte_pre_venda')->nullable()->after('data_fim');
        });

        // Feiras já cadastradas: a pré-venda vai até o fim da véspera do primeiro dia.
        foreach (DB::table('feiras')->get(['id', 'data_inicio']) as $feira) {
            DB::table('feiras')->where('id', $feira->id)->update([
                'data_corte_pre_venda' => Carbon::parse($feira->data_inicio)->subDay()->setTime(23, 59)->format('Y-m-d H:i:s'),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('feiras', function (Blueprint $table) {
            $table->dropColumn('data_corte_pre_venda');
        });
    }
};
