import { Head } from "@inertiajs/react";
import { IconArrowDownRight, IconArrowUpRight, IconMinus } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { TRACO, type Icone } from "@/components/ui/icone";
import { cx } from "@/lib/cx";

export function Cartao({ titulo, icone: I, descricao, acoes, children, className, corpo, id }: {
    titulo?: ReactNode;
    icone?: Icone;
    descricao?: ReactNode;
    acoes?: ReactNode;
    children: ReactNode;
    className?: string;
    corpo?: string;
    id?: string;
}) {
    const temCabecalho = Boolean(titulo || acoes);
    return (
        <section id={id} className={cx("flex min-w-0 flex-col rounded-cartao border border-cartao-borda bg-superficie", className)}>
            {temCabecalho && (
                <header className="flex min-h-14 items-start justify-between gap-3 px-5 pt-4 pb-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                        {I && <I size={18} stroke={TRACO} className="shrink-0 text-tinta-suave" aria-hidden />}
                        <div className="min-w-0">
                            {titulo && <h2 className="truncate text-titulo font-semibold text-tinta">{titulo}</h2>}
                            {descricao && <p className="text-pretty text-rotulo text-tinta-suave">{descricao}</p>}
                        </div>
                    </div>
                    {acoes && <div className="flex shrink-0 items-center gap-1.5">{acoes}</div>}
                </header>
            )}
            <div className={cx("min-w-0 flex-1", corpo ?? (temCabecalho ? "px-5 pb-5" : "p-5"))}>{children}</div>
        </section>
    );
}

export function CabecalhoPagina({ titulo, sobretitulo, descricao, acoes, voltar, children, tituloAba }: {
    titulo: ReactNode;
    sobretitulo?: ReactNode;
    descricao?: ReactNode;
    acoes?: ReactNode;
    voltar?: ReactNode;
    children?: ReactNode;
    tituloAba?: string;
}) {
    return (
        <>
            <Head title={tituloAba ?? (typeof titulo === "string" ? titulo : undefined)} />
            <div className="mb-5 flex flex-col gap-4">
                {voltar}
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="min-w-0">
                        {sobretitulo && <p className="mb-0.5 text-corpo text-tinta-suave">{sobretitulo}</p>}
                        <h1 className="text-cabecalho font-semibold text-balance text-tinta">{titulo}</h1>
                        {descricao && <p className="mt-1 max-w-3xl text-corpo text-tinta-suave">{descricao}</p>}
                    </div>
                    {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
                </div>
                {children}
            </div>
        </>
    );
}

export function PilulaStats({ itens }: { itens: { icone: Icone; valor: ReactNode; rotulo: ReactNode }[] }) {
    return (
        <div className="inline-flex max-w-full flex-wrap items-center gap-y-1 self-start rounded-2xl border border-cartao-borda bg-superficie px-1.5 py-1.5">
            {itens.map(({ icone: I, valor, rotulo }, i) => (
                <div key={i} className={cx("flex items-center gap-2 px-3 py-0.5", i > 0 && "sm:border-s sm:border-linha")}>
                    <I size={16} stroke={TRACO} className="text-tinta-suave" aria-hidden />
                    <span className="text-ui font-semibold tabular-nums text-tinta">{valor}</span>
                    <span className="text-corpo text-tinta-suave">{rotulo}</span>
                </div>
            ))}
        </div>
    );
}

export function Variacao({ fracao, rotulo, bomQuandoSobe = true, formatar }: {
    fracao: number | null;
    rotulo: ReactNode;
    bomQuandoSobe?: boolean;
    formatar: (fracao: number) => string;
}) {
    if (fracao === null || !Number.isFinite(fracao)) return null;
    const I = fracao > 0.0005 ? IconArrowUpRight : fracao < -0.0005 ? IconArrowDownRight : IconMinus;
    const bom = fracao === 0 ? null : (fracao > 0) === bomQuandoSobe;
    return (
        <p className="flex flex-wrap items-center gap-1 text-rotulo text-tinta-suave">
            <span className={cx("inline-flex items-center gap-0.5 font-semibold tabular-nums", bom === true && "text-positivo", bom === false && "text-negativo")}>
                <I size={14} stroke={2} aria-hidden />
                {formatar(Math.abs(fracao))}
            </span>
            <span>{rotulo}</span>
        </p>
    );
}

export function Estatistica({ rotulo, valor, tom = "neutro", rodape, className }: {
    rotulo: ReactNode;
    valor: ReactNode;
    tom?: "neutro" | "positivo" | "negativo";
    rodape?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cx("flex min-w-0 flex-col gap-1", className)}>
            <span className="text-corpo text-tinta-suave">{rotulo}</span>
            <span className={cx("truncate text-numero font-semibold tabular-nums", tom === "positivo" ? "text-positivo" : tom === "negativo" ? "text-negativo" : "text-tinta")}>{valor}</span>
            {typeof rodape === "string" ? <span className="text-rotulo text-tinta-suave">{rodape}</span> : rodape}
        </div>
    );
}

