/** POST JSON com o token CSRF do Laravel, para endpoints que não trocam de página (ex.: prévia do PDV). */
export async function postarJson<T>(url: string, dados: unknown, sinal?: AbortSignal): Promise<T> {
    const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "";

    const resposta = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-TOKEN": token,
            "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
        body: JSON.stringify(dados),
        signal: sinal,
    });

    if (!resposta.ok) {
        throw new Error(`HTTP ${resposta.status}`);
    }

    return resposta.json() as Promise<T>;
}
