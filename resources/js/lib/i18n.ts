import { usePage } from "@inertiajs/react";
import { useCallback } from "react";

export type Parametros = Record<string, string | number>;
export type Tradutor = (texto: string, parametros?: Parametros) => string;

export function traduzir(dicionario: Record<string, string>, texto: string, parametros?: Parametros): string {
    let resultado = dicionario[texto] ?? texto;
    if (parametros) {
        for (const chave of Object.keys(parametros).sort((a, b) => b.length - a.length)) {
            resultado = resultado.replaceAll(`:${chave}`, String(parametros[chave]));
        }
    }
    return resultado;
}

export function useT(): Tradutor {
    const { traducoes } = usePage().props;
    return useCallback((texto: string, parametros?: Parametros) => traduzir(traducoes ?? {}, texto, parametros), [traducoes]);
}

export function useLocale(): string {
    return usePage().props.app.idioma.replace("_", "-");
}
