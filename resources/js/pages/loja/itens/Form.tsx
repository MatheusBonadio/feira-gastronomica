import { useForm } from "@inertiajs/react";
import { IconArrowLeft, IconBox, IconCoins, IconInfoCircle, IconReceipt, IconTag } from "@tabler/icons-react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { AreaTexto, CampoMoeda, CampoNumero, Entrada, Interruptor, Selecao } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao, Detalhe } from "@/components/ui/cartao";
import { Chip, COR_CANAL, Ponto } from "@/components/ui/marcadores";
import { cx } from "@/lib/cx";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { useRotaLoja } from "@/lib/rotas";
import type { Item } from "@/types/dominio";
import type { Opcao } from "@/types/inertia";

interface Props {
    item: Item | null;
    categorias: { id: number; nome: string }[];
    canais: Opcao[];
    canalPadrao: string;
}

export default function Form({ item, categorias, canais, canalPadrao }: Props) {
    const t = useT();
    const { moeda, percentual } = useFormato();
    const rotaLoja = useRotaLoja();
    const form = useForm({
        nome: item?.nome ?? "",
        categoria_id: (item?.categoriaId ?? categorias[0]?.id ?? null) as number | null,
        descricao: item?.descricao ?? "",
        custo: item?.custo ?? null,
        estoque_inicial: item?.estoqueInicial ?? null,
        ativo: item?.ativo ?? true,
        precos: Object.fromEntries(canais.map((c) => [c.valor, item?.precos[c.valor] ?? null])) as Record<string, number | null>,
    });
    const erros = form.errors as Record<string, string | undefined>;

    const precoFeira = form.data.precos[canalPadrao] ?? null;
    const custo = form.data.custo;
    const margens = canais.map((canal) => {
        const proprio = form.data.precos[canal.valor];
        const preco = proprio ?? precoFeira;
        const margem = preco && custo !== null ? (preco - custo) / preco : null;
        return { canal, preco, herdado: proprio === null && canal.valor !== canalPadrao, margem };
    });

    return (
        <>
            <CabecalhoPagina
                titulo={item ? t("Editar item") : t("Novo item")}
                descricao={item ? item.nome : t("Todo produto vendido existe como item antes de ser vendido ou entrar num combo.")}
                voltar={<BotaoLink href={rotaLoja("itens.index")} variante="fantasma" tamanho="sm" icone={IconArrowLeft} className="self-start">{t("Itens")}</BotaoLink>}
            />

            <form
                className="grid grid-cols-1 gap-4 lg:grid-cols-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (item) form.put(rotaLoja("itens.update", { item: item.id }));
                    else form.post(rotaLoja("itens.store"));
                }}
            >
                <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
                    <Cartao titulo={t("Identificação")} icone={IconTag}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Entrada
                                rotulo={t("Nome")}
                                placeholder={t("Ex.: Pastel de carne")}
                                dica={t("Único dentro da barraquinha.")}
                                required
                                maxLength={120}
                                valor={form.data.nome}
                                aoMudar={(v) => form.setData("nome", v)}
                                erro={erros.nome}
                            />
                            <Selecao
                                rotulo={t("Categoria")}
                                opcoes={categorias.map((c) => ({ valor: String(c.id), rotulo: c.nome }))}
                                valor={form.data.categoria_id ? String(form.data.categoria_id) : ""}
                                aoMudar={(v) => form.setData("categoria_id", v ? Number(v) : null)}
                                erro={erros.categoria_id}
                                required
                            />
                            <AreaTexto
                                className="sm:col-span-2"
                                rotulo={t("Descrição / composição")}
                                placeholder={t("Ex.: Frango com Catupiry")}
                                rows={2}
                                maxLength={500}
                                valor={form.data.descricao}
                                aoMudar={(v) => form.setData("descricao", v)}
                                erro={erros.descricao}
                            />
                        </div>
                    </Cartao>

                    <Cartao titulo={t("Preços por canal")} icone={IconCoins} descricao={t("Alterar o preço vale para as próximas vendas; as já registradas guardam o preço da época.")}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {canais.map((canal) => (
                                <CampoMoeda
                                    key={canal.valor}
                                    rotulo={
                                        <span className="inline-flex items-center gap-1.5">
                                            <Ponto cor={COR_CANAL[canal.valor] ?? "bg-linha-forte"} />
                                            {canal.label}
                                        </span>
                                    }
                                    dica={canal.valor === canalPadrao ? t("Obrigatório") : t("Vazio = preço de Feira")}
                                    required={canal.valor === canalPadrao}
                                    valor={form.data.precos[canal.valor]}
                                    aoMudar={(v) => form.setData("precos", { ...form.data.precos, [canal.valor]: v })}
                                    erro={erros[`precos.${canal.valor}`]}
                                />
                            ))}
                        </div>
                    </Cartao>

                    <Cartao titulo={t("Custo e estoque")} icone={IconBox} descricao={t("Opcionais. O custo alimenta a margem; o estoque mostra quanto resta.")}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <CampoMoeda rotulo={t("Custo unitário")} valor={form.data.custo} aoMudar={(v) => form.setData("custo", v)} erro={erros.custo} />
                            <CampoNumero
                                rotulo={t("Estoque inicial")}
                                min={0}
                                max={1000000}
                                valor={form.data.estoque_inicial}
                                aoMudar={(v) => form.setData("estoque_inicial", v)}
                                erro={erros.estoque_inicial}
                            />
                            <div className="sm:col-span-2">
                                <Interruptor ligado={form.data.ativo} aoMudar={(v) => form.setData("ativo", v)}>
                                    {t("Ativo (aparece na venda e pode entrar em combos)")}
                                </Interruptor>
                            </div>
                        </div>
                    </Cartao>
                </div>

                <aside className="flex min-w-0 flex-col gap-4 lg:row-span-2 lg:self-start">
                    <Cartao titulo={t("Margem por canal")} icone={IconReceipt} descricao={t("Prévia com o custo unitário informado.")}>
                        <dl className="-my-2.5 divide-y divide-linha">
                            {margens.map(({ canal, preco, herdado, margem }) => (
                                <Detalhe key={canal.valor} rotulo={canal.label}>
                                    <span className="flex flex-col items-end">
                                        <span className="tabular-nums">
                                            {preco ? moeda(preco) : "-"}
                                            {herdado && preco ? <span className="ms-1 text-rotulo font-normal text-tinta-suave">({t("Feira")})</span> : null}
                                        </span>
                                        {margem !== null && (
                                            <span className={cx("text-rotulo font-normal tabular-nums", margem < 0 ? "text-negativo" : "text-positivo")}>
                                                {t("margem :m", { m: percentual(margem) })}
                                            </span>
                                        )}
                                    </span>
                                </Detalhe>
                            ))}
                        </dl>
                        {custo === null && <p className="mt-3 text-rotulo text-tinta-suave">{t("Informe o custo unitário para ver a margem.")}</p>}
                    </Cartao>

                    {item && (
                        <Cartao titulo={t("Situação")} icone={IconInfoCircle}>
                            <dl className="-my-2.5 divide-y divide-linha">
                                <Detalhe rotulo={t("Status")}>{form.data.ativo ? <Chip tom="verde">{t("Ativo")}</Chip> : <Chip>{t("Inativo")}</Chip>}</Detalhe>
                                {item.estoqueRestante !== null && <Detalhe rotulo={t("Estoque restante")}>{item.estoqueRestante}</Detalhe>}
                            </dl>
                        </Cartao>
                    )}

                    <Cartao titulo={t("Como funciona")} icone={IconInfoCircle}>
                        <ul className="flex list-disc flex-col gap-2 ps-4 text-corpo text-tinta-media">
                            <li>{t("O preço de Feira é o padrão; pré-venda e pós-evento vazios usam o de Feira.")}</li>
                            <li>{t("Vendas já registradas guardam o preço da época.")}</li>
                            <li>{t("Item já vendido não é excluído: fica inativo e some da venda.")}</li>
                        </ul>
                    </Cartao>
                </aside>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end lg:col-span-2">
                    <BotaoLink href={rotaLoja("itens.index")} variante="secundario" className="max-sm:h-11">{t("Cancelar")}</BotaoLink>
                    <Botao type="submit" disabled={form.processing} className="max-sm:h-11">{t("Salvar item")}</Botao>
                </div>
            </form>
        </>
    );
}
