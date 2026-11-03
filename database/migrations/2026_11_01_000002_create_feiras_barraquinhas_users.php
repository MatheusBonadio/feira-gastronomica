<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feiras', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->date('data_inicio');
            $table->date('data_fim');
            $table->string('status', 20)->default('planejada');
            $table->unsignedSmallInteger('qtd_barraquinhas')->default(0);
            $table->timestamps();
        });

        // Uma linha por vaga: o admin informa a quantidade e preenche cada vaga depois.
        Schema::create('barraquinhas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('feira_id')->constrained('feiras')->cascadeOnDelete();
            $table->unsignedSmallInteger('posicao');
            $table->string('nome')->nullable();
            $table->text('responsaveis')->nullable();
            $table->string('status', 20)->default('ativa');
            $table->decimal('meta_vendas', 12, 2)->nullable();
            $table->timestamps();

            $table->unique(['feira_id', 'posicao']);
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('usuario')->unique();
            $table->string('password');
            $table->string('perfil', 20);
            // Admin não tem barraquinha; login de barraquinha é único por barraquinha.
            $table->foreignId('barraquinha_id')->nullable()->unique()->constrained('barraquinhas')->cascadeOnDelete();
            $table->boolean('ativo')->default(true);
            $table->boolean('trocar_senha')->default(false);
            $table->string('idioma', 10)->nullable();
            $table->timestamp('ultimo_acesso_em')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('barraquinhas');
        Schema::dropIfExists('feiras');
    }
};
