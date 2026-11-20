<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('foto_path')->nullable()->after('idioma');
        });

        Schema::table('barraquinhas', function (Blueprint $table) {
            $table->string('foto_path')->nullable()->after('meta_vendas');
            $table->text('checkout')->nullable()->after('foto_path');
        });
    }

    public function down(): void
    {
        Schema::table('barraquinhas', function (Blueprint $table) {
            $table->dropColumn(['foto_path', 'checkout']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('foto_path');
        });
    }
};
