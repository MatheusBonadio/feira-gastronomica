import { Head, router, usePage } from "@inertiajs/react";
import { IconChevronUp, IconLock, IconMinus, IconPlus, IconSearch, IconShoppingCart, IconStack2, IconTrash, IconX } from "@tabler/icons-react";
import { useEffect, useId, useMemo, useState } from "react";
import { avisar } from "@/components/ui/avisos";
import { Botao } from "@/components/ui/botao";
import { Entrada, Segmentos } from "@/components/ui/campos";
import { Folha } from "@/components/ui/dialogo";
import { Cartao, Faixa, Vazio } from "@/components/ui/cartao";
import { TRACO } from "@/components/ui/icone";
import { ChipTag, COR_CANAL, COR_PAGAMENTO, Contador } from "@/components/ui/marcadores";
import { cx } from "@/lib/cx";
import { useMidia } from "@/lib/midia";
import { useFormato } from "@/lib/formato";
import { postarJson } from "@/lib/http";
import { useT } from "@/lib/i18n";
import { useRotaLoja } from "@/lib/rotas";
import type { Opcao } from "@/types/inertia";
import type { Combo, Item } from "@/types/dominio";

interface Props {
    itens: Item[];
    combos: Combo[];
    canais: Opcao[];
    pagamentos: Opcao[];
    canalInicial: string;
}

/** Resposta de vendas.simular (ResultadoClassificacao::paraArray). */
interface Previa {
    linhas: { tag: string; combo: boolean; descricao: string; quantidade: number; preco_unitario: number; desconto: number; total: number }[];
    resumo: string;
    subtotal: number;
    desconto: number;
    total: number;
}

type Carrinho = Record<number, number>;

const precoNoCanal = (item: Item, canal: string) => item.precos[canal] ?? item.precos.feira ?? item.precoFeira;

/** Busca sem diferenciar maiúsculas e acentos ("pao" acha "Pão"). */
const normalizar = (texto: string) => texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/**
 * Ponto de venda, pensado para o celular na barraquinha: o operador só toca
 * nos itens; o servidor decide Comum ou Combo N e aplica o desconto (a prévia
 * usa o mesmo algoritmo que grava a venda). No celular o carrinho abre numa
 * folha a partir da barra fixa no rodapé; no desktop fica numa coluna fixa.
 */
