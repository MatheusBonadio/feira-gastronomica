import { Head } from "@inertiajs/react";
import type { ReactNode } from "react";
import { TRACO, type Icone } from "@/components/ui/icone";
import { cx } from "@/lib/cx";

/** Cartão branco com borda fina; cabeçalho = ícone + título + ações (como "My Projects"). */
export function Cartao({ titulo, icone: I, descricao, acoes, children, className, corpo = "p-4", id }: {
    titulo?: ReactNode;
    icone?: Icone;
    descricao?: ReactNode;
    acoes?: ReactNode;
    children: ReactNode;
    className?: string;
    /** Classes do corpo; use "" para tabelas e listas que encostam nas bordas. */
    corpo?: string;
    id?: string;
}) {
    return (
        <section id={id} className={cx("flex min-w-0 flex-col rounded-cartao border border-linha bg-superficie", className)}>
            {(titulo || acoes) && (
                <header className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                        {I && <I size={20} stroke={TRACO} className="shrink-0 text-tinta-media" aria-hidden />}
                        <div className="min-w-0">
                            {titulo && <h2 className="truncate text-titulo font-medium text-tinta">{titulo}</h2>}
                            {descricao && <p className="truncate text-rotulo text-tinta-suave">{descricao}</p>}
                        </div>
                    </div>
                    {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
                </header>
            )}
            <div className={cx("min-w-0 flex-1", corpo)}>{children}</div>
        </section>
    );
}

/** Topo da página: data/contexto, título grande e ações à direita (como "Good Evening! John,"). */
export function CabecalhoPagina({ titulo, sobretitulo, descricao, acoes, voltar, children, tituloAba }: {
    titulo: ReactNode;
    sobretitulo?: ReactNode;
    descricao?: ReactNode;
    acoes?: ReactNode;
    voltar?: ReactNode;
    children?: ReactNode;
    /** Texto do <title>; padrão = título, quando for texto. */
    tituloAba?: string;
}) {
    return (
        <>
            <Head title={tituloAba ?? (typeof titulo === "string" ? titulo : undefined)} />
            <div className="mb-6 flex flex-col gap-4">
                {voltar}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        {sobretitulo && <p className="mb-1 text-corpo text-tinta-suave">{sobretitulo}</p>}
                        <h1 className="text-cabecalho font-medium tracking-tight text-tinta sm:text-saudacao">{titulo}</h1>
                        {descricao && <p className="mt-1.5 max-w-3xl text-ui text-tinta-suave">{descricao}</p>}
                    </div>
                    {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
                </div>
                {children}
            </div>
        </>
    );
}

/** Pílula de estatísticas (como "12hrs Time Saved | 24 Projects Completed"). */
export function PilulaStats({ itens }: { itens: { icone: Icone; valor: ReactNode; rotulo: ReactNode }[] }) {
    return (
        <div className="inline-flex max-w-full flex-wrap items-center gap-y-1 self-start rounded-2xl border border-linha bg-superficie-suave px-1.5 py-1.5 sm:rounded-full">
            {itens.map(({ icone: I, valor, rotulo }, i) => (
                <div key={i} className={cx("flex items-center gap-2 px-3", i > 0 && "sm:border-s sm:border-linha-forte")}>
                    <I size={18} stroke={TRACO} className="text-tinta-media" aria-hidden />
                    <span className="text-titulo font-semibold tabular-nums text-tinta">{valor}</span>
                    <span className="text-corpo text-tinta-suave">{rotulo}</span>
                </div>
            ))}
        </div>
    );
}

/** Indicador com rótulo, valor grande e um gráfico pequeno opcional. */
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
        <div className={cx("flex min-w-0 flex-col gap-3 rounded-cartao border p-4", destaque ? "border-primaria bg-primaria text-primaria-tinta" : "border-linha bg-superficie", className)}>
            <div className="flex items-center justify-between gap-2">
                <span className={cx("text-corpo font-medium", destaque ? "text-primaria-tinta/80" : "text-tinta-suave")}>{rotulo}</span>
                {I && (
                    <span className={cx("flex size-8 items-center justify-center rounded-lg", destaque ? "bg-secundaria text-secundaria-tinta" : "bg-superficie-suave text-tinta-media")}>
                        <I size={18} stroke={TRACO} aria-hidden />
                    </span>
                )}
            </div>
            <span className={cx("text-numero font-semibold tracking-tight tabular-nums", tom === "positivo" && "text-positivo", tom === "negativo" && "text-negativo", tom === "neutro" && !destaque && "text-tinta")}>
                {valor}
            </span>
            {grafico}
            {detalhe && <span className={cx("text-rotulo", destaque ? "text-primaria-tinta/75" : "text-tinta-suave")}>{detalhe}</span>}
        </div>
    );
}

/** Rótulo + valor em linha, para fichas de detalhe. */
export function Detalhe({ rotulo, children }: { rotulo: string; children: ReactNode }) {
    return (
        <div className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-corpo text-tinta-suave">{rotulo}</dt>
            <dd className="text-end text-corpo font-medium text-tinta">{children}</dd>
        </div>
    );
}

export function Vazio({ titulo, descricao, acao, icone: I }: { titulo: string; descricao?: string; acao?: ReactNode; icone?: Icone }) {
    return (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            {I && (
                <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-superficie-suave">
                    <I size={22} stroke={TRACO} className="text-tinta-suave" aria-hidden />
                </span>
            )}
            <p className="text-ui font-medium text-tinta">{titulo}</p>
            {descricao && <p className="max-w-sm text-corpo text-tinta-suave">{descricao}</p>}
            {acao && <div className="mt-3">{acao}</div>}
        </div>
    );
}

/** Faixa de aviso (feira encerrada, resultado negativo, senha gerada). */
export function Faixa({ tom = "aviso", icone: I, children, titulo }: { tom?: "aviso" | "perigo" | "info" | "destaque"; icone?: Icone; titulo?: ReactNode; children?: ReactNode }) {
    const tons = {
        aviso: "border-ambar/40 bg-ambar-suave text-ambar-tinta",
        perigo: "border-vermelho/30 bg-vermelho-suave text-vermelho-tinta",
        info: "border-primaria/20 bg-primaria-suave text-primaria-texto",
        destaque: "border-secundaria bg-secundaria-suave text-secundaria-tinta",
    };
    return (
        <div role="status" className={cx("flex items-start gap-3 rounded-xl border px-4 py-3", tons[tom])}>
            {I && <I size={18} stroke={TRACO} className="mt-0.5 shrink-0" aria-hidden />}
            <div className="min-w-0 text-corpo">
                {titulo && <p className="font-semibold">{titulo}</p>}
                {children}
            </div>
        </div>
    );
}
