import { Head, useForm } from "@inertiajs/react";
import { IconEye, IconEyeOff, IconLock, IconLogin2, IconUser } from "@tabler/icons-react";
import { useId, useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CLASSE_ENTRADA, Entrada } from "@/components/ui/campos";
import { TRACO } from "@/components/ui/icone";
import { cx } from "@/lib/cx";
import { useT } from "@/lib/i18n";
import { rota } from "@/lib/rotas";

export default function Login() {
    const t = useT();
    const form = useForm({ usuario: "", password: "" });

    return (
        <>
            <Head title={t("Entrar")} />
            <form
                className="flex flex-col gap-5"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(rota("login"), { viewTransition: true, onFinish: () => form.reset("password") });
                }}
            >
                <div>
                    <h1 className="text-cabecalho font-medium tracking-tight text-tinta">{t("Entrar")}</h1>
                    <p className="mt-1 text-ui text-tinta-suave">{t("Use o usuário e a senha que a coordenação da feira entregou.")}</p>
                </div>

                <Entrada
                    rotulo={t("Usuário")}
                    name="usuario"
                    icone={IconUser}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    dir="ltr"
                    autoFocus
                    required
                    className="[&_input]:h-11"
                    valor={form.data.usuario}
                    aoMudar={(v) => form.setData("usuario", v)}
                    erro={form.errors.usuario}
                />
                <CampoSenha
                    rotulo={t("Senha")}
                    valor={form.data.password}
                    aoMudar={(v) => form.setData("password", v)}
                    erro={form.errors.password}
                />

                <Botao type="submit" tamanho="lg" icone={IconLogin2} disabled={form.processing} className="w-full">
                    {form.processing ? t("Entrando…") : t("Entrar")}
                </Botao>
            </form>
        </>
    );
}

function CampoSenha({ rotulo, valor, aoMudar, erro }: { rotulo: string; valor: string; aoMudar: (v: string) => void; erro?: string }) {
    const t = useT();
    const id = useId();
    const [visivel, setVisivel] = useState(false);

    return (
        <Campo rotulo={rotulo} erro={erro} obrigatorio id={id}>
            <div className="relative">
                <IconLock size={16} stroke={TRACO} className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 text-tinta-fraca" aria-hidden />
                <input
                    id={id}
                    name="password"
                    type={visivel ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={valor}
                    onChange={(e) => aoMudar(e.target.value)}
                    aria-invalid={erro ? true : undefined}
                    className={cx(CLASSE_ENTRADA, "h-11 ps-9 pe-11")}
                />
                <button
                    type="button"
                    onClick={() => setVisivel((v) => !v)}
                    aria-label={visivel ? t("Ocultar senha") : t("Mostrar senha")}
                    aria-pressed={visivel}
                    className="absolute inset-e-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-tinta-suave outline-none hover:bg-superficie-hover hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco"
                >
                    {visivel ? <IconEyeOff size={18} stroke={TRACO} aria-hidden /> : <IconEye size={18} stroke={TRACO} aria-hidden />}
                </button>
            </div>
        </Campo>
    );
}
