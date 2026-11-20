import { createInertiaApp, router } from "@inertiajs/react";
import type { ComponentType, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Layout } from "@/layouts/layout";
import { definirRotas } from "@/lib/rotas";

type Pagina = { default: ComponentType & { layout?: (pagina: ReactNode) => ReactNode } };

// Uma parte do bundle por página: o celular do PDV não baixa as telas do admin.
const paginas = import.meta.glob<Pagina>("./pages/**/*.tsx");

/*
 * Navegação rápida:
 *  - os links do kit fazem prefetch ao passar o mouse, e a resposta fica 15 s
 *    "fresca" (abre na hora) e até 1 min "velha" (abre na hora e se atualiza
 *    sozinha em segundo plano);
 *  - qualquer gravação (POST/PUT/DELETE) descarta esse cache, para nenhuma
 *    tela abrir com dado de antes da gravação;
 *  - no tempo ocioso, o navegador baixa o JS das telas que o perfil pode abrir,
 *    e a primeira visita a cada uma não espera download.
 */
router.on("finish", (evento) => {
    if (evento.detail.visit.method !== "get") router.flushAll();
});

const telasBaixadas = new Set<string>();

function baixarTelasDoPerfil(perfil: string | undefined) {
    const economia = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (economia) return;

    // Visitante (login): só os painéis, para a transição do login não esperar o JS.
    const prefixos = perfil === "admin" ? ["./pages/admin/", "./pages/loja/"] : perfil === "barraquinha" ? ["./pages/loja/"] : ["./pages/admin/Painel.tsx", "./pages/loja/Painel.tsx"];
    const pendentes = Object.keys(paginas).filter((c) => !telasBaixadas.has(c) && prefixos.some((p) => c.startsWith(p)));
    if (pendentes.length === 0) return;

    const quandoOcioso = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 1200));
    quandoOcioso(() => {
        for (const caminho of pendentes) {
            telasBaixadas.add(caminho);
            paginas[caminho]().catch(() => telasBaixadas.delete(caminho));
        }
    });
}

router.on("navigate", (evento) => baixarTelasDoPerfil(evento.detail.page.props.auth?.usuario.perfil));

createInertiaApp({
    title: (titulo) => (titulo ? `${titulo} · Feira Gastronômica UNAERP` : "Feira Gastronômica UNAERP"),
    resolve: async (nome, dados) => {
        // Login sem recarga: as rotas do perfil novo valem antes da tela renderizar.
        if (dados?.props.rotas) definirRotas(dados.props.rotas);
        const carregar = paginas[`./pages/${nome}.tsx`];
        if (!carregar) throw new Error(`Página "${nome}" não encontrada.`);
        const pagina = await carregar();
        // Layout persistente: a sidebar não remonta a cada navegação.
        pagina.default.layout ??= (conteudo) => <Layout>{conteudo}</Layout>;
        return pagina.default;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
        baixarTelasDoPerfil(props.initialPage.props.auth?.usuario.perfil);
    },
    defaults: {
        prefetch: { cacheFor: ["15s", "1m"], hoverDelay: 50 },
    },
    progress: { color: "var(--primaria)" },
});
