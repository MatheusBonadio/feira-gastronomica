import { router, usePage } from "@inertiajs/react";
import { IconAlertTriangle, IconBuildingStore, IconCalendarEvent, IconChartBar, IconDownload, IconFileAnalytics, IconPlus, IconShieldCheck, IconTag } from "@tabler/icons-react";
import { BarrasHorizontais } from "@/components/graficos/graficos";
import { AoVivo } from "@/components/painel/ao-vivo";
import { PorPagamento, ProgressoMeta, ProximoPasso, SaidasPorCategoria, SaudeFinanceira, VendasPorDia, variacao } from "@/components/painel/blocos";
import { BotaoFiltros, type FiltroVendas } from "@/components/painel/filtros";
import { AcessoRapido, AcoesRapidas, Identidade, ListaVendas, TabelaTags, useSaudacao, type Pendencia, type PontoSerie } from "@/components/painel/widgets";
import { BotaoLink } from "@/components/ui/botao";
import { CabecalhoPagina, Cartao, Estatistica, Faixa, Variacao, Vazio } from "@/components/ui/cartao";
import { Avatar, ChipStatus } from "@/components/ui/marcadores";
import { Celula, Linha, Tabela } from "@/components/ui/tabela";
import { useTempoReal } from "@/hooks/useTempoReal";
import { cx } from "@/lib/cx";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { rota, semVazios } from "@/lib/rotas";
import type { Opcao } from "@/types/inertia";
import type { Indicadores, Venda } from "@/types/dominio";

interface LinhaComparativo {
    barraquinha: { id: number; nome: string; vaga: boolean; status: Opcao; foto: string | null };
    indicadores: Indicadores;
}

interface Props {
    versao: string;
    feira: { id: number; nome: string; status: Opcao; dataInicio: string; dataFim: string } | null;
    filtro: FiltroVendas;
    linhas: LinhaComparativo[];
    consolidado: Indicadores;
    porTag: { rotulo: string; tag: string; quantidade: number; total: number; desconto: number }[];
    porPagamento: { pagamento: Opcao; total: number }[];
    serie: PontoSerie[];
    ultimas: Venda[];
    pendencias: Pendencia[];
    saidasCategoria: { categoria: Opcao; total: number }[];
    anterior: (Indicadores & { nome: string }) | null;
    ordem: string;
    direcao: "asc" | "desc";
    canais: Opcao[];
    pagamentos: Opcao[];
}

/** Recarregadas quando entra venda ou lançamento em qualquer barraquinha da feira. */
const PROPS_AO_VIVO = ["linhas", "consolidado", "porTag", "porPagamento", "serie", "ultimas", "pendencias", "saidasCategoria"];

