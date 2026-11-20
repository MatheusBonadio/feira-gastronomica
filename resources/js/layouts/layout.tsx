import { usePage } from "@inertiajs/react";
import type { ReactNode } from "react";
import { LogoUnaerpBranca, Marca } from "@/components/app/marca";
import { Provedores } from "@/components/app/provedores";
import { Shell } from "@/components/app/shell";
import { BotaoTema } from "@/components/app/tema";
import { cx } from "@/lib/cx";
import { useT } from "@/lib/i18n";
import { rota } from "@/lib/rotas";

export function Layout({ children }: { children: ReactNode }) {
    const { auth } = usePage().props;

    return <Provedores>{auth ? <Shell>{children}</Shell> : <MolduraPublica>{children}</MolduraPublica>}</Provedores>;
}

function MolduraPublica({ children }: { children: ReactNode }) {
    const { app } = usePage().props;
    const t = useT();
    const blocos = [
        "col-start-4 row-start-1 bg-secundaria",
        "col-start-3 row-start-2 bg-primaria-tinta/20",
        "col-start-4 row-start-2 bg-secundaria/70",
        "col-start-2 row-start-3 bg-secundaria",
        "col-start-3 row-start-3 bg-primaria-tinta/30",
        "col-start-4 row-start-3 bg-secundaria",
        "col-start-1 row-start-4 bg-primaria-tinta/20",
        "col-start-2 row-start-4 bg-secundaria/70",
        "col-start-3 row-start-4 bg-secundaria",
        "col-start-4 row-start-4 bg-primaria-tinta/30",
    ];

    return (
        <div className="flex min-h-dvh bg-fundo p-3 sm:p-4">
            <div className="grid w-full overflow-hidden rounded-3xl border border-cartao-borda bg-superficie [view-transition-name:moldura] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                <div className="flex flex-col px-6 py-7 sm:px-12">
                    <Marca transicao />
                    <div className="flex flex-1 items-center justify-center py-10">
                        <div className="w-full max-w-sm">{children}</div>
                    </div>
                    <div className="flex items-center gap-3 text-rotulo text-tinta-suave">
                        {Object.entries(app.idiomas).map(([codigo, nome]) => (
                            <a key={codigo} href={rota("idioma", { idioma: codigo })} aria-current={app.idioma === codigo ? "true" : undefined} className={cx("rounded-md px-1 py-1 outline-none hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco", app.idioma === codigo && "font-semibold text-tinta")}>
                                {nome}
                            </a>
                        ))}
                        <span className="ms-auto"><BotaoTema /></span>
                    </div>
                </div>
                <div className="relative m-2 hidden overflow-hidden rounded-2xl bg-primaria lg:flex lg:flex-col lg:justify-end lg:p-12">
                    <div className="hachura absolute inset-0 opacity-50" aria-hidden />
                    <LogoUnaerpBranca className="absolute inset-s-12 top-12" />
                    <div className="absolute inset-e-12 top-12 grid grid-cols-4 grid-rows-4 gap-2" aria-hidden>
                        {blocos.map((b) => <span key={b} className={cx("hachura size-12 rounded-xl", b)} />)}
                    </div>
                    <p className="relative max-w-md text-4xl leading-tight font-extrabold tracking-tight text-primaria-tinta">{t("Vendas, caixa e resultados de todas as barraquinhas em um só lugar.")}</p>
                    <p className="relative mt-4 text-ui text-primaria-tinta/75">UNAERP · {t("Projeto PEG")}</p>
                </div>
            </div>
        </div>
    );
}