export default function Pdv({ itens, combos, canais, pagamentos, canalInicial }: Props) {
    const desktop = useMidia("(min-width: 64rem)");
    const t = useT();
    const { moeda } = useFormato();
    const rotaLoja = useRotaLoja();
    const { loja } = usePage().props;

    const [canal, setCanal] = useState(canalInicial);
    const [pagamento, setPagamento] = useState<string | null>(null);
    const [carrinho, setCarrinho] = useState<Carrinho>({});
    const [previa, setPrevia] = useState<Previa | null>(null);
    const [calculando, setCalculando] = useState(false);
    const [falhaPrevia, setFalhaPrevia] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [busca, setBusca] = useState("");
    const [folhaAberta, setFolhaAberta] = useState(false);

    const quantidade = Object.values(carrinho).reduce((a, b) => a + b, 0);

    const porCategoria = useMemo(() => {
        const termo = normalizar(busca.trim());
        const grupos = new Map<string, Item[]>();
        for (const item of itens) {
            if (termo && !normalizar(item.nome).includes(termo)) continue;
            const chave = item.categoria ?? "";
            grupos.set(chave, [...(grupos.get(chave) ?? []), item]);
        }
        return [...grupos.entries()];
    }, [itens, busca]);

    const alterar = (item: Item, delta: number) =>
        setCarrinho((atual) => {
            const proxima = Math.max(0, Math.min(999, (atual[item.id] ?? 0) + delta));
            const { [item.id]: _removido, ...resto } = atual;
            return proxima > 0 ? { ...resto, [item.id]: proxima } : resto;
        });

    // Prévia no servidor, com espera curta para não disparar a cada toque.
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
        router.post(
            rotaLoja("vendas.store"),
            { canal, pagamento, itens: carrinho },
            {
                preserveScroll: true,
                onStart: () => setEnviando(true),
                onFinish: () => setEnviando(false),
                // A resposta volta para esta mesma página: sem limpar, o próximo
                // "Confirmar" repetiria a venda.
                onSuccess: () => {
                    setCarrinho({});
                    setPagamento(null);
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
                        <div className="md:w-[26rem]">
                            <Segmentos rotulo={t("Canal da venda")} opcoes={canais.map((o) => ({ valor: o.valor, rotulo: o.label }))} valor={canal} aoMudar={setCanal} cores={COR_CANAL} cheio grande />
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

                    {itens.length > 0 && porCategoria.length === 0 && (
                        <p className="mb-5 text-corpo text-tinta-suave">{t("Nenhum item encontrado para “:busca”.", { busca })}</p>
                    )}

                    {porCategoria.map(([categoria, lista]) => (
                        <section key={categoria} className="mb-6" aria-label={categoria || t("Itens")}>
                            {categoria && <h2 className="mb-2 text-micro font-semibold tracking-wide text-tinta-suave uppercase">{categoria}</h2>}
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
                        </section>
                    ))}

                    {combos.length > 0 && (
                        <Cartao titulo={t("Combos aplicados automaticamente")} icone={IconStack2} descricao={t("Não precisa escolher: o sistema monta o combo mais vantajoso.")}>
                            <ul className="flex flex-col gap-2">
                                {combos.map((c) => (
                                    <li key={c.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-corpo text-tinta-media">
                                        <ChipTag rotulo={c.tag} combo />
                                        <span className="min-w-0">{c.itens.map((i) => `${i.quantidade}× ${i.nome}`).join(" + ")}</span>
                                        <span className="ms-auto font-medium tabular-nums text-tinta">{moeda(c.preco)}</span>
                                    </li>
                                ))}
                            </ul>
                        </Cartao>
                    )}
                </div>

                {/* Desktop: carrinho fixo na coluna da direita. */}
                <aside className="sticky top-[calc(var(--spacing-topbar)+1.5rem)] hidden max-h-[calc(100dvh-var(--spacing-topbar)-3rem)] flex-col overflow-hidden rounded-cartao border border-linha bg-superficie lg:flex">
                    <div className="rolagem-fina min-h-0 overflow-y-auto p-4">
                        <ConteudoCarrinho {...propsCarrinho} />
                    </div>
                </aside>
            </div>

            {/* Celular e tablet: barra fixa com o total; abre a folha do carrinho. */}
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

            {/* Folha do carrinho (Radix Dialog) só abaixo de lg; acima, o carrinho já está na coluna. */}
            <Folha aberta={folhaAberta && !desktop} aoFechar={() => setFolhaAberta(false)} titulo={t("Carrinho")} ocultarCabecalho semFechar corpo="rolagem-fina min-h-0 overflow-y-auto px-4 pt-3 pb-4">
                <ConteudoCarrinho {...propsCarrinho} aoFechar={() => setFolhaAberta(false)} />
            </Folha>
        </>
    );
}

/** Cartão de toque grande: tocar adiciona um; com quantidade, aparecem − e +. */
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

/** Carrinho classificado pelo servidor + pagamento + confirmar. Usado na coluna (desktop) e na folha (celular). */
function ConteudoCarrinho({ previa, quantidade, calculando, falhaPrevia, pagamentos, pagamento, aoPagar, aoLimpar, aoConfirmar, enviando, aoFechar }: {
    previa: Previa | null;
    quantidade: number;
    calculando: boolean;
    falhaPrevia: boolean;
    pagamentos: Opcao[];
    pagamento: string | null;
    aoPagar: (valor: string) => void;
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
                <Segmentos rotulo={t("Forma de pagamento")} opcoes={pagamentos.map((o) => ({ valor: o.valor, rotulo: o.label }))} valor={pagamento} aoMudar={aoPagar} cores={COR_PAGAMENTO} cheio grande />
                {quantidade > 0 && !pagamento && <p id={idDica} className="text-rotulo text-tinta-suave">{t("Escolha a forma de pagamento.")}</p>}
            </div>

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

