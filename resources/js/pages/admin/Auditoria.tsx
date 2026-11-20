import { router } from "@inertiajs/react";
import { IconAlertTriangle, IconBuildingStore, IconClock, IconFilter, IconShieldCheck, IconUser } from "@tabler/icons-react";
import { Dica } from "@/components/ui/dica";
import { CaixaSelecao, Selecao } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { TRACO } from "@/components/ui/icone";
import { Chip } from "@/components/ui/marcadores";
import { Paginacao } from "@/components/ui/paginacao";
import { Celula, Linha, Tabela } from "@/components/ui/tabela";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { rota, semVazios } from "@/lib/rotas";
import type { Opcao, Paginado } from "@/types/inertia";

interface Registro {
    id: number;
    quando: string;
    acao: Opcao;
    sensivel: boolean;
    usuario: string | null;
    barraquinha: string | null;
    entidade: string | null;
    detalhe: Record<string, unknown> | null;
    ip: string | null;
}

interface Props {
    registros: Paginado<Registro>;
    acao: string | null;
    sensiveis: boolean;
    acoes: Opcao[];
}

export default function Auditoria({ registros, acao, sensiveis, acoes }: Props) {
    const t = useT();
    const { dataHora } = useFormato();

    const filtrar = (mudanca: { acao?: string | null; sensiveis?: boolean }) => {
        const proximo = { acao, sensiveis, ...mudanca };
        router.get(rota("admin.auditoria.index"), semVazios({ acao: proximo.acao, sensiveis: proximo.sensiveis ? 1 : null }), { preserveState: true });
    };

    return (
        <>
            <CabecalhoPagina titulo={t("Auditoria")} descricao={t("Trilha imutável: nem o admin altera ou apaga registros.")} />

            <Cartao corpo="">
                <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
                    <IconFilter size={18} stroke={TRACO} className="hidden shrink-0 text-tinta-suave sm:block" aria-hidden />
                    <Selecao
                        className="sm:w-80"
                        aria-label={t("Ação")}
                        opcoes={acoes.map((o) => ({ valor: o.valor, rotulo: o.label }))}
                        valor={acao ?? ""}
                        vazio={t("Todas as ações")}
                        aoMudar={(v) => filtrar({ acao: v || null })}
                    />
                    <div className="flex min-h-10 items-center">
                        <CaixaSelecao marcado={sensiveis} aoMudar={(v) => filtrar({ sensiveis: v })}>
                            {t("Só eventos sensíveis")}
                        </CaixaSelecao>
                    </div>
                </div>

                <Tabela
                    rotulo={t("Registros de auditoria")}
                    colunas={[
                        { chave: "quando", rotulo: t("Quando"), icone: IconClock },
                        { chave: "acao", rotulo: t("Ação") },
                        { chave: "quem", rotulo: t("Quem"), icone: IconUser },
                        { chave: "barraquinha", rotulo: t("Barraquinha"), icone: IconBuildingStore },
                        { chave: "registro", rotulo: t("Registro") },
                        { chave: "detalhe", rotulo: t("Detalhe") },
                        { chave: "ip", rotulo: t("IP"), cartao: "oculta" },
                    ]}
                    vazio={<Vazio icone={IconShieldCheck} titulo={t("Nenhum registro")} />}
                >
                    {registros.dados.map((r) => {
                        const detalhe = r.detalhe ? JSON.stringify(r.detalhe) : null;
                        return (
                            <Linha key={r.id}>
                                <Celula cabecalho>
                                    <span className="whitespace-nowrap tabular-nums">{dataHora(r.quando)}</span>
                                </Celula>
                                <Celula>
                                    {r.sensivel ? (
                                        <Chip tom="ambar">
                                            <IconAlertTriangle size={13} stroke={2} aria-hidden />
                                            {r.acao.label}
                                        </Chip>
                                    ) : (
                                        <span className="text-tinta">{r.acao.label}</span>
                                    )}
                                </Celula>
                                <Celula><span className="break-words">{r.usuario ?? "-"}</span></Celula>
                                <Celula><span className="break-words">{r.barraquinha ?? "-"}</span></Celula>
                                <Celula>{r.entidade ?? "-"}</Celula>
                                <Celula>
                                    {detalhe ? (
                                        <Dica rotulo={<span dir="ltr" className="block font-mono break-all">{detalhe}</span>}>
                                        <code
                                            dir="ltr"
                                            tabIndex={0}
                                            className="block max-w-[55vw] truncate font-mono text-rotulo text-tinta-suave md:max-w-xs xl:max-w-sm"
                                        >
                                            {detalhe}
                                        </code>
                                        </Dica>
                                    ) : "-"}
                                </Celula>
                                <Celula>
                                    <span dir="ltr" className="font-mono text-rotulo">{r.ip ?? "-"}</span>
                                </Celula>
                            </Linha>
                        );
                    })}
                </Tabela>
                <Paginacao paginado={registros} />
            </Cartao>
        </>
    );
}
