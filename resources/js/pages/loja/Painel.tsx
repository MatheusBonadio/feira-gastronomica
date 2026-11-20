import { usePage } from "@inertiajs/react";
import { IconArrowDownRight, IconArrowUpRight, IconDownload, IconShoppingCart, IconStack2, IconTag } from "@tabler/icons-react";
import { BarrasHorizontais } from "@/components/graficos/graficos";
import { AoVivo } from "@/components/painel/ao-vivo";
import { PorPagamento, ProgressoMeta, ProximoPasso, SaidasPorCategoria, SaudeFinanceira, VendasPorDia } from "@/components/painel/blocos";
import { BotaoFiltros, type FiltroVendas } from "@/components/painel/filtros";
import { AcoesRapidas, Identidade, ListaVendas, TabelaTags, useSaudacao, type Pendencia, type PontoSerie } from "@/components/painel/widgets";
import { BotaoLink } from "@/components/ui/botao";
import { CabecalhoPagina, Cartao, Estatistica, Vazio } from "@/components/ui/cartao";
import { ChipStatus } from "@/components/ui/marcadores";
import { useTempoReal } from "@/hooks/useTempoReal";
import { cx } from "@/lib/cx";
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
    saidasCategoria: { categoria: Opcao; total: number }[];
    estoque: { id: number; nome: string; inicial: number; vendidos: number; restante: number }[];
    canais: Opcao[];
    pagamentos: Opcao[];
}

const PROPS_AO_VIVO = ["indicadores", "porTag", "ranking", "porPagamento", "serie", "ultimas", "pendencias", "saidasCategoria", "estoque"];

