import { IconRefresh } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { Dica } from "@/components/ui/dica";
import { TRACO } from "@/components/ui/icone";
import type { EstadoTempoReal } from "@/hooks/useTempoReal";
import { cx } from "@/lib/cx";
import { useLocale, useT } from "@/lib/i18n";

function useTempoDesde(instante: number) {
    const locale = useLocale();
    const formatador = useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" }), [locale]);
    const [agora, setAgora] = useState(() => Date.now());

    useEffect(() => {
        const id = window.setInterval(() => setAgora(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, []);

    const segundos = Math.max(0, Math.round((agora - instante) / 1000));
    if (segundos < 5) return formatador.format(0, "second");
    if (segundos < 60) return formatador.format(-segundos, "second");
    return formatador.format(-Math.floor(segundos / 60), "minute");
}

export function AoVivo({ estado, sincronizadoEm, aoTentar }: { estado: EstadoTempoReal; sincronizadoEm: number; aoTentar: () => void }) {
    const t = useT();
    const desde = useTempoDesde(sincronizadoEm);

    const rotulo = {
        "ao-vivo": t("Ao vivo"),
        atualizando: t("Atualizando…"),
        pausado: t("Pausado"),
        offline: t("Sem conexão"),
    }[estado];

    const corPonto = {
        "ao-vivo": "bg-positivo",
        atualizando: "bg-secundaria",
        pausado: "bg-tinta-fraca",
        offline: "bg-negativo",
    }[estado];

    return (
        <div className="inline-flex h-10 items-center gap-2 rounded-full md:h-9 border border-linha bg-superficie ps-3 pe-1 text-corpo">
            <span className="relative flex size-2.5" aria-hidden>
                {(estado === "ao-vivo" || estado === "atualizando") && (
                    <span className={cx("absolute inline-flex size-full animate-ping rounded-full opacity-60", corPonto)} />
                )}
                <span className={cx("relative inline-flex size-2.5 rounded-full", corPonto)} />
            </span>
            <span role="status" aria-live="polite" className="font-medium text-tinta">{rotulo}</span>
            <span className="hidden text-tinta-suave sm:inline">· {desde}</span>
            <Dica rotulo={t("Atualizar agora")}>
            <button
                type="button"
                onClick={aoTentar}
                aria-label={t("Atualizar agora")}
                className="ms-0.5 flex size-8 items-center md:size-7 justify-center rounded-full text-tinta-suave outline-none transition-colors hover:bg-superficie-hover hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco"
            >
                <IconRefresh size={15} stroke={TRACO} className={cx(estado === "atualizando" && "animate-spin")} aria-hidden />
            </button>
            </Dica>
        </div>
    );
}
