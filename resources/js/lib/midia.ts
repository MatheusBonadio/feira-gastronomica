import { useSyncExternalStore } from "react";

/** Acompanha uma media query (ex.: "(min-width: 48rem)" = md do Tailwind). */
export function useMidia(consulta: string): boolean {
    return useSyncExternalStore(
        (avisar) => {
            const lista = window.matchMedia(consulta);
            lista.addEventListener("change", avisar);
            return () => lista.removeEventListener("change", avisar);
        },
        () => window.matchMedia(consulta).matches,
        () => false,
    );
}

/** A partir do md (768px) os filtros e tabelas mostram a versão completa. */
export const MD = "(min-width: 48rem)";
