import { IconCashBanknoteFilled, IconCreditCardFilled } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Avatar as AvatarRadix } from "radix-ui";
import { IconPix, type Icone } from "@/components/ui/icone";
import { cx } from "@/lib/cx";
import type { Opcao } from "@/types/inertia";

export type Tom = "verde" | "rosa" | "azul" | "ambar" | "vermelho" | "cinza" | "primaria" | "secundaria" | "inverso";

const TONS: Record<Tom, string> = {
    verde: "bg-verde-suave text-verde-tinta",
    rosa: "bg-rosa-suave text-rosa-tinta",
    azul: "bg-azul-suave text-azul-tinta",
    ambar: "bg-ambar-suave text-ambar-tinta",
    vermelho: "bg-vermelho-suave text-vermelho-tinta",
    cinza: "bg-superficie-ativa text-tinta-media",
    primaria: "bg-primaria text-primaria-tinta",
    secundaria: "bg-secundaria text-secundaria-tinta",
    inverso: "bg-inverso text-inverso-tinta",
};

/** Cor só do texto (o "Completed" / "Declined" da lista de transações). */
const TEXTOS: Partial<Record<Tom, string>> = {
    verde: "text-positivo",
    vermelho: "text-negativo",
    ambar: "text-ambar-tinta",
    azul: "text-primaria-texto",
    cinza: "text-tinta-suave",
};

/** Chip de status em pastel. */
export function Chip({ tom = "cinza", children, className }: { tom?: Tom; children: ReactNode; className?: string }) {
    return <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-rotulo font-semibold whitespace-nowrap", TONS[tom], className)}>{children}</span>;
}

/** Status só em texto colorido, para listas densas. */
export function TextoStatus({ opcao, className }: { opcao: Opcao | null | undefined; className?: string }) {
    if (!opcao) return null;
    return <span className={cx("text-micro font-semibold", TEXTOS[TOM_DO_VALOR[opcao.valor] ?? "cinza"] ?? "text-tinta-suave", className)}>{opcao.label}</span>;
}

/** Tom de cada valor de enum vindo do servidor. */
const TOM_DO_VALOR: Record<string, Tom> = {
    concluida: "verde",
    cancelada: "vermelho",
    ativa: "verde",
    bloqueada: "vermelho",
    planejada: "azul",
    aberta: "verde",
    encerrada: "cinza",
    entrada: "verde",
    saida: "rosa",
    pre_venda: "secundaria",
    feira: "azul",
    pos_evento: "verde",
};

export function ChipStatus({ opcao }: { opcao: Opcao | null | undefined }) {
    if (!opcao) return null;
    return <Chip tom={TOM_DO_VALOR[opcao.valor] ?? "cinza"}>{opcao.label}</Chip>;
}

/** Tag da venda: Comum neutra, Combo N na cor principal. */
export function ChipTag({ rotulo, combo }: { rotulo: string; combo: boolean }) {
    return <Chip tom={combo ? "primaria" : "cinza"}>{rotulo}</Chip>;
}

/** Barra/ponto de cor por canal, igual em gráficos, agenda e chips. */
export const COR_CANAL: Record<string, string> = {
    pre_venda: "bg-secundaria",
    feira: "bg-primaria",
    pos_evento: "bg-verde",
};

/** Forma de pagamento se reconhece pelo ícone, não pela cor (preenchidos: o Pix só existe assim). */
export const ICONE_PAGAMENTO: Record<string, Icone> = {
    dinheiro: IconCashBanknoteFilled,
    pix: IconPix,
    cartao: IconCreditCardFilled,
};

/** Forma de pagamento com o ícone ao lado do nome (listas, detalhe da venda). */
export function Pagamento({ opcao, className }: { opcao: Opcao; className?: string }) {
    const I = ICONE_PAGAMENTO[opcao.valor];
    return (
        <span className={cx("inline-flex min-w-0 items-center gap-1.5", className)}>
            {I && <I size={16} className="shrink-0 text-tinta-suave" aria-hidden />}
            <span className="truncate">{opcao.label}</span>
        </span>
    );
}

/** Quadradinho de cor das legendas. */
export function Ponto({ cor, className }: { cor: string; className?: string }) {
    return <span aria-hidden className={cx("inline-block size-2.5 shrink-0 rounded-sm", cor, className)} />;
}

const CORES_AVATAR = ["bg-rosa-suave text-rosa-tinta", "bg-verde-suave text-verde-tinta", "bg-azul-suave text-azul-tinta", "bg-secundaria-suave text-secundaria-texto", "bg-ambar-suave text-ambar-tinta"];

export function iniciais(nome: string): string {
    return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

/** Avatar de iniciais com cor estável por nome. */
/** Avatar (Radix Avatar): foto quando houver; senão iniciais com cor estável pelo nome. */
export function Avatar({ nome, foto, tamanho = "md", forma = "redonda", className }: { nome: string; foto?: string | null; tamanho?: "sm" | "md" | "lg" | "xl" | "2xl"; forma?: "redonda" | "quadrada"; className?: string }) {
    const indice = [...nome].reduce((soma, c) => soma + c.charCodeAt(0), 0) % CORES_AVATAR.length;
    const tamanhos = { sm: "size-6 text-micro", md: "size-8 text-rotulo", lg: "size-10 text-ui", xl: "size-12 text-titulo", "2xl": "size-20 text-cabecalho" };
    return (
        <AvatarRadix.Root aria-hidden className={cx("inline-flex shrink-0 items-center justify-center overflow-hidden font-bold select-none", forma === "quadrada" ? "rounded-xl" : "rounded-full", tamanhos[tamanho], CORES_AVATAR[indice], className)}>
            {foto && <AvatarRadix.Image src={foto} alt="" className="size-full object-cover" />}
            <AvatarRadix.Fallback>{iniciais(nome)}</AvatarRadix.Fallback>
        </AvatarRadix.Root>
    );
}

export function Kbd({ children }: { children: ReactNode }) {
    return <kbd className="inline-flex h-5 items-center rounded-md border border-linha bg-superficie px-1.5 font-sans text-micro font-semibold text-tinta-suave">{children}</kbd>;
}

/** Contador em pílula escura (o "19" ao lado de History na referência). */
export function Contador({ children, tom = "inverso", className }: { children: ReactNode; tom?: Tom; className?: string }) {
    return <span className={cx("inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-micro font-bold tabular-nums", TONS[tom], className)}>{children}</span>;
}
