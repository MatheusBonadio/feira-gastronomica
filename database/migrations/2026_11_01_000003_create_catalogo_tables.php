<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categorias', function (Blueprint $table) {
            $table->id();
            $table->string('nome')->unique();
            $table->boolean('ativo')->default(true);
            $table->timestamps();
        });

        Schema::create('itens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barraquinha_id')->constrained('barraquinhas')->cascadeOnDelete();
            $table->foreignId('categoria_id')->constrained('categorias')->restrictOnDelete();
            $table->string('nome');
            $table->text('descricao')->nullable();
            $table->decimal('custo', 12, 2)->nullable();
            $table->unsignedInteger('estoque_inicial')->nullable();
            $table->boolean('ativo')->default(true);
            $table->timestamps();

            $table->unique(['barraquinha_id', 'nome']);
        });

        Schema::create('item_precos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barraquinha_id')->constrained('barraquinhas')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('itens')->cascadeOnDelete();
            $table->string('canal', 20);
            $table->decimal('preco', 12, 2);
            $table->timestamps();

            $table->unique(['item_id', 'canal']);
        });

        Schema::create('combos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barraquinha_id')->constrained('barraquinhas')->cascadeOnDelete();
            $table->string('nome');
            $table->unsignedSmallInteger('numero');
            $table->string('tipo_desconto', 20);
            $table->decimal('valor', 12, 2);
            $table->boolean('ativo')->default(true);
            $table->timestamps();

            $table->unique(['barraquinha_id', 'numero']);
        });

        Schema::create('combo_itens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barraquinha_id')->constrained('barraquinhas')->cascadeOnDelete();
            $table->foreignId('combo_id')->constrained('combos')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('itens')->restrictOnDelete();
            $table->unsignedSmallInteger('quantidade');

            $table->unique(['combo_id', 'item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('combo_itens');
        Schema::dropIfExists('combos');
        Schema::dropIfExists('item_precos');
        Schema::dropIfExists('itens');
        Schema::dropIfExists('categorias');
    }
};
