import "@inertiajs/core";

export interface Opcao {
    valor: string;
    label: string;
}

export interface Paginado<T> {
    dados: T[];
    pagina: number;
    ultimaPagina: number;
    total: number;
    anterior: string | null;
    proxima: string | null;
}

export interface LojaAtual {
    id: number;
    nome: string;
    feira: string;
    encerrada: boolean;
    bloqueada: boolean;
    prefixo: string;
    parametros: Record<string, number>;
    podeVender: boolean;
}

export interface Credenciais {
    usuario: string;
    senha: string;
}

declare module "@inertiajs/core" {
    export interface InertiaConfig {
        sharedPageProps: {
            app: { nome: string; idioma: string; idiomas: Record<string, string> };
            auth: {
                usuario: { id: number; nome: string; usuario: string; perfil: "admin" | "barraquinha"; perfilLabel: string; foto: string | null };
                barraquinha: { id: number; nome: string; foto: string | null; feira: string; feiraEncerrada: boolean } | null;
            } | null;
            seletorFeira: {
                atual: { id: number; nome: string } | null;
                barraquinhas: { id: number; nome: string; bloqueada: boolean; foto: string | null }[];
                lista: { id: number; nome: string; status: string }[];
            } | null;
            loja: LojaAtual | null;
            rotas: { url: string; port: number | null; defaults: Record<string, unknown>; routes: Record<string, unknown> } | null;
            mensagens: { success: string | null; error: string | null };
            traducoes: Record<string, string>;
            errors: Record<string, string>;
        };
        flashDataType: { credenciais?: Credenciais };
    }
}
