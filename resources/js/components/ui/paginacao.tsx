import { router } from "@inertiajs/react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Botao } from "@/components/ui/botao";
import { cx } from "@/lib/cx";
import { useT } from "@/lib/i18n";
import type { Paginado } from "@/types/inertia";

/** Páginas próximas da atual, com reticências nas pontas. */
function janela(atual: number, ultima: number): (number | "…")[] {
    const paginas = new Set([1, ultima, atual - 1, atual, atual + 1].filter((p) => p >= 1 && p <= ultima));
    const ordenadas = [...paginas].sort((a, b) => a - b);
    return ordenadas.flatMap((p, i) => (i > 0 && p - ordenadas[i - 1] > 1 ? (["…", p] as const) : [p]));
}

export function Paginacao<T>({ paginado }: { paginado: Paginado<T> }) {
    const t = useT();
    if (paginado.ultimaPagina <= 1) return null;

    const ir = (pagina: number) => {
        const url = new URL(window.location.href);
        url.searchParams.set("page", String(pagina));
        router.get(url.pathname + url.search, {}, { preserveScroll: true, preserveState: true });
    };

    return (
        <nav aria-label={t("Paginação")} className="flex flex-col items-center justify-between gap-3 border-t border-linha px-4 py-3 sm:flex-row">
            <span className="text-rotulo text-tinta-suave">{t(":total registros", { total: paginado.total })}</span>
            <div className="flex items-center gap-1">
                <Botao variante="fantasma" tamanho="sm" icone={IconChevronLeft} disabled={!paginado.anterior} onClick={() => ir(paginado.pagina - 1)}>
                    <span className="max-sm:sr-only">{t("Anterior")}</span>
                </Botao>
                {/* No celular só "3 / 10"; os números aparecem a partir de sm. */}
                <span className="px-2 text-corpo tabular-nums text-tinta-media sm:hidden">{paginado.pagina} / {paginado.ultimaPagina}</span>
                {janela(paginado.pagina, paginado.ultimaPagina).map((p, i) =>
                    p === "…" ? (
                        <span key={`r${i}`} className="px-1 text-tinta-fraca max-sm:hidden">…</span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            aria-current={p === paginado.pagina ? "page" : undefined}
                            onClick={() => ir(p)}
                            className={cx("size-8 rounded-md text-corpo tabular-nums max-sm:hidden", p === paginado.pagina ? "bg-primaria font-semibold text-primaria-tinta" : "text-tinta-media hover:bg-superficie-hover")}
                        >
                            {p}
                        </button>
                    ),
                )}
                <Botao variante="fantasma" tamanho="sm" iconeFinal={IconChevronRight} disabled={!paginado.proxima} onClick={() => ir(paginado.pagina + 1)}>
                    <span className="max-sm:sr-only">{t("Próxima")}</span>
                </Botao>
            </div>
        </nav>
    );
}
