import { IconMoon, IconSun } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { classesBotao } from "@/components/ui/botao";
import { Dica } from "@/components/ui/dica";
import { TRACO } from "@/components/ui/icone";
import { useT } from "@/lib/i18n";

export const CHAVE_TEMA = "tema";

/** Alterna claro/escuro trocando a classe .dark do <html>; a escolha fica no navegador. */
export function BotaoTema() {
    const t = useT();
    const [escuro, setEscuro] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"));

    useEffect(() => {
        document.documentElement.classList.toggle("dark", escuro);
        try {
            localStorage.setItem(CHAVE_TEMA, escuro ? "escuro" : "claro");
        } catch {
            // Sem armazenamento (aba anônima): vale só até recarregar.
        }
    }, [escuro]);

    const rotulo = escuro ? t("Usar tema claro") : t("Usar tema escuro");
    const I = escuro ? IconSun : IconMoon;

    return (
        <Dica rotulo={rotulo}>
            <button type="button" onClick={() => setEscuro((e) => !e)} aria-label={rotulo} className={classesBotao("fantasma", "md", true)}>
                <I size={18} stroke={TRACO} aria-hidden />
            </button>
        </Dica>
    );
}
