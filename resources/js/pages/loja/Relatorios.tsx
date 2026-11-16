import { usePage } from "@inertiajs/react";
import { IconAlertTriangle, IconBuildingStore, IconDownload, IconFileAnalytics, IconFileExport, IconFilter, IconInfoCircle } from "@tabler/icons-react";
import { useState } from "react";
import { Botao, classesBotao } from "@/components/ui/botao";
import { CaixaSelecao, CampoData, OpcoesCartao, Selecao } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao, Detalhe, Faixa } from "@/components/ui/cartao";
import { TRACO } from "@/components/ui/icone";
import { opcoesSelecao } from "@/components/painel/filtros";
import { cx } from "@/lib/cx";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { semVazios } from "@/lib/rotas";
import type { Opcao } from "@/types/inertia";

interface Props {
    admin: boolean;
    feiraAtual: number | null;
    feiras: { id: number; nome: string }[];
    barraquinhas: { id: number; nome: string }[];
    tipos: (Opcao & { descricao: string })[];
    formatos: string[];
    canais: Opcao[];
    pagamentos: Opcao[];
    numerosCombo: number[];
    rotaExportar: string;
}

/**
 * Exportação (seção 9). A barraquinha só exporta os próprios dados: o servidor
 * ignora qualquer escopo vindo da tela. O admin escolhe a feira e as barraquinhas.
 */