export default function Painel(props: Props) {
    const { versao, feira, filtro, linhas, consolidado: c, porTag, porPagamento, serie, ultimas, pendencias, saidasCategoria, anterior, ordem, direcao, canais, pagamentos } = props;
    const t = useT();
    const f = useFormato();
    const saudacao = useSaudacao();
    const { auth, seletorFeira } = usePage().props;
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

    const pct = (x: number) => f.percentual(x);
    const vsAnterior = anterior ? t("vs. :feira", { feira: anterior.nome }) : null;
    const entradas = c.vendas + c.outrasEntradas;
    const negativas = linhas.filter((l) => l.indicadores.resultado < 0);
    const ocupadas = linhas.filter((l) => !l.barraquinha.vaga);
    const comMeta = ocupadas.filter((l) => l.indicadores.meta);
    const somaMetas = comMeta.reduce((s, l) => s + (l.indicadores.meta ?? 0), 0);
    const vendidoComMeta = comMeta.reduce((s, l) => s + l.indicadores.vendas, 0);
    const ranking = [...ocupadas].sort((a, b) => b.indicadores.vendas - a.indicadores.vendas).slice(0, 6);
    const primeiroNome = auth?.usuario.nome.split(" ")[0] ?? "";
    const outrasFeiras = (seletorFeira?.lista ?? []).filter((x) => x.id !== feira.id).slice(0, 2);

    return (
        <>
            <CabecalhoPagina
                tituloAba={t("Painel da feira")}
                sobretitulo={`${saudacao}, ${primeiroNome} · ${f.dataLonga()}`}
                titulo={t("Painel da feira")}
                acoes={
                    <>
                        <AoVivo estado={aoVivo.estado} sincronizadoEm={aoVivo.sincronizadoEm} aoTentar={aoVivo.tentarAgora} />
                        <BotaoFiltros inicial={filtro} canais={canais} pagamentos={pagamentos} />
                        <BotaoLink href={rota("admin.relatorios.index")} variante="superficie" icone={IconDownload}>{t("Exportar")}</BotaoLink>
                    </>
                }
            />

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="grid min-w-0 content-start gap-3">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_15rem]">
                        <VendasPorDia serie={serie} canais={canais} filtro={filtro} total={c.vendas} rodape={t(":n vendas · visão geral", { n: f.numero(c.qtdVendas) })} />
                        <Cartao corpo="p-5" className="justify-center">
                            <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
                                <Estatistica
                                    rotulo={t("Total de entradas")}
                                    valor={f.moeda(entradas)}
                                    rodape={anterior && vsAnterior ? <Variacao fracao={variacao(entradas, anterior.vendas + anterior.outrasEntradas)} rotulo={vsAnterior} formatar={pct} /> : t("Vendas e outras entradas")}
                                />
                                <Estatistica
                                    rotulo={t("Total de saídas")}
                                    valor={f.moeda(c.saidas)}
                                    rodape={anterior && vsAnterior ? <Variacao fracao={variacao(c.saidas, anterior.saidas)} rotulo={vsAnterior} formatar={pct} bomQuandoSobe={false} /> : t("Custos, despesas e investimento")}
                                />
                                <Estatistica
                                    rotulo={t("Saldo de caixa")}
                                    valor={f.moeda(c.saldo)}
                                    tom={c.saldo < 0 ? "negativo" : "neutro"}
                                    rodape={anterior && vsAnterior ? <Variacao fracao={variacao(c.saldo, anterior.saldo)} rotulo={vsAnterior} formatar={pct} /> : t("Entradas menos todas as saídas")}
                                />
                            </div>
                        </Cartao>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        {somaMetas > 0 ? (
                            <ProgressoMeta
                                titulo={t("Meta de vendas da feira")}
                                descricao={t(":n barraquinhas com meta", { n: comMeta.length })}
                                atual={vendidoComMeta}
                                meta={somaMetas}
                                formatar={f.moeda}
                                hrefEditar={rota("admin.barraquinhas.index")}
                                rotuloEditar={t("Editar metas")}
                            />
                        ) : (
                            <ProgressoMeta
                                titulo={t("Vagas preenchidas")}
                                descricao={t("Barraquinhas com nome nesta feira")}
                                atual={ocupadas.length}
                                meta={linhas.length}
                                formatar={(v) => f.numero(v)}
                                hrefEditar={rota("admin.barraquinhas.index")}
                                rotuloEditar={t("Gerenciar barraquinhas")}
                            />
                        )}
                        <ProximoPasso
                            pendencias={pendencias}
                            padrao={{ titulo: t("Tudo pronto para a feira"), texto: t("Acompanhe as vendas em tempo real e exporte o consolidado no fim."), href: rota("admin.relatorios.index"), rotulo: t("Ver relatórios") }}
                        />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                        <SaidasPorCategoria itens={saidasCategoria} total={c.saidas} />
                        <SaudeFinanceira indicadores={c} anterior={anterior} />
                        <Cartao className="md:col-span-2 2xl:col-span-1" titulo={t("Ranking de vendas")} descricao={somaMetas > 0 ? t("Vendido sobre a meta de cada barraquinha") : t("Barraquinhas que mais venderam")}>
                            {ranking.length ? (
                                <BarrasHorizontais
                                    formatarValor={f.moeda}
                                    dados={ranking.map((l, i) => ({
                                        rotulo: l.barraquinha.nome,
                                        valor: l.indicadores.vendas,
                                        maximo: l.indicadores.meta ?? undefined,
                                        detalhe: l.indicadores.meta ? `/ ${f.moedaCompacta(l.indicadores.meta)}` : undefined,
                                        cor: i === 0 ? "bg-secundaria" : "bg-primaria",
                                    }))}
                                />
                            ) : <Vazio titulo={t("Nenhuma venda no período.")} />}
                        </Cartao>
                    </div>

                    {negativas.length > 0 && (
                        <Faixa tom="perigo" icone={IconAlertTriangle} titulo={t("Resultado operacional negativo:")}>
                            {negativas.map((l) => l.barraquinha.nome).join(", ")}
                        </Faixa>
                    )}

                    <Cartao titulo={t("Comparativo das barraquinhas")} descricao={t("Clique numa barraquinha para abrir o painel dela.")} corpo="">
                        <Tabela
                            rotulo={t("Comparativo das barraquinhas")}
                            ordem={ordem}
                            direcao={direcao}
                            aoOrdenar={ordenar}
                            colunas={[
                                { chave: "nome", rotulo: t("Barraquinha"), ordenavel: true },
                                { chave: "vendas", rotulo: t("Vendas"), alinhar: "direita", ordenavel: true },
                                { chave: "saidas", rotulo: t("Saídas"), alinhar: "direita", ordenavel: true },
                                { chave: "saldo", rotulo: t("Saldo"), alinhar: "direita", ordenavel: true },
                                { chave: "resultado", rotulo: t("Resultado"), alinhar: "direita", ordenavel: true },
                                { chave: "margem", rotulo: t("Margem"), alinhar: "direita", ordenavel: true },
                                { chave: "qtd", rotulo: t("Nº de vendas"), alinhar: "direita", ordenavel: true, cartao: "oculta", className: "max-2xl:hidden" },
                            ]}
                            vazio={<Vazio icone={IconBuildingStore} titulo={t("Nenhuma barraquinha nesta feira")} />}
                        >
                            {linhas.map(({ barraquinha: b, indicadores: i }) => (
                                <Linha key={b.id} href={rota("admin.loja.painel", { barraquinha: b.id })}>
                                    <Celula cabecalho>
                                        <span className="flex items-center gap-2.5">
                                            <Avatar nome={b.nome} foto={b.foto} tamanho="md" forma="quadrada" />
                                            <span className={cx("truncate", b.vaga ? "text-tinta-fraca italic" : "font-semibold text-tinta")}>{b.nome}</span>
                                            {b.status.valor === "bloqueada" && <ChipStatus opcao={b.status} />}
                                            {i.resultado < 0 && <IconAlertTriangle size={15} className="shrink-0 text-negativo" aria-label={t("Resultado negativo")} />}
                                        </span>
                                    </Celula>
                                    <Celula direita>{f.moeda(i.vendas)}</Celula>
                                    <Celula direita>{f.moeda(i.saidas)}</Celula>
                                    <Celula direita className={i.saldo < 0 ? "text-negativo" : ""}>{f.moeda(i.saldo)}</Celula>
                                    <Celula direita className={i.resultado < 0 ? "text-negativo" : i.resultado > 0 ? "text-positivo" : ""}>{f.moeda(i.resultado)}</Celula>
                                    <Celula direita>{f.percentual(i.margem)}</Celula>
                                    <Celula direita className="max-2xl:hidden">{f.numero(i.qtdVendas)}</Celula>
                                </Linha>
                            ))}
                        </Tabela>
                    </Cartao>

                    <div className="grid gap-3 md:grid-cols-2">
                        <Cartao titulo={t("Vendas por tag")} descricao={t("Comum e cada Combo N, somando todas as barraquinhas.")} corpo="">
                            <TabelaTags tags={porTag} />
                        </Cartao>
                        <PorPagamento porPagamento={porPagamento} />
                    </div>
                </div>

                <aside className="grid min-w-0 content-start gap-3 md:grid-cols-2 xl:grid-cols-1">
                    <Cartao
                        titulo={t("Feira em uso")}
                        descricao={t("Ações rápidas")}
                        acoes={<BotaoLink href={rota("admin.feiras.create")} variante="secundario" tamanho="sm" icone={IconPlus}>{t("Nova feira")}</BotaoLink>}
                    >
                        <Identidade
                            titulo={feira.nome}
                            situacao={<ChipStatus opcao={feira.status} />}
                            linhas={[`${f.data(feira.dataInicio)} – ${f.data(feira.dataFim)}`, t(":n barraquinhas", { n: ocupadas.length })]}
                            valor={f.moedaCompacta(c.vendas)}
                            rotuloValor={t("Vendas")}
                            href={rota("admin.feiras.edit", { feira: feira.id })}
                        />
                        {outrasFeiras.length > 0 && (
                            <ul className="mt-2 flex flex-col border-t border-linha pt-2">
                                {outrasFeiras.map((o) => (
                                    <li key={o.id}>
                                        <button
                                            type="button"
                                            onClick={() => router.post(rota("admin.feiras.selecionar", { feira: o.id }), {}, { preserveScroll: true })}
                                            className="-mx-2 flex w-[calc(100%+1rem)] min-w-0 items-center gap-3 rounded-xl px-2 py-2 text-start outline-none transition-colors hover:bg-superficie-hover focus-visible:ring-2 focus-visible:ring-foco"
                                            aria-label={t("Usar :feira", { feira: o.nome })}
                                        >
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-corpo font-semibold text-tinta">{o.nome}</span>
                                                <span className="block text-micro text-tinta-suave">{o.status}</span>
                                            </span>
                                            <span className="shrink-0 text-rotulo font-semibold text-primaria-texto">{t("Usar esta feira")}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="mt-4">
                            <AcoesRapidas
                                acoes={[
                                    { rotulo: t("Barraquinhas"), icone: IconBuildingStore, href: rota("admin.barraquinhas.index"), destaque: true },
                                    { rotulo: t("Relatórios"), icone: IconFileAnalytics, href: rota("admin.relatorios.index") },
                                    { rotulo: t("Comparar"), icone: IconChartBar, href: rota("admin.comparar-feiras") },
                                    { rotulo: t("Categorias"), icone: IconTag, href: rota("admin.categorias.index") },
                                    { rotulo: t("Auditoria"), icone: IconShieldCheck, href: rota("admin.auditoria.index") },
                                ]}
                            />
                        </div>
                        {(seletorFeira?.barraquinhas.length ?? 0) > 0 && (
                            <div className="mt-5">
                                <p className="mb-2 text-corpo font-semibold text-tinta">{t("Acesso rápido")}</p>
                                <AcessoRapido itens={(seletorFeira?.barraquinhas ?? []).map((b) => ({ id: b.id, nome: b.nome, href: rota("admin.loja.painel", { barraquinha: b.id }), apagado: b.bloqueada, foto: b.foto }))} />
                            </div>
                        )}
                    </Cartao>

                    <Cartao titulo={t("Últimas vendas")} descricao={t("Atualiza sozinho a cada venda")} corpo="">
                        <ListaVendas vendas={ultimas} comBarraquinha hrefVenda={(v) => rota("admin.loja.vendas.show", { barraquinha: v.barraquinhaId, venda: v.id })} />
                    </Cartao>
                </aside>
            </div>
        </>
    );
}
