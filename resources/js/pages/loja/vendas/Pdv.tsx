import { Head, router, usePage } from "@inertiajs/react";
import { IconChevronUp, IconCopy, IconLock, IconMinus, IconPlus, IconSearch, IconShoppingCart, IconTrash, IconX } from "@tabler/icons-react";
import { useEffect, useId, useMemo, useState } from "react";
import { avisar } from "@/components/ui/avisos";
import { Botao } from "@/components/ui/botao";
import { CampoMoeda, Entrada, Segmentos } from "@/components/ui/campos";
import { Confirmar, Folha } from "@/components/ui/dialogo";
import { Cartao, Faixa, Vazio } from "@/components/ui/cartao";
import { TRACO } from "@/components/ui/icone";
import { ChipTag, COR_CANAL, Contador, ICONE_PAGAMENTO, Pagamento } from "@/components/ui/marcadores";
import { cx } from "@/lib/cx";
import { useMidia } from "@/lib/midia";
import { useFormato } from "@/lib/formato";
import { postarJson } from "@/lib/http";
import { useT } from "@/lib/i18n";
import { useRotaLoja } from "@/lib/rotas";
import type { Opcao } from "@/types/inertia";
import type { Combo, Item, PreferenciasCheckout } from "@/types/dominio";

interface Props {
    itens: Item[];
    combos: Combo[];
    canais: Opcao[];
    pagamentos: Opcao[];
    canalInicial: string;
    checkout: PreferenciasCheckout;
    preVenda: { aberta: boolean; corte: string | null };
}

interface Previa {
    linhas: { tag: string; combo: boolean; combo_id: number | null; descricao: string; quantidade: number; preco_unitario: number; desconto: number; total: number }[];
    resumo: string;
    subtotal: number;
    desconto: number;
    total: number;
}

type Carrinho = Record<number, number>;

const precoNoCanal = (item: Item, canal: string) => item.precos[canal] ?? item.precos.feira ?? item.precoFeira;

/** Null quando o combo não vale no canal. */
const comboNoCanal = (combo: Combo, canal: string) => {
    const regra = combo.canais[canal];
    return regra ? { preco: regra.preco, economia: Math.round((regra.somaAvulsa - regra.preco) * 100) / 100 } : null;
};

