import type { Opcao } from "@/types/inertia";

/** Espelha App\Http\Apresentacao::indicadores. */
export interface Indicadores {
    vendas: number;
    qtdVendas: number;
    porCanal: { canal: Opcao; total: number }[];
    outrasEntradas: number;
    custos: number;
    despesas: number;
    investimento: number;
    saidas: number;
    resultado: number;
    saldo: number;
    margem: number | null;
    meta: number | null;
    progressoMeta: number | null;
}

export interface Barraquinha {
    id: number;
    posicao: number;
    nome: string;
    vaga: boolean;
    responsaveis: string | null;
    status: Opcao;
    meta: number | null;
}

export interface Item {
    id: number;
    nome: string;
    descricao: string | null;
    categoriaId: number;
    categoria: string | null;
    custo: number | null;
    estoqueInicial: number | null;
    estoqueRestante: number | null;
    vendidos: number | null;
    ativo: boolean;
    precos: Record<string, number | null>;
    precoFeira: number;
}

export interface Combo {
    id: number;
    numero: number;
    tag: string;
    nome: string;
    tipoDesconto: Opcao;
    valor: number;
    ativo: boolean;
    incompleto: boolean;
    somaAvulsa: number;
    preco: number;
    vendas: number;
    itens: { id: number; nome: string; quantidade: number; ativo: boolean }[];
}

export interface Venda {
    id: number;
    barraquinhaId: number;
    numero: number;
    dataHora: string;
    canal: Opcao;
    pagamento: Opcao;
    status: Opcao;
    cancelada: boolean;
    subtotal: number;
    desconto: number;
    total: number;
    resumo: string;
    operador: string | null;
    barraquinha: string | null;
    linhas?: {
        descricao: string;
        tag: string;
        ehCombo: boolean;
        quantidade: number;
        precoUnitario: number;
        desconto: number;
        total: number;
    }[];
    motivoCancelamento?: string | null;
    canceladaPor?: string | null;
    canceladaEm?: string | null;
}

export interface Lancamento {
    id: number;
    tipo: Opcao;
    categoria: Opcao;
    grupo: string;
    descricao: string;
    valor: number;
    data: string;
    temComprovante: boolean;
    autor: string | null;
}
