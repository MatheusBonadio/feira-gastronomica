import { IconAlertTriangle, IconCircleCheck, IconInfoCircle, IconX } from "@tabler/icons-react";
import { Toast } from "radix-ui";
import { useSyncExternalStore } from "react";
import { TRACO } from "@/components/ui/icone";
import { cx } from "@/lib/cx";

type TipoAviso = "sucesso" | "erro" | "info";
interface Aviso {
    id: number;
    texto: string;
    tipo: TipoAviso;
}

let avisos: Aviso[] = [];
let proximoId = 1;
const ouvintes = new Set<() => void>();
const emitir = () => ouvintes.forEach((o) => o());

function remover(id: number) {
    avisos = avisos.filter((a) => a.id !== id);
    emitir();
}

export function avisar(texto: string, tipo: TipoAviso = "sucesso") {
    avisos = [...avisos.slice(-2), { id: proximoId++, texto, tipo }];
    emitir();
}

const ICONES = { sucesso: IconCircleCheck, erro: IconAlertTriangle, info: IconInfoCircle };
const CORES = { sucesso: "text-positivo", erro: "text-negativo", info: "text-primaria-texto" };

export function Avisos({ rotulo, rotuloFechar }: { rotulo: string; rotuloFechar: string }) {
    const lista = useSyncExternalStore(
        (ouvinte) => {
            ouvintes.add(ouvinte);
            return () => ouvintes.delete(ouvinte);
        },
        () => avisos,
    );

    return (
        <Toast.Provider label={rotulo} swipeDirection="right">
            {lista.map((a) => {
                const I = ICONES[a.tipo];
                return (
                    <Toast.Root
                        key={a.id}
                        type={a.tipo === "erro" ? "foreground" : "background"}
                        duration={a.tipo === "erro" ? 8000 : 5000}
                        onOpenChange={(aberto) => !aberto && remover(a.id)}
                        className={cx(
                            "flex items-start gap-3 rounded-xl border border-linha bg-superficie p-3 shadow-flutuante",
                            "data-[state=open]:animate-surgir data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x)",
                        )}
                    >
                        <I size={20} stroke={TRACO} className={cx("mt-px shrink-0", CORES[a.tipo])} aria-hidden />
                        <Toast.Description className="flex-1 text-corpo text-tinta">{a.texto}</Toast.Description>
                        <Toast.Close aria-label={rotuloFechar} className="-m-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-tinta-suave outline-none hover:bg-superficie-hover focus-visible:ring-2 focus-visible:ring-foco">
                            <IconX size={16} stroke={TRACO} aria-hidden />
                        </Toast.Close>
                    </Toast.Root>
                );
            })}
            <Toast.Viewport className="fixed inset-e-4 top-4 z-60 flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2 outline-none" />
        </Toast.Provider>
    );
}
