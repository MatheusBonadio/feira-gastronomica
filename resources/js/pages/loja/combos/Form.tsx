import { useForm } from "@inertiajs/react";
import { IconAlertTriangle, IconArrowLeft, IconCheck, IconDiscount, IconInfoCircle, IconMinus, IconPlus, IconSearch, IconStack2, IconTag } from "@tabler/icons-react";
import { Checkbox } from "radix-ui";
import { useMemo, useState } from "react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { CaixaSelecao, CampoMoeda, CampoNumero, Entrada, Segmentos } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao, Detalhe, Faixa, Vazio } from "@/components/ui/cartao";
import { TRACO } from "@/components/ui/icone";
import { Chip } from "@/components/ui/marcadores";
import { cx } from "@/lib/cx";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { useRotaLoja } from "@/lib/rotas";
import type { Combo, Item } from "@/types/dominio";
import type { Opcao } from "@/types/inertia";

interface Props {
    combo: Combo | null;
    itens: Item[];
    tiposDesconto: Opcao[];
}

const QTD_MAXIMA = 99;

function Quantidade({ valor, aoMudar, rotulo }: { valor: number; aoMudar: (valor: number) => void; rotulo: string }) {
    const t = useT();
    const classeBotao =
        "flex size-10 shrink-0 items-center justify-center rounded-controle border border-linha bg-superficie text-tinta outline-none transition-colors hover:bg-superficie-hover focus-visible:ring-2 focus-visible:ring-foco disabled:opacity-40";

    return (
        <div className="flex items-center gap-1.5" role="group" aria-label={rotulo}>
            <button type="button" className={classeBotao} onClick={() => aoMudar(valor - 1)} disabled={valor <= 1} aria-label={t("Diminuir")}>
                <IconMinus size={16} stroke={TRACO} aria-hidden />
            </button>
            <input
                type="number"
                inputMode="numeric"
                min={1}
                max={QTD_MAXIMA}
                value={valor}
                aria-label={rotulo}
                onChange={(e) => {
                    const n = Math.round(Number(e.target.value));
                    aoMudar(Number.isFinite(n) ? n : 1);
                }}
                className="h-10 w-12 rounded-controle border border-linha bg-superficie text-center text-ui font-semibold tabular-nums text-tinta outline-none focus:border-primaria focus:ring-3 focus:ring-primaria-suave [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button type="button" className={classeBotao} onClick={() => aoMudar(valor + 1)} disabled={valor >= QTD_MAXIMA} aria-label={t("Aumentar")}>
                <IconPlus size={16} stroke={TRACO} aria-hidden />
            </button>
        </div>
    );
}

