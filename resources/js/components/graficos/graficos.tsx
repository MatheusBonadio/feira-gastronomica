import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * Gráficos em SVG/HTML puro, coloridos pelos tokens (grafico-1 … grafico-6).
 * Assinatura visual: barras com hachura diagonal (listras em var(--hachura));
 * o que está fora de foco fica cinza (grafico-inativo).
 */

/** Paleta em classes literais (o Tailwind precisa enxergar os nomes completos). */
export const CORES = [
    { texto: "text-grafico-1", fundo: "bg-grafico-1", preenchimento: "fill-grafico-1" },
    { texto: "text-grafico-2", fundo: "bg-grafico-2", preenchimento: "fill-grafico-2" },
    { texto: "text-grafico-3", fundo: "bg-grafico-3", preenchimento: "fill-grafico-3" },
    { texto: "text-grafico-4", fundo: "bg-grafico-4", preenchimento: "fill-grafico-4" },
    { texto: "text-grafico-5", fundo: "bg-grafico-5", preenchimento: "fill-grafico-5" },
    { texto: "text-grafico-6", fundo: "bg-grafico-6", preenchimento: "fill-grafico-6" },
] as const;

export type Cor = (typeof CORES)[number];

function useLargura<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [largura, setLargura] = useState(0);
    useEffect(() => {
        if (!ref.current) return;
        const observador = new ResizeObserver(([e]) => setLargura(e.contentRect.width));
        observador.observe(ref.current);
        return () => observador.disconnect();
    }, []);
    return [ref, largura] as const;
}

/** Escala "bonita" para o eixo Y: 4 divisões em números redondos. */
function escala(maximo: number, divisoes = 4): number[] {
    if (maximo <= 0) return [0, 1, 2, 3, 4].map((i) => i * 25);
    const bruto = maximo / divisoes;
    const magnitude = 10 ** Math.floor(Math.log10(bruto));
    const passo = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((p) => p >= bruto) ?? bruto;
    return Array.from({ length: divisoes + 1 }, (_, i) => i * passo);
}

/** Listras diagonais para sobrepor às marcas coloridas de um SVG. */
function PadraoHachura({ id }: { id: string }) {
    return (
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" strokeWidth="2.5" style={{ stroke: "var(--hachura)" }} />
        </pattern>
    );
}

/** Cartãozinho flutuante dos gráficos (data + valores com bolinhas de cor). */
function DicaGrafico({ x, y, children, largura, abaixo }: { x: number; y: number; children: ReactNode; largura: number; abaixo?: boolean }) {
    const alinharDireita = x > largura - 170;
    return (
        <div
            role="presentation"
            className={cx("pointer-events-none absolute z-10 rounded-xl border border-linha bg-superficie px-3 py-2 text-rotulo whitespace-nowrap text-tinta shadow-flutuante", !abaixo && "-translate-y-full")}
            style={{ left: alinharDireita ? undefined : x + 12, right: alinharDireita ? largura - x + 12 : undefined, top: abaixo ? Math.max(y, 0) : y - 6 }}
        >
            {children}
        </div>
    );
}

const MARGEM = { topo: 16, direita: 8, base: 28, esquerda: 52 };

function Grade({ marcas, y, largura, formatarEixo }: { marcas: number[]; y: (v: number) => number; largura: number; formatarEixo: (v: number) => string }) {
    return (
        <>
            {marcas.map((m) => (
                <g key={m}>
                    <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(m)} y2={y(m)} className="stroke-grafico-grade" />
                    <text x={MARGEM.esquerda - 10} y={y(m)} dy="0.32em" textAnchor="end" className="fill-tinta-fraca text-micro tabular-nums">{formatarEixo(m)}</text>
                </g>
            ))}
        </>
    );
}

export interface DiaBarras {
    chave: string;
    rotulo: string;
    detalhe?: string;
    /** Um valor por série, na ordem de `series`. */
    valores: number[];
}

