import { Tooltip } from "radix-ui";
import type { ComponentProps, ReactElement, ReactNode } from "react";

export function Dica({ rotulo, children, lado = "bottom", ...gatilho }: {
    rotulo: ReactNode;
    children: ReactElement;
    lado?: "top" | "bottom" | "left" | "right";
} & Omit<ComponentProps<typeof Tooltip.Trigger>, "children" | "asChild">) {
    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild {...gatilho}>{children}</Tooltip.Trigger>
            <Tooltip.Portal>
                <Tooltip.Content
                    side={lado}
                    sideOffset={6}
                    collisionPadding={8}
                    className="z-60 max-w-80 rounded-md bg-tinta px-2 py-1 text-rotulo font-medium break-words text-fundo shadow-flutuante data-[state=delayed-open]:animate-surgir"
                >
                    {rotulo}
                </Tooltip.Content>
            </Tooltip.Portal>
        </Tooltip.Root>
    );
}
