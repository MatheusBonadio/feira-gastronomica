import { router, usePage } from "@inertiajs/react";
import { IconArrowLeft, IconCircleX, IconInfoCircle, IconListDetails, IconReceipt } from "@tabler/icons-react";
import { useState } from "react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { AreaTexto } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao, Detalhe, Faixa } from "@/components/ui/cartao";
import { Confirmar } from "@/components/ui/dialogo";
import { ChipStatus, ChipTag, COR_CANAL, Pagamento, Ponto } from "@/components/ui/marcadores";
import { Celula, Linha, Tabela } from "@/components/ui/tabela";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { useRotaLoja } from "@/lib/rotas";
import type { Venda } from "@/types/dominio";

/** Detalhe da venda com preço, desconto e tag da época. Cancelar exige motivo e não apaga o registro. */
export default function Show({ venda }: { venda: Venda }) {
    const t = useT();
    const { dataHora, moeda, numero } = useFormato();
    const rotaLoja = useRotaLoja();
    const { loja, errors } = usePage().props;
    const [cancelando, setCancelando] = useState(false);
    const [motivo, setMotivo] = useState("");
    const linhas = venda.linhas ?? [];

    return (
        <>
            <CabecalhoPagina
                titulo={t("Venda #:n", { n: venda.numero })}
                descricao={venda.resumo}
                voltar={<BotaoLink href={rotaLoja("vendas.index")} variante="fantasma" tamanho="sm" icone={IconArrowLeft} className="self-start">{t("Vendas")}</BotaoLink>}
                acoes={!venda.cancelada && !loja?.encerrada && (
                    <Botao variante="perigo" icone={IconCircleX} onClick={() => setCancelando(true)}>{t("Cancelar venda")}</Botao>
                )}
            />

            {venda.cancelada && (
                <div className="mb-5">
                    <Faixa tom="perigo" icone={IconCircleX} titulo={t("Venda cancelada")}>
                        <p className="wrap-break-word">{venda.motivoCancelamento}</p>
                        <p className="mt-1 text-rotulo opacity-80">
                            {t("Por :quem em :quando", { quem: venda.canceladaPor ?? "—", quando: dataHora(venda.canceladaEm) })}
                        </p>
                    </Faixa>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <Cartao className="xl:col-span-2 xl:self-start" titulo={t("Itens da venda")} icone={IconListDetails} corpo="">
                    <Tabela
                        rotulo={t("Itens da venda")}
                        colunas={[
                            { chave: "item", rotulo: t("Item ou combo") },
                            { chave: "tag", rotulo: t("Tag") },
                            { chave: "qtd", rotulo: t("Qtd."), alinhar: "direita" },
                            { chave: "preco", rotulo: t("Preço unitário"), alinhar: "direita" },
                            { chave: "desconto", rotulo: t("Desconto"), alinhar: "direita" },
                            { chave: "total", rotulo: t("Total"), alinhar: "direita" },
                        ]}
                    >
                        {linhas.map((l, i) => (
                            <Linha key={i}>
                                <Celula cabecalho><span className="font-medium text-tinta">{l.descricao}</span></Celula>
                                <Celula><ChipTag rotulo={l.tag} combo={l.ehCombo} /></Celula>
                                <Celula direita>{numero(l.quantidade)}</Celula>
                                <Celula direita>{moeda(l.precoUnitario)}</Celula>
                                <Celula direita className={l.desconto > 0 ? "text-positivo" : undefined}>{l.desconto > 0 ? `−${moeda(l.desconto)}` : "—"}</Celula>
                                <Celula direita><span className="font-medium text-tinta">{moeda(l.total)}</span></Celula>
                            </Linha>
                        ))}
                    </Tabela>
                    <dl className="flex flex-col border-t border-linha px-4 py-2">
                        <Detalhe rotulo={t("Subtotal")}>{moeda(venda.subtotal)}</Detalhe>
                        <Detalhe rotulo={t("Desconto de combo")}>
                            <span className={venda.desconto > 0 ? "text-positivo" : undefined}>{venda.desconto > 0 ? `−${moeda(venda.desconto)}` : moeda(0)}</span>
                        </Detalhe>
                        <div className="flex items-baseline justify-between gap-4 border-t border-linha pt-3 pb-1">
                            <dt className="text-ui font-medium text-tinta">{t("Total")}</dt>
                            <dd className={venda.cancelada ? "text-numero font-semibold tabular-nums text-tinta-fraca line-through" : "text-numero font-semibold tabular-nums text-tinta"}>
                                {moeda(venda.total)}
                            </dd>
                        </div>
                    </dl>
                </Cartao>

                <div className="flex flex-col gap-4">
                    <Cartao titulo={t("Detalhes")} icone={IconReceipt} corpo="px-4 pb-2">
                        <dl className="flex flex-col divide-y divide-linha">
                            <Detalhe rotulo={t("Data e hora")}>{dataHora(venda.dataHora)}</Detalhe>
                            <Detalhe rotulo={t("Canal")}>
                                <span className="inline-flex items-center gap-2">
                                    <Ponto cor={COR_CANAL[venda.canal.valor] ?? "bg-linha-forte"} />
                                    {venda.canal.label}
                                </span>
                            </Detalhe>
                            <Detalhe rotulo={t("Pagamento")}><Pagamento opcao={venda.pagamento} /></Detalhe>
                            <Detalhe rotulo={t("Operador")}>{venda.operador ?? "—"}</Detalhe>
                            <Detalhe rotulo={t("Status")}><ChipStatus opcao={venda.status} /></Detalhe>
                        </dl>
                    </Cartao>
                    <Cartao titulo={t("Como o desconto é calculado")} icone={IconInfoCircle}>
                        <p className="text-corpo text-tinta-media">
                            {t("O sistema agrupa os itens no combo que dá mais desconto ao cliente. O que sobra fica como Comum. Preços e tags ficam gravados como eram no momento da venda.")}
                        </p>
                    </Cartao>
                </div>
            </div>

            <Confirmar
                aberto={cancelando}
                aoFechar={() => setCancelando(false)}
                titulo={t("Cancelar a venda #:n?", { n: venda.numero })}
                descricao={t("A venda fica registrada como cancelada e sai dos totais. Informe o motivo.")}
                rotuloConfirmar={t("Cancelar venda")}
                desabilitado={motivo.trim().length < 3}
                aoConfirmar={() =>
                    new Promise<void>((ok, falha) =>
                        router.patch(rotaLoja("vendas.cancelar", { venda: venda.id }), { motivo }, {
                            preserveScroll: true,
                            onSuccess: () => ok(),
                            onError: () => falha(new Error("motivo")),
                        }),
                    )
                }
            >
                <AreaTexto rotulo={t("Motivo")} required rows={3} maxLength={500} valor={motivo} aoMudar={setMotivo} erro={errors.motivo} />
            </Confirmar>
        </>
    );
}
