import { useForm } from "@inertiajs/react";
import { IconArrowDownRight, IconArrowLeft, IconArrowUpRight, IconInfoCircle, IconWallet } from "@tabler/icons-react";
import { RadioGroup } from "radix-ui";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { CampoArquivo, CampoData, CampoMoeda, Entrada, Selecao } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao } from "@/components/ui/cartao";
import { TRACO } from "@/components/ui/icone";
import { cx } from "@/lib/cx";
import { useT } from "@/lib/i18n";
import { useRotaLoja } from "@/lib/rotas";
import type { Opcao } from "@/types/inertia";
import type { Lancamento } from "@/types/dominio";

type Categoria = Opcao & { grupo: string };

interface Props {
    lancamento: Lancamento | null;
    tipoInicial: string;
    tipos: Opcao[];
    categorias: Record<string, Categoria[]>;
    hoje: string;
}

interface Dados {
    tipo: string;
    categoria: string;
    descricao: string;
    valor: number | null;
    data: string;
    comprovante: File | null;
}

const ICONE_TIPO: Record<string, typeof IconArrowDownRight> = { entrada: IconArrowDownRight, saida: IconArrowUpRight };

export default function Form({ lancamento, tipoInicial, tipos, categorias, hoje }: Props) {
    const t = useT();
    const rotaLoja = useRotaLoja();
    const tipoAtual = lancamento?.tipo.valor ?? tipoInicial;

    const form = useForm<Dados>({
        tipo: tipoAtual,
        categoria: lancamento?.categoria.valor ?? categorias[tipoAtual]?.[0]?.valor ?? "",
        descricao: lancamento?.descricao ?? "",
        valor: lancamento?.valor ?? null,
        data: lancamento?.data ?? hoje,
        comprovante: null,
    });

    const opcoes = categorias[form.data.tipo] ?? [];
    const grupoAtual = opcoes.find((c) => c.valor === form.data.categoria)?.grupo;

    const trocarTipo = (tipo: string) => form.setData((d) => ({ ...d, tipo, categoria: categorias[tipo]?.[0]?.valor ?? "" }));

    return (
        <>
            <CabecalhoPagina
                titulo={lancamento ? t("Editar lançamento") : t("Novo lançamento")}
                voltar={<BotaoLink href={rotaLoja("lancamentos.index")} variante="fantasma" tamanho="sm" icone={IconArrowLeft} className="self-start">{t("Entradas e saídas")}</BotaoLink>}
            />
            <form
                className="grid grid-cols-1 gap-4 xl:grid-cols-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (lancamento) {
                        form.transform((dados) => ({ ...dados, _method: "put" }));
                        form.post(rotaLoja("lancamentos.update", { lancamento: lancamento.id }), { forceFormData: true });
                    } else {
                        form.transform((dados) => dados);
                        form.post(rotaLoja("lancamentos.store"), { forceFormData: true });
                    }
                }}
            >
                <div className="flex min-w-0 flex-col gap-4 xl:col-span-2">
                    <Cartao titulo={t("Lançamento")} icone={IconWallet}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <TipoLancamento tipos={tipos} valor={form.data.tipo} aoMudar={trocarTipo} />
                            </div>

                            <SelecaoCategoria
                                opcoes={opcoes}
                                valor={form.data.categoria}
                                aoMudar={(v) => form.setData("categoria", v)}
                                erro={form.errors.categoria}
                                dica={grupoAtual ? t("Entra em: :grupo", { grupo: grupoAtual }) : undefined}
                            />
                            <CampoData rotulo={t("Data")} required valor={form.data.data} aoMudar={(v) => form.setData("data", v)} erro={form.errors.data} />

                            <Entrada
                                className="md:col-span-2"
                                rotulo={t("Descrição")}
                                required
                                maxLength={255}
                                placeholder={form.data.tipo === "entrada" ? t("Ex.: Patrocínio da padaria do bairro") : t("Ex.: Compra de pão no atacado")}
                                valor={form.data.descricao}
                                aoMudar={(v) => form.setData("descricao", v)}
                                erro={form.errors.descricao}
                            />
                            <CampoMoeda rotulo={t("Valor")} required placeholder="0,00" valor={form.data.valor} aoMudar={(v) => form.setData("valor", v)} erro={form.errors.valor} />

                            <div className="md:col-span-2">
                                <CampoArquivo
                                    rotulo={t("Comprovante (opcional)")}
                                    arquivo={form.data.comprovante}
                                    aoMudar={(arquivo) => form.setData("comprovante", arquivo)}
                                    aceitar=".pdf,.jpg,.jpeg,.png,.webp"
                                    dica={
                                        lancamento?.temComprovante && !form.data.comprovante
                                            ? t("Já existe um comprovante; envie outro para substituir.")
                                            : t("PDF ou imagem, até 5 MB.")
                                    }
                                    erro={form.errors.comprovante}
                                />
                            </div>
                        </div>
                    </Cartao>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <BotaoLink href={rotaLoja("lancamentos.index")} variante="secundario" className="w-full sm:w-auto">{t("Cancelar")}</BotaoLink>
                        <Botao type="submit" disabled={form.processing} className="w-full sm:w-auto">
                            {form.processing ? t("Salvando…") : t("Salvar lançamento")}
                        </Botao>
                    </div>
                </div>

                <Cartao titulo={t("Como funciona")} icone={IconInfoCircle} className="xl:self-start">
                    <ul className="flex list-disc flex-col gap-2 ps-4 text-corpo text-tinta-media">
                        <li>{t("Entradas (patrocínio, rifa, aportes) somam em outras entradas e no caixa.")}</li>
                        <li>{t("Custos e despesas reduzem o resultado operacional.")}</li>
                        <li>{t("Investimento sai só do saldo de caixa, sem afetar o resultado operacional.")}</li>
                        <li>{t("Edições e exclusões ficam no histórico de auditoria.")}</li>
                    </ul>
                </Cartao>
            </form>
        </>
    );
}