export default function Form({ combo, itens, tiposDesconto }: Props) {
    const t = useT();
    const { moeda, numero, percentual } = useFormato();
    const rotaLoja = useRotaLoja();
    const [busca, setBusca] = useState("");

    const form = useForm({
        nome: combo?.nome ?? "",
        tipo_desconto: combo?.tipoDesconto.valor ?? "preco_fechado",
        valor: (combo?.valor ?? null) as number | null,
        selecionado: Object.fromEntries((combo?.itens ?? []).map((i) => [i.id, true])) as Record<number, boolean>,
        quantidade: Object.fromEntries((combo?.itens ?? []).map((i) => [i.id, i.quantidade])) as Record<number, number>,
        confirmar_sem_desconto: false,
    });
    const erros = form.errors as Record<string, string | undefined>;
    const erroItens = erros.itens ?? Object.entries(erros).find(([chave]) => chave.startsWith("itens."))?.[1];

    const qtd = (id: number) => form.data.quantidade[id] ?? 1;
    const marcados = itens.filter((i) => form.data.selecionado[i.id]);
    const unidades = marcados.reduce((soma, i) => soma + qtd(i.id), 0);
    const somaAvulsa = marcados.reduce((soma, i) => soma + i.precoFeira * qtd(i.id), 0);
    const fechado = form.data.tipo_desconto === "preco_fechado";
    const valor = form.data.valor ?? 0;
    const precoCombo = fechado ? valor : somaAvulsa * (1 - valor / 100);
    const economia = somaAvulsa - precoCombo;
    const descontoPct = somaAvulsa > 0 ? economia / somaAvulsa : null;
    const calculado = marcados.length > 0 && valor > 0;
    const semDesconto = calculado && precoCombo >= somaAvulsa;
    const maisCaro = calculado && precoCombo > somaAvulsa;

    const visiveis = useMemo(() => {
        const termo = busca.trim().toLocaleLowerCase();
        return termo ? itens.filter((i) => [i.nome, i.categoria].some((c) => c?.toLocaleLowerCase().includes(termo))) : itens;
    }, [itens, busca]);

    const alternar = (item: Item) => {
        const marcado = !form.data.selecionado[item.id];
        form.setData((dados) => ({
            ...dados,
            selecionado: { ...dados.selecionado, [item.id]: marcado },
            quantidade: marcado && !dados.quantidade[item.id] ? { ...dados.quantidade, [item.id]: 1 } : dados.quantidade,
        }));
    };
    const definirQtd = (id: number, n: number) => form.setData("quantidade", { ...form.data.quantidade, [id]: Math.min(QTD_MAXIMA, Math.max(1, n)) });

    return (
        <>
            <CabecalhoPagina
                titulo={combo ? t("Editar :tag", { tag: combo.tag }) : t("Novo combo")}
                descricao={combo ? combo.nome : t("A tag (Combo 1, Combo 2...) é numerada automaticamente.")}
                voltar={<BotaoLink href={rotaLoja("combos.index")} variante="fantasma" tamanho="sm" icone={IconArrowLeft} className="self-start">{t("Combos")}</BotaoLink>}
            />

            <form
                className="grid grid-cols-1 gap-4 lg:grid-cols-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (combo) form.put(rotaLoja("combos.update", { combo: combo.id }));
                    else form.post(rotaLoja("combos.store"));
                }}
            >
                <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
                    <Cartao titulo={t("Identificação")} icone={IconTag}>
                        <Entrada
                            rotulo={t("Nome do combo")}
                            placeholder={t("Ex.: Combo do Guerreiro")}
                            required
                            maxLength={120}
                            valor={form.data.nome}
                            aoMudar={(v) => form.setData("nome", v)}
                            erro={erros.nome}
                        />
                    </Cartao>

                    <Cartao
                        titulo={t("Itens do combo")}
                        icone={IconStack2}
                        descricao={t("Marque os itens e informe quantos de cada. Mínimo de 2 unidades.")}
                        acoes={marcados.length > 0 && <Chip tom="primaria">{t(":n un.", { n: numero(unidades) })}</Chip>}
                    >
                        {itens.length === 0 ? (
                            <Vazio
                                icone={IconTag}
                                titulo={t("Nenhum item ativo")}
                                descricao={t("Cadastre os itens antes de montar o combo.")}
                                acao={<BotaoLink href={rotaLoja("itens.create")} icone={IconPlus}>{t("Novo item")}</BotaoLink>}
                            />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {itens.length > 8 && (
                                    <Entrada
                                        type="search"
                                        icone={IconSearch}
                                        aria-label={t("Buscar item")}
                                        placeholder={t("Buscar por nome ou categoria")}
                                        valor={busca}
                                        aoMudar={setBusca}
                                    />
                                )}
                                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {visiveis.map((item) => {
                                        const marcado = !!form.data.selecionado[item.id];
                                        const bloqueado = !item.ativo && !marcado;
                                        return (
                                            <li
                                                key={item.id}
                                                className={cx(
                                                    "flex min-w-0 flex-col rounded-xl border transition-colors",
                                                    marcado ? "border-primaria bg-primaria-suave" : "border-linha bg-superficie",
                                                    bloqueado && "opacity-50",
                                                )}
                                            >
                                                <Checkbox.Root
                                                    checked={marcado}
                                                    disabled={bloqueado}
                                                    onCheckedChange={() => alternar(item)}
                                                    className={cx(
                                                        "flex min-h-14 items-center gap-3 rounded-xl px-3 py-2.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-foco",
                                                        !bloqueado && !marcado && "hover:bg-superficie-hover",
                                                    )}
                                                >
                                                    <span
                                                        aria-hidden
                                                        className={cx(
                                                            "flex size-5 shrink-0 items-center justify-center rounded-md border",
                                                            marcado ? "border-primaria bg-primaria text-primaria-tinta" : "border-linha-forte bg-superficie",
                                                        )}
                                                    >
                                                        {marcado && <IconCheck size={14} stroke={2.5} />}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-ui font-medium text-tinta">{item.nome}</span>
                                                        <span className="block truncate text-rotulo text-tinta-suave">
                                                            {[item.categoria, !item.ativo ? t("inativo") : null].filter(Boolean).join(" · ") || " "}
                                                        </span>
                                                    </span>
                                                    <span className="shrink-0 text-corpo font-medium tabular-nums text-tinta">{moeda(item.precoFeira)}</span>
                                                </Checkbox.Root>
                                                {marcado && (
                                                    <div className="flex items-center justify-between gap-3 border-t border-primaria/15 px-3 py-2">
                                                        <span className="text-rotulo text-tinta-media">
                                                            {t("Subtotal")} <span className="font-medium tabular-nums text-tinta">{moeda(item.precoFeira * qtd(item.id))}</span>
                                                        </span>
                                                        <Quantidade valor={qtd(item.id)} aoMudar={(n) => definirQtd(item.id, n)} rotulo={t("Quantidade de :nome", { nome: item.nome })} />
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                                {visiveis.length === 0 && <p className="py-4 text-center text-corpo text-tinta-suave">{t("Nenhum item encontrado")}</p>}
                            </div>
                        )}
                        {erroItens && <p role="alert" className="mt-3 text-rotulo text-negativo">{erroItens}</p>}
                    </Cartao>

                    <Cartao titulo={t("Desconto")} icone={IconDiscount}>
                        <div className="flex flex-col gap-4">
                            <Segmentos
                                rotulo={t("Forma de desconto")}
                                opcoes={tiposDesconto.map((tipo) => ({ valor: tipo.valor, rotulo: tipo.label }))}
                                valor={form.data.tipo_desconto}
                                aoMudar={(v) => form.setData("tipo_desconto", v)}
                                cheio
                                grande
                            />

                            {fechado ? (
                                <CampoMoeda
                                    rotulo={t("Preço do combo")}
                                    required
                                    valor={form.data.valor}
                                    aoMudar={(v) => form.setData("valor", v)}
                                    erro={erros.valor}
                                    className="sm:max-w-xs"
                                />
                            ) : (
                                <CampoNumero
                                    rotulo={t("Percentual de desconto (%)")}
                                    dica={t("Sobre a soma avulsa (preço de Feira).")}
                                    required
                                    min={0.01}
                                    max={99.99}
                                    step={0.01}
                                    inputMode="decimal"
                                    valor={form.data.valor}
                                    aoMudar={(v) => form.setData("valor", v)}
                                    erro={erros.valor}
                                    className="sm:max-w-xs"
                                />
                            )}

                            {calculado && !semDesconto && (
                                <p className="rounded-xl bg-superficie-suave px-4 py-3 text-corpo text-tinta">
                                    {fechado
                                        ? t("Preço fechado equivale a :pct de desconto sobre a soma avulsa.", { pct: percentual(descontoPct) })
                                        : <>{t("Preço do combo:")} <span className="font-semibold tabular-nums">{moeda(precoCombo)}</span></>}
                                </p>
                            )}

                            {(semDesconto || erros.confirmar_sem_desconto) && (
                                <Faixa tom="aviso" icone={IconAlertTriangle} titulo={erros.confirmar_sem_desconto ?? t("O preço do combo não é menor que a soma avulsa: não há desconto.")}>
                                    {maisCaro && <p className="mt-1">{t("Na venda, um combo mais caro que os itens separados nunca é aplicado: o cliente paga os itens avulsos.")}</p>}
                                    <div className="mt-2">
                                        <CaixaSelecao marcado={form.data.confirmar_sem_desconto} aoMudar={(v) => form.setData("confirmar_sem_desconto", v)}>
                                            {t("Salvar mesmo assim")}
                                        </CaixaSelecao>
                                    </div>
                                </Faixa>
                            )}
                        </div>
                    </Cartao>
                </div>

                <aside className="flex min-w-0 flex-col gap-4 lg:row-span-2 lg:self-start">
                    <section className="flex flex-col gap-3 rounded-cartao border border-primaria bg-primaria p-4 text-primaria-tinta">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-corpo font-medium text-primaria-tinta/80">{combo?.tag ?? t("Novo combo")}</span>
                            {calculado && descontoPct !== null && descontoPct > 0 && (
                                <span className="rounded-full bg-secundaria px-2 py-0.5 text-rotulo font-semibold text-secundaria-tinta">−{percentual(descontoPct)}</span>
                            )}
                        </div>
                        <div>
                            <p className="text-rotulo text-primaria-tinta/75">{t("Preço do combo")}</p>
                            <p className="text-numero font-semibold tracking-tight tabular-nums">{calculado ? moeda(precoCombo) : "-"}</p>
                        </div>
                        <p className="text-rotulo text-primaria-tinta/75">
                            {calculado && economia > 0
                                ? t("O cliente economiza :valor em relação aos itens separados.", { valor: moeda(economia) })
                                : t("Escolha os itens e o desconto para ver o preço final.")}
                        </p>
                    </section>

                    <Cartao titulo={t("Resumo do combo")} icone={IconStack2}>
                        {marcados.length === 0 ? (
                            <p className="text-corpo text-tinta-suave">{t("Nenhum item marcado.")}</p>
                        ) : (
                            <ul className="mb-2 flex flex-col gap-1.5">
                                {marcados.map((i) => (
                                    <li key={i.id} className="flex items-baseline gap-2 text-corpo">
                                        <span className="w-7 shrink-0 font-semibold tabular-nums text-tinta">{qtd(i.id)}×</span>
                                        <span className="min-w-0 flex-1 truncate text-tinta-media">{i.nome}</span>
                                        <span className="shrink-0 tabular-nums text-tinta">{moeda(i.precoFeira * qtd(i.id))}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <dl className="divide-y divide-linha border-t border-linha">
                            <Detalhe rotulo={t("Soma avulsa (preço de Feira)")}>{moeda(somaAvulsa)}</Detalhe>
                            <Detalhe rotulo={t("Preço do combo")}>{calculado ? moeda(precoCombo) : "-"}</Detalhe>
                            <Detalhe rotulo={t("Desconto para o cliente")}>
                                {calculado ? (
                                    <span className={cx("tabular-nums", economia > 0 ? "text-positivo" : "text-negativo")}>
                                        {moeda(economia)} ({percentual(descontoPct)})
                                    </span>
                                ) : "-"}
                            </Detalhe>
                        </dl>
                        {marcados.length > 0 && unidades < 2 && (
                            <p className="mt-2 flex items-center gap-1.5 text-rotulo text-ambar-tinta">
                                <IconAlertTriangle size={14} stroke={TRACO} aria-hidden />
                                {t("O combo precisa de pelo menos 2 itens (ou 2 unidades).")}
                            </p>
                        )}
                    </Cartao>

                    <Cartao titulo={t("Como funciona")} icone={IconInfoCircle}>
                        <ul className="flex list-disc flex-col gap-2 ps-4 text-corpo text-tinta-media">
                            <li>{t("Na venda, o carrinho vira Combo N sozinho quando fecha a composição.")}</li>
                            <li>{t("Se houver mais de um jeito de montar combos, vale o que dá mais desconto ao cliente.")}</li>
                            <li>{t("Combo que já teve vendas não é excluído, só desativado.")}</li>
                        </ul>
                    </Cartao>
                </aside>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end lg:col-span-2">
                    <BotaoLink href={rotaLoja("combos.index")} variante="secundario" className="max-sm:h-11">{t("Cancelar")}</BotaoLink>
                    <Botao type="submit" disabled={form.processing} className="max-sm:h-11">{t("Salvar combo")}</Botao>
                </div>
            </form>
        </>
    );
}
