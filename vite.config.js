import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import laravel from "laravel-vite-plugin";
import { defineConfig } from "vite";

// No Windows o terminal pode estar em "c:\..." enquanto a resolução de pacotes
// devolve o caminho canônico "C:\...". O Vite trata os dois como módulos
// diferentes e empacota React e Inertia duas vezes ("Cannot read properties of
// null (reading 'use')"). Trabalhar sempre com o caminho canônico evita isso.
const raiz = realpathSync.native(process.cwd());

export default defineConfig({
    root: raiz,
    plugins: [
        laravel({
            input: ["resources/js/styles/app.css", "resources/js/app.tsx"],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            "@": resolve(raiz, "resources/js"),
        },
    },
});
