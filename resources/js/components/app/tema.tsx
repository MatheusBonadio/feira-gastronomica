import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Dica } from "@/components/ui/dica";
import { classesBotao } from "@/components/ui/botao";
import { TRACO, type Icone } from "@/components/ui/icone";
import { useT } from "@/lib/i18n";

export type PreferenciaTema = "claro" | "escuro" | "sistema";
export const CHAVE_TEMA = "tema";

function lerPreferencia(): PreferenciaTema {
    try {
        const valor = localStorage.getItem(CHAVE_TEMA);
        return valor === "claro" || valor === "escuro" ? valor : "sistema";
    } catch {
        return "sistema";
    }
}

const midia = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
let preferencia: PreferenciaTema = typeof window !== "undefined" ? lerPreferencia() : "sistema";
const ouvintes = new Set<() => void>();

function trocarClasse(escuro: boolean) {
    document.documentElement.classList.toggle("dark", escuro);
    flushSync(() => ouvintes.forEach((o) => o()));
}

function aplicar() {
    const escuro = preferencia === "escuro" || (preferencia === "sistema" && !!midia?.matches);
    const raiz = document.documentElement;

    if (raiz.classList.contains("dark") === escuro) {
        ouvintes.forEach((o) => o());
        return;
    }

    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduzir || document.visibilityState === "hidden") {
        raiz.classList.add("trocando-tema");
        trocarClasse(escuro);
        void raiz.offsetWidth;
        raiz.classList.remove("trocando-tema");
        return;
    }

    raiz.classList.add("transicao-tema", "trocando-tema");
    const fim = () => raiz.classList.remove("transicao-tema", "trocando-tema");
    document.startViewTransition(() => trocarClasse(escuro)).finished.then(fim, fim);
}

midia?.addEventListener("change", () => preferencia === "sistema" && aplicar());

export function definirTema(nova: PreferenciaTema) {
    preferencia = nova;
    try {
        localStorage.setItem(CHAVE_TEMA, nova);
    } catch {
    }
    aplicar();
}

export function useTema() {
    const estado = useSyncExternalStore(
        (ouvinte) => {
            ouvintes.add(ouvinte);
            return () => ouvintes.delete(ouvinte);
        },
        () => `${preferencia}|${document.documentElement.classList.contains("dark")}`,
        () => "sistema|false",
    );
    const [pref, escuro] = estado.split("|");
    return { preferencia: pref as PreferenciaTema, escuro: escuro === "true", definir: definirTema };
}

export function useOpcoesTema(): { valor: PreferenciaTema; rotulo: string; icone: Icone }[] {
    const t = useT();
    return [
        { valor: "claro", rotulo: t("Claro"), icone: IconSun },
        { valor: "escuro", rotulo: t("Escuro"), icone: IconMoon },
        { valor: "sistema", rotulo: t("Do sistema"), icone: IconDeviceDesktop },
    ];
}

export function BotaoTema() {
    const t = useT();
    const { escuro, definir } = useTema();
    const rotulo = escuro ? t("Usar tema claro") : t("Usar tema escuro");
    const I = escuro ? IconSun : IconMoon;

    return (
        <Dica rotulo={rotulo}>
            <button type="button" onClick={() => definir(escuro ? "claro" : "escuro")} aria-label={rotulo} className={classesBotao("fantasma", "md", true)}>
                <I size={18} stroke={TRACO} aria-hidden />
            </button>
        </Dica>
    );
}
