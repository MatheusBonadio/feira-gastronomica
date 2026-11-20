import { router } from "@inertiajs/react";
import { IconArrowDown, IconArrowUp, IconSelector } from "@tabler/icons-react";
import { Children, cloneElement, createContext, isValidElement, useContext, useRef, type ReactElement, type ReactNode } from "react";
import { Selecao } from "@/components/ui/campos";
import { Dica } from "@/components/ui/dica";
import { TRACO, type Icone } from "@/components/ui/icone";
import { cx } from "@/lib/cx";
import { useT } from "@/lib/i18n";

export interface Coluna {
    chave: string;
    rotulo: ReactNode;
    icone?: Icone;
    alinhar?: "esquerda" | "direita";
    ordenavel?: boolean;
    className?: string;
    /**
     * Papel no modo cartão (telas < md). Padrão: a célula `cabecalho` vira o
     * título; a coluna "acoes" vai para o rodapé; as demais viram "rótulo: valor".
     * "oculta" esconde a coluna no cartão (informação secundária).
     */
    cartao?: "titulo" | "acoes" | "oculta" | "campo";
}

const ColunasContexto = createContext<Coluna[]>([]);

/**
 * Tabela da referência: cabeçalho cinza com ícones, divisórias verticais finas
 * entre colunas e linhas separadas por borda. Ordenação opcional por coluna.
 *
 * Abaixo de md (768px) vira lista de cartões: cada linha é um cartão com o
 * título no topo, um "rótulo: valor" por campo e as ações no rodapé. Os
 * rótulos vêm das colunas, então as páginas não repetem nada.
 */
