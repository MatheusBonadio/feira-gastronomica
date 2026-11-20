import { Link } from "@inertiajs/react";
import { IconCheck, IconChevronRight, IconReceipt } from "@tabler/icons-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Dica } from "@/components/ui/dica";
import { TRACO, type Icone } from "@/components/ui/icone";
import { Avatar, ChipTag, TextoStatus } from "@/components/ui/marcadores";
import { useFormato } from "@/lib/formato";
import { cx } from "@/lib/cx";
import { useT } from "@/lib/i18n";
import type { Venda } from "@/types/dominio";

export interface PontoSerie {
    dia: string;
    total: number;
    qtd: number;
    porCanal?: Record<string, number>;
}

export function useSaudacao() {
    const t = useT();
    const hora = new Date().getHours();
    return hora >= 5 && hora < 12 ? t("Bom dia") : hora >= 12 && hora < 18 ? t("Boa tarde") : t("Boa noite");
}

function useVendasNovas(vendas: Venda[]) {
    const maiorVisto = useRef<number | null>(null);
    const [novas, setNovas] = useState<ReadonlySet<number>>(() => new Set());
    const assinatura = vendas.map((v) => v.id).join(",");

    useEffect(() => {
        const maior = Math.max(0, ...vendas.map((v) => v.id));
        const anterior = maiorVisto.current;
        maiorVisto.current = Math.max(anterior ?? 0, maior);
        if (anterior === null) return;

        const chegaram = vendas.filter((v) => v.id > anterior).map((v) => v.id);
        if (chegaram.length === 0) return;
        setNovas(new Set(chegaram));
        const id = window.setTimeout(() => setNovas(new Set()), 2600);
        return () => window.clearTimeout(id);
    }, [assinatura]);

    return novas;
}

const ICONE_CANAL: Record<string, string> = {
    pre_venda: "bg-secundaria-suave text-secundaria-texto",
    feira: "bg-primaria-suave text-primaria-texto",
    pos_evento: "bg-verde-suave text-verde-tinta",
};

export function ListaVendas({ vendas, hrefVenda, comBarraquinha }: { vendas: Venda[]; hrefVenda?: (v: Venda) => string; comBarraquinha?: boolean }) {
    const { moeda, hora, diaMes } = useFormato();
    const t = useT();
    const novas = useVendasNovas(vendas);

    if (vendas.length === 0) {
        return <p className="px-5 pb-5 text-corpo text-tinta-suave">{t("Nenhuma venda no período.")}</p>;
    }

    return (
        <ul className="flex flex-col px-2 pb-2">
            {vendas.map((v) => {
                const titulo = comBarraquinha && v.barraquinha ? v.barraquinha : v.resumo;
                const conteudo = (
                    <>
                        {comBarraquinha && v.barraquinha ? (
                            <Avatar nome={v.barraquinha} foto={v.barraquinhaFoto} forma="quadrada" tamanho="lg" />
                        ) : (
                            <span className={cx("flex size-10 shrink-0 items-center justify-center rounded-xl", ICONE_CANAL[v.canal.valor] ?? "bg-superficie-suave text-tinta-media")} aria-hidden>
                                <IconReceipt size={18} stroke={TRACO} />
                            </span>
                        )}
                        <span className="min-w-0 flex-1">
                            <span className={cx("block truncate text-corpo font-semibold", v.cancelada ? "text-tinta-suave line-through" : "text-tinta")}>{titulo}</span>
                            <span className="block truncate text-micro text-tinta-suave">
                                {diaMes(v.dataHora)} · {hora(v.dataHora)} · {comBarraquinha ? v.resumo : v.pagamento.label}
                            </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end">
                            <span className={cx("text-corpo font-semibold tabular-nums", v.cancelada ? "text-tinta-suave line-through" : "text-tinta")}>+{moeda(v.total)}</span>
                            <TextoStatus opcao={v.status} />
                        </span>
                        {hrefVenda && <IconChevronRight size={16} stroke={TRACO} className="shrink-0 text-tinta-fraca rtl:rotate-180" aria-hidden />}
                    </>
                );
                const classes = cx("flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors", novas.has(v.id) && "animate-chegar");
                return (
                    <li key={v.id}>
                        {hrefVenda ? <Link prefetch href={hrefVenda(v)} className={cx(classes, "outline-none hover:bg-superficie-hover focus-visible:ring-2 focus-visible:ring-foco")}>{conteudo}</Link> : <div className={classes}>{conteudo}</div>}
                    </li>
                );
            })}
        </ul>
    );
}

