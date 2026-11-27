import { createInertiaApp, router } from "@inertiajs/react";
import type { ComponentType, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { FalhaNaTela, LimiteDeErro } from "@/components/app/limite-de-erro";
import { Layout } from "@/layouts/layout";
import { traduzir } from "@/lib/i18n";
import { registrarRespostasInertia } from "@/lib/respostas-inertia";
import { definirRotas } from "@/lib/rotas";

type Pagina = { default: ComponentType & { layout?: (pagina: ReactNode) => ReactNode } };

const paginas = import.meta.glob<Pagina>("./pages/**/*.tsx");

router.on("finish", (evento) => {
    if (evento.detail.visit.method !== "get") router.flushAll();
});

const telasBaixadas = new Set<string>();

function baixarTelasDoPerfil(perfil: string | undefined) {
    const economia = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (economia) return;

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
        if (dados?.props.rotas) definirRotas(dados.props.rotas);
        const carregar = paginas[`./pages/${nome}.tsx`];
        if (!carregar) throw new Error(`Página "${nome}" não encontrada.`);
        const pagina = await carregar();
        pagina.default.layout ??= (conteudo) => <Layout>{conteudo}</Layout>;
        return pagina.default;
    },
    setup({ el, App, props }) {
        const traducoes = props.initialPage.props.traducoes;
        registrarRespostasInertia(traducoes);
        // Rede de segurança se o próprio layout falhar; erros das telas ficam no limite do Layout.
        const t = (texto: string) => traduzir(traducoes ?? {}, texto);
        const falha = (
            <div className="flex min-h-dvh items-center justify-center bg-fundo p-4">
                <div className="w-full max-w-md">
                    <FalhaNaTela titulo={t("Algo deu errado nesta tela")} descricao={t("Recarregue a página para continuar.")} rotuloRecarregar={t("Recarregar")} />
                </div>
            </div>
        );
        createRoot(el).render(
            <LimiteDeErro fallback={falha}>
                <App {...props} />
            </LimiteDeErro>,
        );
        baixarTelasDoPerfil(props.initialPage.props.auth?.usuario.perfil);
    },
    defaults: {
        prefetch: { cacheFor: ["15s", "1m"], hoverDelay: 50 },
    },
    progress: { color: "var(--primaria)" },
});
