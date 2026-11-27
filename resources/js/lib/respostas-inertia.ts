import { router } from "@inertiajs/react";
import { avisar } from "@/components/ui/avisos";
import { traduzir, type Parametros } from "@/lib/i18n";

type Resposta = { status: number; headers: Record<string, string | undefined>; data: unknown };

let traducoes: Record<string, string> = {};
let visitaAtiva: { method: string; url: string } | null = null;

const t = (texto: string, parametros?: Parametros) => traduzir(traducoes, texto, parametros);
const ehPaginaInertia = (resposta: Resposta) => resposta.headers["x-inertia"] !== undefined;
const resumo = (resposta: Resposta) => ({
    ...visitaAtiva,
    status: resposta.status,
    corpo: typeof resposta.data === "string" ? resposta.data.replace(/\s+/g, " ").slice(0, 300) : resposta.data,
});

/**
 * Trata as respostas que o Inertia não consegue mostrar como página. Sem isso ele abre o diálogo de
 * erro (iframe por cima da tela) e, quando o erro veio de um prefetch, guarda o erro no cache e repete
 * o diálogo a cada clique até a página ser recarregada.
 */
export function registrarRespostasInertia(traducoesIniciais: Record<string, string> | undefined) {
    traducoes = traducoesIniciais ?? {};

    router.on("navigate", (evento) => {
        traducoes = evento.detail.page.props.traducoes ?? traducoes;
    });
    router.on("start", (evento) => {
        visitaAtiva = { method: evento.detail.visit.method.toUpperCase(), url: evento.detail.visit.url.href };
    });
    router.on("finish", () => {
        visitaAtiva = null;
    });

    // O Inertia guarda a resposta do prefetch mesmo quando é erro; o cache só recebe a resposta depois deste evento.
    router.on("prefetched", (evento) => {
        const resposta = evento.detail.response as Resposta;
        if (resposta.status < 400 && ehPaginaInertia(resposta)) return;
        console.warn("[inertia] prefetch com erro descartado", { url: evento.detail.visit.url.href, status: resposta.status });
        window.setTimeout(() => router.flushAll(), 0);
    });

    router.on("httpException", (evento) => {
        const resposta = evento.detail.response as Resposta;
        router.flushAll();
        if (ehPaginaInertia(resposta)) return;

        console.warn("[inertia] resposta não Inertia", resumo(resposta));
        // Em desenvolvimento a página de debug do Laravel continua aparecendo no diálogo.
        if (import.meta.env.DEV && resposta.status >= 500) return;

        evento.preventDefault();
        if (resposta.status === 419 || resposta.status < 400) {
            // Sessão vencida ou resposta de fora do app (ex.: página da hospedagem): só uma recarga completa resolve.
            avisar(t("A conexão com o servidor precisa ser renovada. Recarregando a página…"), "info");
            const destino = visitaAtiva?.method === "GET" ? visitaAtiva.url : null;
            window.setTimeout(() => (destino ? window.location.assign(destino) : window.location.reload()), 1500);
            return;
        }
        avisar(t("Não foi possível concluir (erro :status). Tente de novo.", { status: resposta.status }), "erro");
    });

    router.on("networkError", (evento) => {
        console.warn("[inertia] erro de rede", { ...visitaAtiva, erro: evento.detail.error.message });
        if (visitaAtiva) avisar(t("Sem conexão com o servidor. Confira a internet e tente de novo."), "erro");
    });
}
