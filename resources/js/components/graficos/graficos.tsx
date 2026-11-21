import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { cx } from "@/lib/cx";
import { useMidia } from "@/lib/midia";

export const CORES = [
    { texto: "text-grafico-1", fundo: "bg-grafico-1", preenchimento: "fill-grafico-1" },
    { texto: "text-grafico-2", fundo: "bg-grafico-2", preenchimento: "fill-grafico-2" },
    { texto: "text-grafico-3", fundo: "bg-grafico-3", preenchimento: "fill-grafico-3" },
    { texto: "text-grafico-4", fundo: "bg-grafico-4", preenchimento: "fill-grafico-4" },
    { texto: "text-grafico-5", fundo: "bg-grafico-5", preenchimento: "fill-grafico-5" },
    { texto: "text-grafico-6", fundo: "bg-grafico-6", preenchimento: "fill-grafico-6" },
] as const;

export type Cor = (typeof CORES)[number];

type Forma = { x: number; y: number; width: number; height: number; index: number; value: number | [number, number] };
type Marca = { x?: number | string; y?: number | string; width?: number | string; visibleTicksCount?: number; payload?: { value?: unknown; index?: number } };
type LinhaGrade = { x1: number; x2: number; y1: number; y2: number; key?: string };

const MARGEM = { top: 12, right: 4, bottom: 0, left: 0 };

const SUPERFICIE = "relative w-full [&_:focus:not(:focus-visible)]:outline-none";

const MARCA_Y = { className: "fill-tinta-fraca text-micro tabular-nums" };

function useSemMovimento() {
    return useMidia("(prefers-reduced-motion: reduce)");
}

function escala(maximo: number, divisoes = 4): number[] {
    if (maximo <= 0) return [0, 1, 2, 3, 4].map((i) => i * 25);
    const bruto = maximo / divisoes;
    const magnitude = 10 ** Math.floor(Math.log10(bruto));
    const passo = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((p) => p >= bruto) ?? bruto;
    return Array.from({ length: divisoes + 1 }, (_, i) => i * passo);
}

let contextoTexto: CanvasRenderingContext2D | null = null;

function larguraTexto(texto: string): number {
    contextoTexto ??= document.createElement("canvas").getContext("2d");
    if (!contextoTexto) return texto.length * 7;
    contextoTexto.font = `11px ${getComputedStyle(document.body).fontFamily}`;
    return contextoTexto.measureText(texto).width;
}

function larguraEixoY(marcas: number[], formatar: (v: number) => string): number {
    return Math.ceil(Math.max(...marcas.map((m) => larguraTexto(formatar(m))))) + 14;
}

function PadraoHachura({ id }: { id: string }) {
    return (
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" strokeWidth="2.5" style={{ stroke: "var(--hachura)" }} />
        </pattern>
    );
}

function retangulo(x: number, y: number, w: number, h: number, raioTopo: number, raioBase: number): string {
    const rt = Math.max(0, Math.min(raioTopo, w / 2, raioBase ? h / 2 : h));
    const rb = Math.max(0, Math.min(raioBase, w / 2, h - rt));
    return [
        `M${x},${y + rt}`,
        `Q${x},${y} ${x + rt},${y}`,
        `L${x + w - rt},${y}`,
        `Q${x + w},${y} ${x + w},${y + rt}`,
        `L${x + w},${y + h - rb}`,
        `Q${x + w},${y + h} ${x + w - rb},${y + h}`,
        `L${x + rb},${y + h}`,
        `Q${x},${y + h} ${x},${y + h - rb}`,
        "Z",
    ].join(" ");
}

function linhaGrade(p: LinhaGrade) {
    return <line key={p.key ?? `${p.y1}`} x1={p.x1} x2={p.x2} y1={p.y1} y2={p.y2} className="stroke-grafico-grade" />;
}

function encurtar(texto: string, maximo: number): string {
    return texto.length > maximo ? `${texto.slice(0, maximo - 1)}…` : texto;
}

function marcaX(classe: (indice: number) => string, maximoPadrao = 24) {
    return function MarcaX(p: Marca) {
        const espaco = Number(p.width) / Math.max(p.visibleTicksCount ?? 1, 1);
        const maximo = Number.isFinite(espaco) && espaco > 0 ? Math.max(4, Math.min(maximoPadrao, Math.floor(espaco / 6.5))) : maximoPadrao;
        return (
            <text x={Number(p.x)} y={Number(p.y)} dy="0.9em" textAnchor="middle" className={cx("text-micro", classe(p.payload?.index ?? -1))}>
                {encurtar(String(p.payload?.value ?? ""), maximo)}
            </text>
        );
    };
}

