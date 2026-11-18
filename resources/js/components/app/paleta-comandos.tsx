import { router, usePage } from "@inertiajs/react";
import { IconBuildingStore, IconCornerDownLeft, IconSearch } from "@tabler/icons-react";
import { Dialog } from "radix-ui";
import { useEffect, useMemo, useState } from "react";
import { useNavegacao } from "@/components/app/navegacao";
import { CLASSE_VEU } from "@/components/ui/dialogo";
import { TRACO, type Icone } from "@/components/ui/icone";
import { Kbd } from "@/components/ui/marcadores";
import { cx } from "@/lib/cx";
import { useT } from "@/lib/i18n";
import { rota } from "@/lib/rotas";

interface Comando {
    rotulo: string;
    grupo: string;
    href: string;
    icone: Icone;
}

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Atalho do sistema: Ctrl+K (⌘K no Mac). */
export function useAtalhoPaleta(abrir: () => void) {
    useEffect(() => {
        const tecla = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                abrir();
            }
        };
        window.addEventListener("keydown", tecla);
        return () => window.removeEventListener("keydown", tecla);
    }, [abrir]);
}

/** Busca rápida (o "Search or type a command" da referência): telas e barraquinhas. */
export function PaletaComandos({ aberta, aoFechar, acoes }: { aberta: boolean; aoFechar: () => void; acoes: Comando[] }) {
    const t = useT();
    const { todos } = useNavegacao();
    const { seletorFeira } = usePage().props;
    const [busca, setBusca] = useState("");
    const [indice, setIndice] = useState(0);

    // Cada abertura começa do zero.
    useEffect(() => {
        if (aberta) {
            setBusca("");
            setIndice(0);
        }
    }, [aberta]);

    const comandos = useMemo<Comando[]>(() => [
        // Um destino por endereço ("Vendas" e "Histórico" levam ao mesmo lugar).
        ...todos.filter((n, i) => todos.findIndex((m) => m.href === n.href) === i).map((n) => ({ rotulo: n.rotulo, grupo: t("Ir para"), href: n.href, icone: n.icone })),
        ...acoes,
        ...(seletorFeira?.barraquinhas ?? []).map((b) => ({ rotulo: b.nome, grupo: t("Barraquinhas"), href: rota("admin.loja.painel", { barraquinha: b.id }), icone: IconBuildingStore })),
    ], [todos, acoes, seletorFeira, t]);

    const filtrados = comandos.filter((c) => normalizar(c.rotulo).includes(normalizar(busca)));
    const ir = (c: Comando | undefined) => {
        if (!c) return;
        aoFechar();
        router.visit(c.href);
    };

    return (
        <Dialog.Root open={aberta} onOpenChange={(a) => !a && aoFechar()}>
        <Dialog.Portal>
        <Dialog.Overlay className={CLASSE_VEU} />
        <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 top-[12vh] z-50 mx-auto w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border border-linha bg-superficie text-tinta shadow-flutuante outline-none data-[state=open]:animate-surgir"
        >
            <Dialog.Title className="sr-only">{t("Buscar ou digitar um comando")}</Dialog.Title>
            <div className="flex items-center gap-3 border-b border-linha px-4">
                <IconSearch size={18} stroke={TRACO} className="text-tinta-suave" aria-hidden />
                <input
                    value={busca}
                    onChange={(e) => {
                        setBusca(e.target.value);
                        setIndice(0);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setIndice((i) => Math.min(i + 1, filtrados.length - 1));
                        } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setIndice((i) => Math.max(i - 1, 0));
                        } else if (e.key === "Enter") {
                            e.preventDefault();
                            ir(filtrados[indice]);
                        }
                    }}
                    placeholder={t("Buscar telas, ações e barraquinhas…")}
                    aria-label={t("Buscar")}
                    className="h-12 min-w-0 flex-1 bg-transparent text-base text-tinta placeholder:text-tinta-fraca focus:outline-none md:text-ui"
                />
                <Kbd>Esc</Kbd>
            </div>
            <ul role="listbox" className="rolagem-fina max-h-[50vh] overflow-y-auto p-2">
                {filtrados.length === 0 && <li className="px-3 py-6 text-center text-corpo text-tinta-suave">{t("Nada encontrado.")}</li>}
                {filtrados.map((c, i) => (
                    <li key={c.grupo + c.href + c.rotulo} role="option" aria-selected={i === indice}>
                        {(i === 0 || filtrados[i - 1].grupo !== c.grupo) && <p className="px-3 pt-2 pb-1 text-micro font-medium text-tinta-fraca uppercase">{c.grupo}</p>}
                        <button
                            type="button"
                            onMouseEnter={() => setIndice(i)}
                            onClick={() => ir(c)}
                            className={cx("flex h-10 w-full items-center gap-3 rounded-lg px-3 text-start text-ui", i === indice ? "bg-superficie-hover text-tinta" : "text-tinta-media")}
                        >
                            <c.icone size={18} stroke={TRACO} className="text-tinta-suave" aria-hidden />
                            <span className="flex-1 truncate">{c.rotulo}</span>
                            {i === indice && <IconCornerDownLeft size={16} stroke={TRACO} className="text-tinta-fraca" aria-hidden />}
                        </button>
                    </li>
                ))}
            </ul>
        </Dialog.Content>
        </Dialog.Portal>
        </Dialog.Root>
    );
}