export function Tabela({ colunas, children, rotulo, ordem, direcao, aoOrdenar, vazio }: {
    colunas: Coluna[];
    children: ReactNode;
    rotulo: string;
    ordem?: string;
    direcao?: "asc" | "desc";
    aoOrdenar?: (coluna: string) => void;
    vazio?: ReactNode;
}) {
    const t = useT();
    const semLinhas = Children.toArray(children).length === 0;
    const ordenaveis = aoOrdenar ? colunas.filter((c) => c.ordenavel) : [];

    return (
        <ColunasContexto.Provider value={colunas}>
            {/* No modo cartão o cabeçalho some; a ordenação continua num seletor. */}
            {ordenaveis.length > 0 && !semLinhas && (
                <div className="flex items-center gap-2 border-t border-linha px-3 pt-3 md:hidden">
                    <Selecao
                        className="min-w-0 flex-1"
                        tamanho="sm"
                        aria-label={t("Ordenar por")}
                        valor={ordem ?? ""}
                        placeholder={t("Ordenar por")}
                        aoMudar={(v) => aoOrdenar?.(v)}
                        opcoes={ordenaveis.map((c) => ({ valor: c.chave, rotulo: typeof c.rotulo === "string" ? c.rotulo : c.chave }))}
                    />
                    <Dica rotulo={t("Inverter ordem")}>
                    <button
                        type="button"
                        onClick={() => ordem && aoOrdenar?.(ordem)}
                        aria-label={direcao === "asc" ? t("Ordem crescente") : t("Ordem decrescente")}
                        className="flex size-11 shrink-0 items-center justify-center rounded-controle border border-linha text-tinta-media outline-none hover:bg-superficie-hover focus-visible:ring-2 focus-visible:ring-foco"
                    >
                        {direcao === "asc" ? <IconArrowUp size={16} stroke={TRACO} aria-hidden /> : <IconArrowDown size={16} stroke={TRACO} aria-hidden />}
                    </button>
                    </Dica>
                </div>
            )}
            <div className="rolagem-fina relative md:overflow-x-auto">
                <table aria-label={rotulo} className="w-full border-collapse text-corpo max-md:block">
                    <thead className="max-md:sr-only">
                        <tr className="border-y border-linha">
                            {colunas.map((c) => {
                                const ativa = ordem === c.chave;
                                const SetaOrdem = ativa ? (direcao === "asc" ? IconArrowUp : IconArrowDown) : IconSelector;
                                const conteudo = (
                                    <span className={cx("inline-flex items-center gap-2", c.alinhar === "direita" && "flex-row-reverse")}>
                                        {c.icone && <c.icone size={15} stroke={TRACO} className="text-tinta-fraca" aria-hidden />}
                                        {c.rotulo}
                                        {c.ordenavel && <SetaOrdem size={14} stroke={TRACO} className={ativa ? "text-tinta" : "text-tinta-fraca"} aria-hidden />}
                                    </span>
                                );
                                return (
                                    <th
                                        key={c.chave}
                                        scope="col"
                                        aria-sort={ativa ? (direcao === "asc" ? "ascending" : "descending") : undefined}
                                        className={cx(
                                            "h-10 px-4 text-rotulo font-semibold whitespace-nowrap text-tinta-suave first:ps-5 last:pe-5",
                                            c.alinhar === "direita" ? "text-end" : "text-start",
                                            c.className,
                                        )}
                                    >
                                        {c.ordenavel && aoOrdenar ? (
                                            <button type="button" onClick={() => aoOrdenar(c.chave)} className="hover:text-tinta">{conteudo}</button>
                                        ) : conteudo}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="max-md:flex max-md:flex-col max-md:gap-3 max-md:p-3">
                        {semLinhas && vazio ? (
                            <tr className="max-md:block">
                                <td colSpan={colunas.length} className="max-md:block">{vazio}</td>
                            </tr>
                        ) : children}
                    </tbody>
                </table>
            </div>
        </ColunasContexto.Provider>
    );
}

interface PropsCelula {
    children?: ReactNode;
    direita?: boolean;
    className?: string;
    cabecalho?: boolean;
    /** Preenchido pela Linha a partir das colunas da Tabela. */
    coluna?: Coluna;
}

/** Linha clicável opcional (abre o detalhe pelo Inertia). No celular, um cartão. */
export function Linha({ children, href, apagada, className }: { children: ReactNode; href?: string; apagada?: boolean; className?: string }) {
    const colunas = useContext(ColunasContexto);
    // Como os links do kit: com o mouse parado na linha, o detalhe já vem antes do clique.
    const espera = useRef<number | undefined>(undefined);
    const preCarregar = href ? () => (espera.current = window.setTimeout(() => router.prefetch(href, { method: "get" }), 75)) : undefined;
    const cancelar = href ? () => window.clearTimeout(espera.current) : undefined;
    // Cada célula recebe a sua coluna pela posição (ignora null/false de células condicionais).
    const celulas = Children.toArray(children).map((filho, i) =>
        isValidElement(filho) && filho.type === Celula ? cloneElement(filho as ReactElement<PropsCelula>, { coluna: colunas[i] }) : filho,
    );

    return (
        <tr
            onClick={href ? (e) => !(e.target as HTMLElement).closest("a,button,input,select,label") && router.visit(href) : undefined}
            onMouseEnter={preCarregar}
            onMouseLeave={cancelar}
            className={cx(
                "border-b border-linha transition-colors md:last:border-b-0",
                "max-md:flex max-md:flex-col max-md:overflow-hidden max-md:rounded-xl max-md:border max-md:bg-superficie",
                href && "cursor-pointer hover:bg-superficie-hover",
                apagada && "text-tinta-fraca",
                className,
            )}
        >
            {celulas}
        </tr>
    );
}

export function Celula({ children, direita, className, cabecalho, coluna }: PropsCelula) {
    const Tag = cabecalho ? "th" : "td";
    const papel = coluna?.cartao ?? (cabecalho ? "titulo" : coluna?.chave === "acoes" ? "acoes" : "campo");

    return (
        <Tag
            scope={cabecalho ? "row" : undefined}
            className={cx(
                "h-12 px-4 py-2 font-normal md:first:ps-5 md:last:pe-5",
                direita ? "text-end tabular-nums" : "text-start",
                // Modo cartão
                "max-md:flex max-md:h-auto max-md:min-w-0 max-md:items-center max-md:gap-3 max-md:px-3",
                papel === "titulo" && "max-md:border-b max-md:bg-superficie-suave max-md:py-2.5 max-md:text-start max-md:text-ui max-md:font-medium",
                papel === "campo" && "max-md:justify-between max-md:py-1.5",
                papel === "acoes" && "max-md:mt-1 max-md:justify-end max-md:border-t max-md:py-2",
                papel === "oculta" && "max-md:hidden",
                className,
            )}
        >
            {papel === "campo" && coluna && (
                <span className="shrink-0 text-start text-rotulo text-tinta-suave md:hidden">{coluna.rotulo}</span>
            )}
            {/* Some do layout no desktop (contents); no cartão alinha o valor à direita. */}
            <span className={cx("min-w-0 md:contents", papel === "campo" && "max-md:text-end", papel === "titulo" && "max-md:flex-1")}>{children}</span>
        </Tag>
    );
}
