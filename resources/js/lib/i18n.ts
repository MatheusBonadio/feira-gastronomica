import { usePage } from "@inertiajs/react";
import { useCallback } from "react";

export type Parametros = Record<string, string | number>;
export type Tradutor = (texto: string, parametros?: Parametros) => string;

/**
 * Mesmo esquema do Laravel (__): a chave é a própria frase em português,
 * com :parametros. Sem tradução, a frase original aparece.
 * O dicionário vem do servidor uma vez por carga (lang/{idioma}.json).
 */
export function traduzir(dicionario: Record<string, string>, texto: string, parametros?: Parametros): string {
    let resultado = dicionario[texto] ?? texto;
    if (parametros) {
        // Chaves maiores primeiro, para ":total" não ser cortado por ":t".
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

/** "pt_BR" (Laravel) vira "pt-BR" (BCP 47, usado por Intl e React Aria). */
export function useLocale(): string {
    return usePage().props.app.idioma.replace("_", "-");
}
