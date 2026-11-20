import { router } from "@inertiajs/react";
import { IconPhotoUp, IconTrash } from "@tabler/icons-react";
import { useId, useRef, useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Avatar } from "@/components/ui/marcadores";
import { prepararFoto } from "@/lib/imagem";
import { useT } from "@/lib/i18n";

export function CampoFoto({ nome, foto, forma = "redonda", urlEnviar, urlRemover, rotulo }: {
    nome: string;
    foto: string | null;
    forma?: "redonda" | "quadrada";
    urlEnviar: string;
    urlRemover: string;
    rotulo: string;
}) {
    const t = useT();
    const entrada = useRef<HTMLInputElement>(null);
    const idDica = useId();
    const [previa, setPrevia] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const enviar = async (arquivo: File | undefined) => {
        if (!arquivo) return;
        setErro(null);
        let envio = arquivo;
        try {
            envio = await prepararFoto(arquivo);
        } catch {
        }
        const url = URL.createObjectURL(envio);
        setPrevia(url);
        router.post(urlEnviar, { foto: envio }, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setEnviando(true),
            onError: (erros) => setErro(erros.foto ?? Object.values(erros)[0] ?? t("Não foi possível enviar a foto.")),
            onFinish: () => {
                setEnviando(false);
                setPrevia(null);
                URL.revokeObjectURL(url);
                if (entrada.current) entrada.current.value = "";
            },
        });
    };

    const remover = () =>
        router.delete(urlRemover, {
            preserveScroll: true,
            onStart: () => setEnviando(true),
            onFinish: () => setEnviando(false),
        });

    return (
        <div className="flex flex-wrap items-center gap-4">
            <Avatar nome={nome} foto={previa ?? foto} forma={forma} tamanho="2xl" className={enviando ? "opacity-60" : undefined} />
            <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                    <Botao variante="secundario" icone={IconPhotoUp} disabled={enviando} aria-describedby={idDica} onClick={() => entrada.current?.click()}>
                        {foto ? t("Trocar foto") : t("Enviar foto")}
                    </Botao>
                    {foto && (
                        <Botao variante="fantasma" icone={IconTrash} disabled={enviando} onClick={remover}>
                            {t("Remover")}
                        </Botao>
                    )}
                </div>
                <p id={idDica} className="text-rotulo text-tinta-suave">
                    {enviando ? t("Enviando…") : t("JPG, PNG ou WebP. A foto é recortada em quadrado.")}
                </p>
                {erro && <p role="alert" className="text-rotulo font-medium text-negativo">{erro}</p>}
            </div>
            <input
                ref={entrada}
                type="file"
                accept="image/*"
                tabIndex={-1}
                aria-label={rotulo}
                className="sr-only"
                onChange={(e) => void enviar(e.target.files?.[0])}
            />
        </div>
    );
}
