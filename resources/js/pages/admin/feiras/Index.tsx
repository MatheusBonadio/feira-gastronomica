import { router } from "@inertiajs/react";
import { IconCalendar, IconCalendarEvent, IconCopy, IconLock, IconLockOpen, IconPencil, IconPlus, IconReceipt } from "@tabler/icons-react";
import { useState } from "react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { Confirmar } from "@/components/ui/dialogo";
import { Chip, ChipStatus } from "@/components/ui/marcadores";
import { Celula, Linha, Tabela } from "@/components/ui/tabela";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { rota } from "@/lib/rotas";
import type { Opcao } from "@/types/inertia";

interface Feira {
    id: number;
    nome: string;
    dataInicio: string;
    dataFim: string;
    dataCortePreVenda: string;
    status: Opcao;
    qtdBarraquinhas: number;
    encerrada: boolean;
    vendas: number;
    atual: boolean;
}

export default function Index({ feiras }: { feiras: Feira[] }) {
    const t = useT();
    const { data, dataHora, numero } = useFormato();
    const [encerrando, setEncerrando] = useState<Feira | null>(null);

    return (
        <>
            <CabecalhoPagina
                titulo={t("Feiras")}
                descricao={t("Cada edição tem barraquinhas, itens, vendas e saldos próprios.")}
                acoes={<BotaoLink href={rota("admin.feiras.create")} icone={IconPlus}>{t("Nova feira")}</BotaoLink>}
            />

            <Cartao corpo="">
                <Tabela
                    rotulo={t("Feiras")}
                    colunas={[
                        { chave: "feira", rotulo: t("Feira"), icone: IconCalendarEvent },
                        { chave: "periodo", rotulo: t("Período"), icone: IconCalendar },
                        { chave: "preVenda", rotulo: t("Pré-venda até") },
                        { chave: "status", rotulo: t("Status") },
                        { chave: "barraquinhas", rotulo: t("Barraquinhas"), alinhar: "direita" },
                        { chave: "vendas", rotulo: t("Vendas"), icone: IconReceipt, alinhar: "direita" },
                        { chave: "acoes", rotulo: t("Ações") },
                    ]}
                    vazio={<Vazio icone={IconCalendarEvent} titulo={t("Nenhuma feira cadastrada")} />}
                >
                    {feiras.map((f) => (
                        <Linha key={f.id}>
                            <Celula cabecalho>
                                <span className="flex items-center gap-2">
                                    <span className="font-medium text-tinta">{f.nome}</span>
                                    {f.atual && <Chip tom="secundaria">{t("em uso")}</Chip>}
                                </span>
                            </Celula>
                            <Celula>{data(f.dataInicio)} – {data(f.dataFim)}</Celula>
                            <Celula>{dataHora(f.dataCortePreVenda || null)}</Celula>
                            <Celula><ChipStatus opcao={f.status} /></Celula>
                            <Celula direita>{numero(f.qtdBarraquinhas)}</Celula>
                            <Celula direita>{numero(f.vendas)}</Celula>
                            <Celula>
                                <span className="flex flex-wrap gap-1">
                                    {!f.atual && <Botao tamanho="sm" variante="fantasma" onClick={() => router.post(rota("admin.feiras.selecionar", { feira: f.id }))}>{t("Usar")}</Botao>}
                                    <BotaoLink href={rota("admin.feiras.edit", { feira: f.id })} variante="fantasma" tamanho="sm" icone={IconPencil}>{t("Editar")}</BotaoLink>
                                    <BotaoLink href={rota("admin.feiras.duplicar", { feira: f.id })} variante="fantasma" tamanho="sm" icone={IconCopy}>{t("Duplicar")}</BotaoLink>
                                    {f.encerrada ? (
                                        <Botao tamanho="sm" variante="fantasma" icone={IconLockOpen} onClick={() => router.patch(rota("admin.feiras.reabrir", { feira: f.id }))}>{t("Reabrir")}</Botao>
                                    ) : (
                                        <Botao tamanho="sm" variante="fantasma" icone={IconLock} onClick={() => setEncerrando(f)}>{t("Encerrar")}</Botao>
                                    )}
                                </span>
                            </Celula>
                        </Linha>
                    ))}
                </Tabela>
            </Cartao>

            <Confirmar
                aberto={encerrando !== null}
                aoFechar={() => setEncerrando(null)}
                perigo={false}
                titulo={t("Encerrar :feira?", { feira: encerrando?.nome ?? "" })}
                descricao={t("Novos lançamentos ficam bloqueados e os relatórios, congelados. Você pode reabrir depois.")}
                rotuloConfirmar={t("Encerrar feira")}
                aoConfirmar={() => new Promise<void>((ok) => {
                    if (encerrando) router.patch(rota("admin.feiras.encerrar", { feira: encerrando.id }), {}, { onFinish: () => ok() });
                })}
            />
        </>
    );
}
