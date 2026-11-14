import { router, usePage } from "@inertiajs/react";
import {
    IconAlertTriangle,
    IconArrowDownRight,
    IconArrowUpRight,
    IconBuildingStore,
    IconCalendarEvent,
    IconChartBar,
    IconChartDonut,
    IconChartLine,
    IconCoins,
    IconDownload,
    IconList,
    IconNotes,
    IconReceipt,
    IconPigMoney,
    IconTag,
    IconTrendingUp,
    IconUsers,
} from "@tabler/icons-react";
import { BarrasHorizontais, CORES, GraficoArea, GraficoRosca, Sparkline } from "@/components/graficos/graficos";
import { AoVivo } from "@/components/painel/ao-vivo";
import { FiltrosVendas, type FiltroVendas } from "@/components/painel/filtros";
import { FaixaDias, ListaPendencias, ListaVendas, TabelaTags, useSaudacao, type Pendencia, type PontoSerie } from "@/components/painel/widgets";
import { BotaoLink } from "@/components/ui/botao";
import { CabecalhoPagina, Cartao, Faixa, Kpi, PilulaStats, Vazio } from "@/components/ui/cartao";
import { Avatar, ChipStatus } from "@/components/ui/marcadores";
import { Celula, Linha, Tabela } from "@/components/ui/tabela";
import { useTempoReal } from "@/hooks/useTempoReal";
import { cx } from "@/lib/cx";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { rota, semVazios } from "@/lib/rotas";
import type { Opcao } from "@/types/inertia";
import type { Indicadores, Venda } from "@/types/dominio";

interface Linha {
    barraquinha: { id: number; nome: string; vaga: boolean; status: Opcao };
    indicadores: Indicadores;
}

interface Props {
    versao: string;
    feira: { id: number; nome: string; status: Opcao; dataInicio: string; dataFim: string } | null;
    filtro: FiltroVendas;
    linhas: Linha[];
    consolidado: Indicadores;
    porTag: { rotulo: string; tag: string; quantidade: number; total: number; desconto: number }[];
    porPagamento: { pagamento: Opcao; total: number }[];
    serie: PontoSerie[];
    ultimas: Venda[];
    pendencias: Pendencia[];
    ordem: string;
    direcao: "asc" | "desc";
    canais: Opcao[];
    pagamentos: Opcao[];
}

/** Recarregadas quando entra venda ou lançamento em qualquer barraquinha da feira. */
const PROPS_AO_VIVO = ["linhas", "consolidado", "porTag", "porPagamento", "serie", "ultimas", "pendencias"];

const COR_CANAL_GRAFICO: Record<string, (typeof CORES)[number]> = { pre_venda: CORES[1], feira: CORES[0], pos_evento: CORES[2] };
const COR_PAGAMENTO_GRAFICO: Record<string, (typeof CORES)[number]> = { dinheiro: CORES[2], pix: CORES[4], cartao: CORES[3] };

