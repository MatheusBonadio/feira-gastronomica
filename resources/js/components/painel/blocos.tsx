import { Link } from "@inertiajs/react";
import { IconArrowRight, IconChartBar, IconChartLine, IconPencil } from "@tabler/icons-react";
import { ToggleGroup } from "radix-ui";
import { useState, type ReactNode } from "react";
import { BarraProgresso, BarraSegmentada, CORES, GraficoArea, GraficoBarrasDias, Legenda, Medidor, type Cor, type DiaBarras } from "@/components/graficos/graficos";
import { aplicarFiltro, type FiltroVendas } from "@/components/painel/filtros";
import { CartaoDica, type Pendencia, type PontoSerie } from "@/components/painel/widgets";
import { Cartao, Variacao, Vazio } from "@/components/ui/cartao";
import { Dica } from "@/components/ui/dica";
import { TRACO } from "@/components/ui/icone";
import { cx } from "@/lib/cx";
import { isoDia, paraData, useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import type { Indicadores } from "@/types/dominio";
import type { Opcao } from "@/types/inertia";

export const COR_CANAL_GRAFICO: Record<string, Cor> = { pre_venda: CORES[1], feira: CORES[0], pos_evento: CORES[2] };
export const COR_PAGAMENTO_BARRA: Record<string, string> = { dinheiro: "bg-verde", pix: "bg-azul", cartao: "bg-rosa" };
const CORES_CATEGORIA = ["bg-grafico-1", "bg-grafico-2", "bg-grafico-5", "bg-grafico-6", "bg-grafico-3", "bg-grafico-4"];

export function variacao(atual: number, anterior: number | null | undefined): number | null {
    if (anterior === null || anterior === undefined || anterior === 0) return null;
    return (atual - anterior) / Math.abs(anterior);
}

function ValorCartao({ valor, rotulo, tom }: { valor: ReactNode; rotulo: ReactNode; tom?: "negativo" }) {
    return (
        <div className="min-w-0">
            <p className={cx("truncate text-valor font-semibold tabular-nums", tom === "negativo" ? "text-negativo" : "text-tinta")}>{valor}</p>
            <p className="truncate text-rotulo text-tinta-suave">{rotulo}</p>
        </div>
    );
}

export function VendasPorDia({ serie, canais, filtro, total, rodape }: { serie: PontoSerie[]; canais: Opcao[]; filtro: FiltroVendas; total: number; rodape: string }) {
    const t = useT();
    const f = useFormato();
    const [modo, setModo] = useState<"barras" | "linha">("barras");

    const pontos: PontoSerie[] = (() => {
        if (serie.length < 2) return serie;
        const inicio = paraData(serie[0].dia);
        const fim = paraData(serie[serie.length - 1].dia);
        const dias = Math.round((fim.getTime() - inicio.getTime()) / 86_400_000);
        if (dias > 31) return serie;
        const porDia = new Map(serie.map((p) => [p.dia, p]));
        return Array.from({ length: dias + 1 }, (_, i) => {
            const d = new Date(inicio);
            d.setDate(d.getDate() + i);
            const chave = isoDia(d);
            return porDia.get(chave) ?? { dia: chave, total: 0, qtd: 0, porCanal: {} };
        });
    })();

    const selecionado = filtro.de && filtro.de === filtro.ate ? filtro.de : null;
    const dias: DiaBarras[] = pontos.map((p) => ({
        chave: p.dia,
        rotulo: `${f.diaSemana(p.dia)} ${f.diaMes(p.dia).slice(0, 2)}`,
        detalhe: `${f.data(p.dia)} · ${t(":n vendas", { n: p.qtd })}`,
        valores: canais.map((c) => p.porCanal?.[c.valor] ?? 0),
    }));
    const escolher = (dia: DiaBarras) => aplicarFiltro(selecionado === dia.chave ? { ...filtro, de: undefined, ate: undefined } : { ...filtro, de: dia.chave, ate: dia.chave });

    return (
        <Cartao
            corpo="px-5 pb-4"
            titulo={<ValorCartao valor={f.moeda(total)} rotulo={rodape} />}
            acoes={
                <ToggleGroup.Root type="single" value={modo} onValueChange={(v) => v && setModo(v as typeof modo)} aria-label={t("Tipo de gráfico")} className="flex gap-0.5 rounded-controle border border-linha p-0.5">
                    {([["barras", IconChartBar, t("Barras")], ["linha", IconChartLine, t("Linha")]] as const).map(([valor, I, rotulo]) => (
                        <Dica key={valor} rotulo={rotulo}>
                            <ToggleGroup.Item value={valor} aria-label={rotulo} className="flex size-10 items-center justify-center rounded-lg text-tinta-suave outline-none hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco data-[state=on]:bg-superficie-ativa data-[state=on]:text-tinta md:size-7">
                                <I size={16} stroke={TRACO} aria-hidden />
                            </ToggleGroup.Item>
                        </Dica>
                    ))}
                </ToggleGroup.Root>
            }
        >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Legenda itens={canais.map((c) => ({ rotulo: c.label, cor: COR_CANAL_GRAFICO[c.valor] ?? CORES[5] }))} />
                {selecionado && <span className="text-rotulo text-tinta-suave">{t("Filtrado em :dia. Clique de novo para limpar.", { dia: f.data(selecionado) })}</span>}
            </div>
            {pontos.length === 0 ? (
                <Vazio icone={IconChartBar} titulo={t("Nenhuma venda no período.")} />
            ) : modo === "barras" ? (
                <GraficoBarrasDias
                    rotulo={t("Vendas por dia e canal")}
                    rotuloTotal={t("Total")}
                    dias={dias}
                    series={canais.map((c) => ({ nome: c.label, cor: COR_CANAL_GRAFICO[c.valor] ?? CORES[5] }))}
                    formatarValor={f.moeda}
                    formatarEixo={f.moedaCompacta}
                    focoInicial={selecionado ? Math.max(0, dias.findIndex((d) => d.chave === selecionado)) : undefined}
                    aoEscolher={escolher}
                    altura={250}
                />
            ) : (
                <GraficoArea
                    rotulo={t("Vendas por dia")}
                    pontos={pontos.map((p) => ({ rotulo: f.diaMes(p.dia), valor: p.total, detalhe: t(":n vendas", { n: p.qtd }) }))}
                    formatarValor={f.moeda}
                    formatarEixo={f.moedaCompacta}
                    altura={250}
                />
            )}
        </Cartao>
    );
}

export function SaidasPorCategoria({ itens, total }: { itens: { categoria: Opcao; total: number }[]; total: number }) {
    const t = useT();
    const f = useFormato();
    const principais = itens.slice(0, 5);
    const resto = itens.slice(5).reduce((s, i) => s + i.total, 0);
    const fatias = [
        ...principais.map((i, n) => ({ rotulo: i.categoria.label, valor: i.total, cor: CORES_CATEGORIA[n] })),
        ...(resto > 0 ? [{ rotulo: t("Outras"), valor: resto, cor: "bg-superficie-ativa" }] : []),
    ];

    return (
        <Cartao titulo={<ValorCartao valor={f.moeda(total)} rotulo={t("Saídas por categoria")} />}>
            {fatias.length ? <BarraSegmentada rotulo={t("Saídas por categoria")} fatias={fatias} formatarValor={f.moeda} /> : <Vazio titulo={t("Nenhuma saída lançada.")} />}
        </Cartao>
    );
}

export function SaudeFinanceira({ indicadores: i, anterior }: { indicadores: Indicadores; anterior?: { nome: string; resultado: number } | null }) {
    const t = useT();
    const f = useFormato();
    const margem = i.margem ?? 0;

    return (
        <Cartao
            titulo={
                <div className="min-w-0">
                    <ValorCartao valor={f.moeda(i.resultado)} rotulo={t("Resultado operacional")} tom={i.resultado < 0 ? "negativo" : undefined} />
                    {anterior && (
                        <Variacao fracao={variacao(i.resultado, anterior.resultado)} rotulo={t("vs. :feira", { feira: anterior.nome })} formatar={(x) => f.percentual(x)} />
                    )}
                </div>
            }
        >
            <Medidor rotulo={t("Saúde financeira")} fracao={Math.max(0, margem)} valor={i.margem === null ? "-" : f.percentual(i.margem)} legenda={t("de margem operacional")} />
            <p className="mt-3 text-center text-rotulo text-tinta-suave">{t("Vendas menos custos e despesas, sobre as vendas.")}</p>
        </Cartao>
    );
}

export function PorPagamento({ porPagamento }: { porPagamento: { pagamento: Opcao; total: number }[] }) {
    const t = useT();
    const f = useFormato();
    const total = porPagamento.reduce((s, p) => s + p.total, 0);

    return (
        <Cartao titulo={<ValorCartao valor={f.moeda(total)} rotulo={t("Por forma de pagamento")} />}>
            <BarraSegmentada
                rotulo={t("Por forma de pagamento")}
                fatias={porPagamento.map((p) => ({ rotulo: p.pagamento.label, valor: p.total, cor: COR_PAGAMENTO_BARRA[p.pagamento.valor] ?? "bg-grafico-6" }))}
                formatarValor={f.moeda}
            />
        </Cartao>
    );
}

export function ProgressoMeta({ titulo, descricao, atual, meta, hrefEditar, rotuloEditar, formatar }: {
    titulo: string;
    descricao: string;
    atual: number;
    meta: number;
    hrefEditar?: string;
    rotuloEditar?: string;
    formatar: (v: number) => string;
}) {
    return (
        <Cartao
            titulo={titulo}
            descricao={descricao}
            acoes={hrefEditar && (
                <Dica rotulo={rotuloEditar}>
                    <Link prefetch href={hrefEditar} aria-label={rotuloEditar} className="flex size-10 items-center justify-center rounded-lg text-tinta-suave outline-none hover:bg-superficie-hover hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco md:size-8">
                        <IconPencil size={16} stroke={TRACO} aria-hidden />
                    </Link>
                </Dica>
            )}
        >
            <BarraProgresso rotulo={titulo} fracao={meta > 0 ? atual / meta : 0} cor="bg-primaria" altura="h-6" bloco />
            <div className="mt-2 flex items-baseline justify-between gap-3 text-corpo tabular-nums">
                <span className="font-semibold text-tinta">{formatar(atual)}</span>
                <span className="text-tinta-suave">{formatar(meta)}</span>
            </div>
        </Cartao>
    );
}

export function ProximoPasso({ pendencias, padrao }: { pendencias: Pendencia[]; padrao: { titulo: string; texto: string; href?: string; rotulo?: string } }) {
    const t = useT();
    const proxima = pendencias.find((p) => !p.feito);
    const dica = proxima ? { titulo: proxima.titulo, texto: proxima.descricao, href: proxima.href ?? undefined, rotulo: t("Resolver") } : padrao;

    return (
        <CartaoDica
            titulo={dica.titulo}
            texto={dica.texto}
            acao={dica.href && (
                <Link prefetch href={dica.href} className="inline-flex h-10 items-center gap-1 rounded-md text-corpo font-semibold md:h-8 text-tinta outline-none hover:text-primaria-texto focus-visible:ring-2 focus-visible:ring-foco">
                    {dica.rotulo ?? t("Ver mais")}
                    <IconArrowRight size={15} stroke={TRACO} className="rtl:rotate-180" aria-hidden />
                </Link>
            )}
        />
    );
}
