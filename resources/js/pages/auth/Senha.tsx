import { useForm, usePage } from "@inertiajs/react";
import { IconInfoCircle, IconKey, IconShieldLock } from "@tabler/icons-react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { Entrada } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao, Faixa } from "@/components/ui/cartao";
import { useT } from "@/lib/i18n";
import { rota } from "@/lib/rotas";

export default function Senha({ obrigatoria }: { obrigatoria: boolean }) {
    const t = useT();
    const { auth } = usePage().props;
    const form = useForm({ senha_atual: "", senha: "", senha_confirmation: "" });
    const inicio = rota(auth?.usuario.perfil === "admin" ? "admin.painel" : "barraquinha.painel");

    const campo = (nome: keyof typeof form.data, rotulo: string, autoComplete: string) => (
        <Entrada
            rotulo={rotulo}
            type="password"
            name={nome}
            autoComplete={autoComplete}
            required
            className="[&_input]:max-sm:h-11"
            valor={form.data[nome]}
            aoMudar={(v) => form.setData(nome, v)}
            erro={form.errors[nome]}
        />
    );

    return (
        <>
            <CabecalhoPagina
                titulo={t("Alterar senha")}
                descricao={obrigatoria ? t("Primeiro acesso: escolha uma senha definitiva antes de continuar.") : t("A nova senha passa a valer imediatamente.")}
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="flex min-w-0 flex-col gap-4 xl:col-span-2">
                    {obrigatoria && (
                        <Faixa tom="aviso" icone={IconShieldLock} titulo={t("Senha provisória")}>
                            {t("As outras telas ficam bloqueadas até você definir a sua senha.")}
                        </Faixa>
                    )}
                    <Cartao titulo={t("Nova senha")} icone={IconKey}>
                        <form
                            className="flex flex-col gap-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.put(rota("senha.update"), { onFinish: () => form.reset() });
                            }}
                        >
                            {campo("senha_atual", t("Senha atual"), "current-password")}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {campo("senha", t("Nova senha"), "new-password")}
                                {campo("senha_confirmation", t("Confirme a nova senha"), "new-password")}
                            </div>
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                {!obrigatoria && (
                                    <BotaoLink href={inicio} variante="secundario" className="max-sm:h-11">
                                        {t("Cancelar")}
                                    </BotaoLink>
                                )}
                                <Botao type="submit" disabled={form.processing} className="max-sm:h-11">
                                    {t("Salvar senha")}
                                </Botao>
                            </div>
                        </form>
                    </Cartao>
                </div>

                <Cartao titulo={t("Dicas")} icone={IconInfoCircle} className="self-start">
                    <ul className="flex list-disc flex-col gap-2 ps-4 text-corpo text-tinta-media">
                        <li>{t("Mínimo de 8 caracteres, com letras e números.")}</li>
                        <li>{t("Não reaproveite a senha provisória nem senhas de outros sites.")}</li>
                        <li>{t("Esqueceu a senha? A coordenação da feira gera uma nova.")}</li>
                    </ul>
                </Cartao>
            </div>
        </>
    );
}
