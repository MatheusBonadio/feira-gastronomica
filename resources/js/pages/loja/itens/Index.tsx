import { router, usePage } from "@inertiajs/react";
import { IconAlertTriangle, IconBox, IconCoins, IconPencil, IconPlus, IconSearch, IconTag, IconTrash } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { Entrada } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao, PilulaStats, Vazio } from "@/components/ui/cartao";
import { Confirmar } from "@/components/ui/dialogo";
import { Chip } from "@/components/ui/marcadores";
import { Celula, Linha, Tabela, type Coluna } from "@/components/ui/tabela";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { useRotaLoja } from "@/lib/rotas";
import type { Item } from "@/types/dominio";
import type { Opcao } from "@/types/inertia";

export default function Index({ itens, canais }: { itens: Item[]; canais: Opcao[] }) {
    const t = useT();
    const { moeda, numero } = useFormato();
    const rotaLoja = useRotaLoja();
    const { loja } = usePage().props;
    const [excluindo, setExcluindo] = useState<Item | null>(null);
    const [busca, setBusca] = useState("");
    const editavel = !loja?.encerrada;

    const visiveis = useMemo(() => {
        const termo = busca.trim().toLocaleLowerCase();
        if (!termo) return itens;
        return itens.filter((i) => [i.nome, i.categoria, i.descricao].some((campo) => campo?.toLocaleLowerCase().includes(termo)));
    }, [itens, busca]);

    const ativos = itens.filter((i) => i.ativo).length;
    const esgotados = itens.filter((i) => i.estoqueRestante !== null && i.estoqueRestante <= 0).length;
    const vendidos = itens.reduce((soma, i) => soma + (i.vendidos ?? 0), 0);

    const colunas: Coluna[] = [
        { chave: "item", rotulo: t("Item"), icone: IconTag },
        { chave: "categoria", rotulo: t("Categoria"), cartao: "oculta" },
        ...canais.map((c): Coluna => ({ chave: `preco-${c.valor}`, rotulo: c.label, alinhar: "direita" })),
        { chave: "custo", rotulo: t("Custo"), alinhar: "direita" },
        { chave: "vendidos", rotulo: t("Vendidos"), alinhar: "direita" },
        { chave: "estoque", rotulo: t("Estoque"), alinhar: "direita" },
        ...(editavel ? [{ chave: "acoes", rotulo: t("Ações") } satisfies Coluna] : []),
    ];

    return (
        <>
            <CabecalhoPagina
                titulo={t("Itens")}
                descricao={t("Comidas, bebidas e sobremesas. Preço de Feira é o padrão; pré-venda e pós-evento são opcionais.")}
                acoes={editavel && <BotaoLink href={rotaLoja("itens.create")} icone={IconPlus} className="max-sm:h-11">{t("Novo item")}</BotaoLink>}
            >
                {itens.length > 0 && (
                    <PilulaStats
                        itens={[
                            { icone: IconTag, valor: numero(ativos), rotulo: t("ativos") },
                            { icone: IconCoins, valor: numero(vendidos), rotulo: t("unidades vendidas") },
                            { icone: IconAlertTriangle, valor: numero(esgotados), rotulo: t("esgotados") },
                        ]}
                    />
                )}
            </CabecalhoPagina>

            <Cartao
                corpo=""
                titulo={t("Cardápio")}
                icone={IconBox}
                descricao={t(":n itens", { n: numero(itens.length) })}
            >
                {itens.length > 0 && (
                    <div className="px-4 pb-3">
                        <Entrada
                            type="search"
                            icone={IconSearch}
                            aria-label={t("Buscar item")}
                            placeholder={t("Buscar por nome ou categoria")}
                            valor={busca}
                            aoMudar={setBusca}
                            className="sm:max-w-xs"
                        />
                    </div>
                )}
                <Tabela
                    rotulo={t("Itens")}
                    colunas={colunas}
                    vazio={
                        itens.length === 0 ? (
                            <Vazio
                                icone={IconTag}
                                titulo={t("Nenhum item cadastrado")}
                                descricao={t("Cadastre os itens antes de montar combos e vender.")}
                                acao={editavel && <BotaoLink href={rotaLoja("itens.create")} icone={IconPlus}>{t("Novo item")}</BotaoLink>}
                            />
                        ) : (
                            <Vazio icone={IconSearch} titulo={t("Nenhum item encontrado")} descricao={t("Tente outro termo de busca.")} />
                        )
                    }
                >
                    {visiveis.map((item) => (
                        <Linha key={item.id} apagada={!item.ativo}>
                            <Celula cabecalho>
                                <span className="flex min-w-0 flex-col">
                                    <span className="flex flex-wrap items-center gap-2">
                                        <span className={item.ativo ? "font-medium text-tinta" : "font-medium text-tinta-suave line-through"}>{item.nome}</span>
                                        {!item.ativo && <Chip>{t("Inativo")}</Chip>}
                                    </span>
                                    {item.descricao && <span className="text-rotulo text-tinta-suave">{item.descricao}</span>}
                                    {item.categoria && <span className="text-rotulo text-tinta-suave md:hidden">{item.categoria}</span>}
                                </span>
                            </Celula>
                            <Celula className="text-tinta-media">{item.categoria ?? "-"}</Celula>
                            {canais.map((c) => (
                                <Celula key={c.valor} direita>
                                    {item.precos[c.valor] !== null ? moeda(item.precos[c.valor]) : <span className="text-tinta-fraca">-</span>}
                                </Celula>
                            ))}
                            <Celula direita>{item.custo !== null ? moeda(item.custo) : <span className="text-tinta-fraca">-</span>}</Celula>
                            <Celula direita>{numero(item.vendidos)}</Celula>
                            <Celula direita>
                                {item.estoqueRestante === null ? (
                                    <span className="text-tinta-fraca">-</span>
                                ) : item.estoqueRestante <= 0 ? (
                                    <Chip tom="vermelho">{t("Esgotado")}</Chip>
                                ) : (
                                    numero(item.estoqueRestante)
                                )}
                            </Celula>
                            {editavel && (
                                <Celula>
                                    <span className="flex flex-wrap items-center justify-end gap-1 md:justify-start">
                                        <BotaoLink href={rotaLoja("itens.edit", { item: item.id })} variante="fantasma" tamanho="sm" icone={IconPencil} className="max-md:h-10">
                                            {t("Editar")}
                                        </BotaoLink>
                                        {!item.vendidos && (
                                            <Botao variante="fantasma" tamanho="sm" soIcone icone={IconTrash} className="max-md:size-10" onClick={() => setExcluindo(item)}>
                                                {t("Excluir :nome", { nome: item.nome })}
                                            </Botao>
                                        )}
                                    </span>
                                </Celula>
                            )}
                        </Linha>
                    ))}
                </Tabela>
            </Cartao>

            <Confirmar
                aberto={excluindo !== null}
                aoFechar={() => setExcluindo(null)}
                titulo={t("Excluir :nome?", { nome: excluindo?.nome ?? "" })}
                descricao={t("Só itens que nunca foram vendidos podem ser excluídos. Os demais são inativados.")}
                rotuloConfirmar={t("Excluir")}
                aoConfirmar={() =>
                    new Promise<void>((ok) => {
                        if (excluindo) router.delete(rotaLoja("itens.destroy", { item: excluindo.id }), { preserveScroll: true, onFinish: () => ok() });
                        else ok();
                    })
                }
            />
        </>
    );
}