function CaixaDica({ titulo, children }: { titulo: ReactNode; children: ReactNode }) {
    return (
        <div className="rounded-xl border border-linha bg-superficie px-3 py-2 text-rotulo whitespace-nowrap text-tinta shadow-flutuante">
            <span className="mb-1 block text-micro text-tinta-suave">{titulo}</span>
            {children}
        </div>
    );
}

function LinhaDica({ nome, cor, valor }: { nome: string; cor: Cor; valor: string }) {
    return (
        <span className="flex items-center gap-2 py-px">
            <span className={cx("size-2 rounded-full", cor.fundo)} aria-hidden />
            <span className="flex-1 text-tinta-media">{nome}</span>
            <span className="ps-4 font-semibold tabular-nums">{valor}</span>
        </span>
    );
}

function useIndiceAtivo(conteudo: Pick<TooltipContentProps, "active" | "activeIndex">, aoMudar: (indice: number | null) => void): number | null {
    const indice = conteudo.active && conteudo.activeIndex !== null && conteudo.activeIndex !== undefined ? Number(conteudo.activeIndex) : null;
    useEffect(() => aoMudar(Number.isInteger(indice) ? indice : null), [indice, aoMudar]);
    return Number.isInteger(indice) ? indice : null;
}

const DICA = { cursor: false, isAnimationActive: false, wrapperStyle: { outline: "none", zIndex: 20 } } as const;

export interface DiaBarras {
    chave: string;
    rotulo: string;
    detalhe?: string;
    valores: number[];
}

function DicaDias({ conteudo, dias, series, formatarValor, rotuloTotal, aoMudar }: {
    conteudo: TooltipContentProps;
    dias: DiaBarras[];
    series: { nome: string; cor: Cor }[];
    formatarValor: (v: number) => string;
    rotuloTotal: string;
    aoMudar: (indice: number | null) => void;
}) {
    const indice = useIndiceAtivo(conteudo, aoMudar);
    const dia = indice !== null ? dias[indice] : undefined;
    if (!dia) return null;
    const total = dia.valores.reduce((s, v) => s + Math.max(v, 0), 0);

    return (
        <CaixaDica titulo={dia.detalhe ?? dia.rotulo}>
            {series.map((s, j) => <LinhaDica key={s.nome} nome={s.nome} cor={s.cor} valor={formatarValor(dia.valores[j] ?? 0)} />)}
            <span className="mt-1 flex items-center justify-between gap-4 border-t border-linha pt-1">
                <span className="text-tinta-suave">{rotuloTotal}</span>
                <span className="font-semibold tabular-nums">{formatarValor(total)}</span>
            </span>
        </CaixaDica>
    );
}

