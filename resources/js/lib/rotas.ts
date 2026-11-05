import { usePage } from "@inertiajs/react";
import { useCallback } from "react";
import { route } from "ziggy-js";

type Parametros = Record<string, string | number | boolean | null | undefined | (string | number)[]>;

/** URL de uma rota nomeada do Laravel. Só as rotas do perfil logado existem no navegador. */
export function rota(nome: string, parametros: Parametros = {}): string {
    return route(nome, parametros as never);
}

export function rotaAtiva(padrao: string): boolean {
    return route().current(padrao);
}

/**
 * Rotas das telas compartilhadas (itens, combos, vendas...). Para a
 * barraquinha vira "barraquinha.itens.index"; para o admin,
 * "admin.loja.itens.index" com a barraquinha em foco.
 */
export function useRotaLoja() {
    const { loja } = usePage().props;

    return useCallback(
        (nome: string, parametros: Parametros = {}) => {
            if (!loja) throw new Error(`Rota de loja "${nome}" fora do contexto de uma barraquinha.`);
            return rota(loja.prefixo + nome, { ...loja.parametros, ...parametros });
        },
        [loja],
    );
}

/** Query string para filtros: descarta vazios. */
export function semVazios<T extends Record<string, unknown>>(dados: T): Partial<T> {
    return Object.fromEntries(Object.entries(dados).filter(([, v]) => v !== "" && v !== null && v !== undefined)) as Partial<T>;
}
