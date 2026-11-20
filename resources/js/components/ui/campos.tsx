import { IconCheck, IconChevronDown, IconChevronUp, IconPaperclip, IconX } from "@tabler/icons-react";
import { Checkbox, Label, RadioGroup, Select, Switch } from "radix-ui";
import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { TRACO, type Icone } from "@/components/ui/icone";
import { cx } from "@/lib/cx";
import { useLocale, useT } from "@/lib/i18n";

const CAMPO_BASE =
    "w-full rounded-controle border border-linha bg-superficie px-3 text-tinta placeholder:text-tinta-fraca transition-colors hover:border-linha-forte focus:border-primaria focus:ring-3 focus:ring-primaria-suave focus:outline-none aria-[invalid=true]:border-negativo disabled:cursor-not-allowed disabled:bg-superficie-suave";

export const CLASSE_ENTRADA = `${CAMPO_BASE} h-11 text-base md:h-9 md:text-ui`;
const CLASSE_ENTRADA_PEQUENA = `${CAMPO_BASE} h-11 text-base md:h-8 md:text-corpo`;

export function Campo({ rotulo, dica, erro, obrigatorio, id, className, children }: {
    rotulo?: ReactNode;
    dica?: ReactNode;
    erro?: string;
    obrigatorio?: boolean;
    id?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cx("flex flex-col gap-1.5", className)}>
            {rotulo && (
                <Label.Root htmlFor={id} className="text-corpo font-medium text-tinta">
                    {rotulo}
                    {obrigatorio && <span className="ms-0.5 text-negativo" aria-hidden>*</span>}
                </Label.Root>
            )}
            {children}
            {erro ? (
                <p role="alert" className="text-rotulo text-negativo">{erro}</p>
            ) : dica ? (
                <p className="text-rotulo text-tinta-suave">{dica}</p>
            ) : null}
        </div>
    );
}

type PropsEntrada = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
    rotulo?: ReactNode;
    dica?: ReactNode;
    erro?: string;
    icone?: Icone;
    prefixo?: string;
    valor: string;
    aoMudar: (valor: string) => void;
};

