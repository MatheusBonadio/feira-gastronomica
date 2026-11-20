import { router } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";

export type EstadoTempoReal = "ao-vivo" | "atualizando" | "pausado" | "offline";

interface Opcoes {
    url: string;
    versao: string;
    props: string[];
    intervalo?: number;
}

export function useTempoReal({ url, versao, props, intervalo = 3000 }: Opcoes) {
    const [estado, setEstado] = useState<EstadoTempoReal>("ao-vivo");
    const [sincronizadoEm, setSincronizadoEm] = useState(() => Date.now());

    const versaoAtual = useRef(versao);
    versaoAtual.current = versao;
    const chaves = useRef(props);
    chaves.current = props;

    useEffect(() => {
        let ativo = true;
        let timer: number | undefined;
        let falhas = 0;
        let recarregando = false;
        let controlador: AbortController | null = null;

        const agendar = (ms: number) => {
            window.clearTimeout(timer);
            timer = window.setTimeout(verificar, ms);
        };

        async function verificar() {
            if (!ativo || recarregando) return;
            if (document.hidden) {
                setEstado("pausado");
                return;
            }

            controlador = new AbortController();
            try {
                const resposta = await fetch(url, {
                    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
                    credentials: "same-origin",
                    cache: "no-store",
                    signal: controlador.signal,
                });

                if (resposta.status === 401 || resposta.status === 403 || resposta.status === 419) {
                    setEstado("offline");
                    return;
                }
                if (!resposta.ok) throw new Error(String(resposta.status));

                const { versao: nova } = (await resposta.json()) as { versao: string };
                falhas = 0;

                if (nova === versaoAtual.current) {
                    setEstado("ao-vivo");
                    setSincronizadoEm(Date.now());
                    agendar(intervalo);
                    return;
                }

                recarregando = true;
                setEstado("atualizando");
                router.reload({
                    only: [...chaves.current, "versao"],
                    onSuccess: () => setSincronizadoEm(Date.now()),
                    onFinish: () => {
                        recarregando = false;
                        if (!ativo) return;
                        setEstado("ao-vivo");
                        agendar(intervalo);
                    },
                });
            } catch (erro) {
                if (!ativo || (erro instanceof DOMException && erro.name === "AbortError")) return;
                falhas += 1;
                setEstado("offline");
                agendar(Math.min(intervalo * 2 ** falhas, 30_000));
            }
        }

        const aoMudarVisibilidade = () => {
            if (document.hidden) {
                window.clearTimeout(timer);
                setEstado("pausado");
            } else {
                agendar(0);
            }
        };
        const aoVoltarRede = () => agendar(0);

        document.addEventListener("visibilitychange", aoMudarVisibilidade);
        window.addEventListener("online", aoVoltarRede);
        agendar(intervalo);

        return () => {
            ativo = false;
            window.clearTimeout(timer);
            controlador?.abort();
            document.removeEventListener("visibilitychange", aoMudarVisibilidade);
            window.removeEventListener("online", aoVoltarRede);
        };
    }, [url, intervalo]);

    return { estado, sincronizadoEm, tentarAgora: () => router.reload({ only: [...chaves.current, "versao"] }) };
}
