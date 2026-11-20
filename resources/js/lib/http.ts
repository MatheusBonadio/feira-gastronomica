function tokenCsrf(): string {
    const cookie = document.cookie.split("; ").find((c) => c.startsWith("XSRF-TOKEN="));
    return cookie ? decodeURIComponent(cookie.slice("XSRF-TOKEN=".length)) : "";
}

export async function postarJson<T>(url: string, dados: unknown, sinal?: AbortSignal): Promise<T> {
    const resposta = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": tokenCsrf(),
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
