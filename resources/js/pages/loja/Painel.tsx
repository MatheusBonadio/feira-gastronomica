import { usePage } from "@inertiajs/react";
import {
    IconArrowDownRight,
    IconArrowUpRight,
    IconCalendarEvent,
    IconChartDonut,
    IconChartLine,
    IconCoins,
    IconDownload,
    IconNotes,
    IconReceipt,
    IconPigMoney,
    IconShoppingCart,
    IconTag,
    IconTarget,
    IconTrendingUp,
    IconTrophy,
} from "@tabler/icons-react";
import { Progress } from "radix-ui";
import { BarrasHorizontais, CORES, GraficoArea, GraficoRosca, Sparkline } from "@/components/graficos/graficos";
import { AoVivo } from "@/components/painel/ao-vivo";
import { FiltrosVendas, type FiltroVendas } from "@/components/painel/filtros";
import { FaixaDias, ListaPendencias, ListaVendas, TabelaTags, useSaudacao, type Pendencia, type PontoSerie } from "@/components/painel/widgets";
import { BotaoLink } from "@/components/ui/botao";
import { CabecalhoPagina, Cartao, Kpi, PilulaStats, Vazio } from "@/components/ui/cartao";
import { useTempoReal } from "@/hooks/useTempoReal";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { rota, useRotaLoja } from "@/lib/rotas";
import type { Opcao } from "@/types/inertia";
import type { Barraquinha, Indicadores, Venda } from "@/types/dominio";

interface Props {
    versao: string;
    barraquinha: Barraquinha;
    filtro: FiltroVendas;
    indicadores: Indicadores;
    porTag: { rotulo: string; tag: string; quantidade: number; total: number; desconto: number }[];
    ranking: { item_id: number; item_nome: string; quantidade: number }[];
    porPagamento: { pagamento: Opcao; total: number }[];
    serie: PontoSerie[];
    ultimas: Venda[];
    pendencias: Pendencia[];
    canais: Opcao[];
    pagamentos: Opcao[];
}

/** Recarregadas quando entra venda ou lançamento nesta barraquinha. */
const PROPS_AO_VIVO = ["indicadores", "porTag", "ranking", "porPagamento", "serie", "ultimas", "pendencias"];

const COR_CANAL_GRAFICO: Record<string, (typeof CORES)[number]> = { pre_venda: CORES[1], feira: CORES[0], pos_evento: CORES[2] };
const COR_PAGAMENTO_GRAFICO: Record<string, (typeof CORES)[number]> = { dinheiro: CORES[2], pix: CORES[4], cartao: CORES[3] };

