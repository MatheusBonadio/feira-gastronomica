import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * Gráficos em SVG puro, coloridos pelos tokens (text-grafico-N / bg-grafico-N).
 * Sem biblioteca de gráficos: o necessário para o painel da feira.
 */

/** Paleta em classes literais (o Tailwind precisa enxergar os nomes completos). */
export const CORES = [
    { texto: "text-grafico-1", fundo: "bg-grafico-1" },
    { texto: "text-grafico-2", fundo: "bg-grafico-2" },
    { texto: "text-grafico-3", fundo: "bg-grafico-3" },
    { texto: "text-grafico-4", fundo: "bg-grafico-4" },
    { texto: "text-grafico-5", fundo: "bg-grafico-5" },
    { texto: "text-grafico-6", fundo: "bg-grafico-6" },
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

function Dica({ x, y, children, largura }: { x: number; y: number; children: ReactNode; largura: number }) {
    const alinharDireita = x > largura - 140;
    return (
        <div
            className="pointer-events-none absolute z-10 -translate-y-full rounded-lg border border-linha bg-superficie px-2.5 py-1.5 text-rotulo whitespace-nowrap text-tinta shadow-flutuante"
            style={{ left: alinharDireita ? undefined : x + 10, right: alinharDireita ? largura - x + 10 : undefined, top: y - 8 }}
        >
            {children}
        </div>
    );
}

const MARGEM = { topo: 12, direita: 12, base: 28, esquerda: 56 };

/** Área com linha: série temporal (vendas por dia). */
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

    const passoRotulo = Math.max(1, Math.ceil(pontos.length / Math.max(1, Math.floor(geometria.w / 70))));

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
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {geometria.marcas.map((m) => (
                        <g key={m}>
                            <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={geometria.y(m)} y2={geometria.y(m)} className="stroke-grafico-grade" strokeDasharray={m === 0 ? undefined : "3 4"} />
                            <text x={MARGEM.esquerda - 8} y={geometria.y(m)} dy="0.32em" textAnchor="end" className="fill-tinta-fraca text-micro">{formatarEixo(m)}</text>
                        </g>
                    ))}
                    {pontos.map((p, i) => i % passoRotulo === 0 && (
                        <text key={i} x={geometria.x(i)} y={altura - 8} textAnchor="middle" className="fill-tinta-fraca text-micro">{p.rotulo}</text>
                    ))}
                    <path d={geometria.area} fill={`url(#${idGradiente})`} />
                    <path d={geometria.linha} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                    {pontos.length === 1 && (
                        <g aria-hidden>
                            <line x1={geometria.x(0)} x2={geometria.x(0)} y1={geometria.y(pontos[0].valor)} y2={geometria.y(0)} stroke="currentColor" strokeWidth={2} strokeDasharray="3 4" />
                            <circle cx={geometria.x(0)} cy={geometria.y(pontos[0].valor)} r={5} fill="currentColor" className="stroke-superficie" strokeWidth={2} />
                            <text x={geometria.x(0)} y={geometria.y(pontos[0].valor) - 12} textAnchor="middle" className="fill-tinta text-rotulo font-semibold">{formatarValor(pontos[0].valor)}</text>
                        </g>
                    )}
                    {foco !== null && pontos[foco] && (
                        <g>
                            <line x1={geometria.x(foco)} x2={geometria.x(foco)} y1={MARGEM.topo} y2={altura - MARGEM.base} className="stroke-linha-forte" />
                            <circle cx={geometria.x(foco)} cy={geometria.y(pontos[foco].valor)} r={4.5} fill="currentColor" className="stroke-superficie" strokeWidth={2} />
                        </g>
                    )}
                </svg>
            )}
            {foco !== null && pontos[foco] && (
                <Dica x={geometria.x(foco)} y={geometria.y(pontos[foco].valor)} largura={largura}>
                    <span className="block text-tinta-suave">{pontos[foco].rotulo}</span>
                    <span className="font-semibold tabular-nums">{formatarValor(pontos[foco].valor)}</span>
                    {pontos[foco].detalhe && <span className="block text-tinta-suave">{pontos[foco].detalhe}</span>}
                </Dica>
            )}
        </div>
    );
}