export default function Painel(props: Props) {
    const { versao, feira, filtro, linhas, consolidado: c, porTag, porPagamento, serie, ultimas, pendencias, ordem, direcao, canais, pagamentos } = props;
    const t = useT();
    const f = useFormato();
    const saudacao = useSaudacao();
    const { auth } = usePage().props;
    const aoVivo = useTempoReal({ url: rota("admin.painel.pulso"), versao, props: PROPS_AO_VIVO });

    if (!feira) {
        return (
            <>
                <CabecalhoPagina titulo={t("Painel da feira")} />
                <Cartao>
                    <Vazio icone={IconCalendarEvent} titulo={t("Nenhuma feira cadastrada")} descricao={t("Crie a primeira edição para começar.")} acao={<BotaoLink href={rota("admin.feiras.create")}>{t("Nova feira")}</BotaoLink>} />
                </Cartao>
            </>
        );
    }

    const ordenar = (coluna: string) =>
        router.get(rota("admin.painel"), semVazios({ ...filtro, ordem: coluna, direcao: coluna === ordem && direcao === "desc" ? "asc" : "desc" }), { preserveScroll: true, preserveState: true });

    const negativas = linhas.filter((l) => l.indicadores.resultado < 0);
    const ativas = linhas.filter((l) => !l.barraquinha.vaga).length;
    const ticket = c.qtdVendas ? c.vendas / c.qtdVendas : 0;
    const primeiroNome = auth?.usuario.nome.split(" ")[0] ?? "";
    const ranking = [...linhas].filter((l) => !l.barraquinha.vaga).sort((a, b) => b.indicadores.vendas - a.indicadores.vendas).slice(0, 8);

    return (
        <>
            <CabecalhoPagina
                tituloAba={t("Painel da feira")}
                sobretitulo={`${f.dataLonga()} · ${feira.nome}`}
                titulo={`${saudacao}, ${primeiroNome}!`}
                acoes={
                    <>
                        <AoVivo estado={aoVivo.estado} sincronizadoEm={aoVivo.sincronizadoEm} aoTentar={aoVivo.tentarAgora} />
                        <BotaoLink href={rota("admin.comparar-feiras")} variante="secundario" icone={IconChartBar}>{t("Comparar feiras")}</BotaoLink>
                        <BotaoLink href={rota("admin.relatorios.index")} variante="secundario" icone={IconDownload}>{t("Exportar")}</BotaoLink>
                    </>
                }
            >
                <PilulaStats
                    itens={[
                        { icone: IconCoins, valor: f.moeda(c.vendas), rotulo: t("em vendas") },
                        { icone: IconReceipt, valor: f.numero(c.qtdVendas), rotulo: t("vendas") },
                        { icone: IconTrendingUp, valor: f.moeda(ticket), rotulo: t("ticket médio") },
                        { icone: IconBuildingStore, valor: f.numero(ativas), rotulo: t("barraquinhas") },
                    ]}
                />
            </CabecalhoPagina>

            <Cartao className="mb-5" corpo="p-4">
                <FiltrosVendas inicial={filtro} canais={canais} pagamentos={pagamentos} />
            </Cartao>

            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                <Kpi destaque className="sm:col-span-2 2xl:col-span-1" rotulo={t("Entrada de vendas")} valor={f.moeda(c.vendas)} icone={IconCoins} detalhe={t(":n vendas", { n: f.numero(c.qtdVendas) })} grafico={<Sparkline valores={serie.map((p) => p.total)} cor={CORES[1]} />} />
                <Kpi rotulo={t("Outras entradas")} valor={f.moeda(c.outrasEntradas)} icone={IconArrowDownRight} detalhe={t("Patrocínio, rifa, aportes")} />
                <Kpi rotulo={t("Saídas")} valor={f.moeda(c.saidas)} icone={IconArrowUpRight} detalhe={t("Custos, despesas e investimento")} />
                <Kpi rotulo={t("Saldo de caixa")} valor={f.moeda(c.saldo)} icone={IconPigMoney} tom={c.saldo < 0 ? "negativo" : "positivo"} detalhe={t("Entradas menos todas as saídas")} />
                <Kpi rotulo={t("Resultado operacional")} valor={f.moeda(c.resultado)} icone={IconTrendingUp} tom={c.resultado < 0 ? "negativo" : "positivo"} detalhe={t("Margem :m", { m: f.percentual(c.margem) })} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <Cartao className="xl:col-span-8" titulo={t("Vendas por dia")} icone={IconChartLine} descricao={t("Vendas concluídas de todas as barraquinhas")}>
                    {serie.length ? (
                        <GraficoArea
                            rotulo={t("Vendas por dia")}
                            pontos={serie.map((p) => ({ rotulo: f.diaMes(p.dia), valor: p.total, detalhe: t(":n vendas", { n: p.qtd }) }))}
                            formatarValor={f.moeda}
                            formatarEixo={f.moedaCompacta}
                            altura={280}
                        />
                    ) : (
                        <Vazio icone={IconChartLine} titulo={t("Nenhuma venda no período.")} />
                    )}
                </Cartao>

                <Cartao className="xl:col-span-4" titulo={t("Vendas por canal")} icone={IconChartDonut}>
                    <GraficoRosca
                        rotulo={t("Vendas por canal")}
                        fatias={c.porCanal.map((p) => ({ rotulo: p.canal.label, valor: p.total, cor: COR_CANAL_GRAFICO[p.canal.valor] ?? CORES[5] }))}
                        formatarValor={f.moeda}
                        centro={{ valor: f.moedaCompacta(c.vendas), rotulo: t("total") }}
                    />
                </Cartao>

                <div className="flex flex-col gap-4 xl:col-span-8">
                    {negativas.length > 0 && (
                        <Faixa tom="perigo" icone={IconAlertTriangle} titulo={t("Resultado operacional negativo:")}>
                            {negativas.map((l) => l.barraquinha.nome).join(", ")}
                        </Faixa>
                    )}
                    <Cartao titulo={t("Comparativo das barraquinhas")} icone={IconList} descricao={t("Clique numa barraquinha para abrir o painel dela.")} corpo="">
                        <Tabela
                            rotulo={t("Comparativo das barraquinhas")}
                            ordem={ordem}
                            direcao={direcao}
                            aoOrdenar={ordenar}
                            colunas={[
                                { chave: "nome", rotulo: t("Barraquinha"), icone: IconBuildingStore, ordenavel: true },
                                { chave: "vendas", rotulo: t("Vendas"), alinhar: "direita", ordenavel: true },
                                { chave: "saidas", rotulo: t("Saídas"), alinhar: "direita", ordenavel: true },
                                { chave: "saldo", rotulo: t("Saldo"), alinhar: "direita", ordenavel: true },
                                { chave: "resultado", rotulo: t("Resultado"), alinhar: "direita", ordenavel: true },
                                { chave: "margem", rotulo: t("Margem"), alinhar: "direita", ordenavel: true },
                                { chave: "qtd", rotulo: t("Nº de vendas"), alinhar: "direita", ordenavel: true },
                            ]}
                            vazio={<Vazio icone={IconBuildingStore} titulo={t("Nenhuma barraquinha nesta feira")} />}
                        >
                            {linhas.map(({ barraquinha: b, indicadores: i }) => (
                                <Linha key={b.id} href={rota("admin.loja.painel", { barraquinha: b.id })}>
                                    <Celula cabecalho>
                                        <span className="flex items-center gap-2.5">
                                            <Avatar nome={b.nome} tamanho="sm" />
                                            <span className={cx("truncate", b.vaga ? "text-tinta-fraca italic" : "font-medium text-tinta")}>{b.nome}</span>
                                            {b.status.valor === "bloqueada" && <ChipStatus opcao={b.status} />}
                                            {i.resultado < 0 && <IconAlertTriangle size={15} className="shrink-0 text-negativo" aria-label={t("Resultado negativo")} />}
                                        </span>
                                    </Celula>
                                    <Celula direita>{f.moeda(i.vendas)}</Celula>
                                    <Celula direita>{f.moeda(i.saidas)}</Celula>
                                    <Celula direita className={i.saldo < 0 ? "text-negativo" : ""}>{f.moeda(i.saldo)}</Celula>
                                    <Celula direita className={i.resultado < 0 ? "text-negativo" : i.resultado > 0 ? "text-positivo" : ""}>{f.moeda(i.resultado)}</Celula>
                                    <Celula direita>{f.percentual(i.margem)}</Celula>
                                    <Celula direita>{f.numero(i.qtdVendas)}</Celula>
                                </Linha>
                            ))}
                        </Tabela>
                    </Cartao>
                </div>

                <div className="flex flex-col gap-4 xl:col-span-4">
                    <Cartao titulo={t("Pendências")} icone={IconNotes} corpo="">
                        <ListaPendencias pendencias={pendencias} />
                    </Cartao>
                    <Cartao titulo={t("Por forma de pagamento")} icone={IconChartDonut}>
                        <GraficoRosca
                            rotulo={t("Por forma de pagamento")}
                            fatias={porPagamento.map((p) => ({ rotulo: p.pagamento.label, valor: p.total, cor: COR_PAGAMENTO_GRAFICO[p.pagamento.valor] ?? CORES[5] }))}
                            formatarValor={f.moeda}
                            centro={{ valor: f.numero(c.qtdVendas), rotulo: t("vendas") }}
                            tamanho={140}
                        />
                    </Cartao>
                </div>

                <Cartao className="xl:col-span-4" titulo={t("Ranking de vendas")} icone={IconUsers}>
                    {ranking.length ? (
                        <BarrasHorizontais formatarValor={f.moeda} dados={ranking.map((l, i) => ({ rotulo: l.barraquinha.nome, valor: l.indicadores.vendas, cor: i === 0 ? "bg-secundaria" : "bg-primaria" }))} />
                    ) : <Vazio titulo={t("Nenhuma venda no período.")} />}
                </Cartao>

                <Cartao className="xl:col-span-4" titulo={t("Últimas vendas")} icone={IconCalendarEvent} corpo="">
                    <FaixaDias serie={serie} filtro={filtro} />
                    <ListaVendas vendas={ultimas} comBarraquinha />
                </Cartao>

                <Cartao className="xl:col-span-4" titulo={t("Vendas por tag")} icone={IconTag} descricao={t("Comum e cada Combo N, somando todas as barraquinhas.")} corpo="">
                    <TabelaTags tags={porTag} />
                </Cartao>
            </div>
        </>
    );
}
