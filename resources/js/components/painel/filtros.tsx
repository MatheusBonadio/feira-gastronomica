import { router } from "@inertiajs/react";
import { IconAdjustmentsHorizontal, IconChevronDown, IconFilter, IconX } from "@tabler/icons-react";
import { Collapsible, Popover } from "radix-ui";
import { useState, type ReactNode } from "react";
import { Botao } from "@/components/ui/botao";
import { CampoData, Selecao } from "@/components/ui/campos";
import { TRACO } from "@/components/ui/icone";
import { Contador } from "@/components/ui/marcadores";
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

/** Aplica o filtro pela URL: o resultado pode ser compartilhado e voltado no navegador. */
export function aplicarFiltro(dados: FiltroVendas) {
    router.get(window.location.pathname, semVazios(dados), { preserveState: true, preserveScroll: true });
}

interface PropsFiltros {
    inicial: FiltroVendas;
    canais: Opcao[];
    pagamentos: Opcao[];
    numerosCombo?: number[];
    extras?: ReactNode;
}

/** Campos e botões dos filtros (período, canal, pagamento, tag — seções 8 e 9). */
function FormularioFiltros({ inicial, canais, pagamentos, numerosCombo = [], extras, empilhado, aoAplicar }: PropsFiltros & { empilhado?: boolean; aoAplicar?: () => void }) {
    const t = useT();
    const [filtro, setFiltro] = useState<FiltroVendas>(inicial);
    const definir = (campo: string) => (valor: string) => setFiltro((f) => ({ ...f, [campo]: valor }));
    const tags = [{ valor: "comum", rotulo: t("Comum") }, ...numerosCombo.map((n) => ({ valor: `combo:${n}`, rotulo: t("Combo :n", { n }) }))];
    const ativos = Object.values(semVazios(inicial)).length;
    const aplicar = (dados: FiltroVendas) => {
        aplicarFiltro(dados);
        aoAplicar?.();
    };
    const campo = empilhado ? "w-full" : "w-full md:w-40";

    return (
        <form
            className={cx("grid grid-cols-2 items-end gap-3", !empilhado && "md:flex md:flex-wrap")}
            onSubmit={(e) => {
                e.preventDefault();
                aplicar(filtro);
            }}
        >
            <CampoData className={campo} rotulo={t("De")} valor={filtro.de ?? ""} aoMudar={definir("de")} />
            <CampoData className={campo} rotulo={t("Até")} valor={filtro.ate ?? ""} aoMudar={definir("ate")} />
            <Selecao className={campo} rotulo={t("Canal")} opcoes={opcoesSelecao(canais)} vazio={t("Todos")} valor={filtro.canal ?? ""} aoMudar={definir("canal")} />
            <Selecao className={campo} rotulo={t("Pagamento")} opcoes={opcoesSelecao(pagamentos)} vazio={t("Todos")} valor={filtro.pagamento ?? ""} aoMudar={definir("pagamento")} />
            <Selecao className={cx(campo, "col-span-2", !empilhado && "md:col-span-1")} rotulo={t("Tag")} opcoes={tags} vazio={t("Todas")} valor={filtro.tag ?? ""} aoMudar={definir("tag")} />
            {extras}
            <div className="col-span-2 flex flex-wrap gap-2">
                <Botao type="submit" variante={empilhado ? "primario" : "secundario"} icone={IconFilter} className={empilhado ? "flex-1" : "max-md:flex-1"}>{t("Filtrar")}</Botao>
                {ativos > 0 && (
                    <Botao variante="fantasma" icone={IconX} onClick={() => aplicar({})} className={empilhado ? "flex-1" : "max-md:flex-1"}>
                        {t("Limpar")}
                    </Botao>
                )}
            </div>
        </form>
    );
}

/**
 * Filtros em linha (listas): no celular ficam recolhidos (Radix Collapsible)
 * atrás de "Filtros (n)"; a partir do md, sempre abertos.
 */
export function FiltrosVendas(props: PropsFiltros) {
    const t = useT();
    const [aberto, setAberto] = useState(false);
    const largo = useMidia(MD);
    const ativos = Object.values(semVazios(props.inicial)).length;

    return (
        <Collapsible.Root open={largo || aberto} onOpenChange={setAberto}>
            <Collapsible.Trigger className="flex h-10 w-full items-center gap-2 rounded-controle text-ui font-semibold text-tinta outline-none focus-visible:ring-2 focus-visible:ring-foco md:hidden">
                <IconAdjustmentsHorizontal size={18} stroke={TRACO} className="text-tinta-media" aria-hidden />
                {t("Filtros")}
                {ativos > 0 && <Contador tom="secundaria">{ativos}</Contador>}
                <IconChevronDown size={16} stroke={TRACO} className={cx("ms-auto text-tinta-suave transition-transform", aberto && "rotate-180")} aria-hidden />
            </Collapsible.Trigger>
            <Collapsible.Content className="max-md:mt-3">
                <FormularioFiltros {...props} />
            </Collapsible.Content>
        </Collapsible.Root>
    );
}

/** Filtros num botão com popover (Radix Popover), para o topo dos painéis. */
export function BotaoFiltros(props: PropsFiltros) {
    const t = useT();
    const [aberto, setAberto] = useState(false);
    const ativos = Object.values(semVazios(props.inicial)).length;

    return (
        <Popover.Root open={aberto} onOpenChange={setAberto}>
            <Popover.Trigger asChild>
                <Botao variante={ativos ? "secundario" : "superficie"} icone={IconAdjustmentsHorizontal}>
                    {t("Filtros")}
                    {ativos > 0 && <Contador tom="secundaria">{ativos}</Contador>}
                </Botao>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    align="end"
                    sideOffset={8}
                    collisionPadding={8}
                    className="z-50 w-88 max-w-[calc(100vw-1rem)] rounded-2xl border border-linha bg-superficie p-4 text-tinta shadow-flutuante outline-none data-[state=open]:animate-surgir"
                >
                    <p className="mb-3 text-titulo font-semibold">{t("Filtrar o painel")}</p>
                    <FormularioFiltros {...props} empilhado aoAplicar={() => setAberto(false)} />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
