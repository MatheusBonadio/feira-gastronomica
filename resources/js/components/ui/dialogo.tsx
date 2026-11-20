import { IconAlertTriangle, IconX } from "@tabler/icons-react";
import { AlertDialog, Dialog } from "radix-ui";
import { useState, type ReactNode } from "react";
import { Botao } from "@/components/ui/botao";
import { TRACO } from "@/components/ui/icone";
import { cx } from "@/lib/cx";
import { useT } from "@/lib/i18n";

export const CLASSE_VEU = "fixed inset-0 z-50 bg-veu data-[state=open]:animate-esmaecer";

const CLASSE_CAIXA =
    "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-linha bg-superficie text-tinta shadow-flutuante outline-none data-[state=open]:animate-surgir";

function BotaoFechar() {
    const t = useT();
    return (
        <Dialog.Close
            aria-label={t("Fechar")}
            className="-me-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-tinta-suave outline-none hover:bg-superficie-hover hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco md:size-8"
        >
            <IconX size={18} stroke={TRACO} aria-hidden />
        </Dialog.Close>
    );
}

export function Dialogo({ aberto, aoFechar, titulo, descricao, children, rodape, largura = "max-w-md" }: {
    aberto: boolean;
    aoFechar: () => void;
    titulo: ReactNode;
    descricao?: ReactNode;
    children?: ReactNode;
    rodape?: ReactNode;
    largura?: string;
}) {
    return (
        <Dialog.Root open={aberto} onOpenChange={(a) => !a && aoFechar()}>
            <Dialog.Portal>
                <Dialog.Overlay className={CLASSE_VEU} />
                <Dialog.Content className={cx(CLASSE_CAIXA, largura)} {...(descricao ? {} : { "aria-describedby": undefined })}>
                    <div className="flex shrink-0 items-start justify-between gap-4 px-5 pt-5">
                        <div className="min-w-0">
                            <Dialog.Title className="text-titulo font-semibold text-tinta">{titulo}</Dialog.Title>
                            {descricao && <Dialog.Description className="mt-1 text-corpo text-tinta-suave">{descricao}</Dialog.Description>}
                        </div>
                        <BotaoFechar />
                    </div>
                    {children && <div className="rolagem-fina min-h-0 overflow-y-auto px-5 pt-4 pb-1">{children}</div>}
                    {rodape && <div className="mt-5 flex shrink-0 flex-wrap justify-end gap-2 rounded-b-2xl border-t border-linha bg-superficie-suave px-5 py-3">{rodape}</div>}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export function Confirmar({ aberto, aoFechar, titulo, descricao, children, rotuloConfirmar, perigo = true, desabilitado, aoConfirmar }: {
    aberto: boolean;
    aoFechar: () => void;
    titulo: ReactNode;
    descricao?: ReactNode;
    children?: ReactNode;
    rotuloConfirmar: string;
    perigo?: boolean;
    desabilitado?: boolean;
    aoConfirmar: () => void | Promise<unknown>;
}) {
    const t = useT();
    const [ocupado, setOcupado] = useState(false);

    const confirmar = async () => {
        setOcupado(true);
        try {
            await aoConfirmar();
            aoFechar();
        } catch {
        } finally {
            setOcupado(false);
        }
    };

    return (
        <AlertDialog.Root open={aberto} onOpenChange={(a) => !a && !ocupado && aoFechar()}>
            <AlertDialog.Portal>
                <AlertDialog.Overlay className={CLASSE_VEU} />
                <AlertDialog.Content className={cx(CLASSE_CAIXA, "max-w-md")} {...(descricao ? {} : { "aria-describedby": undefined })}>
                    <div className="px-5 pt-5">
                        <AlertDialog.Title className="flex items-center gap-2 text-titulo font-semibold text-tinta">
                            {perigo && <IconAlertTriangle size={20} stroke={TRACO} className="shrink-0 text-negativo" aria-hidden />}
                            {titulo}
                        </AlertDialog.Title>
                        {descricao && <AlertDialog.Description className="mt-1 text-corpo text-tinta-suave">{descricao}</AlertDialog.Description>}
                    </div>
                    {children && <div className="rolagem-fina min-h-0 overflow-y-auto px-5 pt-4 pb-1">{children}</div>}
                    <div className="mt-5 flex shrink-0 flex-wrap justify-end gap-2 rounded-b-2xl border-t border-linha bg-superficie-suave px-5 py-3">
                        <AlertDialog.Cancel asChild>
                            <Botao variante="secundario" disabled={ocupado}>{t("Cancelar")}</Botao>
                        </AlertDialog.Cancel>
                        <Botao variante={perigo ? "perigo" : "primario"} onClick={confirmar} disabled={desabilitado || ocupado}>
                            {ocupado ? t("Aguarde…") : rotuloConfirmar}
                        </Botao>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
}

export function Folha({ aberta, aoFechar, titulo, descricao, children, lado = "baixo", ocultarCabecalho, semFechar, corpo = "rolagem-fina min-h-0 flex-1 overflow-y-auto px-4 pb-4", acoes }: {
    aberta: boolean;
    aoFechar: () => void;
    titulo: ReactNode;
    descricao?: ReactNode;
    children: ReactNode;
    lado?: "baixo" | "inicio";
    ocultarCabecalho?: boolean;
    semFechar?: boolean;
    corpo?: string;
    acoes?: ReactNode;
}) {
    return (
        <Dialog.Root open={aberta} onOpenChange={(a) => !a && aoFechar()}>
            <Dialog.Portal>
                <Dialog.Overlay className={CLASSE_VEU} />
                <Dialog.Content
                    {...(descricao ? {} : { "aria-describedby": undefined })}
                    className={cx(
                        "fixed z-50 flex flex-col bg-superficie text-tinta shadow-flutuante outline-none",
                        lado === "baixo"
                            ? "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t border-linha pb-[env(safe-area-inset-bottom)] data-[state=open]:animate-subir"
                            : "inset-y-0 inset-s-0 w-sidebar max-w-[85vw] border-e border-linha data-[state=open]:animate-entrar-inicio rtl:data-[state=open]:animate-entrar-fim",
                    )}
                >
                    {lado === "baixo" && <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-linha-forte" aria-hidden />}
                    {ocultarCabecalho ? (
                        <>
                            <Dialog.Title className="sr-only">{titulo}</Dialog.Title>
                            {!semFechar && <div className="absolute inset-e-3 top-4 z-10"><BotaoFechar /></div>}
                        </>
                    ) : (
                        <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3 pb-3">
                            <div className="min-w-0">
                                <Dialog.Title className="text-titulo font-semibold text-tinta">{titulo}</Dialog.Title>
                                {descricao && <Dialog.Description className="text-rotulo text-tinta-suave">{descricao}</Dialog.Description>}
                            </div>
                            <div className="flex items-center gap-1">
                                {acoes}
                                <BotaoFechar />
                            </div>
                        </div>
                    )}
                    <div className={corpo}>{children}</div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
