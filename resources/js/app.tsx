import { createInertiaApp } from "@inertiajs/react";
import type { ComponentType, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Layout } from "@/layouts/layout";

type Pagina = { default: ComponentType & { layout?: (pagina: ReactNode) => ReactNode } };

// Uma parte do bundle por página: o celular do PDV não baixa as telas do admin.
const paginas = import.meta.glob<Pagina>("./pages/**/*.tsx");

createInertiaApp({
    title: (titulo) => (titulo ? `${titulo} · Feira Gastronômica UNAERP` : "Feira Gastronômica UNAERP"),
    resolve: async (nome) => {
        const carregar = paginas[`./pages/${nome}.tsx`];
        if (!carregar) throw new Error(`Página "${nome}" não encontrada.`);
        const pagina = await carregar();
        // Layout persistente: a sidebar não remonta a cada navegação.
        pagina.default.layout ??= (conteudo) => <Layout>{conteudo}</Layout>;
        return pagina.default;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: { color: "var(--primaria)" },
});