/** Barras verticais agrupadas (uma ou mais séries por categoria). */
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

    const todos = series.flatMap((s) => s.valores);
    const minimo = Math.min(0, ...todos);
    const marcas = escala(Math.max(...todos.map(Math.abs), 0));
    const topo = marcas[marcas.length - 1] || 1;
    const baseNegativa = minimo < 0 ? topo : 0;
    const w = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 1);
    const h = altura - MARGEM.topo - MARGEM.base;
    const faixa = w / Math.max(categorias.length, 1);
    const larguraBarra = Math.min(28, (faixa * 0.7) / Math.max(series.length, 1));
    const y = (v: number) => MARGEM.topo + h * ((topo - v) / (topo + baseNegativa));

    return (
        <div ref={ref} className="relative w-full" style={{ height: altura }}>
            {largura > 0 && (
                <svg width={largura} height={altura} role="img" aria-label={rotulo} onMouseLeave={() => setFoco(null)}>
                    {[...marcas, ...(baseNegativa ? marcas.slice(1).map((m) => -m) : [])].map((m) => (
                        <g key={m}>
                            <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(m)} y2={y(m)} className={m === 0 ? "stroke-linha-forte" : "stroke-grafico-grade"} strokeDasharray={m === 0 ? undefined : "3 4"} />
                            <text x={MARGEM.esquerda - 8} y={y(m)} dy="0.32em" textAnchor="end" className="fill-tinta-fraca text-micro">{formatarEixo(m)}</text>
                        </g>
                    ))}
                    {categorias.map((c, i) => {
                        const centro = MARGEM.esquerda + faixa * i + faixa / 2;
                        const inicio = centro - (larguraBarra * series.length + 4 * (series.length - 1)) / 2;
                        return (
                            <g key={c} onMouseEnter={() => setFoco(i)}>
                                <rect x={MARGEM.esquerda + faixa * i} y={MARGEM.topo} width={faixa} height={h} fill="transparent" />
                                {series.map((s, j) => {
                                    const v = s.valores[i] ?? 0;
                                    const topoBarra = Math.min(y(v), y(0));
                                    return (
                                        <rect
                                            key={s.nome}
                                            x={inicio + j * (larguraBarra + 4)}
                                            y={topoBarra}
                                            width={larguraBarra}
                                            height={Math.max(Math.abs(y(v) - y(0)), v === 0 ? 0 : 2)}
                                            rx={4}
                                            fill="currentColor"
                                            className={cx(s.cor.texto, foco !== null && foco !== i && "opacity-40", "transition-opacity")}
                                        />
                                    );
                                })}
                                <text x={centro} y={altura - 8} textAnchor="middle" className="fill-tinta-fraca text-micro">
                                    {c.length > 14 ? `${c.slice(0, 13)}…` : c}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            )}
            {foco !== null && (
                <Dica x={MARGEM.esquerda + faixa * foco + faixa / 2} y={MARGEM.topo + 24} largura={largura}>
                    <span className="mb-0.5 block font-medium">{categorias[foco]}</span>
                    {series.map((s) => (
                        <span key={s.nome} className="flex items-center gap-1.5">
                            <span className={cx("size-2 rounded-sm", s.cor.fundo)} />
                            <span className="text-tinta-suave">{s.nome}</span>
                            <span className="ms-auto ps-3 font-semibold tabular-nums">{formatarValor(s.valores[foco] ?? 0)}</span>
                        </span>
                    ))}
                </Dica>
            )}
        </div>
    );
}

/** Rosca de participação, com total no centro e legenda com percentuais. */
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
                    <circle cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" strokeWidth={18} className="stroke-superficie-suave" />
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
                                strokeDasharray={`${Math.max(parte - 2, 0)} ${circunferencia}`}
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
            <ul className="flex w-full min-w-0 flex-col gap-2.5">
                {fatias.map((f) => (
                    <li key={f.rotulo} className="flex items-center gap-2 text-corpo">
                        <span className={cx("size-2.5 shrink-0 rounded-[3px]", f.cor.fundo)} />
                        <span className="min-w-0 flex-1 truncate text-tinta-media">{f.rotulo}</span>
                        <span className="tabular-nums text-tinta-suave">{total > 0 ? Math.round((Math.max(f.valor, 0) / total) * 100) : 0}%</span>
                        <span className="w-24 text-end font-medium tabular-nums text-tinta">{formatarValor(f.valor)}</span>
                    </li>
                ))}
            </ul>
        </div>
        </div>
    );
}

/** Linha pequena sem eixos, para os KPIs. */
export function Sparkline({ valores, cor = CORES[0], altura = 32 }: { valores: number[]; cor?: Cor; altura?: number }) {
    const [ref, largura] = useLargura<HTMLDivElement>();
    if (valores.length < 2) return <div className="h-8" />;

    const max = Math.max(...valores);
    const min = Math.min(...valores, 0);
    const amplitude = max - min || 1;
    const x = (i: number) => (i / (valores.length - 1)) * largura;
    const y = (v: number) => 2 + (altura - 4) * (1 - (v - min) / amplitude);
    const d = valores.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");

    return (
        <div ref={ref} className={cx("w-full", cor.texto)} style={{ height: altura }} aria-hidden>
            {largura > 0 && (
                <svg width={largura} height={altura}>
                    <path d={`${d} L${largura},${altura} L0,${altura} Z`} fill="currentColor" opacity={0.1} />
                    <path d={d} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round" />
                </svg>
            )}
        </div>
    );
}

/** Barras horizontais simples (ranking), coloridas por token. */
export function BarrasHorizontais({ dados, formatarValor }: { dados: { rotulo: string; valor: number; cor: string; detalhe?: string }[]; formatarValor: (v: number) => string }) {
    const maximo = Math.max(...dados.map((d) => d.valor), 0);
    return (
        <ul className="flex flex-col gap-3.5">
            {dados.map((d) => (
                <li key={d.rotulo}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-corpo">
                        <span className="truncate text-tinta-media">{d.rotulo}</span>
                        <span className="shrink-0 font-medium tabular-nums text-tinta">
                            {formatarValor(d.valor)}
                            {d.detalhe && <span className="ms-1.5 font-normal text-tinta-suave">{d.detalhe}</span>}
                        </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-superficie-suave">
                        <div className={cx("h-full rounded-full transition-[width] duration-500", d.cor)} style={{ width: maximo > 0 ? `${(d.valor / maximo) * 100}%` : "0%" }} />
                    </div>
                </li>
            ))}
        </ul>
    );
}

export function Legenda({ itens }: { itens: { rotulo: string; cor: Cor }[] }) {
    return (
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {itens.map((i) => (
                <li key={i.rotulo} className="flex items-center gap-1.5 text-rotulo text-tinta-suave">
                    <span className={cx("size-2.5 rounded-[3px]", i.cor.fundo)} />
                    {i.rotulo}
                </li>
            ))}
        </ul>
    );
}
