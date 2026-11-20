import { router, usePage } from "@inertiajs/react";
import { IconArrowDownRight, IconArrowUpRight, IconCalendar, IconPaperclip, IconPencil, IconTrash, IconWallet } from "@tabler/icons-react";
import { useState } from "react";
import { opcoesSelecao } from "@/components/painel/filtros";
import { Dica } from "@/components/ui/dica";
import { Botao, BotaoLink, classesBotao } from "@/components/ui/botao";
import { CampoData, Selecao } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { Confirmar } from "@/components/ui/dialogo";
import { TRACO } from "@/components/ui/icone";
import { ChipStatus } from "@/components/ui/marcadores";
import { Paginacao } from "@/components/ui/paginacao";
import { Celula, Linha, Tabela } from "@/components/ui/tabela";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { semVazios, useRotaLoja } from "@/lib/rotas";
import type { Opcao, Paginado } from "@/types/inertia";
import type { Lancamento } from "@/types/dominio";

interface Props {
    lancamentos: Paginado<Lancamento>;
    filtro: { tipo: string | null; de: string | null; ate: string | null };
    tipos: Opcao[];
}

export default function Index({ lancamentos, filtro, tipos }: Props) {
    const t = useT();
    const { data, moeda } = useFormato();
    const rotaLoja = useRotaLoja();
    const { loja } = usePage().props;
    const [excluindo, setExcluindo] = useState<Lancamento | null>(null);
    const editavel = !loja?.encerrada;

    const filtrar = (mudanca: Partial<Props["filtro"]>) =>
        router.get(window.location.pathname, semVazios({ ...filtro, ...mudanca }), { preserveState: true, preserveScroll: true });

    return (
        <>
            <CabecalhoPagina
                titulo={t("Entradas e saídas")}
                descricao={t("Lançamentos manuais que não são venda: patrocínio, rifa e aportes entram; custos, despesas e investimentos saem.")}
                acoes={editavel && (
                    <>
                        <BotaoLink href={rotaLoja("lancamentos.create", { tipo: "entrada" })} variante="secundario" icone={IconArrowDownRight}>{t("Nova entrada")}</BotaoLink>
                        <BotaoLink href={rotaLoja("lancamentos.create", { tipo: "saida" })} icone={IconArrowUpRight}>{t("Nova saída")}</BotaoLink>
                    </>
                )}
            />

            <Cartao className="mb-5" corpo="p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-3xl">
                    <Selecao rotulo={t("Tipo")} opcoes={opcoesSelecao(tipos)} vazio={t("Todos")} valor={filtro.tipo ?? ""} aoMudar={(tipo) => filtrar({ tipo })} />
                    <CampoData rotulo={t("De")} valor={filtro.de ?? ""} aoMudar={(de) => filtrar({ de })} />
                    <CampoData rotulo={t("Até")} valor={filtro.ate ?? ""} aoMudar={(ate) => filtrar({ ate })} />
                </div>
            </Cartao>

            <Cartao corpo="">
                <Tabela
                    rotulo={t("Lançamentos")}
                    colunas={[
                        { chave: "descricao", rotulo: t("Descrição"), icone: IconWallet },
                        { chave: "data", rotulo: t("Data"), icone: IconCalendar },
                        { chave: "tipo", rotulo: t("Tipo") },
                        { chave: "grupo", rotulo: t("Grupo"), cartao: "oculta" },
                        { chave: "categoria", rotulo: t("Categoria") },
                        { chave: "valor", rotulo: t("Valor"), alinhar: "direita" },
                        { chave: "acoes", rotulo: t("Ações") },
                    ]}
                    vazio={
                        <Vazio
                            icone={IconWallet}
                            titulo={t("Nenhum lançamento")}
                            descricao={editavel ? t("Registre patrocínios, compras e outras despesas da barraquinha.") : undefined}
                        />
                    }
                >
                    {lancamentos.dados.map((l) => {
                        const entrada = l.tipo.valor === "entrada";
                        return (
                            <Linha key={l.id}>
                                <Celula cabecalho>
                                    <span className="flex min-w-0 flex-col">
                                        <span className="font-medium text-tinta md:max-w-80 md:truncate">{l.descricao}</span>
                                        {l.autor && <span className="text-rotulo font-normal text-tinta-suave">{l.autor}</span>}
                                    </span>
                                </Celula>
                                <Celula className="whitespace-nowrap">{data(l.data)}</Celula>
                                <Celula><ChipStatus opcao={l.tipo} /></Celula>
                                <Celula>{l.grupo}</Celula>
                                <Celula>{l.categoria.label}</Celula>
                                <Celula direita>
                                    <span className={entrada ? "font-semibold text-positivo" : "font-semibold text-negativo"}>
                                        {entrada ? "+" : "−"}{moeda(l.valor)}
                                    </span>
                                </Celula>
                                <Celula>
                                    <span className="flex flex-wrap items-center justify-end gap-1 md:justify-start">
                                        {l.temComprovante && (
                                            <Dica rotulo={t("Ver comprovante")}>
                                            <a
                                                href={rotaLoja("lancamentos.comprovante", { lancamento: l.id })}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={classesBotao("fantasma", "sm", true)}
                                                aria-label={t("Ver comprovante")}
                                            >
                                                <IconPaperclip size={16} stroke={TRACO} aria-hidden />
                                            </a>
                                            </Dica>
                                        )}
                                        {editavel && (
                                            <>
                                                <BotaoLink href={rotaLoja("lancamentos.edit", { lancamento: l.id })} variante="fantasma" tamanho="sm" icone={IconPencil}>{t("Editar")}</BotaoLink>
                                                <Botao variante="fantasma" tamanho="sm" soIcone icone={IconTrash} onClick={() => setExcluindo(l)}>
                                                    {t("Excluir :nome", { nome: l.descricao })}
                                                </Botao>
                                            </>
                                        )}
                                    </span>
                                </Celula>
                            </Linha>
                        );
                    })}
                </Tabela>
                <Paginacao paginado={lancamentos} />
            </Cartao>

            <Confirmar
                aberto={excluindo !== null}
                aoFechar={() => setExcluindo(null)}
                titulo={t("Excluir :nome?", { nome: excluindo?.descricao ?? "" })}
                descricao={t("O lançamento sai dos totais, mas continua no histórico de auditoria.")}
                rotuloConfirmar={t("Excluir")}
                aoConfirmar={() =>
                    new Promise<void>((ok) => {
                        if (!excluindo) return ok();
                        router.delete(rotaLoja("lancamentos.destroy", { lancamento: excluindo.id }), { preserveScroll: true, onFinish: () => ok() });
                    })
                }
            />
        </>
    );
}
