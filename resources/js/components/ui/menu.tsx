import { router } from "@inertiajs/react";
import { DropdownMenu } from "radix-ui";
import { Fragment, type ReactElement, type ReactNode } from "react";
import { TRACO, type Icone } from "@/components/ui/icone";
import { cx } from "@/lib/cx";

export interface ItemMenu {
    rotulo: string;
    icone?: Icone;
    href?: string;
    hrefExterno?: string;
    aoSelecionar?: () => void;
    selecionado?: boolean;
    perigo?: boolean;
    separadorAntes?: boolean;
}

export type PropsGatilho = Record<never, never>;

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

export interface GrupoEscolha {
    rotulo: string;
    valor: string;
    opcoes: { valor: string; rotulo: string; icone?: Icone }[];
    aoEscolher: (valor: string) => void;
}

export function MenuEscolhas({ gatilho, grupos, alinhamento = "fim", largura = "w-60" }: {
    gatilho: (props: PropsGatilho) => ReactElement;
    grupos: GrupoEscolha[];
    alinhamento?: "inicio" | "fim";
    largura?: string;
}) {
    return (
        <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger asChild>{gatilho({})}</DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align={alinhamento === "fim" ? "end" : "start"}
                    sideOffset={6}
                    collisionPadding={8}
                    className={cx("z-50 max-w-[calc(100vw-1rem)] rounded-xl border border-linha bg-superficie p-1 text-tinta shadow-flutuante outline-none data-[state=open]:animate-surgir", largura)}
                >
                    {grupos.map((g, i) => (
                        <Fragment key={g.rotulo}>
                            {i > 0 && <DropdownMenu.Separator className="my-1 h-px bg-linha" />}
                            <DropdownMenu.Label className="px-2.5 pt-1.5 pb-1 text-micro font-semibold tracking-wide text-tinta-fraca uppercase">{g.rotulo}</DropdownMenu.Label>
                            <DropdownMenu.RadioGroup value={g.valor} onValueChange={g.aoEscolher}>
                                {g.opcoes.map(({ icone: I, ...o }) => (
                                    <DropdownMenu.RadioItem
                                        key={o.valor}
                                        value={o.valor}
                                        className="flex h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-ui text-tinta outline-none select-none data-[highlighted]:bg-superficie-hover data-[state=checked]:font-semibold md:h-9"
                                    >
                                        {I && <I size={16} stroke={TRACO} className="text-tinta-suave" aria-hidden />}
                                        <span className="flex-1 truncate">{o.rotulo}</span>
                                        <DropdownMenu.ItemIndicator>
                                            <span className="block size-1.5 rounded-full bg-primaria" aria-hidden />
                                        </DropdownMenu.ItemIndicator>
                                    </DropdownMenu.RadioItem>
                                ))}
                            </DropdownMenu.RadioGroup>
                        </Fragment>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