/** Painel da barraquinha. O admin vê o mesmo painel, em modo leitura. */
export default function Painel({ versao, barraquinha, filtro, indicadores: i, porTag, ranking, porPagamento, serie, ultimas, pendencias, canais, pagamentos }: Props) {
    const t = useT();
    const f = useFormato();
    const saudacao = useSaudacao();
    const rotaLoja = useRotaLoja();
    const { loja } = usePage().props;
    const ticket = i.qtdVendas ? i.vendas / i.qtdVendas : 0;
    const unidades = ranking.reduce((s, r) => s + r.quantidade, 0);
    const podeVender = loja?.podeVender && !loja.encerrada;
    const aoVivo = useTempoReal({ url: rotaLoja("pulso"), versao, props: PROPS_AO_VIVO });

    return (
        <>
            <CabecalhoPagina
                tituloAba={barraquinha.nome}
                sobretitulo={`${f.dataLonga()} · ${loja?.feira ?? ""}`}
                titulo={podeVender ? `${saudacao}, ${barraquinha.nome}!` : barraquinha.nome}
                acoes={
                    <>
                        <AoVivo estado={aoVivo.estado} sincronizadoEm={aoVivo.sincronizadoEm} aoTentar={aoVivo.tentarAgora} />
                        {loja?.podeVender && <BotaoLink href={rota("barraquinha.relatorios.index")} variante="secundario" icone={IconDownload}>{t("Exportar")}</BotaoLink>}
                        {podeVender && <BotaoLink href={rotaLoja("vendas.create")} icone={IconShoppingCart}>{t("Nova venda")}</BotaoLink>}
                    </>
                }
            >
                <PilulaStats
                    itens={[
                        { icone: IconCoins, valor: f.moeda(i.vendas), rotulo: t("em vendas") },
                        { icone: IconReceipt, valor: f.numero(i.qtdVendas), rotulo: t("vendas") },
                        { icone: IconTrendingUp, valor: f.moeda(ticket), rotulo: t("ticket médio") },
                        { icone: IconTag, valor: f.numero(unidades), rotulo: t("itens vendidos") },
                    ]}
                />
            </CabecalhoPagina>

            <Cartao className="mb-5" corpo="p-4">
                <FiltrosVendas inicial={filtro} canais={canais} pagamentos={pagamentos} />
            </Cartao>

            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                <Kpi destaque className="sm:col-span-2 2xl:col-span-1" rotulo={t("Entrada de vendas")} valor={f.moeda(i.vendas)} icone={IconCoins} detalhe={t(":n vendas", { n: f.numero(i.qtdVendas) })} grafico={<Sparkline valores={serie.map((p) => p.total)} cor={CORES[1]} />} />
                <Kpi rotulo={t("Outras entradas")} valor={f.moeda(i.outrasEntradas)} icone={IconArrowDownRight} detalhe={t("Patrocínio, rifa, aportes")} />
                <Kpi rotulo={t("Saídas")} valor={f.moeda(i.saidas)} icone={IconArrowUpRight} detalhe={t("Custos, despesas e investimento")} />
                <Kpi rotulo={t("Saldo de caixa")} valor={f.moeda(i.saldo)} icone={IconPigMoney} tom={i.saldo < 0 ? "negativo" : "positivo"} detalhe={t("Entradas menos todas as saídas")} />
                <Kpi rotulo={t("Resultado operacional")} valor={f.moeda(i.resultado)} icone={IconTrendingUp} tom={i.resultado < 0 ? "negativo" : "positivo"} detalhe={t("Margem :m", { m: f.percentual(i.margem) })} />
            </div>

            {i.meta !== null && (
                <Cartao className="mb-5" corpo="px-4 pb-4" titulo={t("Meta de vendas")} icone={IconTarget} acoes={<span className="text-ui font-semibold tabular-nums text-tinta">{f.percentual(i.progressoMeta)}</span>}>
                    <Progress.Root value={Math.min(100, Math.round((i.progressoMeta ?? 0) * 100))} max={100} aria-label={t("Meta de vendas")} className="h-2.5 overflow-hidden rounded-full bg-superficie-suave">
                        <Progress.Indicator className="h-full rounded-full bg-secundaria transition-[width] duration-700" style={{ width: `${Math.min(100, (i.progressoMeta ?? 0) * 100)}%` }} />
                    </Progress.Root>
                    <p className="mt-2 text-rotulo text-tinta-suave">{t(":vendido de :meta", { vendido: f.moeda(i.vendas), meta: f.moeda(i.meta) })}</p>
                </Cartao>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <Cartao className="xl:col-span-8" titulo={t("Vendas por dia")} icone={IconChartLine}>
                    {serie.length ? (
                        <GraficoArea
                            rotulo={t("Vendas por dia")}
                            pontos={serie.map((p) => ({ rotulo: f.diaMes(p.dia), valor: p.total, detalhe: t(":n vendas", { n: p.qtd }) }))}
                            formatarValor={f.moeda}
                            formatarEixo={f.moedaCompacta}
                            altura={260}
                        />
                    ) : <Vazio icone={IconChartLine} titulo={t("Nenhuma venda no período.")} />}
                </Cartao>

                <Cartao className="xl:col-span-4" titulo={t("Vendas por canal")} icone={IconChartDonut}>
                    <GraficoRosca
                        rotulo={t("Vendas por canal")}
                        fatias={i.porCanal.map((p) => ({ rotulo: p.canal.label, valor: p.total, cor: COR_CANAL_GRAFICO[p.canal.valor] ?? CORES[5] }))}
                        formatarValor={f.moeda}
                        centro={{ valor: f.moedaCompacta(i.vendas), rotulo: t("total") }}
                    />
                </Cartao>

                <Cartao className="xl:col-span-4" titulo={t("Últimas vendas")} icone={IconCalendarEvent} corpo="">
                    <FaixaDias serie={serie} filtro={filtro} />
                    <ListaVendas vendas={ultimas} hrefVenda={(v) => rotaLoja("vendas.show", { venda: v.id })} />
                </Cartao>

                <Cartao className="xl:col-span-4" titulo={t("Pendências")} icone={IconNotes} corpo="">
                    <ListaPendencias pendencias={pendencias} />
                </Cartao>

                <Cartao className="xl:col-span-4" titulo={t("Itens mais vendidos")} icone={IconTrophy} descricao={t("Inclui os itens vendidos dentro de combos.")}>
                    {ranking.length ? (
                        <BarrasHorizontais
                            formatarValor={(v) => t(":n un.", { n: f.numero(v) })}
                            dados={ranking.map((r, n) => ({ rotulo: r.item_nome, valor: r.quantidade, cor: n === 0 ? "bg-secundaria" : "bg-primaria" }))}
                        />
                    ) : <Vazio titulo={t("Nenhuma venda no período.")} />}
                </Cartao>

                <Cartao className="xl:col-span-6" titulo={t("Vendas por tag")} icone={IconTag} descricao={t("Quantas e quanto em Comum e em cada Combo N.")} corpo="">
                    <TabelaTags tags={porTag} />
                </Cartao>

                <Cartao className="xl:col-span-6" titulo={t("Por forma de pagamento")} icone={IconChartDonut}>
                    <GraficoRosca
                        rotulo={t("Por forma de pagamento")}
                        fatias={porPagamento.map((p) => ({ rotulo: p.pagamento.label, valor: p.total, cor: COR_PAGAMENTO_GRAFICO[p.pagamento.valor] ?? CORES[5] }))}
                        formatarValor={f.moeda}
                        centro={{ valor: f.numero(i.qtdVendas), rotulo: t("vendas") }}
                        tamanho={140}
                    />
                </Cartao>
            </div>
        </>
    );
}