export function Kpi({ rotulo, valor, icone: I, detalhe, tom = "neutro", grafico, destaque, className }: {
    rotulo: string;
    valor: ReactNode;
    icone?: Icone;
    detalhe?: ReactNode;
    tom?: "neutro" | "positivo" | "negativo";
    grafico?: ReactNode;
    destaque?: boolean;
    className?: string;
}) {
    return (
        <div className={cx("relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-cartao border p-5", destaque ? "border-primaria bg-primaria text-primaria-tinta" : "border-cartao-borda bg-superficie", className)}>
            <div className="flex items-center justify-between gap-2">
                <span className={cx("text-corpo", destaque ? "text-primaria-tinta/80" : "text-tinta-suave")}>{rotulo}</span>
                {I && (
                    <span className={cx("flex size-8 items-center justify-center rounded-lg", destaque ? "bg-secundaria text-secundaria-tinta" : "bg-superficie-suave text-tinta-media")}>
                        <I size={16} stroke={TRACO} aria-hidden />
                    </span>
                )}
            </div>
            <span className={cx("text-numero font-semibold tabular-nums", tom === "positivo" && "text-positivo", tom === "negativo" && "text-negativo", tom === "neutro" && !destaque && "text-tinta")}>
                {valor}
            </span>
            {grafico}
            {detalhe && <span className={cx("text-rotulo", destaque ? "text-primaria-tinta/75" : "text-tinta-suave")}>{detalhe}</span>}
        </div>
    );
}

export function Detalhe({ rotulo, children }: { rotulo: string; children: ReactNode }) {
    return (
        <div className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-corpo text-tinta-suave">{rotulo}</dt>
            <dd className="text-end text-corpo font-semibold text-tinta">{children}</dd>
        </div>
    );
}

export function Vazio({ titulo, descricao, acao, icone: I }: { titulo: string; descricao?: string; acao?: ReactNode; icone?: Icone }) {
    return (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            {I && (
                <span className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-superficie-suave">
                    <I size={22} stroke={TRACO} className="text-tinta-suave" aria-hidden />
                </span>
            )}
            <p className="text-ui font-semibold text-tinta">{titulo}</p>
            {descricao && <p className="max-w-sm text-corpo text-tinta-suave">{descricao}</p>}
            {acao && <div className="mt-3">{acao}</div>}
        </div>
    );
}

export function Faixa({ tom = "aviso", icone: I, children, titulo }: { tom?: "aviso" | "perigo" | "info" | "destaque"; icone?: Icone; titulo?: ReactNode; children?: ReactNode }) {
    const tons = {
        aviso: "bg-ambar-suave text-ambar-tinta",
        perigo: "bg-vermelho-suave text-vermelho-tinta",
        info: "bg-primaria-suave text-primaria-texto",
        destaque: "bg-secundaria-suave text-secundaria-texto",
    };
    return (
        <div role="status" className={cx("flex items-start gap-3 rounded-2xl px-4 py-3", tons[tom])}>
            {I && <I size={18} stroke={TRACO} className="mt-0.5 shrink-0" aria-hidden />}
            <div className="min-w-0 text-corpo">
                {titulo && <p className="font-semibold">{titulo}</p>}
                {children}
            </div>
        </div>
    );
}
