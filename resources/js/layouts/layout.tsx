import { usePage } from "@inertiajs/react";
import type { ReactNode } from "react";
import { Provedores } from "@/components/app/provedores";
import { Shell } from "@/components/app/shell";
import { BotaoTema } from "@/components/app/tema";
import { cx } from "@/lib/cx";
import { useT } from "@/lib/i18n";
import { rota } from "@/lib/rotas";

/** Layout persistente: com usuário logado, a shell; sem, a moldura pública. */
export function Layout({ children }: { children: ReactNode }) {
    const { auth } = usePage().props;

    return <Provedores>{auth ? <Shell>{children}</Shell> : <MolduraPublica>{children}</MolduraPublica>}</Provedores>;
}

/** Login: formulário à esquerda, painel da marca à direita (só em telas largas). */
function MolduraPublica({ children }: { children: ReactNode }) {
    const { app } = usePage().props;
    const t = useT();

    return (
        <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="flex flex-col px-6 py-8 sm:px-12">
                <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primaria">
                        <span className="size-3 rounded-sm bg-secundaria" />
                    </span>
                    <span className="font-serif text-[1.3rem] font-semibold tracking-tight text-tinta">{t("Feira Gastronômica")}</span>
                </div>
                <div className="flex flex-1 items-center justify-center py-10">
                    <div className="w-full max-w-sm">{children}</div>
                </div>
                <div className="flex items-center gap-3 text-rotulo text-tinta-suave">
                    {Object.entries(app.idiomas).map(([codigo, nome]) => (
                        <a key={codigo} href={rota("idioma", { idioma: codigo })} aria-current={app.idioma === codigo ? "true" : undefined} className={cx("hover:text-tinta", app.idioma === codigo && "font-medium text-tinta")}>
                            {nome}
                        </a>
                    ))}
                    <span className="ml-auto"><BotaoTema /></span>
                </div>
            </div>
            <div className="relative hidden overflow-hidden bg-primaria lg:flex lg:flex-col lg:justify-end lg:p-14">
                <div className="absolute -top-24 -right-24 size-96 rounded-full bg-secundaria/90" aria-hidden />
                <div className="absolute top-40 right-40 size-40 rounded-full border-[28px] border-primaria-tinta/10" aria-hidden />
                <p className="relative font-serif text-5xl leading-tight font-semibold text-primaria-tinta">{t("Vendas, caixa e resultados de todas as barraquinhas em um só lugar.")}</p>
                <p className="relative mt-4 text-ui text-primaria-tinta/75">UNAERP · {t("Projeto PEG")}</p>
            </div>
        </div>
    );
}
