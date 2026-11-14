import { router } from "@inertiajs/react";
import { IconAdjustmentsHorizontal, IconChevronDown, IconFilter, IconX } from "@tabler/icons-react";
import { Collapsible } from "radix-ui";
import { useState, type ReactNode } from "react";
import { Botao } from "@/components/ui/botao";
import { CampoData, Selecao } from "@/components/ui/campos";
import { cx } from "@/lib/cx";
import { MD, useMidia } from "@/lib/midia";
import { useT } from "@/lib/i18n";
import { semVazios } from "@/lib/rotas";
import type { Opcao } from "@/types/inertia";

export interface FiltroVendas {
    de?: string;
    ate?: string;
    canal?: string;
    tag?: string;
    pagamento?: string;
    [chave: string]: string | undefined;
}

export const opcoesSelecao = (opcoes: Opcao[]) => opcoes.map((o) => ({ valor: o.valor, rotulo: o.label }));

/**
 * Filtros por período, canal, tag e pagamento (seções 8 e 9), aplicados pela
 * URL: o resultado pode ser compartilhado e voltado no navegador.
 */
export function FiltrosVendas({ inicial, canais, pagamentos, numerosCombo = [], extras }: {
    inicial: FiltroVendas;
    canais: Opcao[];
    pagamentos: Opcao[];
    numerosCombo?: number[];
    extras?: ReactNode;
}) {
    const t = useT();
    const [filtro, setFiltro] = useState<FiltroVendas>(inicial);
    const definir = (campo: string) => (valor: string) => setFiltro((f) => ({ ...f, [campo]: valor }));
    const tags = [{ valor: "comum", rotulo: t("Comum") }, ...numerosCombo.map((n) => ({ valor: `combo:${n}`, rotulo: t("Combo :n", { n }) }))];
    const aplicar = (dados: FiltroVendas) => router.get(window.location.pathname, semVazios(dados), { preserveState: true, preserveScroll: true });
    const ativos = Object.values(semVazios(inicial)).length;
    // No celular os filtros ficam recolhidos (Radix Collapsible); a partir do md, sempre abertos.
    const [aberto, setAberto] = useState(false);
    const largo = useMidia(MD);
    const campo = "w-full md:w-40";

    return (
        <Collapsible.Root open={largo || aberto} onOpenChange={setAberto}>
            <Collapsible.Trigger
                className="flex h-10 w-full items-center gap-2 rounded-controle text-ui font-medium text-tinta outline-none focus-visible:ring-2 focus-visible:ring-foco md:hidden"
            >
                <IconAdjustmentsHorizontal size={18} stroke={1.5} className="text-tinta-media" aria-hidden />
                {t("Filtros")}
                {ativos > 0 && <span className="rounded-full bg-secundaria px-2 text-micro font-semibold text-secundaria-tinta">{ativos}</span>}
                <IconChevronDown size={16} stroke={1.5} className={cx("ms-auto text-tinta-suave transition-transform", aberto && "rotate-180")} aria-hidden />
            </Collapsible.Trigger>
            <Collapsible.Content asChild>
            <form
                className="grid grid-cols-2 items-end gap-3 max-md:mt-3 md:flex md:flex-wrap"
                onSubmit={(e) => {
                    e.preventDefault();
                    aplicar(filtro);
                }}
            >
                <CampoData className={campo} rotulo={t("De")} valor={filtro.de ?? ""} aoMudar={definir("de")} />
                <CampoData className={campo} rotulo={t("Até")} valor={filtro.ate ?? ""} aoMudar={definir("ate")} />
                <Selecao className={campo} rotulo={t("Canal")} opcoes={opcoesSelecao(canais)} vazio={t("Todos")} valor={filtro.canal ?? ""} aoMudar={definir("canal")} />
                <Selecao className={campo} rotulo={t("Pagamento")} opcoes={opcoesSelecao(pagamentos)} vazio={t("Todos")} valor={filtro.pagamento ?? ""} aoMudar={definir("pagamento")} />
                <Selecao className={cx(campo, "col-span-2 md:col-span-1")} rotulo={t("Tag")} opcoes={tags} vazio={t("Todas")} valor={filtro.tag ?? ""} aoMudar={definir("tag")} />
                {extras}
                <div className="col-span-2 flex flex-wrap gap-2">
                    <Botao type="submit" variante="secundario" icone={IconFilter} className="max-md:flex-1">{t("Filtrar")}</Botao>
                    {ativos > 0 && (
                        <Botao variante="fantasma" icone={IconX} onClick={() => aplicar({})} className="max-md:flex-1">
                            {t("Limpar")}
                        </Botao>
                    )}
                </div>
            </form>
            </Collapsible.Content>
        </Collapsible.Root>
    );
}