const normalizar = (texto: string) => texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function Pdv({ itens, combos, canais, pagamentos, canalInicial, checkout, preVenda }: Props) {
    const desktop = useMidia("(min-width: 64rem)");
    const t = useT();
    const { moeda, dataHora } = useFormato();
    const rotaLoja = useRotaLoja();
    const { loja } = usePage().props;

    const [canal, setCanal] = useState(canalInicial);
    const [pagamento, setPagamento] = useState<string | null>(checkout.pagamentoPadrao);
    const [recebido, setRecebido] = useState<number | null>(null);
    const [confirmando, setConfirmando] = useState(false);
    const [carrinho, setCarrinho] = useState<Carrinho>({});
    const [previa, setPrevia] = useState<Previa | null>(null);
    const [calculando, setCalculando] = useState(false);
    const [falhaPrevia, setFalhaPrevia] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [busca, setBusca] = useState("");
    const [folhaAberta, setFolhaAberta] = useState(false);
    const [preVendaAberta, setPreVendaAberta] = useState(preVenda.aberta);

    const quantidade = Object.values(carrinho).reduce((a, b) => a + b, 0);

    const porCategoria = useMemo(() => {
        const termo = normalizar(busca.trim());
        const grupos = new Map<string, Item[]>();
        for (const item of itens) {
            if (termo && !normalizar(item.nome).includes(termo)) continue;
            const chave = checkout.agruparCategorias ? (item.categoria ?? "") : "";
            grupos.set(chave, [...(grupos.get(chave) ?? []), item]);
        }
        return [...grupos.entries()];
    }, [itens, busca, checkout.agruparCategorias]);

    // O classificador só aplica o combo nos canais em que ele vale e quando sai mais barato que os itens avulsos.
    const combosVisiveis = useMemo(() => {
        if (!checkout.mostrarCombos) return [];
        const termo = normalizar(busca.trim());
        return combos.flatMap((combo) => {
            const noCanal = comboNoCanal(combo, canal);
            if (!noCanal || noCanal.economia < 0) return [];
            if (termo && ![combo.tag, combo.nome, ...combo.itens.map((i) => i.nome)].some((texto) => normalizar(texto).includes(termo))) return [];
            return [{ combo, ...noCanal }];
        });
    }, [combos, canal, busca, checkout.mostrarCombos]);

    const combosNoCarrinho = useMemo(() => {
        const vezes = new Map<number, number>();
        for (const linha of previa?.linhas ?? []) {
            if (linha.combo_id !== null) vezes.set(linha.combo_id, (vezes.get(linha.combo_id) ?? 0) + linha.quantidade);
        }
        return vezes;
    }, [previa]);

    const alterar = (item: Item, delta: number) =>
        setCarrinho((atual) => {
            const proxima = Math.max(0, Math.min(999, (atual[item.id] ?? 0) + delta));
            const { [item.id]: _removido, ...resto } = atual;
            return proxima > 0 ? { ...resto, [item.id]: proxima } : resto;
        });

    // Lançar um combo põe todos os itens dele no carrinho; o servidor reconhece o combo e aplica o desconto.
    const alterarCombo = (combo: Combo, delta: 1 | -1) =>
        setCarrinho((atual) => {
            if (delta < 0 && combo.itens.some((i) => (atual[i.id] ?? 0) < i.quantidade)) return atual;
            const proximo = { ...atual };
            for (const i of combo.itens) {
                const quantidade = Math.max(0, Math.min(999, (proximo[i.id] ?? 0) + i.quantidade * delta));
                if (quantidade > 0) proximo[i.id] = quantidade;
                else delete proximo[i.id];
            }
            return proximo;
        });

    // Fecha a pré-venda na tela se o corte passar com o PDV aberto; o servidor confere de novo ao registrar.
    useEffect(() => {
        if (!preVendaAberta || !preVenda.corte) return;
        const restante = Date.parse(preVenda.corte) - Date.now();
        if (restante > 2 ** 31 - 1) return;
        const espera = window.setTimeout(() => setPreVendaAberta(false), Math.max(0, restante + 1000));
        return () => window.clearTimeout(espera);
    }, [preVendaAberta, preVenda.corte]);

    useEffect(() => {
        if (preVendaAberta || canal !== "pre_venda") return;
        setCanal("feira");
        avisar(t("A pré-venda encerrou. A venda passou para o canal Feira."), "info");
    }, [preVendaAberta, canal, t]);

    useEffect(() => {
        if (quantidade === 0) {
            setPrevia(null);
            setCalculando(false);
            setFalhaPrevia(false);
            return;
        }
        const controle = new AbortController();
        setCalculando(true);
        const espera = window.setTimeout(() => {
            postarJson<Previa>(rotaLoja("vendas.simular"), { canal, itens: carrinho }, controle.signal)
                .then((resultado) => {
                    setPrevia(resultado);
                    setFalhaPrevia(false);
                    setCalculando(false);
                })
                .catch((erro: Error) => {
                    if (erro.name === "AbortError") return;
                    setPrevia(null);
                    setFalhaPrevia(true);
                    setCalculando(false);
                });
        }, 200);
        return () => {
            window.clearTimeout(espera);
            controle.abort();
        };
    }, [carrinho, canal, quantidade, rotaLoja]);

    const limpar = () => {
        setCarrinho({});
        setFolhaAberta(false);
    };

    const confirmar = () => {
        if (quantidade === 0) return;
        if (!pagamento) {
            avisar(t("Escolha a forma de pagamento."), "erro");
            return;
        }
        if (checkout.confirmarAntes && !confirmando) {
            setConfirmando(true);
            return;
        }
        router.post(
            rotaLoja("vendas.store"),
            { canal, pagamento, itens: carrinho },
            {
                preserveScroll: true,
                onStart: () => setEnviando(true),
                onFinish: () => {
                    setEnviando(false);
                    setConfirmando(false);
                },
                onSuccess: () => {
                    setCarrinho({});
                    setPagamento(checkout.pagamentoPadrao);
                    setRecebido(null);
                    setBusca("");
                    setFolhaAberta(false);
                },
                onError: (erros) => avisar(Object.values(erros)[0] ?? t("Não foi possível registrar a venda."), "erro"),
            },
        );
    };

    if (loja?.encerrada) {
        return (
            <>
                <Head title={t("Nova venda")} />
                <Cartao>
                    <Vazio icone={IconLock} titulo={t("Feira encerrada")} descricao={t("Novas vendas estão bloqueadas.")} />
                </Cartao>
            </>
        );
    }

    const propsCarrinho = {
        previa,
        quantidade,
        calculando,
        falhaPrevia,
        pagamentos,
        pagamento,
        aoPagar: setPagamento,
        checkout,
        recebido,
        aoReceber: setRecebido,
        aoLimpar: limpar,
        aoConfirmar: confirmar,
        enviando,
    };

    return (
        <>
            <Head title={t("Nova venda")} />

            <div className="pb-28 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-6 lg:pb-0 2xl:grid-cols-[minmax(0,1fr)_25rem]">
                <div className="min-w-0">
                    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <h1 className="text-cabecalho font-medium tracking-tight text-tinta">{t("Nova venda")}</h1>
                        <div className="flex flex-col gap-2 md:w-[26rem]">
                            <Segmentos
                                rotulo={t("Canal da venda")}
                                opcoes={canais.map((o) => ({ valor: o.valor, rotulo: o.label, desabilitado: o.valor === "pre_venda" && !preVendaAberta }))}
                                valor={canal}
                                aoMudar={setCanal}
                                cores={COR_CANAL}
                                cheio
                                grande
                            />
                            {!preVendaAberta && (
                                <Faixa icone={IconLock}>
                                    {t("Pré-venda encerrada em :data. Registre as vendas pelos canais Feira ou Pós-evento.", { data: dataHora(preVenda.corte) })}
                                </Faixa>
                            )}
                        </div>
                    </div>

                    {itens.length > 8 && (
                        <Entrada
                            className="mb-5"
                            type="search"
                            icone={IconSearch}
                            placeholder={t("Buscar item")}
                            aria-label={t("Buscar item")}
                            valor={busca}
                            aoMudar={setBusca}
                        />
                    )}

                    {itens.length === 0 && (
                        <Cartao>
                            <Vazio icone={IconShoppingCart} titulo={t("Nenhum item ativo")} descricao={t("Cadastre os itens da barraquinha para começar a vender.")} />
                        </Cartao>
                    )}

                    {itens.length > 0 && porCategoria.length === 0 && combosVisiveis.length === 0 && (
                        <p className="mb-5 text-corpo text-tinta-suave">{t("Nenhum item encontrado para “:busca”.", { busca })}</p>
                    )}

                    {combosVisiveis.length > 0 && (
                        <section className="@container mb-6" aria-label={t("Combos")}>
                            <h2 className="mb-2 text-micro font-semibold tracking-wide text-tinta-suave uppercase">{t("Combos")}</h2>
                            <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2 @3xl:grid-cols-3 @6xl:grid-cols-4">
                                {combosVisiveis.map(({ combo, preco, economia }) => (
                                    <CartaoCombo
                                        key={combo.id}
                                        combo={combo}
                                        preco={preco}
                                        economia={economia}
                                        vezes={combosNoCarrinho.get(combo.id) ?? 0}
                                        aoAlterar={(delta) => alterarCombo(combo, delta)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {porCategoria.map(([categoria, lista]) => (
                        <section key={categoria} className="mb-6" aria-label={categoria || t("Itens")}>
                            {categoria && <h2 className="mb-2 text-micro font-semibold tracking-wide text-tinta-suave uppercase">{categoria}</h2>}
                            {checkout.exibicao === "lista" ? (
                                <ul className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                                    {lista.map((item) => (
                                        <LinhaItem
                                            key={item.id}
                                            item={item}
                                            preco={precoNoCanal(item, canal)}
                                            quantidade={carrinho[item.id] ?? 0}
                                            aoAlterar={(delta) => alterar(item, delta)}
                                        />
                                    ))}
                                </ul>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                    {lista.map((item) => (
                                        <CartaoItem
                                            key={item.id}
                                            item={item}
                                            preco={precoNoCanal(item, canal)}
                                            quantidade={carrinho[item.id] ?? 0}
                                            aoAlterar={(delta) => alterar(item, delta)}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    ))}
                </div>

                <aside className="sticky top-[calc(var(--spacing-topbar)+1.5rem)] hidden max-h-[calc(100dvh-var(--spacing-topbar)-3rem)] flex-col overflow-hidden rounded-cartao border border-linha bg-superficie lg:flex">
                    <div className="rolagem-fina min-h-0 overflow-y-auto p-4">
                        <ConteudoCarrinho {...propsCarrinho} />
                    </div>
                </aside>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-superficie px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-flutuante lg:hidden">
                <div className="mx-auto flex max-w-3xl items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setFolhaAberta(true)}
                        disabled={quantidade === 0}
                        aria-haspopup="dialog"
                        aria-expanded={folhaAberta}
                        className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-controle text-start outline-none focus-visible:ring-2 focus-visible:ring-foco disabled:opacity-60"
                    >
                        <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-superficie-suave text-tinta-media">
                            <IconShoppingCart size={22} stroke={TRACO} aria-hidden />
                            {quantidade > 0 && (
                                <span className="absolute -top-1 -inset-e-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-secundaria px-1 text-micro font-semibold tabular-nums text-secundaria-tinta">
                                    {quantidade}
                                </span>
                            )}
                        </span>
                        <span className="flex min-w-0 flex-col">
                            <span className="truncate text-rotulo text-tinta-suave">
                                {quantidade === 0 ? t("Carrinho vazio") : t(":n itens · ver carrinho", { n: quantidade })}
                            </span>
                            <span className={cx("text-titulo font-semibold tabular-nums text-tinta transition-opacity", calculando && "opacity-50")}>
                                {previa ? moeda(previa.total) : moeda(0)}
                            </span>
                        </span>
                        {quantidade > 0 && <IconChevronUp size={18} stroke={TRACO} className="ms-auto shrink-0 text-tinta-suave" aria-hidden />}
                    </button>
                    <Botao tamanho="lg" disabled={quantidade === 0} onClick={() => setFolhaAberta(true)}>
                        {t("Registrar venda")}
                    </Botao>
                </div>
            </div>

            <Folha aberta={folhaAberta && !desktop} aoFechar={() => setFolhaAberta(false)} titulo={t("Carrinho")} ocultarCabecalho semFechar corpo="rolagem-fina min-h-0 overflow-y-auto px-4 pt-3 pb-4">
                <ConteudoCarrinho {...propsCarrinho} aoFechar={() => setFolhaAberta(false)} />
            </Folha>

            <Confirmar
                aberto={confirmando}
                aoFechar={() => !enviando && setConfirmando(false)}
                titulo={t("Registrar esta venda?")}
                rotuloConfirmar={enviando ? t("Registrando…") : t("Registrar venda")}
                perigo={false}
                desabilitado={enviando}
                aoConfirmar={confirmar}
            >
                <dl className="flex flex-col gap-2 text-corpo">
                    <div className="flex justify-between gap-4">
                        <dt className="text-tinta-suave">{t(":n itens", { n: quantidade })}</dt>
                        <dd className="text-titulo font-semibold tabular-nums text-tinta">{previa ? moeda(previa.total) : "-"}</dd>
                    </div>
                    {pagamento && (
                        <div className="flex justify-between gap-4">
                            <dt className="text-tinta-suave">{t("Pagamento")}</dt>
                            <dd className="text-tinta">
                                <Pagamento opcao={pagamentos.find((p) => p.valor === pagamento) ?? { valor: pagamento, label: pagamento }} />
                            </dd>
                        </div>
                    )}
                    {pagamento === "dinheiro" && recebido !== null && previa && recebido >= previa.total && (
                        <div className="flex justify-between gap-4">
                            <dt className="text-tinta-suave">{t("Troco")}</dt>
                            <dd className="font-semibold tabular-nums text-tinta">{moeda(recebido - previa.total)}</dd>
                        </div>
                    )}
                </dl>
            </Confirmar>
        </>
    );
}

function CartaoItem({ item, preco, quantidade, aoAlterar }: { item: Item; preco: number | null; quantidade: number; aoAlterar: (delta: number) => void }) {
    const t = useT();
    const { moeda, numero } = useFormato();
    const restante = item.estoqueRestante !== null ? item.estoqueRestante - quantidade : null;
    const esgotado = restante !== null && restante <= 0;

    return (
        <div
            className={cx(
                "relative flex min-w-0 flex-col overflow-hidden rounded-cartao border bg-superficie transition-colors",
                quantidade > 0 ? "border-primaria ring-1 ring-primaria" : "border-linha",
            )}
        >
            <button
                type="button"
                onClick={() => aoAlterar(1)}
                className="flex min-h-28 flex-1 flex-col items-start gap-1 p-3 text-start outline-none transition-colors hover:bg-superficie-hover focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-inset active:bg-superficie-ativa sm:p-4"
            >
                <span className="line-clamp-2 pe-7 text-ui font-medium text-tinta">{item.nome}</span>
                <span className="text-titulo font-semibold tabular-nums text-tinta">{moeda(preco)}</span>
                {restante !== null && (
                    <span className={cx("mt-auto text-rotulo", esgotado ? "font-medium text-negativo" : "text-tinta-suave")}>
                        {esgotado ? t("Esgotado") : t("Restam :n", { n: numero(restante) })}
                    </span>
                )}
                {quantidade > 0 && (
                    <span className="absolute top-2 inset-e-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-secundaria px-1.5 text-rotulo font-semibold tabular-nums text-secundaria-tinta">
                        <span className="sr-only">{t("No carrinho:")} </span>
                        {quantidade}
                    </span>
                )}
            </button>
            {quantidade > 0 && (
                <div className="flex items-center justify-between border-t border-linha p-1">
                    <button
                        type="button"
                        onClick={() => aoAlterar(-1)}
                        aria-label={t("Remover um :nome", { nome: item.nome })}
                        className="flex size-11 items-center justify-center rounded-controle text-tinta-media outline-none hover:bg-superficie-hover hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco active:bg-superficie-ativa"
                    >
                        {quantidade === 1 ? <IconTrash size={18} stroke={TRACO} aria-hidden /> : <IconMinus size={20} stroke={TRACO} aria-hidden />}
                    </button>
                    <span className="text-titulo font-semibold tabular-nums text-tinta" aria-live="polite">{quantidade}</span>
                    <button
                        type="button"
                        onClick={() => aoAlterar(1)}
                        aria-label={t("Adicionar um :nome", { nome: item.nome })}
                        className="flex size-11 items-center justify-center rounded-controle text-tinta-media outline-none hover:bg-superficie-hover hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco active:bg-superficie-ativa"
                    >
                        <IconPlus size={20} stroke={TRACO} aria-hidden />
                    </button>
                </div>
            )}
        </div>
    );
}

function CartaoCombo({ combo, preco, economia, vezes, aoAlterar }: { combo: Combo; preco: number; economia: number; vezes: number; aoAlterar: (delta: 1 | -1) => void }) {
    const t = useT();
    const { moeda } = useFormato();

    return (
        <div
            className={cx(
                "relative flex min-w-0 flex-col overflow-hidden rounded-cartao border bg-superficie transition-colors",
                vezes > 0 ? "border-primaria ring-1 ring-primaria" : "border-linha",
            )}
        >
            <button
                type="button"
                onClick={() => aoAlterar(1)}
                className="flex min-h-28 flex-1 flex-col items-start gap-1.5 p-3 text-start outline-none transition-colors hover:bg-superficie-hover focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-inset active:bg-superficie-ativa sm:p-4"
            >
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 pe-7">
                    <ChipTag rotulo={combo.tag} combo />
                    <span className="min-w-0 text-ui font-medium text-tinta">{combo.nome}</span>
                </span>
                <span className="text-rotulo text-tinta-suave">{combo.itens.map((i) => `${i.quantidade}× ${i.nome}`).join(" + ")}</span>
                <span className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-1">
                    <span className="text-titulo font-semibold tabular-nums text-tinta">{moeda(preco)}</span>
                    {economia > 0 && <span className="text-rotulo tabular-nums text-positivo">{t("Economia de :valor", { valor: moeda(economia) })}</span>}
                </span>
                {vezes > 0 && (
                    <span className="absolute top-2 inset-e-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-secundaria px-1.5 text-rotulo font-semibold tabular-nums text-secundaria-tinta">
                        <span className="sr-only">{t("No carrinho:")} </span>
                        {vezes}
                    </span>
                )}
            </button>
            {vezes > 0 && (
                <div className="flex items-center justify-between border-t border-linha p-1">
                    <button
                        type="button"
                        onClick={() => aoAlterar(-1)}
                        aria-label={t("Remover um :nome", { nome: combo.nome })}
                        className="flex size-11 items-center justify-center rounded-controle text-tinta-media outline-none hover:bg-superficie-hover hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco active:bg-superficie-ativa"
                    >
                        {vezes === 1 ? <IconTrash size={18} stroke={TRACO} aria-hidden /> : <IconMinus size={20} stroke={TRACO} aria-hidden />}
                    </button>
                    <span className="text-titulo font-semibold tabular-nums text-tinta" aria-live="polite">{vezes}</span>
                    <button
                        type="button"
                        onClick={() => aoAlterar(1)}
                        aria-label={t("Adicionar um :nome", { nome: combo.nome })}
                        className="flex size-11 items-center justify-center rounded-controle text-tinta-media outline-none hover:bg-superficie-hover hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco active:bg-superficie-ativa"
                    >
                        <IconPlus size={20} stroke={TRACO} aria-hidden />
                    </button>
                </div>
            )}
        </div>
    );
}

function ConteudoCarrinho({ previa, quantidade, calculando, falhaPrevia, pagamentos, pagamento, aoPagar, checkout, recebido, aoReceber, aoLimpar, aoConfirmar, enviando, aoFechar }: {
    previa: Previa | null;
    quantidade: number;
    calculando: boolean;
    falhaPrevia: boolean;
    pagamentos: Opcao[];
    pagamento: string | null;
    aoPagar: (valor: string) => void;
    checkout: PreferenciasCheckout;
    recebido: number | null;
    aoReceber: (valor: number | null) => void;
    aoLimpar: () => void;
    aoConfirmar: () => void;
    enviando: boolean;
    aoFechar?: () => void;
}) {
    const t = useT();
    const { moeda } = useFormato();
    const idTitulo = useId();
    const idDica = useId();

    return (
        <section aria-labelledby={idTitulo} className="flex flex-col gap-4">
            <header className="flex items-center gap-2">
                <h2 id={idTitulo} className="text-titulo font-medium text-tinta">{t("Carrinho")}</h2>
                {quantidade > 0 && <Contador>{quantidade}</Contador>}
                <div className="ms-auto flex items-center gap-1">
                    {quantidade > 0 && (
                        <Botao tamanho="sm" variante="fantasma" icone={IconTrash} onClick={aoLimpar}>{t("Limpar")}</Botao>
                    )}
                    {aoFechar && (
                        <Botao tamanho="md" variante="fantasma" soIcone icone={IconX} onClick={aoFechar}>{t("Fechar")}</Botao>
                    )}
                </div>
            </header>

            {quantidade === 0 ? (
                <p className="text-corpo text-tinta-suave">{t("Toque nos itens para adicionar.")}</p>
            ) : falhaPrevia ? (
                <Faixa tom="aviso">{t("Não foi possível calcular o total agora. A venda é classificada de novo ao confirmar.")}</Faixa>
            ) : !previa ? (
                <p className="text-corpo text-tinta-suave" role="status">{t("Calculando…")}</p>
            ) : (
                <div className={cx("flex flex-col gap-4 transition-opacity", calculando && "opacity-60")} aria-busy={calculando}>
                    <ul className="flex flex-col divide-y divide-linha">
                        {previa.linhas.map((l, i) => (
                            <li key={i} className="flex items-start justify-between gap-3 py-2.5 first:pt-0">
                                <span className="flex min-w-0 flex-col gap-1">
                                    <span className="text-corpo font-medium text-tinta">{l.quantidade}× {l.descricao}</span>
                                    <span className="flex flex-wrap items-center gap-2">
                                        <ChipTag rotulo={l.tag} combo={l.combo} />
                                        {l.desconto > 0 && <span className="text-rotulo tabular-nums text-positivo">−{moeda(l.desconto)}</span>}
                                    </span>
                                </span>
                                <span className="shrink-0 text-corpo font-semibold tabular-nums text-tinta">{moeda(l.total)}</span>
                            </li>
                        ))}
                    </ul>

                    <dl className="flex flex-col gap-1 border-t border-linha pt-3">
                        <div className="flex justify-between gap-4 text-corpo text-tinta-suave">
                            <dt>{t("Subtotal")}</dt>
                            <dd className="tabular-nums">{moeda(previa.subtotal)}</dd>
                        </div>
                        {previa.desconto > 0 && (
                            <div className="flex justify-between gap-4 text-corpo text-positivo">
                                <dt>{t("Desconto de combo")}</dt>
                                <dd className="tabular-nums">−{moeda(previa.desconto)}</dd>
                            </div>
                        )}
                        <div className="mt-1 flex items-baseline justify-between gap-4">
                            <dt className="text-ui font-medium text-tinta">{t("Total")}</dt>
                            <dd className="text-numero font-semibold tabular-nums text-tinta">{moeda(previa.total)}</dd>
                        </div>
                        <dd className="text-rotulo text-tinta-suave">{previa.resumo}</dd>
                    </dl>
                </div>
            )}

            <div className="flex flex-col gap-2">
                <span className="text-corpo font-medium text-tinta">{t("Forma de pagamento")}</span>
                <Segmentos rotulo={t("Forma de pagamento")} opcoes={pagamentos.map((o) => ({ valor: o.valor, rotulo: o.label }))} valor={pagamento} aoMudar={aoPagar} icones={ICONE_PAGAMENTO} cheio grande />
                {quantidade > 0 && !pagamento && <p id={idDica} className="text-rotulo text-tinta-suave">{t("Escolha a forma de pagamento.")}</p>}
            </div>

            {pagamento === "dinheiro" && checkout.calcularTroco && quantidade > 0 && <Troco total={previa?.total ?? null} recebido={recebido} aoReceber={aoReceber} />}
            {pagamento === "pix" && checkout.chavePix && <ChavePix chave={checkout.chavePix} />}

            <Botao
                tamanho="lg"
                className="w-full"
                disabled={quantidade === 0 || !pagamento || enviando}
                aria-describedby={quantidade > 0 && !pagamento ? idDica : undefined}
                onClick={aoConfirmar}
            >
                {enviando ? t("Registrando…") : previa ? t("Confirmar venda · :total", { total: moeda(previa.total) }) : t("Confirmar venda")}
            </Botao>
        </section>
    );
}

function LinhaItem({ item, preco, quantidade, aoAlterar }: { item: Item; preco: number | null; quantidade: number; aoAlterar: (delta: number) => void }) {
    const t = useT();
    const { moeda, numero } = useFormato();
    const restante = item.estoqueRestante !== null ? item.estoqueRestante - quantidade : null;
    const esgotado = restante !== null && restante <= 0;

    return (
        <li className={cx("flex min-w-0 items-center gap-1 rounded-xl border bg-superficie p-1 transition-colors", quantidade > 0 ? "border-primaria ring-1 ring-primaria" : "border-linha")}>
            <button
                type="button"
                onClick={() => aoAlterar(1)}
                className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-start outline-none transition-colors hover:bg-superficie-hover focus-visible:ring-2 focus-visible:ring-foco active:bg-superficie-ativa"
            >
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-ui font-medium text-tinta">{item.nome}</span>
                    {restante !== null && (
                        <span className={cx("block text-rotulo", esgotado ? "font-medium text-negativo" : "text-tinta-suave")}>
                            {esgotado ? t("Esgotado") : t("Restam :n", { n: numero(restante) })}
                        </span>
                    )}
                </span>
                <span className="shrink-0 text-ui font-semibold tabular-nums text-tinta">{moeda(preco)}</span>
            </button>
            {quantidade > 0 && (
                <span className="flex shrink-0 items-center">
                    <button
                        type="button"
                        onClick={() => aoAlterar(-1)}
                        aria-label={t("Remover um :nome", { nome: item.nome })}
                        className="flex size-11 items-center justify-center rounded-lg text-tinta-media outline-none hover:bg-superficie-hover hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco active:bg-superficie-ativa"
                    >
                        {quantidade === 1 ? <IconTrash size={18} stroke={TRACO} aria-hidden /> : <IconMinus size={20} stroke={TRACO} aria-hidden />}
                    </button>
                    <span className="min-w-6 text-center text-titulo font-semibold tabular-nums text-tinta" aria-live="polite">
                        <span className="sr-only">{t("No carrinho:")} </span>
                        {quantidade}
                    </span>
                    <button
                        type="button"
                        onClick={() => aoAlterar(1)}
                        aria-label={t("Adicionar um :nome", { nome: item.nome })}
                        className="flex size-11 items-center justify-center rounded-lg text-tinta-media outline-none hover:bg-superficie-hover hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco active:bg-superficie-ativa"
                    >
                        <IconPlus size={20} stroke={TRACO} aria-hidden />
                    </button>
                </span>
            )}
        </li>
    );
}

function Troco({ total, recebido, aoReceber }: { total: number | null; recebido: number | null; aoReceber: (valor: number | null) => void }) {
    const t = useT();
    const { moeda } = useFormato();
    const diferenca = total !== null && recebido !== null ? recebido - total : null;

    return (
        <div className="flex flex-col gap-2 rounded-xl bg-superficie-suave p-3">
            <CampoMoeda rotulo={t("Valor recebido")} valor={recebido} aoMudar={aoReceber} inputMode="decimal" />
            {diferenca !== null && (
                <p className="flex items-baseline justify-between gap-3" aria-live="polite">
                    <span className="text-corpo text-tinta-suave">{diferenca >= 0 ? t("Troco") : t("Faltam")}</span>
                    <span className={cx("text-titulo font-semibold tabular-nums", diferenca >= 0 ? "text-tinta" : "text-negativo")}>{moeda(Math.abs(diferenca))}</span>
                </p>
            )}
        </div>
    );
}

function ChavePix({ chave }: { chave: string }) {
    const t = useT();

    const copiar = () =>
        navigator.clipboard
            .writeText(chave)
            .then(() => avisar(t("Chave Pix copiada."), "sucesso"))
            .catch(() => avisar(t("Não foi possível copiar. Selecione a chave e copie."), "erro"));

    return (
        <div className="flex items-center gap-3 rounded-xl bg-superficie-suave p-3">
            <span className="min-w-0 flex-1">
                <span className="block text-rotulo text-tinta-suave">{t("Chave Pix")}</span>
                <span className="block text-ui font-semibold break-all text-tinta select-all">{chave}</span>
            </span>
            <Botao variante="secundario" icone={IconCopy} onClick={copiar}>{t("Copiar")}</Botao>
        </div>
    );
}
