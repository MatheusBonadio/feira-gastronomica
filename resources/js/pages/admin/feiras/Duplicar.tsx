import { useForm } from "@inertiajs/react";
import { IconArrowLeft, IconCopy, IconInfoCircle } from "@tabler/icons-react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { CampoData, Entrada } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao } from "@/components/ui/cartao";
import { useT } from "@/lib/i18n";
import { rota } from "@/lib/rotas";

/** Copia barraquinhas e itens (com preços) para a próxima edição. Vendas, combos e logins não vêm junto. */
export default function Duplicar({ origem }: { origem: { id: number; nome: string } }) {
    const t = useT();
    const form = useForm({ nome: "", data_inicio: "", data_fim: "" });

    return (
        <>
            <CabecalhoPagina
                titulo={t("Duplicar :feira", { feira: origem.nome })}
                voltar={<BotaoLink href={rota("admin.feiras.index")} variante="fantasma" tamanho="sm" icone={IconArrowLeft} className="self-start">{t("Feiras")}</BotaoLink>}
            />
            <form
                className="grid grid-cols-1 gap-4 xl:grid-cols-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(rota("admin.feiras.duplicar.store", { feira: origem.id }));
                }}
            >
                <div className="flex flex-col gap-4 xl:col-span-2">
                    <Cartao titulo={t("Nova edição")} icone={IconCopy}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Entrada className="md:col-span-2" rotulo={t("Nome da nova feira")} required valor={form.data.nome} aoMudar={(v) => form.setData("nome", v)} erro={form.errors.nome} />
                            <CampoData rotulo={t("Início")} required valor={form.data.data_inicio} aoMudar={(v) => form.setData("data_inicio", v)} erro={form.errors.data_inicio} />
                            <CampoData rotulo={t("Fim")} required valor={form.data.data_fim} aoMudar={(v) => form.setData("data_fim", v)} erro={form.errors.data_fim} />
                        </div>
                    </Cartao>
                    <div className="flex justify-end">
                        <Botao type="submit" icone={IconCopy} disabled={form.processing}>{t("Duplicar")}</Botao>
                    </div>
                </div>
                <Cartao titulo={t("O que é copiado")} icone={IconInfoCircle} className="self-start">
                    <p className="text-corpo text-tinta-media">{t("Barraquinhas e itens são copiados. Vendas, combos e acessos não.")}</p>
                </Cartao>
            </form>
        </>
    );
}