/**
 * Barras por dia empilhadas por série (canais). Como na referência: os dias
 * ficam cinza e o dia em foco aparece colorido, hachurado, com a dica ao lado.
 * Mouse ou setas mudam o foco; clique/Enter escolhe o dia (filtra o painel).
 */
export function GraficoBarrasDias({ dias, series, formatarValor, formatarEixo, altura = 260, rotulo, rotuloTotal, focoInicial, aoEscolher }: {
    dias: DiaBarras[];
    series: { nome: string; cor: Cor }[];
    formatarValor: (v: number) => string;
    formatarEixo: (v: number) => string;
    altura?: number;
    rotulo: string;
    rotuloTotal: string;
    focoInicial?: number;
    aoEscolher?: (dia: DiaBarras) => void;
}) {
    const [ref, largura] = useLargura<HTMLDivElement>();
    const [foco, setFoco] = useState<number>(() => focoInicial ?? dias.length - 1);
    const idHachura = useId();

    // Novos dados (tempo real, filtro): o foco volta para o dia indicado.
    useEffect(() => setFoco(focoInicial ?? dias.length - 1), [dias.length, focoInicial]);

    const totais = dias.map((d) => d.valores.reduce((s, v) => s + Math.max(v, 0), 0));
    const marcas = escala(Math.max(...totais, 0));
    const topo = marcas[marcas.length - 1] || 1;
    const w = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 1);
    const h = altura - MARGEM.topo - MARGEM.base;
    const passo = w / Math.max(dias.length, 1);
    const larguraBarra = Math.min(56, passo * 0.62);
    const y = (v: number) => MARGEM.topo + h - (v / topo) * h;
    const xCentro = (i: number) => MARGEM.esquerda + passo * i + passo / 2;
    const passoRotulo = Math.max(1, Math.ceil(dias.length / Math.max(1, Math.floor(w / 56))));
    const atual = dias[foco];

    const teclar = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            const sentido = (e.key === "ArrowRight") !== (getComputedStyle(e.currentTarget).direction === "rtl") ? 1 : -1;
            setFoco((f) => Math.min(dias.length - 1, Math.max(0, f + sentido)));
        } else if ((e.key === "Enter" || e.key === " ") && atual && aoEscolher) {
            e.preventDefault();
            aoEscolher(atual);
        }
    };

    return (
        <div
            ref={ref}
            className="relative w-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-foco"
            style={{ height: altura }}
            tabIndex={0}
            role="group"
            aria-label={rotulo}
            aria-roledescription="gráfico"
            onKeyDown={teclar}
        >
            {/* Resumo do dia em foco para leitores de tela. */}
            <p className="sr-only" aria-live="polite">
                {atual && `${atual.rotulo}: ${series.map((s, i) => `${s.nome} ${formatarValor(atual.valores[i] ?? 0)}`).join(", ")}`}
            </p>
            {largura > 0 && (
                <svg
                    width={largura}
                    height={altura}
                    aria-hidden
                    onMouseMove={(e) => {
                        if (!dias.length) return;
                        const caixa = e.currentTarget.getBoundingClientRect();
                        const i = Math.floor((e.clientX - caixa.left - MARGEM.esquerda) / passo);
                        if (i >= 0 && i < dias.length) setFoco(i);
                    }}
                    onClick={() => atual && aoEscolher?.(atual)}
                    className={aoEscolher ? "cursor-pointer" : undefined}
                >
                    <defs><PadraoHachura id={idHachura} /></defs>
                    <Grade marcas={marcas} y={y} largura={largura} formatarEixo={formatarEixo} />
                    {dias.map((d, i) => {
                        const x = xCentro(i) - larguraBarra / 2;
                        const total = totais[i];
                        if (i !== foco) {
                            const alturaBarra = Math.max(total > 0 ? y(0) - y(total) : 0, total > 0 ? 3 : 0);
                            return <rect key={d.chave} x={x} y={y(0) - alturaBarra} width={larguraBarra} height={alturaBarra} rx={6} className="fill-grafico-inativo" />;
                        }
                        // Em foco: segmentos por série, com um respiro entre eles.
                        let base = 0;
                        return (
                            <g key={d.chave}>
                                {series.map((s, j) => {
                                    const v = Math.max(d.valores[j] ?? 0, 0);
                                    if (v <= 0) return null;
                                    const topoSeg = y(base + v);
                                    const alturaSeg = Math.max(y(base) - topoSeg - (base > 0 ? 2 : 0), 2);
                                    base += v;
                                    return (
                                        <g key={s.nome}>
                                            <rect x={x} y={topoSeg} width={larguraBarra} height={alturaSeg} rx={5} className={s.cor.preenchimento} />
                                            <rect x={x} y={topoSeg} width={larguraBarra} height={alturaSeg} rx={5} fill={`url(#${idHachura})`} />
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}
                    {dias.map((d, i) => i % passoRotulo === 0 && (
                        <text key={d.chave} x={xCentro(i)} y={altura - 8} textAnchor="middle" className={cx("text-micro", i === foco ? "fill-tinta font-semibold" : "fill-tinta-fraca")}>{d.rotulo}</text>
                    ))}
                </svg>
            )}
            {atual && totais[foco] > 0 && largura > 0 && (
                <DicaGrafico x={xCentro(foco) + larguraBarra / 2 - 6} y={y(totais[foco]) + 8} largura={largura} abaixo={y(totais[foco]) < 130}>
                    <span className="mb-1 block text-micro text-tinta-suave">{atual.detalhe ?? atual.rotulo}</span>
                    {series.map((s, j) => (
                        <span key={s.nome} className="flex items-center gap-2 py-px">
                            <span className={cx("size-2 rounded-full", s.cor.fundo)} aria-hidden />
                            <span className="flex-1 text-tinta-media">{s.nome}</span>
                            <span className="ps-4 font-semibold tabular-nums">{formatarValor(atual.valores[j] ?? 0)}</span>
                        </span>
                    ))}
                    <span className="mt-1 flex items-center justify-between gap-4 border-t border-linha pt-1">
                        <span className="text-tinta-suave">{rotuloTotal}</span>
                        <span className="font-semibold tabular-nums">{formatarValor(totais[foco])}</span>
                    </span>
                </DicaGrafico>
            )}
        </div>
    );
}

/** Área com linha: série temporal (vendas por dia), alternativa às barras. */
export function GraficoArea({ pontos, formatarValor, formatarEixo, altura = 240, cor = CORES[0], rotulo }: {
    pontos: { rotulo: string; valor: number; detalhe?: string }[];
    formatarValor: (v: number) => string;
    formatarEixo: (v: number) => string;
    altura?: number;
    cor?: Cor;
    rotulo: string;
}) {
    const [ref, largura] = useLargura<HTMLDivElement>();
    const [foco, setFoco] = useState<number | null>(null);
    const idGradiente = useId();

    const geometria = useMemo(() => {
        const marcas = escala(Math.max(...pontos.map((p) => p.valor), 0));
        const topo = marcas[marcas.length - 1] || 1;
        const w = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 1);
        const h = altura - MARGEM.topo - MARGEM.base;
        const x = (i: number) => MARGEM.esquerda + (pontos.length <= 1 ? w / 2 : (i / (pontos.length - 1)) * w);
        const y = (v: number) => MARGEM.topo + h - (v / topo) * h;
        const linha = pontos.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.valor)}`).join(" ");
        const area = pontos.length ? `${linha} L${x(pontos.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : "";
        return { marcas, x, y, linha, area, w };
    }, [pontos, largura, altura]);

    const passoRotulo = Math.max(1, Math.ceil(pontos.length / Math.max(1, Math.floor(geometria.w / 64))));

    return (
        <div ref={ref} className="relative w-full" style={{ height: altura }}>
            {largura > 0 && (
                <svg
                    width={largura}
                    height={altura}
                    role="img"
                    aria-label={rotulo}
                    className={cor.texto}
                    onMouseLeave={() => setFoco(null)}
                    onMouseMove={(e) => {
                        if (pontos.length === 0) return;
                        const caixa = e.currentTarget.getBoundingClientRect();
                        const rel = (e.clientX - caixa.left - MARGEM.esquerda) / Math.max(geometria.w, 1);
                        setFoco(Math.min(pontos.length - 1, Math.max(0, Math.round(rel * (pontos.length - 1)))));
                    }}
                >
                    <defs>
                        <linearGradient id={idGradiente} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <Grade marcas={geometria.marcas} y={geometria.y} largura={largura} formatarEixo={formatarEixo} />
                    {pontos.map((p, i) => i % passoRotulo === 0 && (
                        <text key={i} x={geometria.x(i)} y={altura - 8} textAnchor="middle" className="fill-tinta-fraca text-micro">{p.rotulo}</text>
                    ))}
                    <path d={geometria.area} fill={`url(#${idGradiente})`} />
                    <path d={geometria.linha} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
                    {pontos.length === 1 && (
                        <g aria-hidden>
                            <line x1={geometria.x(0)} x2={geometria.x(0)} y1={geometria.y(pontos[0].valor)} y2={geometria.y(0)} stroke="currentColor" strokeWidth={2} strokeDasharray="3 4" />
                            <circle cx={geometria.x(0)} cy={geometria.y(pontos[0].valor)} r={5} fill="currentColor" className="stroke-superficie" strokeWidth={2} />
                            <text x={geometria.x(0)} y={geometria.y(pontos[0].valor) - 12} textAnchor="middle" className="fill-tinta text-rotulo font-semibold">{formatarValor(pontos[0].valor)}</text>
                        </g>
                    )}
                    {foco !== null && pontos[foco] && (
                        <g>
                            <line x1={geometria.x(foco)} x2={geometria.x(foco)} y1={MARGEM.topo} y2={altura - MARGEM.base} className="stroke-linha-forte" strokeDasharray="3 3" />
                            <circle cx={geometria.x(foco)} cy={geometria.y(pontos[foco].valor)} r={5} fill="currentColor" className="stroke-superficie" strokeWidth={2} />
                        </g>
                    )}
                </svg>
            )}
            {foco !== null && pontos[foco] && (
                <DicaGrafico x={geometria.x(foco)} y={geometria.y(pontos[foco].valor)} largura={largura}>
                    <span className="block text-micro text-tinta-suave">{pontos[foco].rotulo}</span>
                    <span className="font-semibold tabular-nums">{formatarValor(pontos[foco].valor)}</span>
                    {pontos[foco].detalhe && <span className="block text-tinta-suave">{pontos[foco].detalhe}</span>}
                </DicaGrafico>
            )}
        </div>
    );
}

/** Barras agrupadas por categoria (comparar feiras), hachuradas. */
export function GraficoBarras({ categorias, series, formatarValor, formatarEixo, altura = 260, rotulo }: {
    categorias: string[];
    series: { nome: string; cor: Cor; valores: number[] }[];
    formatarValor: (v: number) => string;
    formatarEixo: (v: number) => string;
    altura?: number;
    rotulo: string;
}) {
    const [ref, largura] = useLargura<HTMLDivElement>();
    const [foco, setFoco] = useState<number | null>(null);
    const idHachura = useId();
    const maximo = Math.max(...series.flatMap((s) => s.valores), 0);
    const marcas = escala(maximo);
    const topo = marcas[marcas.length - 1] || 1;
    const w = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 1);
    const h = altura - MARGEM.topo - MARGEM.base;
    const grupo = w / Math.max(categorias.length, 1);
    const barra = Math.min(36, (grupo * 0.7) / Math.max(series.length, 1));
    const y = (v: number) => MARGEM.topo + h - (Math.max(v, 0) / topo) * h;

    return (
        <div ref={ref} className="relative w-full" style={{ height: altura }}>
            {largura > 0 && (
                <svg width={largura} height={altura} role="img" aria-label={rotulo} onMouseLeave={() => setFoco(null)}>
                    <defs><PadraoHachura id={idHachura} /></defs>
                    <Grade marcas={marcas} y={y} largura={largura} formatarEixo={formatarEixo} />
                    {categorias.map((c, i) => {
                        const inicio = MARGEM.esquerda + grupo * i + (grupo - barra * series.length - 4 * (series.length - 1)) / 2;
                        return (
                            <g key={c} onMouseEnter={() => setFoco(i)}>
                                <rect x={MARGEM.esquerda + grupo * i} y={MARGEM.topo} width={grupo} height={h} fill="transparent" />
                                {series.map((s, j) => {
                                    const v = s.valores[i] ?? 0;
                                    const x = inicio + j * (barra + 4);
                                    const alturaBarra = Math.max(y(0) - y(v), v > 0 ? 2 : 0);
                                    return (
                                        <g key={s.nome}>
                                            <rect x={x} y={y(0) - alturaBarra} width={barra} height={alturaBarra} rx={5} className={foco === null || foco === i ? s.cor.preenchimento : "fill-grafico-inativo"} />
                                            {(foco === null || foco === i) && <rect x={x} y={y(0) - alturaBarra} width={barra} height={alturaBarra} rx={5} fill={`url(#${idHachura})`} />}
                                        </g>
                                    );
                                })}
                                <text x={MARGEM.esquerda + grupo * i + grupo / 2} y={altura - 8} textAnchor="middle" className="fill-tinta-suave text-micro">{c}</text>
                            </g>
                        );
                    })}
                </svg>
            )}
            {foco !== null && (
                <DicaGrafico x={MARGEM.esquerda + grupo * foco + grupo / 2} y={y(Math.max(...series.map((s) => s.valores[foco] ?? 0)))} largura={largura}>
                    <span className="mb-1 block text-micro text-tinta-suave">{categorias[foco]}</span>
                    {series.map((s) => (
                        <span key={s.nome} className="flex items-center gap-2 py-px">
                            <span className={cx("size-2 rounded-full", s.cor.fundo)} aria-hidden />
                            <span className="flex-1 text-tinta-media">{s.nome}</span>
                            <span className="ps-4 font-semibold tabular-nums">{formatarValor(s.valores[foco] ?? 0)}</span>
                        </span>
                    ))}
                </DicaGrafico>
            )}
        </div>
    );
}

/** Rosca com total no centro e legenda com percentual e valor. */
export function GraficoRosca({ fatias, formatarValor, centro, rotulo, tamanho = 168 }: {
    fatias: { rotulo: string; valor: number; cor: Cor }[];
    formatarValor: (v: number) => string;
    centro: { valor: string; rotulo: string };
    rotulo: string;
    tamanho?: number;
}) {
    const total = fatias.reduce((s, f) => s + Math.max(f.valor, 0), 0);
    const raio = tamanho / 2 - 12;
    const circunferencia = 2 * Math.PI * raio;
    let acumulado = 0;

    // Container query: empilha conforme a largura do cartão, não da tela.
    return (
        <div className="@container">
            <div className="flex flex-col items-center gap-5 @md:flex-row">
                <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
                    <svg width={tamanho} height={tamanho} role="img" aria-label={rotulo} className="-rotate-90">
                        <circle cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" strokeWidth={18} className="stroke-grafico-inativo" />
                        {total > 0 && fatias.map((f) => {
                            const parte = (Math.max(f.valor, 0) / total) * circunferencia;
                            const deslocamento = -acumulado;
                            acumulado += parte;
                            return (
                                <circle
                                    key={f.rotulo}
                                    cx={tamanho / 2}
                                    cy={tamanho / 2}
                                    r={raio}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={18}
                                    strokeDasharray={`${Math.max(parte - 3, 0)} ${circunferencia}`}
                                    strokeDashoffset={deslocamento}
                                    className={f.cor.texto}
                                />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-titulo font-semibold tabular-nums text-tinta">{centro.valor}</span>
                        <span className="text-micro text-tinta-suave">{centro.rotulo}</span>
                    </div>
                </div>
                <Legenda
                    vertical
                    itens={fatias.map((f) => ({ rotulo: f.rotulo, cor: f.cor, valor: formatarValor(f.valor), percentual: total > 0 ? Math.max(f.valor, 0) / total : 0 }))}
                />
            </div>
        </div>
    );
}

/** Linha pequena sem eixos, para os KPIs. */
export function Sparkline({ valores, cor = CORES[0], altura = 32 }: { valores: number[]; cor?: Cor; altura?: number }) {
    const [ref, largura] = useLargura<HTMLDivElement>();
    if (valores.length < 2) return <div className="h-8" />;
    const maximo = Math.max(...valores, 1);
    const pontos = valores.map((v, i) => `${(i / (valores.length - 1)) * largura},${altura - 2 - (v / maximo) * (altura - 4)}`).join(" ");
    return (
        <div ref={ref} className="w-full" style={{ height: altura }} aria-hidden>
            {largura > 0 && (
                <svg width={largura} height={altura} className={cor.texto}>
                    <polyline points={pontos} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                </svg>
            )}
        </div>
    );
}

/** Trilho com preenchimento hachurado (meta, limite, estoque). */
export function BarraProgresso({ fracao, cor = "bg-primaria", rotulo, altura = "h-3", bloco }: { fracao: number; cor?: string; rotulo: string; altura?: string; bloco?: boolean }) {
    const pct = Math.max(0, Math.min(1, fracao)) * 100;
    const forma = bloco ? "rounded-lg" : "rounded-full";
    return (
        <div role="progressbar" aria-label={rotulo} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} className={cx("overflow-hidden bg-grafico-inativo", forma, altura)}>
            <div className={cx("hachura h-full transition-[width] duration-700", forma, cor)} style={{ width: `${pct}%` }} />
        </div>
    );
}

/** Ranking/metas em barras horizontais (o "Goal tracker" da referência). */
export function BarrasHorizontais({ dados, formatarValor }: { dados: { rotulo: string; valor: number; cor: string; detalhe?: string; maximo?: number }[]; formatarValor: (v: number) => string }) {
    const maximo = Math.max(...dados.map((d) => d.valor), 0);
    return (
        <ul className="flex flex-col gap-4">
            {dados.map((d) => (
                <li key={d.rotulo}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-corpo">
                        <span className="truncate font-medium text-tinta">{d.rotulo}</span>
                        <span className="shrink-0 font-semibold tabular-nums text-tinta">
                            {formatarValor(d.valor)}
                            {d.detalhe && <span className="ms-1 font-normal text-tinta-suave">{d.detalhe}</span>}
                        </span>
                    </div>
                    <BarraProgresso rotulo={d.rotulo} cor={d.cor} altura="h-2.5" fracao={(d.maximo ?? maximo) > 0 ? d.valor / (d.maximo ?? maximo) : 0} />
                </li>
            ))}
        </ul>
    );
}

/** Legenda: quadradinho de cor + rótulo; na vertical, com % e valor à direita. */
export function Legenda({ itens, vertical }: { itens: { rotulo: string; cor: Cor | string; valor?: string; percentual?: number }[]; vertical?: boolean }) {
    const fundo = (cor: Cor | string) => (typeof cor === "string" ? cor : cor.fundo);
    if (!vertical) {
        return (
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {itens.map((i) => (
                    <li key={i.rotulo} className="flex items-center gap-1.5 text-rotulo text-tinta-suave">
                        <span className={cx("size-2.5 rounded-sm", fundo(i.cor))} />
                        {i.rotulo}
                    </li>
                ))}
            </ul>
        );
    }
    return (
        <ul className="flex w-full min-w-0 flex-col gap-2.5">
            {itens.map((i) => (
                <li key={i.rotulo} className="flex items-center gap-2 text-corpo">
                    <span className={cx("size-2.5 shrink-0 rounded-sm", fundo(i.cor))} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-tinta-media">{i.rotulo}</span>
                    {i.percentual !== undefined && <span className="tabular-nums text-tinta-suave">{Math.round(i.percentual * 100)}%</span>}
                    {i.valor !== undefined && <span className="w-24 text-end font-semibold tabular-nums text-tinta">{i.valor}</span>}
                </li>
            ))}
        </ul>
    );
}

/** Barra dividida em blocos hachurados (o "Cost analysis" da referência) + legenda. */
export function BarraSegmentada({ fatias, formatarValor, rotulo }: {
    fatias: { rotulo: string; valor: number; cor: string }[];
    formatarValor: (v: number) => string;
    rotulo: string;
}) {
    const total = fatias.reduce((s, f) => s + Math.max(f.valor, 0), 0);
    const visiveis = fatias.filter((f) => f.valor > 0);
    return (
        <div className="flex flex-col gap-4">
            <div role="img" aria-label={`${rotulo}: ${visiveis.map((f) => `${f.rotulo} ${formatarValor(f.valor)}`).join(", ")}`} className="flex h-8 gap-1">
                {total > 0 ? (
                    visiveis.map((f) => (
                        <div key={f.rotulo} className={cx("hachura h-full min-w-2 rounded-lg", f.cor)} style={{ flexGrow: Math.max(f.valor, 0), flexBasis: 0 }} />
                    ))
                ) : (
                    <div className="h-full flex-1 rounded-lg bg-grafico-inativo" />
                )}
            </div>
            <Legenda vertical itens={fatias.map((f) => ({ rotulo: f.rotulo, cor: f.cor, percentual: total > 0 ? Math.max(f.valor, 0) / total : 0, valor: formatarValor(f.valor) }))} />
        </div>
    );
}

/**
 * Medidor em meio-círculo de blocos (o "Financial health" da referência):
 * blocos preenchidos vão do amarelo ao azul, hachurados; o resto fica cinza.
 */
export function Medidor({ fracao, valor, legenda, rotulo, blocos = 11 }: { fracao: number; valor: string; legenda: string; rotulo: string; blocos?: number }) {
    const idHachura = useId();
    const largura = 240;
    const raioExterno = 112;
    const raioInterno = 70;
    const cx0 = largura / 2;
    const cy0 = 120;
    const lacuna = 0.035; // radianos entre blocos
    const preenchidos = Math.round(Math.max(0, Math.min(1, fracao)) * blocos);

    const ponto = (r: number, a: number) => `${cx0 + r * Math.cos(a)},${cy0 - r * Math.sin(a)}`;
    const bloco = (i: number) => {
        const passo = Math.PI / blocos;
        const a1 = Math.PI - i * passo - lacuna / 2;
        const a2 = Math.PI - (i + 1) * passo + lacuna / 2;
        return `M${ponto(raioExterno, a1)} A${raioExterno},${raioExterno} 0 0 1 ${ponto(raioExterno, a2)} L${ponto(raioInterno, a2)} A${raioInterno},${raioInterno} 0 0 0 ${ponto(raioInterno, a1)} Z`;
    };

    return (
        <div className="relative mx-auto w-full max-w-64">
            <svg viewBox={`0 0 ${largura} ${cy0 + 4}`} className="w-full" role="img" aria-label={`${rotulo}: ${valor} ${legenda}`}>
                <defs><PadraoHachura id={idHachura} /></defs>
                {Array.from({ length: blocos }, (_, i) => {
                    const cheio = i < preenchidos;
                    // Do amarelo (início) ao azul (fim), misturando os dois tokens.
                    const mistura = blocos > 1 ? Math.round((i / (blocos - 1)) * 100) : 100;
                    return (
                        <g key={i}>
                            <path d={bloco(i)} className={cheio ? undefined : "fill-grafico-inativo"} style={cheio ? { fill: `color-mix(in oklab, var(--primaria) ${mistura}%, var(--secundaria))` } : undefined} />
                            {cheio && <path d={bloco(i)} fill={`url(#${idHachura})`} />}
                        </g>
                    );
                })}
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center">
                <span className="text-numero font-semibold tabular-nums text-tinta">{valor}</span>
                <span className="max-w-36 text-micro text-tinta-suave">{legenda}</span>
            </div>
        </div>
    );
}
