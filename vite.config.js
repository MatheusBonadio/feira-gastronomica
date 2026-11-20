import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import laravel from "laravel-vite-plugin";
import { defineConfig } from "vite";

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
