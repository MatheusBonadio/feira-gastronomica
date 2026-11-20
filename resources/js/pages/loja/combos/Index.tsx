import { router, usePage } from "@inertiajs/react";
import { IconAlertTriangle, IconCoins, IconPencil, IconPlayerPause, IconPlayerPlay, IconPlus, IconReceipt, IconStack2, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { CabecalhoPagina, Cartao, Faixa, PilulaStats, Vazio } from "@/components/ui/cartao";
import { Confirmar } from "@/components/ui/dialogo";
import { TRACO } from "@/components/ui/icone";
import { Chip } from "@/components/ui/marcadores";
import { cx } from "@/lib/cx";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { useRotaLoja } from "@/lib/rotas";
import type { Combo } from "@/types/dominio";

export default function Index({ combos }: { combos: Combo[] }) {
    const t = useT();
    const { moeda, numero, percentual } = useFormato();
    const rotaLoja = useRotaLoja();
    const { loja, errors } = usePage().props;
    const [excluindo, setExcluindo] = useState<Combo | null>(null);
    const editavel = !loja?.encerrada;

    const ativos = combos.filter((c) => c.ativo).length;
    const vendas = combos.reduce((soma, c) => soma + c.vendas, 0);
    const incompletos = combos.filter((c) => c.incompleto).length;

    const alternar = (combo: Combo) => router.patch(rotaLoja("combos.alternar", { combo: combo.id }), {}, { preserveScroll: true });

    return (
        <>
            <CabecalhoPagina
                titulo={t("Combos")}
                descricao={t("Itens vendidos juntos com desconto. A venda vira Combo N sozinha quando o carrinho fecha o combo.")}
                acoes={editavel && <BotaoLink href={rotaLoja("combos.create")} icone={IconPlus} className="max-sm:h-11">{t("Novo combo")}</BotaoLink>}
            >
                {combos.length > 0 && (
                    <PilulaStats
                        itens={[
                            { icone: IconStack2, valor: numero(ativos), rotulo: t("ativos") },
                            { icone: IconReceipt, valor: numero(vendas), rotulo: t("vendas") },
                            ...(incompletos > 0 ? [{ icone: IconAlertTriangle, valor: numero(incompletos), rotulo: t("incompletos") }] : []),
                        ]}
                    />
                )}
            </CabecalhoPagina>

            {errors.combo && (
                <div className="mb-4">
                    <Faixa tom="perigo" icone={IconAlertTriangle}>{errors.combo}</Faixa>
                </div>
            )}

            {combos.length === 0 ? (
                <Cartao>
                    <Vazio
                        icone={IconStack2}
                        titulo={t("Nenhum combo")}
                        descricao={t("Cadastre os itens primeiro; depois monte o combo com eles.")}
                        acao={editavel && <BotaoLink href={rotaLoja("combos.create")} icone={IconPlus}>{t("Novo combo")}</BotaoLink>}
                    />
                </Cartao>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {combos.map((combo) => {
                        const desconto = combo.somaAvulsa > 0 ? 1 - combo.preco / combo.somaAvulsa : null;
                        const economia = combo.somaAvulsa - combo.preco;
                        return (
                            <article
                                key={combo.id}
                                className={cx("flex min-w-0 flex-col rounded-cartao border bg-superficie", combo.incompleto ? "border-ambar/50" : "border-linha", !combo.ativo && "opacity-75")}
                            >
                                <header className="flex items-start justify-between gap-3 px-4 pt-4">
                                    <div className="min-w-0">
                                        <Chip tom="primaria">{combo.tag}</Chip>
                                        <h2 className="mt-2 text-titulo font-medium break-words text-tinta">{combo.nome}</h2>
                                    </div>
                                    {combo.incompleto ? (
                                        <Chip tom="ambar">
                                            <IconAlertTriangle size={12} stroke={TRACO} aria-hidden />
                                            {t("Incompleto")}
                                        </Chip>
                                    ) : combo.ativo ? (
                                        <Chip tom="verde">{t("Ativo")}</Chip>
                                    ) : (
                                        <Chip>{t("Inativo")}</Chip>
                                    )}
                                </header>

                                <ul className="flex flex-col gap-1 px-4 pt-3">
                                    {combo.itens.map((i) => (
                                        <li key={i.id} className="flex items-baseline gap-2 text-corpo text-tinta-media">
                                            <span className="w-7 shrink-0 font-semibold tabular-nums text-tinta">{i.quantidade}×</span>
                                            <span className={cx("min-w-0 break-words", !i.ativo && "line-through")}>{i.nome}</span>
                                            {!i.ativo && <span className="shrink-0 text-rotulo font-medium text-negativo">({t("inativo")})</span>}
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-auto px-4 pt-4 pb-4">
                                    <div className="flex items-end justify-between gap-3 rounded-xl bg-superficie-suave px-3 py-2.5">
                                        <div className="min-w-0">
                                            <p className="text-rotulo text-tinta-suave">{t("Separado")}</p>
                                            <p className="text-corpo tabular-nums text-tinta-suave line-through">{moeda(combo.somaAvulsa)}</p>
                                        </div>
                                        <div className="min-w-0 text-end">
                                            <p className="text-rotulo text-tinta-suave">{t("No combo")}</p>
                                            <p className="text-numero font-semibold tracking-tight tabular-nums text-tinta">{moeda(combo.preco)}</p>
                                        </div>
                                    </div>
                                    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-rotulo text-tinta-suave">
                                        {desconto !== null && desconto > 0 ? (
                                            <Chip tom="secundaria">
                                                <IconCoins size={12} stroke={TRACO} aria-hidden />
                                                {t("−:pct · economiza :valor", { pct: percentual(desconto), valor: moeda(economia) })}
                                            </Chip>
                                        ) : (
                                            <Chip tom="vermelho">{t("Sem desconto")}</Chip>
                                        )}
                                        <span>{t(":n vendas", { n: numero(combo.vendas) })}</span>
                                    </p>
                                </div>

                                {editavel && (
                                    <footer className="flex flex-wrap items-center gap-1 border-t border-linha px-2 py-2">
                                        <BotaoLink href={rotaLoja("combos.edit", { combo: combo.id })} variante="fantasma" tamanho="sm" icone={IconPencil} className="max-md:h-10">
                                            {t("Editar")}
                                        </BotaoLink>
                                        <Botao variante="fantasma" tamanho="sm" icone={combo.ativo ? IconPlayerPause : IconPlayerPlay} className="max-md:h-10" onClick={() => alternar(combo)}>
                                            {combo.ativo ? t("Desativar") : t("Reativar")}
                                        </Botao>
                                        {combo.vendas === 0 && (
                                            <Botao variante="fantasma" tamanho="sm" soIcone icone={IconTrash} className="ms-auto max-md:size-10" onClick={() => setExcluindo(combo)}>
                                                {t("Excluir :nome", { nome: combo.nome })}
                                            </Botao>
                                        )}
                                    </footer>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            <Confirmar
                aberto={excluindo !== null}
                aoFechar={() => setExcluindo(null)}
                titulo={t("Excluir :nome?", { nome: excluindo?.nome ?? "" })}
                descricao={t("Combos que já tiveram vendas nunca são excluídos, só desativados.")}
                rotuloConfirmar={t("Excluir")}
                aoConfirmar={() =>
                    new Promise<void>((ok) => {
                        if (excluindo) router.delete(rotaLoja("combos.destroy", { combo: excluindo.id }), { preserveScroll: true, onFinish: () => ok() });
                        else ok();
                    })
                }
            />
        </>
    );
}
