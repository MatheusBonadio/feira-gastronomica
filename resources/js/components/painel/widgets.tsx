import { Link, router } from "@inertiajs/react";
import { IconCheck, IconChevronRight } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Dica } from "@/components/ui/dica";
import { TRACO } from "@/components/ui/icone";
import { Chip, ChipTag, COR_CANAL } from "@/components/ui/marcadores";
import { isoDia, paraData, useFormato } from "@/lib/formato";
import { cx } from "@/lib/cx";
import { useT } from "@/lib/i18n";
import { semVazios } from "@/lib/rotas";
import type { Venda } from "@/types/dominio";

export interface PontoSerie {
    dia: string;
    total: number;
    qtd: number;
}

/** Saudação conforme o horário (como "Good Evening! John,"). */
export function useSaudacao() {
    const t = useT();
    const hora = new Date().getHours();
    return hora >= 5 && hora < 12 ? t("Bom dia") : hora >= 12 && hora < 18 ? t("Boa tarde") : t("Boa noite");
}

/**
 * Faixa de 7 dias (como a "Schedule" da referência). Mostra os últimos dias
 * com movimento; clicar filtra o painel por aquele dia, clicar de novo limpa.
 */
export function FaixaDias({ serie, filtro }: { serie: PontoSerie[]; filtro: Record<string, string | undefined> }) {
    const { diaSemana, diaMes } = useFormato();
    const t = useT();
    const ultimo = serie.length ? paraData(serie[serie.length - 1].dia) : new Date();
    const dias = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(ultimo);
        d.setDate(d.getDate() - (6 - i));
        return isoDia(d);
    });
    const porDia = new Map(serie.map((p) => [p.dia, p]));
    const selecionado = filtro.de && filtro.de === filtro.ate ? filtro.de : null;

    const escolher = (dia: string) => {
        const proximo = selecionado === dia ? { ...filtro, de: undefined, ate: undefined } : { ...filtro, de: dia, ate: dia };
        router.get(window.location.pathname, semVazios(proximo), { preserveScroll: true, preserveState: true });
    };

    return (
        <div role="group" aria-label={t("Dias")} className="grid grid-cols-7 gap-1 px-3 pb-3">
            {dias.map((dia) => {
                const ativo = dia === selecionado;
                const ponto = porDia.get(dia);
                return (
                    <Dica key={dia} rotulo={ponto ? t(":n vendas", { n: ponto.qtd }) : t("Sem vendas")}>
                    <button
                        type="button"
                        aria-pressed={ativo}
                        onClick={() => escolher(dia)}
                        className={cx(
                            "flex flex-col items-center gap-0.5 rounded-lg py-1.5 transition-colors",
                            ativo ? "bg-secundaria text-secundaria-tinta" : "hover:bg-superficie-hover",
                        )}
                    >
                        <span className={cx("text-micro capitalize", ativo ? "text-secundaria-tinta" : "text-tinta-suave")}>{diaSemana(dia)}</span>
                        <span className="text-corpo font-semibold tabular-nums">{diaMes(dia).slice(0, 2)}</span>
                        <span className={cx("size-1 rounded-full", ponto ? (ativo ? "bg-secundaria-tinta" : "bg-primaria") : "bg-transparent")} />
                    </button>
                    </Dica>
                );
            })}
        </div>
    );
}

/**
 * Ids de vendas que chegaram depois da primeira renderização (id maior que o
 * maior já visto), para acender a linha quando o tempo real traz venda nova.
 * Trocar o filtro para dias antigos não acende nada.
 */
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assinatura]);

    return novas;
}

/** Últimas vendas com a barra de cor do canal (como os compromissos da "Schedule"). */
export function ListaVendas({ vendas, hrefVenda, comBarraquinha }: { vendas: Venda[]; hrefVenda?: (v: Venda) => string; comBarraquinha?: boolean }) {
    const { moeda, hora, data } = useFormato();
    const t = useT();
    const novas = useVendasNovas(vendas);

    if (vendas.length === 0) {
        return <p className="px-4 pb-4 text-corpo text-tinta-suave">{t("Nenhuma venda no período.")}</p>;
    }

    return (
        <ul className="flex flex-col">
            {vendas.map((v) => {
                const conteudo = (
                    <>
                        <span className={cx("w-1 self-stretch rounded-full", COR_CANAL[v.canal.valor] ?? "bg-linha-forte")} aria-hidden />
                        <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                                <span className={cx("truncate text-corpo font-medium", v.cancelada ? "text-tinta-fraca line-through" : "text-tinta")}>
                                    {comBarraquinha && v.barraquinha ? v.barraquinha : v.resumo}
                                </span>
                                {v.cancelada && <Chip tom="vermelho">{v.status.label}</Chip>}
                            </span>
                            <span className="block truncate text-micro text-tinta-suave">
                                #{v.numero} · {data(v.dataHora)} {hora(v.dataHora)} · {comBarraquinha ? v.resumo : v.pagamento.label}
                            </span>
                        </span>
                        <span className="text-corpo font-semibold tabular-nums text-tinta">{moeda(v.total)}</span>
                        {hrefVenda && <IconChevronRight size={16} stroke={TRACO} className="text-tinta-fraca" aria-hidden />}
                    </>
                );
                const classes = cx("flex items-center gap-3 border-t border-linha px-4 py-2.5", novas.has(v.id) && "animate-chegar");
                return (
                    <li key={v.id}>
                        {hrefVenda ? <Link href={hrefVenda(v)} className={cx(classes, "hover:bg-superficie-hover")}>{conteudo}</Link> : <div className={classes}>{conteudo}</div>}
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

/** Checklist (como as "Notes"): resolvido fica marcado e riscado. */
export function ListaPendencias({ pendencias }: { pendencias: Pendencia[] }) {
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
                            <span className={cx("block text-corpo font-medium", p.feito ? "text-tinta-suave line-through" : "text-tinta")}>{p.titulo}</span>
                            <span className="block text-rotulo text-tinta-suave">{p.descricao}</span>
                        </span>
                    </>
                );
                const classes = "flex items-start gap-3 border-t border-linha px-4 py-3";
                return (
                    <li key={p.titulo}>
                        {p.href ? <Link href={p.href} className={cx(classes, "hover:bg-superficie-hover")}>{conteudo}</Link> : <div className={classes}>{conteudo}</div>}
                    </li>
                );
            })}
        </ul>
    );
}

/** Quantas e quanto em Comum e em cada Combo N. */
export function TabelaTags({ tags }: { tags: { rotulo: string; tag: string; quantidade: number; total: number; desconto: number }[] }) {
    const t = useT();
    const { numero, moeda } = useFormato();

    if (tags.length === 0) return <p className="px-4 pb-4 text-corpo text-tinta-suave">{t("Nenhuma venda no período.")}</p>;

    return (
        <ul className="flex flex-col">
            {tags.map((tag) => (
                <li key={tag.rotulo} className="flex items-center gap-3 border-t border-linha px-4 py-2.5">
                    <ChipTag rotulo={tag.rotulo} combo={tag.tag === "combo"} />
                    <span className="flex-1 text-rotulo text-tinta-suave">{t(":n un.", { n: numero(tag.quantidade) })}</span>
                    {tag.desconto > 0 && <span className="text-rotulo tabular-nums text-positivo">−{moeda(tag.desconto)}</span>}
                    <span className="w-28 text-end text-corpo font-semibold tabular-nums text-tinta">{moeda(tag.total)}</span>
                </li>
            ))}
        </ul>
    );
}
