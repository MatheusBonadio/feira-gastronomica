<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barraquinha_id')->constrained('barraquinhas')->cascadeOnDelete();
            $table->foreignId('feira_id')->constrained('feiras')->cascadeOnDelete();
            $table->foreignId('operador_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('numero');
            $table->timestamp('data_hora');
            $table->string('canal', 20);
            $table->string('pagamento', 20);
            $table->decimal('subtotal', 12, 2);
            $table->decimal('desconto', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->string('status', 20)->default('concluida');
            $table->text('motivo_cancelamento')->nullable();
            $table->foreignId('cancelada_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('cancelada_em')->nullable();
            $table->timestamps();

            $table->unique(['barraquinha_id', 'numero']);
            $table->index(['barraquinha_id', 'status', 'data_hora']);
            $table->index(['feira_id', 'status']);
        });

        // Preço, desconto e tag da época da venda (histórico preservado).
        Schema::create('venda_linhas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barraquinha_id')->constrained('barraquinhas')->cascadeOnDelete();
            $table->foreignId('venda_id')->constrained('vendas')->cascadeOnDelete();
            $table->foreignId('item_id')->nullable()->constrained('itens')->restrictOnDelete();
            $table->foreignId('combo_id')->nullable()->constrained('combos')->restrictOnDelete();
            $table->string('descricao');
            $table->string('tag', 10);
            $table->unsignedSmallInteger('combo_numero')->nullable();
            $table->unsignedInteger('quantidade');
            $table->decimal('preco_unitario', 12, 2);
            $table->decimal('desconto', 12, 2)->default(0);
            $table->decimal('total', 12, 2);

            $table->index(['venda_id']);
        });

        // Baixa por item (inclusive os que saíram dentro de combos): ranking, estoque e margem.
        Schema::create('venda_itens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barraquinha_id')->constrained('barraquinhas')->cascadeOnDelete();
            $table->foreignId('venda_id')->constrained('vendas')->cascadeOnDelete();
            $table->foreignId('venda_linha_id')->constrained('venda_linhas')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('itens')->restrictOnDelete();
            $table->string('item_nome');
            $table->unsignedInteger('quantidade');
            $table->decimal('custo_unitario', 12, 2)->nullable();

            $table->index(['barraquinha_id', 'item_id']);
        });

        Schema::create('lancamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barraquinha_id')->constrained('barraquinhas')->cascadeOnDelete();
            $table->string('tipo', 10);
            $table->string('categoria', 30);
            $table->string('descricao');
            $table->decimal('valor', 12, 2);
            $table->date('data');
            $table->string('comprovante_path')->nullable();
            $table->foreignId('criado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['barraquinha_id', 'data']);
        });

        Schema::create('auditoria_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('barraquinha_id')->nullable()->constrained('barraquinhas')->nullOnDelete();
            $table->string('acao', 40);
            $table->string('entidade', 60)->nullable();
            $table->unsignedBigInteger('entidade_id')->nullable();
            $table->json('detalhe')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['acao', 'created_at']);
            $table->index(['barraquinha_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auditoria_logs');
        Schema::dropIfExists('lancamentos');
        Schema::dropIfExists('venda_itens');
        Schema::dropIfExists('venda_linhas');
        Schema::dropIfExists('vendas');
    }
};