export function Entrada({ rotulo, dica, erro, icone: I, prefixo, valor, aoMudar, className, required, id: idExterno, ...props }: PropsEntrada) {
    const idGerado = useId();
    const id = idExterno ?? idGerado;
    return (
        <Campo rotulo={rotulo} dica={dica} erro={erro} obrigatorio={required} id={id} className={className}>
            <div className="relative">
                {I && <I size={16} stroke={TRACO} className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 text-tinta-fraca" aria-hidden />}
                {prefixo && <span className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 text-ui text-tinta-suave">{prefixo}</span>}
                <input
                    id={id}
                    value={valor}
                    onChange={(e) => aoMudar(e.target.value)}
                    required={required}
                    aria-invalid={erro ? true : undefined}
                    className={cx(CLASSE_ENTRADA, (I || prefixo) && "ps-9")}
                    {...props}
                />
            </div>
        </Campo>
    );
}

export function lerMoeda(texto: string, decimal: "," | "."): number | null {
    const limpo = texto.replace(/[^\d,.]/g, "");
    if (!/\d/.test(limpo)) return null;
    let i = Math.max(limpo.lastIndexOf(","), limpo.lastIndexOf("."));
    if (i !== -1 && limpo[i] !== decimal && /^\d{3}$/.test(limpo.slice(i + 1))) i = -1;
    const numero = i === -1 ? limpo.replace(/[,.]/g, "") : `${limpo.slice(0, i).replace(/[,.]/g, "")}.${limpo.slice(i + 1)}`;
    const n = Number(numero);
    return Number.isFinite(n) ? n : null;
}

export function CampoMoeda({ valor, aoMudar, onBlur, ...props }: Omit<PropsEntrada, "valor" | "aoMudar" | "prefixo"> & { valor: number | null; aoMudar: (valor: number | null) => void }) {
    const locale = useLocale();
    const decimal = (1.5).toLocaleString(locale).includes(",") ? "," : ".";
    const formatar = (v: number | null) => (v === null || Number.isNaN(v) ? "" : v.toFixed(2).replace(".", decimal));
    const [texto, setTexto] = useState(() => formatar(valor));

    useEffect(() => {
        if (lerMoeda(texto, decimal) !== valor) setTexto(formatar(valor));
    }, [valor]);

    return (
        <Entrada
            {...props}
            prefixo="R$"
            inputMode="decimal"
            autoComplete="off"
            valor={texto}
            aoMudar={(digitado) => {
                const limpo = digitado.replace(/[^\d,.]/g, "");
                setTexto(limpo);
                aoMudar(lerMoeda(limpo, decimal));
            }}
            onBlur={(e) => {
                setTexto(formatar(lerMoeda(texto, decimal)));
                onBlur?.(e);
            }}
        />
    );
}

export function CampoNumero({ valor, aoMudar, ...props }: Omit<PropsEntrada, "valor" | "aoMudar"> & { valor: number | null; aoMudar: (valor: number | null) => void }) {
    return (
        <Entrada
            {...props}
            type="number"
            inputMode="numeric"
            valor={valor === null || Number.isNaN(valor) ? "" : String(valor)}
            aoMudar={(texto) => aoMudar(texto === "" ? null : Number(texto))}
        />
    );
}

export function CampoData(props: Omit<PropsEntrada, "type">) {
    return <Entrada {...props} type="date" />;
}

export function AreaTexto({ rotulo, dica, erro, valor, aoMudar, className, required, ...props }: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
    rotulo?: ReactNode;
    dica?: ReactNode;
    erro?: string;
    valor: string;
    aoMudar: (valor: string) => void;
}) {
    const id = useId();
    return (
        <Campo rotulo={rotulo} dica={dica} erro={erro} obrigatorio={required} id={id} className={className}>
            <textarea
                id={id}
                rows={3}
                value={valor}
                onChange={(e) => aoMudar(e.target.value)}
                aria-invalid={erro ? true : undefined}
                className={cx(CAMPO_BASE, "py-2 text-base md:text-ui")}
                {...props}
            />
        </Campo>
    );
}

export interface OpcaoSelecao {
    valor: string;
    rotulo: string;
}

const VAZIO = "__vazio__";

function ItemSelecao({ opcao }: { opcao: OpcaoSelecao }) {
    return (
        <Select.Item
            value={opcao.valor}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-lg ps-2.5 pe-2 text-ui text-tinta outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-superficie-hover data-[state=checked]:font-medium md:h-9"
        >
            <Select.ItemText>{opcao.rotulo}</Select.ItemText>
            <Select.ItemIndicator className="ms-auto text-primaria-texto">
                <IconCheck size={16} stroke={2} aria-hidden />
            </Select.ItemIndicator>
        </Select.Item>
    );
}

export function Selecao({ rotulo, dica, erro, opcoes = [], grupos, valor, aoMudar, vazio, placeholder, className, tamanho = "md", required, disabled, name, id: idExterno, "aria-label": rotuloAcessivel }: {
    rotulo?: ReactNode;
    dica?: ReactNode;
    erro?: string;
    opcoes?: OpcaoSelecao[];
    grupos?: { rotulo: string; opcoes: OpcaoSelecao[] }[];
    valor: string;
    aoMudar: (valor: string) => void;
    vazio?: string;
    placeholder?: string;
    className?: string;
    tamanho?: "sm" | "md";
    required?: boolean;
    disabled?: boolean;
    name?: string;
    id?: string;
    "aria-label"?: string;
}) {
    const t = useT();
    const idGerado = useId();
    const id = idExterno ?? idGerado;
    const valorRadix = valor === "" ? (vazio !== undefined ? VAZIO : "") : valor;

    return (
        <Campo rotulo={rotulo} dica={dica} erro={erro} obrigatorio={required} id={id} className={className}>
            <Select.Root value={valorRadix} onValueChange={(v) => aoMudar(v === VAZIO ? "" : v)} required={required} disabled={disabled} name={name}>
                <Select.Trigger
                    id={id}
                    aria-label={rotuloAcessivel}
                    aria-invalid={erro ? true : undefined}
                    className={cx(
                        tamanho === "sm" ? CLASSE_ENTRADA_PEQUENA : CLASSE_ENTRADA,
                        "flex cursor-pointer items-center justify-between gap-2 text-start data-[placeholder]:text-tinta-fraca data-[state=open]:border-primaria",
                    )}
                >
                    <span className="min-w-0 truncate">
                        <Select.Value placeholder={placeholder ?? t("Selecione…")} />
                    </span>
                    <Select.Icon className="shrink-0 text-tinta-suave">
                        <IconChevronDown size={16} stroke={TRACO} aria-hidden />
                    </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content
                        position="popper"
                        sideOffset={6}
                        collisionPadding={8}
                        className="z-60 max-h-[min(var(--radix-select-content-available-height),22rem)] min-w-(--radix-select-trigger-width) overflow-hidden rounded-xl border border-linha bg-superficie text-tinta shadow-flutuante data-[state=open]:animate-surgir"
                    >
                        <Select.ScrollUpButton className="flex h-6 items-center justify-center text-tinta-suave">
                            <IconChevronUp size={14} stroke={TRACO} aria-hidden />
                        </Select.ScrollUpButton>
                        <Select.Viewport className="p-1">
                            {vazio !== undefined && <ItemSelecao opcao={{ valor: VAZIO, rotulo: vazio }} />}
                            {opcoes.map((o) => <ItemSelecao key={o.valor} opcao={o} />)}
                            {grupos?.map((g, i) => (
                                <Select.Group key={g.rotulo}>
                                    {(i > 0 || opcoes.length > 0 || vazio !== undefined) && <Select.Separator className="my-1 h-px bg-linha" />}
                                    <Select.Label className="px-2.5 pt-1.5 pb-1 text-micro font-semibold tracking-wide text-tinta-fraca uppercase">{g.rotulo}</Select.Label>
                                    {g.opcoes.map((o) => <ItemSelecao key={o.valor} opcao={o} />)}
                                </Select.Group>
                            ))}
                        </Select.Viewport>
                        <Select.ScrollDownButton className="flex h-6 items-center justify-center text-tinta-suave">
                            <IconChevronDown size={14} stroke={TRACO} aria-hidden />
                        </Select.ScrollDownButton>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
        </Campo>
    );
}

export function CaixaSelecao({ marcado, aoMudar, children, descricao, desabilitado }: {
    marcado: boolean;
    aoMudar: (marcado: boolean) => void;
    children: ReactNode;
    descricao?: ReactNode;
    desabilitado?: boolean;
}) {
    const id = useId();
    return (
        <div className={cx("flex items-start gap-2.5", desabilitado && "opacity-50")}>
            <Checkbox.Root
                id={id}
                checked={marcado}
                disabled={desabilitado}
                onCheckedChange={(v) => aoMudar(v === true)}
                className="relative flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md border border-linha-forte after:absolute after:-inset-2.5 after:content-[''] bg-superficie text-primaria-tinta outline-none transition-colors hover:border-primaria focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-offset-2 disabled:cursor-not-allowed data-[state=checked]:border-primaria data-[state=checked]:bg-primaria"
            >
                <Checkbox.Indicator>
                    <IconCheck size={14} stroke={3} aria-hidden />
                </Checkbox.Indicator>
            </Checkbox.Root>
            <Label.Root htmlFor={id} className={cx("flex flex-col", !desabilitado && "cursor-pointer")}>
                <span className="text-ui leading-5 text-tinta">{children}</span>
                {descricao && <span className="text-rotulo text-tinta-suave">{descricao}</span>}
            </Label.Root>
        </div>
    );
}

export function Interruptor({ ligado, aoMudar, children, descricao, desabilitado, rotuloAcessivel }: {
    ligado: boolean;
    aoMudar: (ligado: boolean) => void;
    children: ReactNode;
    descricao?: ReactNode;
    desabilitado?: boolean;
    rotuloAcessivel?: string;
}) {
    const id = useId();
    return (
        <div className={cx("flex min-h-10 items-center gap-3", desabilitado && "opacity-50")}>
            <Switch.Root
                id={id}
                aria-label={rotuloAcessivel}
                checked={ligado}
                disabled={desabilitado}
                onCheckedChange={aoMudar}
                className="relative h-6 w-10 shrink-0 cursor-pointer rounded-full bg-superficie-ativa after:absolute after:-inset-y-2 after:-inset-x-1 after:content-[''] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-offset-2 disabled:cursor-not-allowed data-[state=checked]:bg-primaria"
            >
                <Switch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-superficie shadow-botao transition-transform data-[state=checked]:translate-x-4.5 rtl:-translate-x-0.5 rtl:data-[state=checked]:-translate-x-4.5" />
            </Switch.Root>
            <Label.Root htmlFor={id} className="flex cursor-pointer flex-col">
                <span className="text-ui text-tinta">{children}</span>
                {descricao && <span className="text-rotulo text-tinta-suave">{descricao}</span>}
            </Label.Root>
        </div>
    );
}

export function Segmentos({ rotulo, opcoes, valor, aoMudar, cheio, grande, cores, icones }: {
    rotulo: string;
    opcoes: OpcaoSelecao[];
    valor: string | null;
    aoMudar: (valor: string) => void;
    cheio?: boolean;
    grande?: boolean;
    cores?: Record<string, string>;
    icones?: Record<string, Icone>;
}) {
    return (
        <RadioGroup.Root
            aria-label={rotulo}
            value={valor ?? ""}
            onValueChange={aoMudar}
            orientation="horizontal"
            loop
            className={cx("gap-1 rounded-controle bg-superficie-suave p-1", cheio ? "flex w-full" : "inline-flex max-w-full")}
        >
            {opcoes.map((o) => {
                const I = icones?.[o.valor];
                const empilhado = Boolean(I && grande);
                return (
                    <RadioGroup.Item
                        key={o.valor}
                        value={o.valor}
                        className={cx(
                            "inline-flex min-w-0 cursor-pointer items-center justify-center rounded-md font-medium whitespace-nowrap text-tinta-suave outline-none transition-colors hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco data-[state=checked]:bg-superficie data-[state=checked]:text-tinta data-[state=checked]:shadow-botao",
                            empilhado ? "h-16 flex-col gap-1 px-2 text-corpo" : grande ? "h-11 gap-2 px-3 text-ui" : "h-9 gap-2 px-3 text-corpo md:h-7",
                            cheio && "flex-1",
                        )}
                    >
                        {I && <I size={grande ? 20 : 16} className="shrink-0" aria-hidden />}
                        {cores?.[o.valor] && <span className={cx("size-2.5 shrink-0 rounded-sm", cores[o.valor])} aria-hidden />}
                        <span className="truncate">{o.rotulo}</span>
                    </RadioGroup.Item>
                );
            })}
        </RadioGroup.Root>
    );
}

export function OpcoesCartao({ rotulo, opcoes, valor, aoMudar, colunas = 1 }: {
    rotulo: string;
    opcoes: { valor: string; titulo: string; descricao?: string }[];
    valor: string;
    aoMudar: (valor: string) => void;
    colunas?: 1 | 2 | 3;
}) {
    return (
        <RadioGroup.Root
            aria-label={rotulo}
            value={valor}
            onValueChange={aoMudar}
            className={cx("grid gap-2", colunas === 3 ? "sm:grid-cols-3" : colunas === 2 ? "sm:grid-cols-2" : "")}
        >
            {opcoes.map((o) => (
                <RadioGroup.Item
                    key={o.valor}
                    value={o.valor}
                    className="group flex cursor-pointer items-start gap-3 rounded-xl border border-linha p-3 text-start outline-none transition-colors hover:border-linha-forte hover:bg-superficie-hover focus-visible:ring-2 focus-visible:ring-foco data-[state=checked]:border-primaria data-[state=checked]:bg-primaria-suave"
                >
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-linha-forte group-data-[state=checked]:border-primaria">
                        <RadioGroup.Indicator className="size-2 rounded-full bg-primaria" />
                    </span>
                    <span className="flex flex-col gap-0.5">
                        <span className="text-ui font-medium text-tinta">{o.titulo}</span>
                        {o.descricao && <span className="text-rotulo text-tinta-suave">{o.descricao}</span>}
                    </span>
                </RadioGroup.Item>
            ))}
        </RadioGroup.Root>
    );
}

export function CampoArquivo({ rotulo, arquivo, aoMudar, aceitar, dica, erro }: {
    rotulo: string;
    arquivo: File | null;
    aoMudar: (arquivo: File | null) => void;
    aceitar: string;
    dica?: string;
    erro?: string;
}) {
    const t = useT();
    const id = useId();
    const entrada = useRef<HTMLInputElement>(null);

    return (
        <Campo rotulo={rotulo} dica={dica} erro={erro} id={id}>
            <div className="relative flex items-center gap-2 rounded-controle border border-dashed border-linha-forte bg-superficie-suave p-1.5">
                <input ref={entrada} id={id} type="file" accept={aceitar} className="sr-only" onChange={(e) => aoMudar(e.target.files?.[0] ?? null)} />
                <button type="button" onClick={() => entrada.current?.click()} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md border border-linha bg-superficie px-3 text-corpo font-medium text-tinta outline-none hover:bg-superficie-hover focus-visible:ring-2 focus-visible:ring-foco md:h-8 md:px-2.5">
                    <IconPaperclip size={16} stroke={TRACO} aria-hidden />
                    {arquivo ? t("Trocar arquivo") : t("Escolher arquivo")}
                </button>
                <span className="min-w-0 flex-1 truncate text-corpo text-tinta-suave">{arquivo?.name ?? t("Nenhum arquivo")}</span>
                {arquivo && (
                    <button
                        type="button"
                        aria-label={t("Remover arquivo")}
                        onClick={() => {
                            aoMudar(null);
                            if (entrada.current) entrada.current.value = "";
                        }}
                        className="flex size-9 items-center justify-center rounded-md text-tinta-suave hover:bg-superficie-hover md:size-7"
                    >
                        <IconX size={16} stroke={TRACO} aria-hidden />
                    </button>
                )}
            </div>
        </Campo>
    );
}
