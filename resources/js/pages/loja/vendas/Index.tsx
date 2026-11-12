import { router, usePage } from "@inertiajs/react";
import { IconCalendar, IconCash, IconReceipt, IconShoppingCart, IconTag } from "@tabler/icons-react";
import { FiltrosVendas, opcoesSelecao, type FiltroVendas } from "@/components/painel/filtros";
import { BotaoLink } from "@/components/ui/botao";
import { Selecao } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { ChipStatus } from "@/components/ui/marcadores";
import { Paginacao } from "@/components/ui/paginacao";
import { Celula, Linha, Tabela } from "@/components/ui/tabela";
import { cx } from "@/lib/cx";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { semVazios, useRotaLoja } from "@/lib/rotas";
import type { Opcao, Paginado } from "@/types/inertia";
import type { Venda } from "@/types/dominio";

interface Props {
    vendas: Paginado<Venda>;
    filtro: FiltroVendas & { status?: string | null };
    canais: Opcao[];
    pagamentos: Opcao[];
    statusOpcoes: Opcao[];
    numerosCombo: number[];
}

/** Histórico de vendas da barraquinha. Canceladas ficam marcadas e fora dos totais. */
export default function Index({ vendas, filtro, canais, pagamentos, statusOpcoes, numerosCombo }: Props) {
    const t = useT();
    const { dataHora, moeda } = useFormato();
    const rotaLoja = useRotaLoja();
    const { loja } = usePage().props;
    const status = filtro.status ?? "";

    const filtrarStatus = (valor: string) =>
        router.get(window.location.pathname, semVazios({ ...filtro, status: valor }), { preserveState: true, preserveScroll: true });

    return (
        <>
            <CabecalhoPagina
                titulo={t("Vendas")}
                descricao={t("Canceladas aparecem marcadas e ficam fora dos totais.")}
                acoes={loja?.podeVender && !loja.encerrada && (
                    <BotaoLink href={rotaLoja("vendas.create")} icone={IconShoppingCart}>{t("Nova venda")}</BotaoLink>
                )}
            />

            <Cartao className="mb-5" corpo="p-4">
                {/* Remonta ao trocar o status, para o "Filtrar" não reaplicar o status antigo. */}
                <FiltrosVendas
                    key={status}
                    inicial={{ ...filtro, status: status || undefined }}
                    canais={canais}
                    pagamentos={pagamentos}
                    numerosCombo={numerosCombo}
                    extras={
                        <Selecao
                            className="w-40"
                            rotulo={t("Status")}
                            opcoes={opcoesSelecao(statusOpcoes)}
                            vazio={t("Todos")}
                            valor={status}
                            aoMudar={filtrarStatus}
                        />
                    }
                />
            </Cartao>

            <Cartao corpo="">
                <Tabela
                    rotulo={t("Vendas")}
                    colunas={[
                        { chave: "venda", rotulo: t("Venda"), icone: IconReceipt },
                        { chave: "data", rotulo: t("Data e hora"), icone: IconCalendar },
                        { chave: "classificacao", rotulo: t("Classificação"), icone: IconTag },
                        { chave: "canal", rotulo: t("Canal") },
                        { chave: "pagamento", rotulo: t("Pagamento"), icone: IconCash },
                        { chave: "desconto", rotulo: t("Desconto"), alinhar: "direita", cartao: "oculta" },
                        { chave: "total", rotulo: t("Total"), alinhar: "direita" },
                        { chave: "status", rotulo: t("Status") },
                    ]}
                    vazio={<Vazio icone={IconReceipt} titulo={t("Nenhuma venda encontrada")} descricao={t("Ajuste os filtros ou registre uma nova venda.")} />}
                >
                    {vendas.dados.map((v) => (
                        <Linha key={v.id} href={rotaLoja("vendas.show", { venda: v.id })} apagada={v.cancelada}>
                            <Celula cabecalho>
                                <span className="font-medium tabular-nums text-tinta">#{v.numero}</span>
                            </Celula>
                            <Celula className="whitespace-nowrap">{dataHora(v.dataHora)}</Celula>
                            <Celula className="md:max-w-72">
                                <span className="md:line-clamp-2">{v.resumo}</span>
                            </Celula>
                            <Celula><ChipStatus opcao={v.canal} /></Celula>
                            <Celula>{v.pagamento.label}</Celula>
                            <Celula direita>{v.desconto > 0 ? `−${moeda(v.desconto)}` : "—"}</Celula>
                            <Celula direita>
                                <span className={cx("font-semibold", v.cancelada ? "text-tinta-fraca line-through" : "text-tinta")}>{moeda(v.total)}</span>
                            </Celula>
                            <Celula><ChipStatus opcao={v.status} /></Celula>
                        </Linha>
                    ))}
                </Tabela>
                <Paginacao paginado={vendas} />
            </Cartao>
        </>
    );
}