export interface Pendencia {
    titulo: string;
    descricao: string;
    feito: boolean;
    href: string | null;
}

export function ListaPendencias({ pendencias, aoNavegar }: { pendencias: Pendencia[]; aoNavegar?: () => void }) {
    return (
        <ul className="flex flex-col">
            {pendencias.map((p) => {
                const conteudo = (
                    <>
                        <span
                            aria-hidden
                            className={cx(
                                "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border",
                                p.feito ? "border-secundaria bg-secundaria text-secundaria-tinta" : "border-linha-forte",
                            )}
                        >
                            {p.feito && <IconCheck size={12} stroke={2.5} />}
                        </span>
                        <span className="min-w-0">
                            <span className={cx("block text-corpo font-semibold", p.feito ? "text-tinta-suave line-through" : "text-tinta")}>{p.titulo}</span>
                            <span className="block text-rotulo text-tinta-suave">{p.descricao}</span>
                        </span>
                    </>
                );
                const classes = "flex items-start gap-3 rounded-xl px-3 py-2.5";
                return (
                    <li key={p.titulo}>
                        {p.href ? (
                            <Link prefetch href={p.href} onClick={aoNavegar} className={cx(classes, "outline-none hover:bg-superficie-hover focus-visible:ring-2 focus-visible:ring-foco")}>{conteudo}</Link>
                        ) : (
                            <div className={classes}>{conteudo}</div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

export function TabelaTags({ tags }: { tags: { rotulo: string; tag: string; quantidade: number; total: number; desconto: number }[] }) {
    const t = useT();
    const { numero, moeda } = useFormato();

    if (tags.length === 0) return <p className="px-5 pb-5 text-corpo text-tinta-suave">{t("Nenhuma venda no período.")}</p>;

    return (
        <ul className="flex flex-col px-2 pb-2">
            {tags.map((tag) => (
                <li key={tag.rotulo} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <ChipTag rotulo={tag.rotulo} combo={tag.tag === "combo"} />
                    <span className="flex-1 text-rotulo text-tinta-suave">{t(":n un.", { n: numero(tag.quantidade) })}</span>
                    {tag.desconto > 0 && <span className="text-rotulo tabular-nums text-positivo">−{moeda(tag.desconto)}</span>}
                    <span className="w-24 text-end text-corpo font-semibold tabular-nums text-tinta">{moeda(tag.total)}</span>
                </li>
            ))}
        </ul>
    );
}

export function Identidade({ titulo, situacao, linhas, valor, rotuloValor, foto, href }: {
    titulo: string;
    situacao?: ReactNode;
    linhas: ReactNode[];
    valor?: string;
    rotuloValor?: string;
    foto?: string | null;
    href?: string;
}) {
    const corpo = (
        <>
            <Avatar nome={titulo} foto={foto} forma="quadrada" tamanho="xl" />
            <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-titulo font-semibold text-tinta">{titulo}</span>
                    {situacao}
                </span>
                <span className="mt-0.5 flex flex-wrap gap-x-2 text-rotulo text-tinta-suave">
                    {linhas.filter(Boolean).map((l, i) => <span key={i}>{l}</span>)}
                </span>
            </span>
            {valor && (
                <span className="shrink-0 text-end">
                    {rotuloValor && <span className="block text-micro text-tinta-suave">{rotuloValor}</span>}
                    <span className="block text-titulo font-semibold tabular-nums text-tinta">{valor}</span>
                </span>
            )}
        </>
    );
    const classes = "-mx-2 flex min-w-0 items-center gap-3 rounded-xl px-2 py-2";
    return href ? <Link prefetch href={href} className={cx(classes, "outline-none transition-colors hover:bg-superficie-hover focus-visible:ring-2 focus-visible:ring-foco")}>{corpo}</Link> : <div className={classes}>{corpo}</div>;
}

export function AcoesRapidas({ acoes }: { acoes: { rotulo: string; icone: Icone; href?: string; aoClicar?: () => void; destaque?: boolean }[] }) {
    return (
        <ul className="grid grid-cols-5 gap-2">
            {acoes.map(({ rotulo, icone: I, href, aoClicar, destaque }) => {
                const conteudo = (
                    <>
                        <span className={cx("flex size-11 items-center justify-center rounded-xl border transition-colors", destaque ? "border-primaria bg-primaria text-primaria-tinta" : "border-linha bg-superficie text-tinta-media group-hover:border-linha-forte group-hover:text-tinta")}>
                            <I size={18} stroke={TRACO} aria-hidden />
                        </span>
                        <span className="w-full truncate text-center text-micro font-semibold text-tinta-media">{rotulo}</span>
                    </>
                );
                const classes = "group flex min-w-0 flex-col items-center gap-1.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-foco";
                return (
                    <li key={rotulo} className="min-w-0">
                        {href ? <Link prefetch href={href} className={classes}>{conteudo}</Link> : <button type="button" onClick={aoClicar} className={cx(classes, "w-full")}>{conteudo}</button>}
                    </li>
                );
            })}
        </ul>
    );
}

export function AcessoRapido({ itens }: { itens: { id: number; nome: string; href: string; apagado?: boolean; foto?: string | null }[] }) {
    return (
        <ul className="rolagem-fina flex gap-1 overflow-x-auto pb-1">
            {itens.map((i) => (
                <li key={i.id} className="shrink-0">
                    <Dica rotulo={i.nome}>
                        <Link prefetch href={i.href} className={cx("flex w-14 flex-col items-center gap-1 rounded-xl py-1 outline-none hover:bg-superficie-hover focus-visible:ring-2 focus-visible:ring-foco", i.apagado && "opacity-50")}>
                            <Avatar nome={i.nome} foto={i.foto} tamanho="lg" forma="quadrada" />
                            <span className="w-full truncate px-0.5 text-center text-micro font-medium text-tinta-media">{i.nome.split(" ")[0]}</span>
                        </Link>
                    </Dica>
                </li>
            ))}
        </ul>
    );
}

export function CartaoDica({ titulo, texto, acao }: { titulo: string; texto: string; acao?: ReactNode }) {
    const blocos = [
        "col-start-3 row-start-1 bg-secundaria",
        "col-start-2 row-start-2 bg-primaria",
        "col-start-3 row-start-2 bg-primaria/60",
        "col-start-1 row-start-3 bg-secundaria/60",
        "col-start-2 row-start-3 bg-primaria",
        "col-start-3 row-start-3 bg-secundaria",
    ];
    return (
        <section className="relative flex min-w-0 overflow-hidden rounded-cartao border border-cartao-borda bg-superficie p-5">
            <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-1.5 pe-24 sm:pe-28">
                <h2 className="text-titulo font-semibold text-tinta">{titulo}</h2>
                <p className="text-corpo text-tinta-suave">{texto}</p>
                {acao && <div className="mt-auto pt-2">{acao}</div>}
            </div>
            <div className="pointer-events-none absolute inset-e-5 bottom-5 grid grid-cols-3 grid-rows-3 gap-1" aria-hidden>
                {blocos.map((b) => <span key={b} className={cx("hachura size-6 rounded-md sm:size-7", b)} />)}
            </div>
        </section>
    );
}
