import { router, useForm } from "@inertiajs/react";
import { IconCategory, IconInfoCircle, IconPlus, IconTag } from "@tabler/icons-react";
import { Botao } from "@/components/ui/botao";
import { Entrada, Interruptor } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { Chip } from "@/components/ui/marcadores";
import { Celula, Linha, Tabela } from "@/components/ui/tabela";
import { cx } from "@/lib/cx";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { rota } from "@/lib/rotas";

interface Categoria {
    id: number;
    nome: string;
    ativo: boolean;
    padrao: boolean;
    itens: number;
}

export default function Categorias({ categorias }: { categorias: Categoria[] }) {
    const t = useT();
    const { numero } = useFormato();
    const form = useForm({ nome: "" });

    return (
        <>
            <CabecalhoPagina titulo={t("Categorias de item")} descricao={t("Lista fechada usada no cadastro de itens de todas as barraquinhas.")} />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <Cartao titulo={t("Categorias")} icone={IconCategory} corpo="" className="xl:col-span-2">
                    <Tabela
                        rotulo={t("Categorias de item")}
                        colunas={[
                            { chave: "nome", rotulo: t("Categoria"), icone: IconTag },
                            { chave: "itens", rotulo: t("Itens"), alinhar: "direita" },
                            { chave: "ativa", rotulo: t("Situação") },
                        ]}
                        vazio={<Vazio icone={IconCategory} titulo={t("Nenhuma categoria cadastrada")} />}
                    >
                        {categorias.map((c) => (
                            <Linha key={c.id} apagada={!c.ativo}>
                                <Celula cabecalho>
                                    <span className="flex min-w-0 flex-wrap items-center gap-2">
                                        <span className={cx("min-w-0 break-words", c.ativo ? "font-medium text-tinta" : "text-tinta-suave")}>{c.nome}</span>
                                        {c.padrao && <Chip>{t("padrão")}</Chip>}
                                    </span>
                                </Celula>
                                <Celula direita>{numero(c.itens)}</Celula>
                                <Celula>
                                    <Interruptor
                                        ligado={c.ativo}
                                        rotuloAcessivel={c.ativo ? t("Desativar :nome", { nome: c.nome }) : t("Ativar :nome", { nome: c.nome })}
                                        aoMudar={() => router.patch(rota("admin.categorias.alternar", { categoria: c.id }), {}, { preserveScroll: true })}
                                    >
                                        <span className="text-corpo text-tinta-media">{c.ativo ? t("Ativa") : t("Inativa")}</span>
                                    </Interruptor>
                                </Celula>
                            </Linha>
                        ))}
                    </Tabela>
                </Cartao>

                <div className="flex min-w-0 flex-col gap-4">
                    <Cartao titulo={t("Nova categoria")} icone={IconPlus}>
                        <form
                            className="flex flex-col gap-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post(rota("admin.categorias.store"), { preserveScroll: true, onSuccess: () => form.reset() });
                            }}
                        >
                            <Entrada
                                rotulo={t("Nome")}
                                placeholder={t("Ex.: Salgado")}
                                required
                                maxLength={60}
                                valor={form.data.nome}
                                aoMudar={(v) => form.setData("nome", v)}
                                erro={form.errors.nome}
                            />
                            <Botao type="submit" icone={IconPlus} disabled={form.processing} className="max-sm:h-11 sm:self-end">
                                {t("Adicionar")}
                            </Botao>
                        </form>
                    </Cartao>

                    <Cartao titulo={t("Como funciona")} icone={IconInfoCircle}>
                        <ul className="flex list-disc flex-col gap-2 ps-4 text-corpo text-tinta-media">
                            <li>{t("Comida, Bebida e Sobremesa vêm prontas; só o admin inclui outras.")}</li>
                            <li>{t("Categoria inativa some do cadastro de itens; os itens que já a usam continuam como estão.")}</li>
                        </ul>
                    </Cartao>
                </div>
            </div>
        </>
    );
}