function SegmentoDia({ forma, valores, serie, cor, destaque, hachura }: { forma: Forma; valores: number[]; serie: number; cor: Cor; destaque: number; hachura: string }) {
    const { x, y, width, height, index } = forma;
    const v = Math.max(valores[serie] ?? 0, 0);
    if (v <= 0 || width <= 0) return <g />;

    const positivos = valores.map((n) => Math.max(n, 0));
    const primeiro = positivos.findIndex((n) => n > 0);
    const ultimo = positivos.length - 1 - [...positivos].reverse().findIndex((n) => n > 0);

    if (index !== destaque) {
        const alturaMinima = serie === ultimo ? Math.max(height, 3) : height;
        return <path d={retangulo(x, y + height - alturaMinima, width, alturaMinima, serie === ultimo ? 6 : 0, serie === primeiro ? 6 : 0)} className="fill-grafico-inativo" />;
    }

    const altura = Math.max(height - (serie > primeiro ? 2 : 0), 2);
    return (
        <g>
            <rect x={x} y={y} width={width} height={altura} rx={5} className={cor.preenchimento} />
            <rect x={x} y={y} width={width} height={altura} rx={5} fill={`url(#${hachura})`} />
        </g>
    );
}

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
    const hachura = useId();
    const semMovimento = useSemMovimento();
    const [ativo, setAtivo] = useState<number | null>(null);
    const destaque = ativo ?? focoInicial ?? dias.length - 1;
    const atual = dias[destaque];

    const dados = useMemo(
        () => dias.map((d) => Object.fromEntries([["rotulo", d.rotulo], ...series.map((_, j) => [`s${j}`, Math.max(d.valores[j] ?? 0, 0)])])),
        [dias, series],
    );
    const marcas = useMemo(() => escala(Math.max(0, ...dias.map((d) => d.valores.reduce((s, v) => s + Math.max(v, 0), 0)))), [dias]);
    const marcaDia = useMemo(() => marcaX((i) => (i === destaque ? "fill-tinta font-semibold" : "fill-tinta-fraca"), 12), [destaque]);

    const escolher = (indice: unknown) => {
        const i = Number(indice);
        if (aoEscolher && Number.isInteger(i) && dias[i]) aoEscolher(dias[i]);
    };

    return (
        <div
            className={cx(SUPERFICIE, aoEscolher && "[&_.recharts-surface]:cursor-pointer")}
            style={{ height: altura }}
            role="group"
            aria-label={rotulo}
            aria-roledescription="gráfico"
            onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && ativo !== null) {
                    e.preventDefault();
                    escolher(ativo);
                }
            }}
        >
            <p className="sr-only" aria-live="polite">
                {atual && `${atual.rotulo}: ${series.map((s, i) => `${s.nome} ${formatarValor(atual.valores[i] ?? 0)}`).join(", ")}`}
            </p>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dados} margin={MARGEM} barCategoryGap="34%" onClick={(estado) => escolher(estado?.activeTooltipIndex)} onMouseLeave={() => setAtivo(null)}>
                    <defs><PadraoHachura id={hachura} /></defs>
                    <CartesianGrid vertical={false} horizontal={linhaGrade} />
                    <XAxis dataKey="rotulo" axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={8} tick={marcaDia} height={26} />
                    <YAxis width={larguraEixoY(marcas, formatarEixo)} axisLine={false} tickLine={false} domain={[0, marcas[marcas.length - 1]]} ticks={marcas} interval={0} tickFormatter={formatarEixo} tick={MARCA_Y} />
                    <Tooltip
                        {...DICA}
                        content={(conteudo) => <DicaDias conteudo={conteudo} dias={dias} series={series} formatarValor={formatarValor} rotuloTotal={rotuloTotal} aoMudar={setAtivo} />}
                    />
                    {series.map((s, j) => (
                        <Bar
                            key={s.nome}
                            dataKey={`s${j}`}
                            stackId="dia"
                            maxBarSize={56}
                            isAnimationActive={!semMovimento}
                            animationDuration={450}
                            shape={(forma: unknown) => {
                                const f = forma as Forma;
                                return <SegmentoDia forma={f} valores={dias[f.index]?.valores ?? []} serie={j} cor={s.cor} destaque={destaque} hachura={hachura} />;
                            }}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function CursorVertical({ points, height, top }: { points?: { x: number; y: number }[]; height?: number; top?: number }) {
    const x = points?.[0]?.x;
    if (x === undefined) return null;
    const inicio = points?.[0]?.y ?? top ?? 0;
    const fim = points?.[1]?.y ?? inicio + (height ?? 0);
    return <line x1={x} x2={x} y1={inicio} y2={fim} className="stroke-linha-forte" strokeDasharray="3 3" />;
}

export function GraficoArea({ pontos, formatarValor, formatarEixo, altura = 240, cor = CORES[0], rotulo }: {
    pontos: { rotulo: string; valor: number; detalhe?: string }[];
    formatarValor: (v: number) => string;
    formatarEixo: (v: number) => string;
    altura?: number;
    cor?: Cor;
    rotulo: string;
}) {
    const gradiente = useId();
    const semMovimento = useSemMovimento();
    const marcas = useMemo(() => escala(Math.max(0, ...pontos.map((p) => p.valor))), [pontos]);
    const marcaDia = useMemo(() => marcaX(() => "fill-tinta-fraca", 12), []);
    const ponto = { r: 5, fill: "currentColor", strokeWidth: 2, className: "stroke-superficie" };

    return (
        <div className={cx(SUPERFICIE, cor.texto)} style={{ height: altura }} role="group" aria-label={rotulo} aria-roledescription="gráfico">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pontos} margin={{ ...MARGEM, right: 12, left: 4 }}>
                    <defs>
                        <linearGradient id={gradiente} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} horizontal={linhaGrade} />
                    <XAxis dataKey="rotulo" axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={12} tick={marcaDia} height={26} />
                    <YAxis width={larguraEixoY(marcas, formatarEixo)} axisLine={false} tickLine={false} domain={[0, marcas[marcas.length - 1]]} ticks={marcas} interval={0} tickFormatter={formatarEixo} tick={MARCA_Y} />
                    <Tooltip
                        cursor={<CursorVertical />}
                        isAnimationActive={false}
                        wrapperStyle={DICA.wrapperStyle}
                        content={({ active, payload }) => {
                            const p = active ? (payload?.[0]?.payload as (typeof pontos)[number] | undefined) : undefined;
                            if (!p) return null;
                            return (
                                <CaixaDica titulo={p.rotulo}>
                                    <span className="font-semibold tabular-nums">{formatarValor(p.valor)}</span>
                                    {p.detalhe && <span className="block text-tinta-suave">{p.detalhe}</span>}
                                </CaixaDica>
                            );
                        }}
                    />
                    <Area
                        type="linear"
                        dataKey="valor"
                        stroke="currentColor"
                        strokeWidth={2.25}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        fill={`url(#${gradiente})`}
                        dot={pontos.length === 1 ? ponto : false}
                        activeDot={ponto}
                        isAnimationActive={!semMovimento}
                        animationDuration={450}
                        label={
                            pontos.length === 1
                                ? (p: { x?: number | string; y?: number | string; value?: unknown }) => (
                                      <text x={Number(p.x)} y={Number(p.y) - 14} textAnchor="middle" className="fill-tinta text-rotulo font-semibold">
                                          {formatarValor(Number(p.value))}
                                      </text>
                                  )
                                : false
                        }
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function BarraGrupo({ forma, cor, ativa, hachura }: { forma: Forma; cor: Cor; ativa: boolean; hachura: string }) {
    const { x, y, width, height, value } = forma;
    const v = Array.isArray(value) ? value[1] - value[0] : value;
    if (width <= 0 || v <= 0) return <g />;
    const altura = Math.max(height, 2);
    const topo = y + height - altura;
    if (!ativa) return <rect x={x} y={topo} width={width} height={altura} rx={5} className="fill-grafico-inativo" />;
    return (
        <g>
            <rect x={x} y={topo} width={width} height={altura} rx={5} className={cor.preenchimento} />
            <rect x={x} y={topo} width={width} height={altura} rx={5} fill={`url(#${hachura})`} />
        </g>
    );
}

function DicaGrupo({ conteudo, categorias, series, formatarValor, aoMudar }: {
    conteudo: TooltipContentProps;
    categorias: string[];
    series: { nome: string; cor: Cor; valores: number[] }[];
    formatarValor: (v: number) => string;
    aoMudar: (indice: number | null) => void;
}) {
    const indice = useIndiceAtivo(conteudo, aoMudar);
    if (indice === null || categorias[indice] === undefined) return null;
    return (
        <CaixaDica titulo={categorias[indice]}>
            {series.map((s) => <LinhaDica key={s.nome} nome={s.nome} cor={s.cor} valor={formatarValor(s.valores[indice] ?? 0)} />)}
        </CaixaDica>
    );
}

export function GraficoBarras({ categorias, series, formatarValor, formatarEixo, altura = 260, rotulo }: {
    categorias: string[];
    series: { nome: string; cor: Cor; valores: number[] }[];
    formatarValor: (v: number) => string;
    formatarEixo: (v: number) => string;
    altura?: number;
    rotulo: string;
}) {
    const hachura = useId();
    const semMovimento = useSemMovimento();
    const [ativo, setAtivo] = useState<number | null>(null);
    const dados = useMemo(
        () => categorias.map((c, i) => Object.fromEntries([["rotulo", c], ...series.map((s, j) => [`s${j}`, Math.max(s.valores[i] ?? 0, 0)])])),
        [categorias, series],
    );
    const marcas = useMemo(() => escala(Math.max(0, ...series.flatMap((s) => s.valores))), [series]);
    const marcaCategoria = useMemo(() => marcaX(() => "fill-tinta-suave", 18), []);

    return (
        <div className={SUPERFICIE} style={{ height: altura }} role="group" aria-label={rotulo} aria-roledescription="gráfico">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dados} margin={MARGEM} barGap={4} barCategoryGap="24%" onMouseLeave={() => setAtivo(null)}>
                    <defs><PadraoHachura id={hachura} /></defs>
                    <CartesianGrid vertical={false} horizontal={linhaGrade} />
                    <XAxis dataKey="rotulo" axisLine={false} tickLine={false} interval={0} tick={marcaCategoria} height={26} />
                    <YAxis width={larguraEixoY(marcas, formatarEixo)} axisLine={false} tickLine={false} domain={[0, marcas[marcas.length - 1]]} ticks={marcas} interval={0} tickFormatter={formatarEixo} tick={MARCA_Y} />
                    <Tooltip {...DICA} content={(conteudo) => <DicaGrupo conteudo={conteudo} categorias={categorias} series={series} formatarValor={formatarValor} aoMudar={setAtivo} />} />
                    {series.map((s, j) => (
                        <Bar
                            key={s.nome}
                            dataKey={`s${j}`}
                            maxBarSize={36}
                            isAnimationActive={!semMovimento}
                            animationDuration={450}
                            shape={(forma: unknown) => {
                                const f = forma as Forma;
                                return <BarraGrupo forma={f} cor={s.cor} ativa={ativo === null || ativo === f.index} hachura={hachura} />;
                            }}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function GraficoRosca({ fatias, formatarValor, centro, rotulo, tamanho = 168 }: {
    fatias: { rotulo: string; valor: number; cor: Cor }[];
    formatarValor: (v: number) => string;
    centro: { valor: string; rotulo: string };
    rotulo: string;
    tamanho?: number;
}) {
    const semMovimento = useSemMovimento();
    const total = fatias.reduce((s, f) => s + Math.max(f.valor, 0), 0);
    const visiveis = fatias.filter((f) => f.valor > 0);

    return (
        <div className="@container">
            <div className="flex flex-col items-center gap-5 @md:flex-row">
                <div className="relative aspect-square w-full shrink-0" style={{ maxWidth: tamanho }} role="img" aria-label={`${rotulo}: ${visiveis.map((f) => `${f.rotulo} ${formatarValor(f.valor)}`).join(", ")}`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <Pie data={[{ valor: 1 }]} dataKey="valor" innerRadius="78%" outerRadius="100%" stroke="none" isAnimationActive={false}>
                                <Cell className="fill-grafico-inativo" />
                            </Pie>
                            {total > 0 && (
                                <Pie data={visiveis} dataKey="valor" nameKey="rotulo" innerRadius="78%" outerRadius="100%" startAngle={90} endAngle={-270} paddingAngle={visiveis.length > 1 ? 2 : 0} stroke="none" isAnimationActive={!semMovimento}>
                                    {visiveis.map((f) => <Cell key={f.rotulo} className={f.cor.preenchimento} />)}
                                </Pie>
                            )}
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
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

export function Sparkline({ valores, cor = CORES[0], altura = 32 }: { valores: number[]; cor?: Cor; altura?: number }) {
    const dados = useMemo(() => valores.map((valor) => ({ valor })), [valores]);
    if (valores.length < 2) return <div className="h-8" />;
    return (
        <div className={cx("w-full", cor.texto)} style={{ height: altura }} aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dados} margin={{ top: 2, right: 2, bottom: 2, left: 2 }} accessibilityLayer={false}>
                    <Line type="linear" dataKey="valor" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function BarraProgresso({ fracao, cor = "bg-primaria", rotulo, altura = "h-3", bloco }: { fracao: number; cor?: string; rotulo: string; altura?: string; bloco?: boolean }) {
    const pct = Math.max(0, Math.min(1, fracao)) * 100;
    const forma = bloco ? "rounded-lg" : "rounded-full";
    return (
        <div role="progressbar" aria-label={rotulo} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} className={cx("overflow-hidden bg-grafico-inativo", forma, altura)}>
            <div className={cx("hachura h-full transition-[width] duration-700", forma, cor)} style={{ width: `${pct}%` }} />
        </div>
    );
}

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

export function Medidor({ fracao, valor, legenda, rotulo, blocos = 11 }: { fracao: number; valor: string; legenda: string; rotulo: string; blocos?: number }) {
    const idHachura = useId();
    const largura = 240;
    const raioExterno = 112;
    const raioInterno = 70;
    const cx0 = largura / 2;
    const cy0 = 120;
    const lacuna = 0.035;
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
