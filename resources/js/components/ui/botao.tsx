import { Link } from "@inertiajs/react";
import { IconChevronDown } from "@tabler/icons-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Menu, type ItemMenu } from "@/components/ui/menu";
import { TRACO, type Icone } from "@/components/ui/icone";
import { cx } from "@/lib/cx";

export type Variante = "primario" | "secundario" | "superficie" | "escuro" | "destaque" | "suave" | "fantasma" | "perigo";
export type Tamanho = "sm" | "md" | "lg";

const BASE =
    "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-controle font-semibold transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-offset-2 focus-visible:ring-offset-fundo disabled:pointer-events-none disabled:opacity-50";

const VARIANTES: Record<Variante, string> = {
    primario: "bg-primaria text-primaria-tinta shadow-botao hover:bg-primaria-hover",
    secundario: "border border-linha bg-superficie text-tinta shadow-botao hover:border-linha-forte hover:bg-superficie-hover",
    superficie: "border border-cartao-borda bg-superficie text-tinta-media hover:bg-superficie-hover hover:text-tinta",
    escuro: "bg-inverso text-inverso-tinta hover:opacity-90",
    destaque: "bg-secundaria text-secundaria-tinta shadow-botao hover:bg-secundaria-hover",
    suave: "bg-superficie-suave text-tinta hover:bg-superficie-ativa",
    fantasma: "text-tinta-media hover:bg-superficie-hover hover:text-tinta",
    perigo: "bg-vermelho text-primaria-tinta shadow-botao hover:opacity-90",
};

const TAMANHOS: Record<Tamanho, string> = {
    sm: "h-9 rounded-lg px-3 text-corpo md:h-8 md:px-2.5",
    md: "h-10 px-3.5 text-ui md:h-9 md:px-3",
    lg: "h-11 rounded-xl px-4 text-ui",
};

const SO_ICONE: Record<Tamanho, string> = { sm: "size-9 rounded-lg md:size-8", md: "size-10 md:size-9", lg: "size-11 rounded-xl" };

export function classesBotao(variante: Variante = "primario", tamanho: Tamanho = "md", soIcone = false) {
    return cx(BASE, VARIANTES[variante], soIcone ? SO_ICONE[tamanho] : TAMANHOS[tamanho]);
}

interface Comum {
    variante?: Variante;
    tamanho?: Tamanho;
    icone?: Icone;
    iconeFinal?: Icone;
    soIcone?: boolean;
    children?: ReactNode;
    className?: string;
}

function Conteudo({ icone: I, iconeFinal: F, soIcone, children }: Comum) {
    return (
        <>
            {I && <I size={16} stroke={TRACO} aria-hidden />}
            {soIcone ? <span className="sr-only">{children}</span> : children}
            {F && <F size={16} stroke={TRACO} aria-hidden />}
        </>
    );
}

export function Botao({ variante, tamanho, icone, iconeFinal, soIcone, children, className, type = "button", ...props }: Comum & ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button type={type} className={cx(classesBotao(variante, tamanho, soIcone), className)} {...props}>
            <Conteudo icone={icone} iconeFinal={iconeFinal} soIcone={soIcone}>{children}</Conteudo>
        </button>
    );
}

export function BotaoLink({ href, variante, tamanho, icone, iconeFinal, soIcone, children, className }: Comum & { href: string }) {
    return (
        <Link prefetch href={href} className={cx(classesBotao(variante, tamanho, soIcone), className)}>
            <Conteudo icone={icone} iconeFinal={iconeFinal} soIcone={soIcone}>{children}</Conteudo>
        </Link>
    );
}

export function BotaoDividido({ href, icone, children, itens, rotuloMenu, variante = "superficie" }: {
    href: string;
    icone?: Icone;
    children: ReactNode;
    itens: ItemMenu[];
    rotuloMenu: string;
    variante?: "primario" | "superficie";
}) {
    const divisor = variante === "primario" ? "border-s border-primaria-tinta/25" : "border-s border-linha";
    return (
        <div className="inline-flex rounded-controle">
            <Link prefetch href={href} className={cx(BASE, VARIANTES[variante], TAMANHOS.md, "rounded-e-none")}>
                <Conteudo icone={icone}>{children}</Conteudo>
            </Link>
            <Menu
                alinhamento="fim"
                itens={itens}
                gatilho={(props) => (
                    <button {...props} type="button" aria-label={rotuloMenu} className={cx(BASE, VARIANTES[variante], divisor, "h-10 w-9 rounded-s-none md:h-9")}>
                        <IconChevronDown size={16} stroke={TRACO} aria-hidden />
                    </button>
                )}
            />
        </div>
    );
}
