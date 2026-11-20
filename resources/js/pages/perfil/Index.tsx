import { useForm, usePage } from "@inertiajs/react";
import { IconAdjustments, IconKey, IconPhoto, IconShieldLock, IconUser } from "@tabler/icons-react";
import { useOpcoesTema, useTema } from "@/components/app/tema";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { Entrada, Segmentos } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao, Detalhe } from "@/components/ui/cartao";
import { CampoFoto } from "@/components/ui/foto";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { rota } from "@/lib/rotas";

interface Props {
    perfil: { nome: string; usuario: string; perfilLabel: string; foto: string | null; ultimoAcesso: string | null };
}

export default function Perfil({ perfil }: Props) {
    const t = useT();
    const f = useFormato();
    const { auth, app } = usePage().props;
    const area = auth?.usuario.perfil === "admin" ? "admin" : "barraquinha";
    const form = useForm({ nome: perfil.nome });
    const tema = useTema();
    const opcoesTema = useOpcoesTema();

    return (
        <>
            <CabecalhoPagina titulo={t("Meu perfil")} descricao={t("Sua foto e seu nome aparecem no topo e nas vendas que você registra.")} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
                    <Cartao titulo={t("Foto")} icone={IconPhoto}>
                        <CampoFoto
                            nome={perfil.nome}
                            foto={perfil.foto}
                            rotulo={t("Escolher a foto do perfil")}
                            urlEnviar={rota(`${area}.perfil.foto`)}
                            urlRemover={rota(`${area}.perfil.foto.remover`)}
                        />
                    </Cartao>

                    <Cartao titulo={t("Dados")} icone={IconUser}>
                        <form
                            className="flex flex-col gap-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.put(rota(`${area}.perfil.update`), { preserveScroll: true });
                            }}
                        >
                            <Entrada rotulo={t("Nome")} name="nome" autoComplete="name" required valor={form.data.nome} aoMudar={(v) => form.setData("nome", v)} erro={form.errors.nome} />
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Detalhe rotulo={t("Usuário")}>{perfil.usuario}</Detalhe>
                                <Detalhe rotulo={t("Perfil")}>{perfil.perfilLabel}</Detalhe>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                                <Botao type="submit" disabled={form.processing || !form.isDirty} className="max-sm:h-11">{t("Salvar")}</Botao>
                            </div>
                        </form>
                    </Cartao>

                    <Cartao titulo={t("Preferências")} icone={IconAdjustments} descricao={t("Valem só neste aparelho (tema) e na sua conta (idioma).")}>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-corpo font-medium text-tinta">{t("Tema")}</span>
                                <Segmentos
                                    rotulo={t("Tema")}
                                    opcoes={opcoesTema.map((o) => ({ valor: o.valor, rotulo: o.rotulo }))}
                                    icones={Object.fromEntries(opcoesTema.map((o) => [o.valor, o.icone]))}
                                    valor={tema.preferencia}
                                    aoMudar={(v) => tema.definir(v as typeof tema.preferencia)}
                                    cheio
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-corpo font-medium text-tinta">{t("Idioma")}</span>
                                <Segmentos
                                    rotulo={t("Idioma")}
                                    opcoes={Object.entries(app.idiomas).map(([valor, rotulo]) => ({ valor, rotulo }))}
                                    valor={app.idioma}
                                    aoMudar={(idioma) => window.location.assign(rota("idioma", { idioma }))}
                                    cheio
                                />
                            </div>
                        </div>
                    </Cartao>
                </div>

                <Cartao titulo={t("Segurança")} icone={IconShieldLock} className="self-start">
                    <div className="flex flex-col gap-4">
                        <Detalhe rotulo={t("Último acesso")}>{perfil.ultimoAcesso ? f.dataHora(perfil.ultimoAcesso) : "-"}</Detalhe>
                        <BotaoLink href={rota("senha.edit")} variante="secundario" icone={IconKey} className="self-start">{t("Alterar minha senha")}</BotaoLink>
                    </div>
                </Cartao>
            </div>
        </>
    );
}