export default function Painel({ versao, barraquinha, filtro, indicadores: i, porTag, ranking, porPagamento, serie, ultimas, pendencias, saidasCategoria, estoque, canais, pagamentos }: Props) {
    const t = useT();
    const f = useFormato();
    const saudacao = useSaudacao();
    const rotaLoja = useRotaLoja();
    const { loja } = usePage().props;
    const podeVender = Boolean(loja?.podeVender && !loja.encerrada);
    const aoVivo = useTempoReal({ url: rotaLoja("pulso"), versao, props: PROPS_AO_VIVO });
    const ticket = i.qtdVendas ? i.vendas / i.qtdVendas : 0;

    return (
        <>
            <CabecalhoPagina
                tituloAba={barraquinha.nome}
                sobretitulo={`${podeVender ? `${saudacao}! · ` : ""}${f.dataLonga()} · ${loja?.feira ?? ""}`}
                titulo={barraquinha.nome}
                acoes={
                    <>
                        <AoVivo estado={aoVivo.estado} sincronizadoEm={aoVivo.sincronizadoEm} aoTentar={aoVivo.tentarAgora} />
                        <BotaoFiltros inicial={filtro} canais={canais} pagamentos={pagamentos} />
                        {loja?.podeVender && <BotaoLink href={rota("barraquinha.relatorios.index")} variante="superficie" icone={IconDownload}>{t("Exportar")}</BotaoLink>}
                    </>
                }
            />

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="grid min-w-0 content-start gap-3">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_15rem]">
                        <VendasPorDia serie={serie} canais={canais} filtro={filtro} total={i.vendas} rodape={t(":n vendas · ticket médio :t", { n: f.numero(i.qtdVendas), t: f.moeda(ticket) })} />
                        <Cartao corpo="p-5" className="justify-center">
                            <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
                                <Estatistica rotulo={t("Outras entradas")} valor={f.moeda(i.outrasEntradas)} rodape={t("Patrocínio, rifa, aportes")} />
                                <Estatistica rotulo={t("Total de saídas")} valor={f.moeda(i.saidas)} rodape={t("Custos, despesas e investimento")} />
                                <Estatistica rotulo={t("Saldo de caixa")} valor={f.moeda(i.saldo)} tom={i.saldo < 0 ? "negativo" : "neutro"} rodape={t("Entradas menos todas as saídas")} />
                            </div>
                        </Cartao>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        {i.meta !== null && (
                            <ProgressoMeta
                                titulo={t("Meta de vendas")}
                                descricao={t(":p da meta", { p: f.percentual(i.progressoMeta) })}
                                atual={i.vendas}
                                meta={i.meta}
                                formatar={f.moeda}
                            />
                        )}
                        <div className={cx("grid", i.meta === null && "md:col-span-2")}>
                            <ProximoPasso
                                pendencias={pendencias}
                                padrao={
                                    podeVender
                                        ? { titulo: t("Tudo pronto para vender"), texto: t("Cada venda entra no painel na hora; lance também os custos para o resultado ficar real."), href: rotaLoja("vendas.create"), rotulo: t("Abrir PDV") }
                                        : { titulo: t("Tudo em dia"), texto: t("Itens, combos e lançamentos conferidos."), href: rotaLoja("vendas.index"), rotulo: t("Ver vendas") }
                                }
                            />
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                        <SaidasPorCategoria itens={saidasCategoria} total={i.saidas} />
                        <SaudeFinanceira indicadores={i} />
                        {estoque.length > 0 ? (
                            <Cartao className="md:col-span-2 2xl:col-span-1" titulo={t("Estoque")} descricao={t("Itens mais perto de acabar")}>
                                <BarrasHorizontais
                                    formatarValor={(v) => t(":n un.", { n: f.numero(v) })}
                                    dados={estoque.map((e) => ({
                                        rotulo: e.nome,
                                        valor: e.vendidos,
                                        maximo: e.inicial,
                                        detalhe: e.restante <= 0 ? t("· esgotado") : t("· restam :n", { n: f.numero(e.restante) }),
                                        cor: e.restante <= 0 ? "bg-vermelho" : e.restante <= e.inicial * 0.2 ? "bg-secundaria" : "bg-primaria",
                                    }))}
                                />
                            </Cartao>
                        ) : (
                            <Cartao className="md:col-span-2 2xl:col-span-1" titulo={t("Itens mais vendidos")} descricao={t("Inclui os itens vendidos dentro de combos.")}>
                                {ranking.length ? (
                                    <BarrasHorizontais
                                        formatarValor={(v) => t(":n un.", { n: f.numero(v) })}
                                        dados={ranking.slice(0, 6).map((r, n) => ({ rotulo: r.item_nome, valor: r.quantidade, cor: n === 0 ? "bg-secundaria" : "bg-primaria" }))}
                                    />
                                ) : <Vazio titulo={t("Nenhuma venda no período.")} />}
                            </Cartao>
                        )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <Cartao titulo={t("Vendas por tag")} descricao={t("Quantas e quanto em Comum e em cada Combo N.")} corpo="">
                            <TabelaTags tags={porTag} />
                        </Cartao>
                        <PorPagamento porPagamento={porPagamento} />
                    </div>
                </div>

                <aside className="grid min-w-0 content-start gap-3 md:grid-cols-2 xl:grid-cols-1">
                    <Cartao titulo={t("Minha barraquinha")} descricao={t("Ações rápidas")}>
                        <Identidade
                            titulo={barraquinha.nome}
                            situacao={<ChipStatus opcao={barraquinha.status} />}
                            linhas={[loja?.feira ?? "", t("Vaga :n", { n: barraquinha.posicao })]}
                            valor={f.moedaCompacta(i.vendas)}
                            rotuloValor={t("Vendas")}
                            foto={barraquinha.foto}
                        />
                        <div className="mt-4">
                            <AcoesRapidas
                                acoes={[
                                    ...(podeVender ? [{ rotulo: t("Vender"), icone: IconShoppingCart, href: rotaLoja("vendas.create"), destaque: true }] : []),
                                    ...(loja?.encerrada ? [] : [
                                        { rotulo: t("Entrada"), icone: IconArrowDownRight, href: rotaLoja("lancamentos.create", { tipo: "entrada" }) },
                                        { rotulo: t("Saída"), icone: IconArrowUpRight, href: rotaLoja("lancamentos.create", { tipo: "saida" }) },
                                    ]),
                                    { rotulo: t("Itens"), icone: IconTag, href: rotaLoja("itens.index") },
                                    { rotulo: t("Combos"), icone: IconStack2, href: rotaLoja("combos.index") },
                                ].slice(0, 5)}
                            />
                        </div>
                    </Cartao>

                    <Cartao titulo={t("Últimas vendas")} descricao={t("Atualiza sozinho a cada venda")} acoes={<BotaoLink href={rotaLoja("vendas.index")} variante="secundario" tamanho="sm">{t("Ver todas")}</BotaoLink>} corpo="">
                        <ListaVendas vendas={ultimas} hrefVenda={(v) => rotaLoja("vendas.show", { venda: v.id })} />
                    </Cartao>
                </aside>
            </div>
        </>
    );
}