export default function Relatorios({ admin, feiraAtual, feiras, barraquinhas, tipos, formatos, canais, pagamentos, numerosCombo, rotaExportar }: Props) {
    const t = useT();
    const { data } = useFormato();
    const { errors } = usePage().props;
    const [tipo, setTipo] = useState(tipos[0]?.valor ?? "");
    const [formato, setFormato] = useState(formatos[0] ?? "xlsx");
    const [feira, setFeira] = useState(feiraAtual ? String(feiraAtual) : "");
    const [escolhidas, setEscolhidas] = useState<number[]>([]);
    const [filtro, setFiltro] = useState({ de: "", ate: "", canal: "", tag: "", pagamento: "" });
    const definir = (campo: keyof typeof filtro) => (valor: string) => setFiltro((f) => ({ ...f, [campo]: valor }));

    const tags = [{ valor: "comum", rotulo: t("Comum") }, ...numerosCombo.map((n) => ({ valor: `combo:${n}`, rotulo: t("Combo :n", { n }) }))];
    const formatosInfo: Record<string, { titulo: string; descricao: string }> = {
        xlsx: { titulo: "Excel (.xlsx)", descricao: t("Planilha para Excel ou Google Planilhas.") },
        csv: { titulo: "CSV", descricao: t("Texto simples, para outros sistemas.") },
        pdf: { titulo: "PDF", descricao: t("Pronto para imprimir ou enviar.") },
    };

    // As barraquinhas listadas são as da feira em uso; noutra feira, vale "todas".
    const podeEscolherBarraquinhas = admin && barraquinhas.length > 0 && feira === String(feiraAtual ?? "");
    const ids = podeEscolherBarraquinhas ? escolhidas : [];
    const periodoInvalido = !!filtro.de && !!filtro.ate && filtro.ate < filtro.de;
    const pronto = !!tipo && !!formato && (!admin || !!feira) && !periodoInvalido;

    // Download direto (não é uma página do Inertia): link comum com a query montada.
    const parametros = new URLSearchParams(semVazios({ tipo, formato, feira_id: admin ? feira : "", ...filtro }) as Record<string, string>);
    ids.forEach((id) => parametros.append("barraquinhas[]", String(id)));
    const url = `${rotaExportar}?${parametros.toString()}`;

    const tipoAtual = tipos.find((tp) => tp.valor === tipo);
    const feiraNome = feiras.find((f) => String(f.id) === feira)?.nome;
    const periodo = filtro.de || filtro.ate ? `${filtro.de ? data(filtro.de) : "…"} – ${filtro.ate ? data(filtro.ate) : "…"}` : t("Todo o período");
    const filtrosAtivos = [
        filtro.canal && canais.find((c) => c.valor === filtro.canal)?.label,
        filtro.tag && tags.find((tg) => tg.valor === filtro.tag)?.rotulo,
        filtro.pagamento && pagamentos.find((p) => p.valor === filtro.pagamento)?.label,
    ].filter(Boolean);
    const errosServidor = Object.values(errors ?? {});

    return (
        <>
            <CabecalhoPagina
                titulo={t("Relatórios")}
                descricao={admin ? t("Uma, várias ou todas as barraquinhas, ou a feira inteira.") : t("Somente os dados da sua barraquinha.")}
            />

            {errosServidor.length > 0 && (
                <div className="mb-4">
                    <Faixa tom="perigo" icone={IconAlertTriangle} titulo={t("Não foi possível exportar.")}>
                        <ul className="list-disc ps-4">
                            {errosServidor.map((erro) => <li key={erro}>{erro}</li>)}
                        </ul>
                    </Faixa>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
                    <Cartao titulo={t("Relatório")} icone={IconFileAnalytics}>
                        <OpcoesCartao
                            rotulo={t("Relatório")}
                            opcoes={tipos.map((tp) => ({ valor: tp.valor, titulo: tp.label, descricao: tp.descricao }))}
                            valor={tipo}
                            aoMudar={setTipo}
                            colunas={2}
                        />
                    </Cartao>

                    <Cartao titulo={t("Filtros")} icone={IconFilter} descricao={t("Todos opcionais. Sem datas, vale a feira inteira.")}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {admin && (
                                <Selecao
                                    className="sm:col-span-2 xl:col-span-3"
                                    rotulo={t("Feira")}
                                    opcoes={feiras.map((f) => ({ valor: String(f.id), rotulo: f.nome }))}
                                    vazio={t("Escolha a feira")}
                                    valor={feira}
                                    aoMudar={setFeira}
                                    erro={errors.feira_id}
                                />
                            )}
                            <CampoData rotulo={t("Data inicial")} valor={filtro.de} aoMudar={definir("de")} erro={errors.de} />
                            <CampoData
                                rotulo={t("Data final")}
                                valor={filtro.ate}
                                min={filtro.de || undefined}
                                aoMudar={definir("ate")}
                                erro={periodoInvalido ? t("A data final deve ser igual ou posterior à inicial.") : errors.ate}
                            />
                            <Selecao rotulo={t("Canal")} opcoes={opcoesSelecao(canais)} vazio={t("Todos")} valor={filtro.canal} aoMudar={definir("canal")} />
                            <Selecao rotulo={t("Tag")} opcoes={tags} vazio={t("Todas")} valor={filtro.tag} aoMudar={definir("tag")} />
                            <Selecao rotulo={t("Forma de pagamento")} opcoes={opcoesSelecao(pagamentos)} vazio={t("Todos")} valor={filtro.pagamento} aoMudar={definir("pagamento")} />
                        </div>
                    </Cartao>

                    {admin && barraquinhas.length > 0 && (
                        <Cartao
                            titulo={t("Barraquinhas")}
                            icone={IconBuildingStore}
                            descricao={podeEscolherBarraquinhas ? t("Nenhuma marcada = todas da feira.") : t("Outra feira escolhida: entram todas as barraquinhas dela.")}
                            acoes={
                                podeEscolherBarraquinhas && (
                                    <Botao
                                        variante="fantasma"
                                        tamanho="sm"
                                        className="max-md:h-10"
                                        onClick={() => setEscolhidas(escolhidas.length === barraquinhas.length ? [] : barraquinhas.map((b) => b.id))}
                                    >
                                        {escolhidas.length === barraquinhas.length ? t("Limpar") : t("Marcar todas")}
                                    </Botao>
                                )
                            }
                        >
                            {podeEscolherBarraquinhas ? (
                                <fieldset>
                                    <legend className="sr-only">{t("Barraquinhas")}</legend>
                                    <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
                                        {barraquinhas.map((b) => (
                                            <div key={b.id} className="flex min-h-10 items-center">
                                                <CaixaSelecao
                                                    marcado={escolhidas.includes(b.id)}
                                                    aoMudar={(marcada) => setEscolhidas((atual) => (marcada ? [...atual, b.id] : atual.filter((id) => id !== b.id)))}
                                                >
                                                    {b.nome}
                                                </CaixaSelecao>
                                            </div>
                                        ))}
                                    </div>
                                </fieldset>
                            ) : (
                                <p className="text-corpo text-tinta-suave">{t("Para escolher barraquinhas, use a feira em uso (troque no menu lateral).")}</p>
                            )}
                        </Cartao>
                    )}

                    <Cartao titulo={t("Formato")} icone={IconFileExport}>
                        <OpcoesCartao
                            rotulo={t("Formato")}
                            opcoes={formatos.map((f) => ({ valor: f, titulo: formatosInfo[f]?.titulo ?? f.toUpperCase(), descricao: formatosInfo[f]?.descricao }))}
                            valor={formato}
                            aoMudar={setFormato}
                            colunas={3}
                        />
                    </Cartao>
                </div>

                {/* Resumo + botão: ao lado no desktop, no fim da página no celular. */}
                <aside className="flex min-w-0 flex-col gap-4 lg:self-start">
                    <Cartao titulo={t("Resumo da exportação")} icone={IconInfoCircle}>
                        <dl className="-mt-2.5 divide-y divide-linha">
                            <Detalhe rotulo={t("Relatório")}>{tipoAtual?.label ?? "—"}</Detalhe>
                            {admin && <Detalhe rotulo={t("Feira")}>{feiraNome ?? "—"}</Detalhe>}
                            <Detalhe rotulo={t("Escopo")}>
                                {!admin
                                    ? t("Sua barraquinha")
                                    : ids.length === 0
                                      ? t("Todas as barraquinhas")
                                      : t(":n de :total barraquinhas", { n: ids.length, total: barraquinhas.length })}
                            </Detalhe>
                            <Detalhe rotulo={t("Período")}>{periodo}</Detalhe>
                            <Detalhe rotulo={t("Filtros")}>{filtrosAtivos.length ? filtrosAtivos.join(" · ") : t("Nenhum")}</Detalhe>
                            <Detalhe rotulo={t("Formato")}>{formatosInfo[formato]?.titulo ?? formato}</Detalhe>
                        </dl>

                        <div className="mt-4">
                            {pronto ? (
                                <a href={url} className={cx(classesBotao("primario", "lg"), "w-full")}>
                                    <IconDownload size={18} stroke={TRACO} aria-hidden />
                                    {t("Exportar")}
                                </a>
                            ) : (
                                <Botao tamanho="lg" icone={IconDownload} className="w-full" disabled>
                                    {t("Exportar")}
                                </Botao>
                            )}
                            {admin && !feira && <p className="mt-2 text-rotulo text-tinta-suave">{t("Escolha a feira para exportar.")}</p>}
                            <p className="mt-2 text-rotulo text-tinta-suave">{t("Toda exportação fica registrada na auditoria.")}</p>
                        </div>
                    </Cartao>
                </aside>
            </div>
        </>
    );
}
