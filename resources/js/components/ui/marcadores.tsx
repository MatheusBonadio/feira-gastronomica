import type { ReactNode } from "react";
import { Avatar as AvatarRadix } from "radix-ui";
import { cx } from "@/lib/cx";
import type { Opcao } from "@/types/inertia";

export type Tom = "verde" | "rosa" | "azul" | "ambar" | "vermelho" | "cinza" | "primaria" | "secundaria";

const TONS: Record<Tom, string> = {
    verde: "bg-verde-suave text-verde-tinta",
    rosa: "bg-rosa-suave text-rosa-tinta",
    azul: "bg-azul-suave text-azul-tinta",
    ambar: "bg-ambar-suave text-ambar-tinta",
    vermelho: "bg-vermelho-suave text-vermelho-tinta",
    cinza: "bg-superficie-ativa text-tinta-media",
    primaria: "bg-primaria text-primaria-tinta",
    secundaria: "bg-secundaria text-secundaria-tinta",
};

/** Chip de status em pastel (como "In Progress" / "Pending" / "Completed"). */
export function Chip({ tom = "cinza", children, className }: { tom?: Tom; children: ReactNode; className?: string }) {
    return <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-rotulo font-medium whitespace-nowrap", TONS[tom], className)}>{children}</span>;
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
    dinheiro: "verde",
    pix: "azul",
    cartao: "rosa",
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

export const COR_PAGAMENTO: Record<string, string> = {
    dinheiro: "bg-verde",
    pix: "bg-azul",
    cartao: "bg-rosa",
};

/** Quadradinho de cor (como os de "Event Planning" / "Breakfast Plan"). */
export function Ponto({ cor, className }: { cor: string; className?: string }) {
    return <span aria-hidden className={cx("inline-block size-2.5 shrink-0 rounded-[3px]", cor, className)} />;
}

const CORES_AVATAR = ["bg-rosa-suave text-rosa-tinta", "bg-verde-suave text-verde-tinta", "bg-azul-suave text-azul-tinta", "bg-secundaria-suave text-secundaria-tinta", "bg-ambar-suave text-ambar-tinta"];

export function iniciais(nome: string): string {
    return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

/** Avatar de iniciais com cor estável por nome. */
/** Avatar (Radix Avatar): foto quando houver; senão iniciais com cor estável pelo nome. */
export function Avatar({ nome, foto, tamanho = "md", className }: { nome: string; foto?: string | null; tamanho?: "sm" | "md" | "lg"; className?: string }) {
    const indice = [...nome].reduce((soma, c) => soma + c.charCodeAt(0), 0) % CORES_AVATAR.length;
    const tamanhos = { sm: "size-6 text-micro", md: "size-8 text-rotulo", lg: "size-10 text-ui" };
    return (
        <AvatarRadix.Root aria-hidden className={cx("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ring-2 ring-superficie select-none", tamanhos[tamanho], CORES_AVATAR[indice], className)}>
            {foto && <AvatarRadix.Image src={foto} alt="" className="size-full object-cover" />}
            <AvatarRadix.Fallback>{iniciais(nome)}</AvatarRadix.Fallback>
        </AvatarRadix.Root>
    );
}

export function Kbd({ children }: { children: ReactNode }) {
    return <kbd className="inline-flex h-5 items-center rounded border border-linha bg-superficie px-1.5 font-sans text-micro font-medium text-tinta-suave">{children}</kbd>;
}

/** Contador em pílula (como o "8" de Help & Support). */
export function Contador({ children, tom = "secundaria" }: { children: ReactNode; tom?: Tom }) {
    return <span className={cx("inline-flex min-w-5 items-center justify-center rounded-md px-1.5 text-micro font-semibold", TONS[tom])}>{children}</span>;
}
