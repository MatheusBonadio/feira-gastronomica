import { useForm } from "@inertiajs/react";
import { IconArrowLeft, IconBuildingStore, IconCalendarEvent, IconInfoCircle } from "@tabler/icons-react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { CampoData, CampoNumero, Entrada, Selecao } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao } from "@/components/ui/cartao";
import { useT } from "@/lib/i18n";
import { rota } from "@/lib/rotas";
import type { Opcao } from "@/types/inertia";

interface Props {
    feira: { id: number | null; nome: string; dataInicio: string; dataFim: string; status: Opcao; qtdBarraquinhas: number };
    statusOpcoes: Opcao[];
}

export default function Form({ feira, statusOpcoes }: Props) {
    const t = useT();
    const editando = feira.id !== null;
    const form = useForm({
        nome: feira.nome,
        data_inicio: feira.dataInicio,
        data_fim: feira.dataFim,
        status: feira.status.valor,
        qtd_barraquinhas: feira.qtdBarraquinhas as number | null,
    });

    return (
        <>
            <CabecalhoPagina
                titulo={editando ? t("Editar feira") : t("Nova feira")}
                voltar={<BotaoLink href={rota("admin.feiras.index")} variante="fantasma" tamanho="sm" icone={IconArrowLeft} className="self-start">{t("Feiras")}</BotaoLink>}
            />
            <form
                className="grid grid-cols-1 gap-4 xl:grid-cols-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (editando) form.put(rota("admin.feiras.update", { feira: feira.id! }));
                    else form.post(rota("admin.feiras.store"));
                }}
            >
                <div className="flex flex-col gap-4 xl:col-span-2">
                    <Cartao titulo={t("Edição")} icone={IconCalendarEvent}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Entrada className="md:col-span-2" rotulo={t("Nome")} placeholder={t("Ex.: Feira Gastronômica 2027")} required valor={form.data.nome} aoMudar={(v) => form.setData("nome", v)} erro={form.errors.nome} />
                            <CampoData rotulo={t("Início")} required valor={form.data.data_inicio} aoMudar={(v) => form.setData("data_inicio", v)} erro={form.errors.data_inicio} />
                            <CampoData rotulo={t("Fim")} required valor={form.data.data_fim} aoMudar={(v) => form.setData("data_fim", v)} erro={form.errors.data_fim} />
                            <Selecao rotulo={t("Status")} opcoes={statusOpcoes.map((o) => ({ valor: o.valor, rotulo: o.label }))} valor={form.data.status} aoMudar={(v) => form.setData("status", v)} erro={form.errors.status} />
                        </div>
                    </Cartao>
                    <Cartao titulo={t("Barraquinhas")} icone={IconBuildingStore}>
                        <CampoNumero
                            className="max-w-xs"
                            rotulo={t("Quantidade de barraquinhas")}
                            dica={t("Cria uma vaga em branco por barraquinha. Não pode ficar abaixo das que já estão em uso (vendas, lançamentos, itens ou acesso).")}
                            min={1}
                            max={200}
                            required
                            valor={form.data.qtd_barraquinhas}
                            aoMudar={(v) => form.setData("qtd_barraquinhas", v)}
                            erro={form.errors.qtd_barraquinhas}
                        />
                    </Cartao>
                    <div className="flex justify-end gap-2">
                        <BotaoLink href={rota("admin.feiras.index")} variante="secundario">{t("Cancelar")}</BotaoLink>
                        <Botao type="submit" disabled={form.processing}>{t("Salvar")}</Botao>
                    </div>
                </div>
                <Cartao titulo={t("Como funciona")} icone={IconInfoCircle} className="self-start">
                    <ul className="flex list-disc flex-col gap-2 ps-4 text-corpo text-tinta-media">
                        <li>{t("Cada edição é independente: barraquinhas, itens, vendas e saldos não se misturam.")}</li>
                        <li>{t("Aberta: as barraquinhas registram vendas e lançamentos.")}</li>
                        <li>{t("Encerrada: lançamentos bloqueados e relatórios congelados; dá para reabrir.")}</li>
                    </ul>
                </Cartao>
            </form>
        </>
    );
}
