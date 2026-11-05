import { router } from "@inertiajs/react";
import { DropdownMenu } from "radix-ui";
import { Fragment, type ReactElement, type ReactNode } from "react";
import { TRACO, type Icone } from "@/components/ui/icone";
import { cx } from "@/lib/cx";

export interface ItemMenu {
    rotulo: string;
    icone?: Icone;
    /** Navega pelo Inertia. */
    href?: string;
    /** Navegação completa (troca de idioma, download). */
    hrefExterno?: string;
    aoSelecionar?: () => void;
    selecionado?: boolean;
    perigo?: boolean;
    separadorAntes?: boolean;
}

/** O Radix injeta no gatilho os atributos e o ref (Trigger asChild); basta espalhar as props. */
export type PropsGatilho = Record<never, never>;

/**
 * Menu suspenso (Radix DropdownMenu): setas, Home/End, busca por letra, Esc,
 * foco de volta ao gatilho e reposicionamento para não sair da tela.
 */
export function Menu({ gatilho, itens, cabecalho, alinhamento = "inicio", direcao = "baixo", largura = "w-56" }: {
    gatilho: (props: PropsGatilho) => ReactElement;
    itens: ItemMenu[];
    cabecalho?: ReactNode;
    alinhamento?: "inicio" | "fim";
    direcao?: "baixo" | "cima";
    largura?: string;
}) {
    const escolher = (item: ItemMenu) => {
        if (item.aoSelecionar) item.aoSelecionar();
        else if (item.href) router.visit(item.href);
        else if (item.hrefExterno) window.location.assign(item.hrefExterno);
    };

    return (
        <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger asChild>{gatilho({})}</DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align={alinhamento === "fim" ? "end" : "start"}
                    side={direcao === "cima" ? "top" : "bottom"}
                    sideOffset={6}
                    collisionPadding={8}
                    className={cx(
                        "z-50 max-w-[calc(100vw-1rem)] rounded-xl border border-linha bg-superficie p-1 text-tinta shadow-flutuante outline-none data-[state=open]:animate-surgir",
                        largura,
                    )}
                >
                    {cabecalho && (
                        <DropdownMenu.Label asChild>
                            <div className="mb-1 border-b border-linha px-2.5 pt-1.5 pb-2.5">{cabecalho}</div>
                        </DropdownMenu.Label>
                    )}
                    {itens.map(({ icone: I, ...item }) => (
                        <Fragment key={item.rotulo}>
                            {item.separadorAntes && <DropdownMenu.Separator className="my-1 h-px bg-linha" />}
                            <DropdownMenu.Item
                                onSelect={() => escolher(item)}
                                aria-current={item.selecionado ? "true" : undefined}
                                className={cx(
                                    "flex h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-ui outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-superficie-hover md:h-9",
                                    item.perigo ? "text-negativo" : "text-tinta",
                                    item.selecionado && "bg-superficie-suave font-medium",
                                )}
                            >
                                {I && <I size={16} stroke={TRACO} className={item.perigo ? "" : "text-tinta-suave"} aria-hidden />}
                                <span className="flex-1 truncate">{item.rotulo}</span>
                                {item.selecionado && <span className="size-1.5 rounded-full bg-primaria" aria-hidden />}
                            </DropdownMenu.Item>
                        </Fragment>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
