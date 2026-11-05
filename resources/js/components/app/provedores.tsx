import { usePage } from "@inertiajs/react";
import { Direction, Tooltip } from "radix-ui";
import { useEffect, type ReactNode } from "react";
import { Avisos, avisar } from "@/components/ui/avisos";
import { useLocale, useT } from "@/lib/i18n";

/** Idiomas escritos da direita para a esquerda. */
const RTL = ["ar", "he", "fa", "ur"];

/**
 * Base de todos os primitivos Radix: direção do texto (teclado e posicionamento
 * dos menus seguem o idioma), atraso comum das dicas e avisos flutuantes com
 * as mensagens de sucesso/erro vindas do servidor.
 */
export function Provedores({ children }: { children: ReactNode }) {
    const t = useT();
    const locale = useLocale();
    const { mensagens } = usePage().props;
    const direcao = RTL.includes(locale.split("-")[0]) ? "rtl" : "ltr";

    useEffect(() => {
        document.documentElement.dir = direcao;
        document.documentElement.lang = locale;
    }, [direcao, locale]);

    useEffect(() => {
        if (mensagens?.success) avisar(mensagens.success, "sucesso");
        if (mensagens?.error) avisar(mensagens.error, "erro");
    }, [mensagens]);

    return (
        <Direction.Provider dir={direcao}>
            <Tooltip.Provider delayDuration={400} skipDelayDuration={200}>
                {children}
                <Avisos rotulo={t("Notificações")} rotuloFechar={t("Fechar")} />
            </Tooltip.Provider>
        </Direction.Provider>
    );
}