function TipoLancamento({ tipos, valor, aoMudar }: { tipos: Opcao[]; valor: string; aoMudar: (valor: string) => void }) {
    const t = useT();

    return (
        <RadioGroup.Root aria-label={t("Tipo")} value={valor} onValueChange={aoMudar} orientation="horizontal" loop className="grid grid-cols-2 gap-2">
            {tipos.map((tipo) => {
                const ativo = tipo.valor === valor;
                const I = ICONE_TIPO[tipo.valor] ?? IconWallet;
                return (
                    <RadioGroup.Item
                        key={tipo.valor}
                        value={tipo.valor}
                        className={cx(
                            "flex h-12 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 text-ui font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-foco",
                            ativo
                                ? tipo.valor === "entrada"
                                    ? "border-verde bg-verde-suave text-verde-tinta"
                                    : "border-rosa bg-rosa-suave text-rosa-tinta"
                                : "border-linha text-tinta-media hover:border-linha-forte hover:bg-superficie-hover",
                        )}
                    >
                        <I size={18} stroke={TRACO} aria-hidden />
                        <span className="truncate">{tipo.label}</span>
                    </RadioGroup.Item>
                );
            })}
        </RadioGroup.Root>
    );
}

function SelecaoCategoria({ opcoes, valor, aoMudar, erro, dica }: { opcoes: Categoria[]; valor: string; aoMudar: (valor: string) => void; erro?: string; dica?: string }) {
    const t = useT();
    const grupos = [...opcoes.reduce<Map<string, Categoria[]>>((mapa, c) => mapa.set(c.grupo, [...(mapa.get(c.grupo) ?? []), c]), new Map()).entries()]
        .map(([grupo, lista]) => ({ rotulo: grupo, opcoes: lista.map((c) => ({ valor: c.valor, rotulo: c.label })) }));

    return grupos.length > 1 ? (
        <Selecao rotulo={t("Categoria")} required grupos={grupos} valor={valor} aoMudar={aoMudar} erro={erro} dica={dica} />
    ) : (
        <Selecao rotulo={t("Categoria")} required opcoes={grupos[0]?.opcoes ?? []} valor={valor} aoMudar={aoMudar} erro={erro} dica={dica} />
    );
}
