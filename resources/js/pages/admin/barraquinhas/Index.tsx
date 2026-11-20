import {
    IconBuildingStore,
    IconCalendarEvent,
    IconKey,
    IconLayoutDashboard,
    IconLock,
    IconPencil,
    IconReceipt,
    IconSearch,
    IconSettings,
    IconUserOff,
} from "@tabler/icons-react";
import { useState } from "react";
import { BotaoLink } from "@/components/ui/botao";
import { Entrada, Selecao } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao, PilulaStats, Vazio } from "@/components/ui/cartao";
import { Avatar, Chip, ChipStatus } from "@/components/ui/marcadores";
import { Celula, Linha, Tabela } from "@/components/ui/tabela";
import { cx } from "@/lib/cx";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { rota } from "@/lib/rotas";
import type { Barraquinha } from "@/types/dominio";

interface LinhaBarraquinha extends Barraquinha {
    usuario: string | null;
    ultimoAcesso: string | null;
    vendas: number;
    itens: number;
    combos: number;
}

interface Props {
    feira: { id: number; nome: string; qtd: number; encerrada: boolean } | null;
    barraquinhas: LinhaBarraquinha[];
}

type Filtro = "" | "preenchidas" | "vagas" | "sem-acesso" | "bloqueadas";

export default function Index({ feira, barraquinhas }: Props) {
    const t = useT();
    const { numero, dataHora } = useFormato();
    const [busca, setBusca] = useState("");
    const [filtro, setFiltro] = useState<Filtro>("");

    if (!feira) {
        return (
            <>
                <CabecalhoPagina titulo={t("Barraquinhas")} />
                <Cartao>
                    <Vazio
                        icone={IconCalendarEvent}
                        titulo={t("Nenhuma feira selecionada")}
                        acao={<BotaoLink href={rota("admin.feiras.create")}>{t("Nova feira")}</BotaoLink>}
                    />
                </Cartao>
            </>
        );
    }

    const preenchidas = barraquinhas.filter((b) => !b.vaga);
    const semAcesso = preenchidas.filter((b) => !b.usuario).length;
    const bloqueadas = barraquinhas.filter((b) => b.status.valor === "bloqueada").length;

    const termo = busca.trim().toLocaleLowerCase();
    const visiveis = barraquinhas.filter((b) => {
        if (termo && !`${b.nome} ${b.usuario ?? ""}`.toLocaleLowerCase().includes(termo)) return false;
        if (filtro === "preenchidas") return !b.vaga;
        if (filtro === "vagas") return b.vaga;
        if (filtro === "sem-acesso") return !b.vaga && !b.usuario;
        if (filtro === "bloqueadas") return b.status.valor === "bloqueada";
        return true;
    });

    return (
        <>
            <CabecalhoPagina
                titulo={t("Barraquinhas")}
                descricao={t(":feira · :preenchidas de :total vagas preenchidas", { feira: feira.nome, preenchidas: preenchidas.length, total: feira.qtd })}
                acoes={
                    <BotaoLink href={rota("admin.feiras.edit", { feira: feira.id })} variante="secundario" icone={IconSettings}>
                        {t("Alterar quantidade")}
                    </BotaoLink>
                }
            >
                <PilulaStats
                    itens={[
                        { icone: IconBuildingStore, valor: numero(preenchidas.length), rotulo: t("preenchidas") },
                        { icone: IconKey, valor: numero(semAcesso), rotulo: t("sem acesso") },
                        { icone: IconLock, valor: numero(bloqueadas), rotulo: t("bloqueadas") },
                    ]}
                />
            </CabecalhoPagina>

            <Cartao corpo="">
                <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_14rem] sm:p-4">
                    <Entrada
                        type="search"
                        icone={IconSearch}
                        placeholder={t("Buscar por nome ou usuário")}
                        aria-label={t("Buscar por nome ou usuário")}
                        valor={busca}
                        aoMudar={setBusca}
                    />
                    <Selecao
                        aria-label={t("Filtrar barraquinhas")}
                        vazio={t("Todas")}
                        valor={filtro}
                        aoMudar={(v) => setFiltro(v as Filtro)}
                        opcoes={[
                            { valor: "preenchidas", rotulo: t("Preenchidas") },
                            { valor: "vagas", rotulo: t("Vagas em branco") },
                            { valor: "sem-acesso", rotulo: t("Sem acesso") },
                            { valor: "bloqueadas", rotulo: t("Bloqueadas") },
                        ]}
                    />
                </div>

                <Tabela
                    rotulo={t("Barraquinhas")}
                    colunas={[
                        { chave: "barraquinha", rotulo: t("Barraquinha"), icone: IconBuildingStore },
                        { chave: "acesso", rotulo: t("Acesso"), icone: IconKey },
                        { chave: "status", rotulo: t("Status") },
                        { chave: "itens", rotulo: t("Itens"), alinhar: "direita" },
                        { chave: "combos", rotulo: t("Combos"), alinhar: "direita", cartao: "oculta" },
                        { chave: "vendas", rotulo: t("Vendas"), icone: IconReceipt, alinhar: "direita" },
                        { chave: "acoes", rotulo: t("Ações") },
                    ]}
                    vazio={
                        <Vazio
                            icone={IconBuildingStore}
                            titulo={barraquinhas.length ? t("Nenhuma barraquinha encontrada") : t("Nenhuma vaga nesta feira")}
                        />
                    }
                >
                    {visiveis.map((b) => (
                        <Linha key={b.id} href={rota("admin.barraquinhas.edit", { barraquinha: b.id })}>
                            <Celula cabecalho>
                                <span className="flex min-w-0 items-center gap-2.5">
                                    <span className="w-6 shrink-0 text-end text-rotulo tabular-nums text-tinta-fraca">{b.posicao}</span>
                                    {!b.vaga && <Avatar nome={b.nome} foto={b.foto} tamanho="sm" />}
                                    <span className={cx("min-w-0 truncate", b.vaga ? "text-tinta-fraca italic" : "font-medium text-tinta")}>{b.nome}</span>
                                </span>
                            </Celula>
                            <Celula>
                                {b.usuario ? (
                                    <span className="flex min-w-0 flex-col">
                                        <span dir="ltr" className="truncate font-mono text-rotulo text-tinta">{b.usuario}</span>
                                        <span className="truncate text-micro text-tinta-suave">
                                            {b.ultimoAcesso ? t("Último acesso :data", { data: dataHora(b.ultimoAcesso) }) : t("Nunca acessou")}
                                        </span>
                                    </span>
                                ) : b.vaga ? (
                                    <span className="text-tinta-fraca">-</span>
                                ) : (
                                    <Chip tom="ambar">
                                        <IconUserOff size={13} stroke={2} aria-hidden />
                                        {t("Sem acesso")}
                                    </Chip>
                                )}
                            </Celula>
                            <Celula><ChipStatus opcao={b.status} /></Celula>
                            <Celula direita>{numero(b.itens)}</Celula>
                            <Celula direita>{numero(b.combos)}</Celula>
                            <Celula direita>{numero(b.vendas)}</Celula>
                            <Celula>
                                <span className="flex flex-wrap justify-end gap-1 md:justify-start">
                                    <BotaoLink
                                        href={rota("admin.barraquinhas.edit", { barraquinha: b.id })}
                                        variante="fantasma"
                                        tamanho="sm"
                                        icone={IconPencil}
                                        className="max-md:h-10"
                                    >
                                        {b.vaga ? t("Preencher") : t("Editar")}
                                    </BotaoLink>
                                    {!b.vaga && (
                                        <BotaoLink
                                            href={rota("admin.loja.painel", { barraquinha: b.id })}
                                            variante="fantasma"
                                            tamanho="sm"
                                            icone={IconLayoutDashboard}
                                            className="max-md:h-10"
                                        >
                                            {t("Painel")}
                                        </BotaoLink>
                                    )}
                                </span>
                            </Celula>
                        </Linha>
                    ))}
                </Tabela>
            </Cartao>
        </>
    );
}
