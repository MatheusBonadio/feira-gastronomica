import { usePage } from "@inertiajs/react";
import { useCallback } from "react";
import { route } from "ziggy-js";

type Parametros = Record<string, string | number | boolean | null | undefined | (string | number)[]>;
type ConfigRotas = Parameters<typeof route>[3];

let rotasDoPerfil: ConfigRotas;

export function definirRotas(config: object) {
    rotasDoPerfil = config as ConfigRotas;
}

export function rota(nome: string, parametros: Parametros = {}): string {
    return route(nome, parametros as never, undefined, rotasDoPerfil);
}

export function rotaAtiva(padrao: string): boolean {
    return route(undefined, undefined, undefined, rotasDoPerfil).current(padrao);
}

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

export function semVazios<T extends Record<string, unknown>>(dados: T): Partial<T> {
    return Object.fromEntries(Object.entries(dados).filter(([, v]) => v !== "" && v !== null && v !== undefined)) as Partial<T>;
}
