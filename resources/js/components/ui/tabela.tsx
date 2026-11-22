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
    cartao?: "titulo" | "acoes" | "oculta" | "campo";
}

const ColunasContexto = createContext<Coluna[]>([]);

const CONTAINER = {
    extra: "@container/tabela-extra",
    larga: "@container/tabela",
    media: "@container/tabela-media",
};

export function Tabela({ colunas, children, rotulo, ordem, direcao, aoOrdenar, vazio, cartoesAbaixo = "larga" }: {
    colunas: Coluna[];
    children: ReactNode;
    rotulo: string;
    ordem?: string;
    direcao?: "asc" | "desc";
    aoOrdenar?: (coluna: string) => void;
    vazio?: ReactNode;
    cartoesAbaixo?: keyof typeof CONTAINER;
}) {
    const t = useT();
    const semLinhas = Children.toArray(children).length === 0;
    const ordenaveis = aoOrdenar ? colunas.filter((c) => c.ordenavel) : [];

    return (
        <ColunasContexto.Provider value={colunas}>
            <div className={CONTAINER[cartoesAbaixo]}>
            {ordenaveis.length > 0 && !semLinhas && (
                <div className="flex items-center gap-2 border-t border-linha px-3 pt-3 larga:hidden">
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
            <div className="rolagem-fina relative larga:overflow-x-auto">
                <table aria-label={rotulo} className="w-full border-collapse text-corpo compacta:block">
                    <thead className="compacta:sr-only">
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
                    <tbody className="compacta:grid compacta:grid-cols-1 compacta:gap-3 compacta:p-3 @min-[40rem]/tabela:compacta:grid-cols-2 @min-[40rem]/tabela-extra:compacta:grid-cols-2">
                        {semLinhas && vazio ? (
                            <tr className="compacta:col-span-full compacta:block">
                                <td colSpan={colunas.length} className="compacta:block">{vazio}</td>
                            </tr>
                        ) : children}
                    </tbody>
                </table>
            </div>
            </div>
        </ColunasContexto.Provider>
    );
}

interface PropsCelula {
    children?: ReactNode;
    direita?: boolean;
    className?: string;
    cabecalho?: boolean;
    coluna?: Coluna;
}

export function Linha({ children, href, apagada, className }: { children: ReactNode; href?: string; apagada?: boolean; className?: string }) {
    const colunas = useContext(ColunasContexto);
    const espera = useRef<number | undefined>(undefined);
    const preCarregar = href ? () => (espera.current = window.setTimeout(() => router.prefetch(href, { method: "get" }), 75)) : undefined;
    const cancelar = href ? () => window.clearTimeout(espera.current) : undefined;
    const celulas = Children.toArray(children).map((filho, i) =>
        isValidElement(filho) && filho.type === Celula ? cloneElement(filho as ReactElement<PropsCelula>, { coluna: colunas[i] }) : filho,
    );

    return (
        <tr
            onClick={href ? (e) => !(e.target as HTMLElement).closest("a,button,input,select,label") && router.visit(href) : undefined}
            onMouseEnter={preCarregar}
            onMouseLeave={cancelar}
            className={cx(
                "border-b border-linha transition-colors larga:last:border-b-0",
                "compacta:flex compacta:flex-col compacta:overflow-hidden compacta:rounded-xl compacta:border compacta:bg-superficie",
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
                "h-12 px-4 py-2 font-normal larga:first:ps-5 larga:last:pe-5",
                direita ? "text-end tabular-nums" : "text-start",
                "compacta:flex compacta:h-auto compacta:min-w-0 compacta:items-center compacta:gap-3 compacta:px-3",
                papel === "titulo" && "compacta:border-b compacta:border-linha compacta:bg-superficie-suave compacta:py-2.5 compacta:text-start compacta:text-ui compacta:font-medium",
                papel === "campo" && "compacta:justify-between compacta:py-1.5",
                papel === "acoes" && "compacta:mt-auto compacta:justify-end compacta:border-t compacta:border-linha compacta:py-2",
                papel === "oculta" && "compacta:hidden",
                className,
            )}
        >
            {papel === "campo" && coluna && (
                <span className="shrink-0 text-start text-rotulo text-tinta-suave larga:hidden">{coluna.rotulo}</span>
            )}
            <span className={cx("min-w-0 larga:contents", papel === "campo" && "compacta:text-end", papel === "titulo" && "compacta:flex-1")}>{children}</span>
        </Tag>
    );
}
