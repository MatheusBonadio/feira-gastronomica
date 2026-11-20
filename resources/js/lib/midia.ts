import { useSyncExternalStore } from "react";

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

export const MD = "(min-width: 48rem)";
