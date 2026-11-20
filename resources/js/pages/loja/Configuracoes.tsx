import { useForm } from "@inertiajs/react";
import { IconInfoCircle, IconLayoutGrid, IconList, IconPhoto, IconShoppingCart } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Botao } from "@/components/ui/botao";
import { CaixaSelecao, Entrada, Interruptor, Segmentos, Selecao } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao } from "@/components/ui/cartao";
import { CampoFoto } from "@/components/ui/foto";
import { Pagamento } from "@/components/ui/marcadores";
import { useT } from "@/lib/i18n";
import { useRotaLoja } from "@/lib/rotas";
import type { Opcao } from "@/types/inertia";
import type { Barraquinha, PreferenciasCheckout } from "@/types/dominio";

interface Props {
    barraquinha: Barraquinha;
    checkout: PreferenciasCheckout;
    canais: Opcao[];
    pagamentos: Opcao[];
}

/** Foto da barraquinha e o jeito do checkout (PDV), escolhidos pelo gestor dela. */
export default function Configuracoes({ barraquinha, checkout: c, canais, pagamentos }: Props) {
    const t = useT();
    const rotaLoja = useRotaLoja();
    const form = useForm({
        pagamentos: c.pagamentos,
        pagamento_padrao: c.pagamentoPadrao ?? "",
        canal_padrao: c.canalPadrao ?? "",
        exibicao: c.exibicao,
        agrupar_categorias: c.agruparCategorias,
        ordem: c.ordem,
        mostrar_combos: c.mostrarCombos,
        calcular_troco: c.calcularTroco,
        chave_pix: c.chavePix ?? "",
        confirmar_antes: c.confirmarAntes,
    });
    const d = form.data;
    const aceita = (forma: string) => d.pagamentos.includes(forma);

    const alternarPagamento = (forma: string, marcado: boolean) => {
        const lista = marcado ? pagamentos.map((p) => p.valor).filter((v) => v === forma || aceita(v)) : d.pagamentos.filter((v) => v !== forma);
        form.setData((atual) => ({ ...atual, pagamentos: lista, pagamento_padrao: lista.includes(atual.pagamento_padrao) ? atual.pagamento_padrao : "" }));
    };

    const salvar = () => {
        form.transform((dados) => ({
            ...dados,
            pagamento_padrao: dados.pagamento_padrao || null,
            canal_padrao: dados.canal_padrao || null,
            chave_pix: dados.chave_pix.trim() || null,
        }));
        form.put(rotaLoja("configuracoes.checkout"), { preserveScroll: true });
    };

    return (
        <>
            <CabecalhoPagina titulo={t("Configurações")} descricao={t("Foto da barraquinha e o jeito do checkout (PDV).")} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
                    <Cartao titulo={t("Foto da barraquinha")} icone={IconPhoto} descricao={t("Aparece no painel, para a coordenação e nas listas de vendas.")}>
                        <CampoFoto
                            nome={barraquinha.nome}
                            foto={barraquinha.foto}
                            forma="quadrada"
                            rotulo={t("Escolher a foto da barraquinha")}
                            urlEnviar={rotaLoja("configuracoes.foto")}
                            urlRemover={rotaLoja("configuracoes.foto.remover")}
                        />
                    </Cartao>

                    <Cartao titulo={t("Checkout (PDV)")} icone={IconShoppingCart} descricao={t("Vale para a próxima vez que o PDV for aberto.")}>
                        <form
                            className="flex flex-col gap-6"
                            onSubmit={(e) => {
                                e.preventDefault();
                                salvar();
                            }}
                        >
                            <Grupo titulo={t("Pagamento")}>
                                <fieldset className="flex flex-col gap-2">
                                    <legend className="mb-1 text-corpo font-medium text-tinta">{t("Formas aceitas")}</legend>
                                    {pagamentos.map((p) => (
                                        <CaixaSelecao
                                            key={p.valor}
                                            marcado={aceita(p.valor)}
                                            // Pelo menos uma forma: a última não pode ser desmarcada.
                                            desabilitado={aceita(p.valor) && d.pagamentos.length === 1}
                                            aoMudar={(marcado) => alternarPagamento(p.valor, marcado)}
                                        >
                                            <Pagamento opcao={p} />
                                        </CaixaSelecao>
                                    ))}
                                    {form.errors.pagamentos && <p role="alert" className="text-rotulo font-medium text-negativo">{form.errors.pagamentos}</p>}
                                </fieldset>
                                <Selecao
                                    rotulo={t("Já marcada ao abrir o PDV")}
                                    vazio={t("Nenhuma: o operador escolhe")}
                                    opcoes={pagamentos.filter((p) => aceita(p.valor)).map((p) => ({ valor: p.valor, rotulo: p.label }))}
                                    valor={d.pagamento_padrao}
                                    aoMudar={(v) => form.setData("pagamento_padrao", v)}
                                    erro={form.errors.pagamento_padrao}
                                />
                                {aceita("pix") && (
                                    <Entrada
                                        rotulo={t("Chave Pix")}
                                        dica={t("Aparece no PDV quando o cliente escolhe Pix, com botão para copiar.")}
                                        name="chave_pix"
                                        autoComplete="off"
                                        spellCheck={false}
                                        maxLength={140}
                                        valor={d.chave_pix}
                                        aoMudar={(v) => form.setData("chave_pix", v)}
                                        erro={form.errors.chave_pix}
                                    />
                                )}
                                {aceita("dinheiro") && (
                                    <Interruptor ligado={d.calcular_troco} aoMudar={(v) => form.setData("calcular_troco", v)} descricao={t("No dinheiro, o operador digita quanto recebeu e o PDV mostra o troco.")}>
                                        {t("Calcular o troco")}
                                    </Interruptor>
                                )}
                            </Grupo>

                            <Grupo titulo={t("Venda")}>
                                <Selecao
                                    rotulo={t("Canal ao abrir o PDV")}
                                    vazio={t("Padrão do sistema (Feira)")}
                                    opcoes={canais.map((o) => ({ valor: o.valor, rotulo: o.label }))}
                                    valor={d.canal_padrao}
                                    aoMudar={(v) => form.setData("canal_padrao", v)}
                                    erro={form.errors.canal_padrao}
                                />
                                <Interruptor ligado={d.confirmar_antes} aoMudar={(v) => form.setData("confirmar_antes", v)} descricao={t("Mostra o resumo (total e pagamento) e pede um segundo toque antes de registrar.")}>
                                    {t("Confirmar antes de registrar")}
                                </Interruptor>
                            </Grupo>

                            <Grupo titulo={t("Itens")}>
                                <div className="flex flex-col gap-2">
                                    <span className="text-corpo font-medium text-tinta">{t("Exibição")}</span>
                                    <Segmentos
                                        rotulo={t("Exibição")}
                                        opcoes={[{ valor: "grade", rotulo: t("Grade") }, { valor: "lista", rotulo: t("Lista") }]}
                                        icones={{ grade: IconLayoutGrid, lista: IconList }}
                                        valor={d.exibicao}
                                        aoMudar={(v) => form.setData("exibicao", v as typeof d.exibicao)}
                                        cheio
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-corpo font-medium text-tinta">{t("Ordem")}</span>
                                    <Segmentos
                                        rotulo={t("Ordem")}
                                        opcoes={[{ valor: "nome", rotulo: t("Nome (A–Z)") }, { valor: "mais_vendidos", rotulo: t("Mais vendidos") }]}
                                        valor={d.ordem}
                                        aoMudar={(v) => form.setData("ordem", v as typeof d.ordem)}
                                        cheio
                                    />
                                </div>
                                <Interruptor ligado={d.agrupar_categorias} aoMudar={(v) => form.setData("agrupar_categorias", v)}>
                                    {t("Separar por categoria")}
                                </Interruptor>
                                <Interruptor ligado={d.mostrar_combos} aoMudar={(v) => form.setData("mostrar_combos", v)} descricao={t("Os combos continuam sendo aplicados sozinhos; isto só esconde a lista.")}>
                                    {t("Mostrar a lista de combos")}
                                </Interruptor>
                            </Grupo>

                            <div className="flex flex-wrap justify-end gap-2 border-t border-linha pt-4">
                                <Botao type="submit" disabled={form.processing || !form.isDirty} className="max-sm:h-11">{t("Salvar checkout")}</Botao>
                            </div>
                        </form>
                    </Cartao>
                </div>

                <Cartao titulo={t("Como funciona")} icone={IconInfoCircle} className="self-start">
                    <ul className="flex list-disc flex-col gap-2 ps-4 text-corpo text-tinta-media">
                        <li>{t("Forma de pagamento desmarcada some do PDV e o servidor também a recusa.")}</li>
                        <li>{t("Com uma forma só, ela já vem marcada em toda venda.")}</li>
                        <li>{t("“Mais vendidos” usa as vendas concluídas da barraquinha nesta feira.")}</li>
                        <li>{t("Depois de uma venda, o PDV continua no canal dela.")}</li>
                    </ul>
                </Cartao>
            </div>
        </>
    );
}

/** Bloco do formulário com título, separado do anterior por uma linha. */
function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-4 border-t border-linha pt-5 first:border-t-0 first:pt-0">
            <h3 className="text-micro font-semibold tracking-wide text-tinta-suave uppercase">{titulo}</h3>
            {children}
        </section>
    );
}
