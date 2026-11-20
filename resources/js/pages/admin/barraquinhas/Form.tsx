import { router, useForm, usePage } from "@inertiajs/react";
import {
    IconArrowLeft,
    IconBuildingStore,
    IconCheck,
    IconCopy,
    IconInfoCircle,
    IconKey,
    IconLayoutDashboard,
    IconLock,
    IconLockOpen,
    IconShieldLock,
    IconUser,
    IconWand,
} from "@tabler/icons-react";
import { useState } from "react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { AreaTexto, CampoMoeda, Entrada } from "@/components/ui/campos";
import { CabecalhoPagina, Cartao, Detalhe } from "@/components/ui/cartao";
import { avisar } from "@/components/ui/avisos";
import { Confirmar } from "@/components/ui/dialogo";
import { TRACO } from "@/components/ui/icone";
import { ChipStatus } from "@/components/ui/marcadores";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import { rota } from "@/lib/rotas";
import type { Barraquinha } from "@/types/dominio";
import type { Credenciais } from "@/types/inertia";

interface Props {
    barraquinha: Barraquinha & {
        nomeCadastrado: string | null;
        feira: string;
        usuario: { usuario: string; trocarSenha: boolean; ultimoAcesso: string | null } | null;
    };
    sugestao: string;
}

export default function Form({ barraquinha: b, sugestao }: Props) {
    const t = useT();
    const { dataHora } = useFormato();
    const credenciais = usePage().flash.credenciais;
    const [confirmar, setConfirmar] = useState<"redefinir" | "bloquear" | null>(null);

    const dados = useForm({ nome: b.nomeCadastrado ?? "", responsaveis: b.responsaveis ?? "", meta_vendas: b.meta });
    const acesso = useForm({ usuario: b.usuario?.usuario ?? sugestao, senha: "" });

    const bloqueada = b.status.valor === "bloqueada";
    const parametros = { barraquinha: b.id };

    const enviar = (metodo: "post" | "patch", nome: string) =>
        new Promise<void>((ok) => router[metodo](rota(nome, parametros), {}, { preserveScroll: true, onFinish: () => ok() }));

    return (
        <>
            <CabecalhoPagina
                tituloAba={b.nome}
                sobretitulo={b.feira}
                titulo={
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="min-w-0 break-words">{b.nome}</span>
                        <ChipStatus opcao={b.status} />
                    </span>
                }
                voltar={
                    <BotaoLink href={rota("admin.barraquinhas.index")} variante="fantasma" tamanho="sm" icone={IconArrowLeft} className="self-start">
                        {t("Barraquinhas")}
                    </BotaoLink>
                }
                acoes={
                    !b.vaga && (
                        <BotaoLink href={rota("admin.loja.painel", parametros)} variante="secundario" icone={IconLayoutDashboard}>
                            {t("Abrir painel")}
                        </BotaoLink>
                    )
                }
            />

            {credenciais && <CredenciaisUmaVez credenciais={credenciais} />}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="flex min-w-0 flex-col gap-4 xl:col-span-2">
                    <Cartao titulo={t("Dados da barraquinha")} icone={IconBuildingStore}>
                        <form
                            className="grid grid-cols-1 gap-4 md:grid-cols-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                dados.put(rota("admin.barraquinhas.update", parametros), { preserveScroll: true });
                            }}
                        >
                            <Entrada
                                className="md:col-span-2"
                                rotulo={t("Nome")}
                                placeholder={t("Ex.: Senhor dos Pastéis")}
                                required
                                valor={dados.data.nome}
                                aoMudar={(v) => dados.setData("nome", v)}
                                erro={dados.errors.nome}
                            />
                            <AreaTexto
                                className="md:col-span-2"
                                rotulo={t("Responsáveis")}
                                dica={t("Nomes dos integrantes da equipe (informativo).")}
                                valor={dados.data.responsaveis}
                                aoMudar={(v) => dados.setData("responsaveis", v)}
                                erro={dados.errors.responsaveis}
                            />
                            <CampoMoeda
                                rotulo={t("Meta de vendas")}
                                dica={t("Opcional: acompanha o progresso no painel.")}
                                min={0}
                                valor={dados.data.meta_vendas}
                                aoMudar={(v) => dados.setData("meta_vendas", v)}
                                erro={dados.errors.meta_vendas}
                            />
                            <div className="flex items-end justify-end md:col-span-2">
                                <Botao type="submit" disabled={dados.processing} className="max-sm:h-11 max-sm:w-full">
                                    {t("Salvar dados")}
                                </Botao>
                            </div>
                        </form>
                    </Cartao>

                    <Cartao titulo={t("Acesso da equipe")} icone={IconKey} descricao={t("Um login por barraquinha.")}>
                        {b.vaga ? (
                            <p className="text-corpo text-tinta-suave">{t("Dê um nome à barraquinha antes de criar o acesso.")}</p>
                        ) : (
                            <div className="flex flex-col gap-5">
                                {b.usuario && (
                                    <dl className="divide-y divide-linha">
                                        <Detalhe rotulo={t("Usuário")}>
                                            <span dir="ltr" className="font-mono break-all">{b.usuario.usuario}</span>
                                        </Detalhe>
                                        <Detalhe rotulo={t("Último acesso")}>
                                            {b.usuario.ultimoAcesso ? dataHora(b.usuario.ultimoAcesso) : t("Nunca acessou")}
                                        </Detalhe>
                                        <Detalhe rotulo={t("Senha")}>
                                            {b.usuario.trocarSenha ? t("Provisória (troca no primeiro acesso)") : t("Definida pela equipe")}
                                        </Detalhe>
                                    </dl>
                                )}

                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                    {!b.usuario && (
                                        <Botao
                                            icone={IconWand}
                                            className="max-sm:h-11"
                                            onClick={() => router.post(rota("admin.barraquinhas.credenciais.gerar", parametros), {}, { preserveScroll: true })}
                                        >
                                            {t("Gerar credenciais")}
                                        </Botao>
                                    )}
                                    {b.usuario && (
                                        <Botao variante="secundario" icone={IconKey} className="max-sm:h-11" onClick={() => setConfirmar("redefinir")}>
                                            {t("Redefinir senha")}
                                        </Botao>
                                    )}
                                    {b.usuario &&
                                        (bloqueada ? (
                                            <Botao
                                                variante="secundario"
                                                icone={IconLockOpen}
                                                className="max-sm:h-11"
                                                onClick={() => router.patch(rota("admin.barraquinhas.reativar", parametros), {}, { preserveScroll: true })}
                                            >
                                                {t("Reativar acesso")}
                                            </Botao>
                                        ) : (
                                            <Botao variante="perigo" icone={IconLock} className="max-sm:h-11" onClick={() => setConfirmar("bloquear")}>
                                                {t("Bloquear acesso")}
                                            </Botao>
                                        ))}
                                </div>

                                <form
                                    className="grid grid-cols-1 items-start gap-4 border-t border-linha pt-5 sm:grid-cols-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        acesso.put(rota("admin.barraquinhas.credenciais.definir", parametros), {
                                            preserveScroll: true,
                                            onSuccess: () => acesso.reset("senha"),
                                        });
                                    }}
                                >
                                    <p className="text-ui font-semibold text-tinta sm:col-span-2">
                                        {b.usuario ? t("Alterar usuário e senha") : t("Definir usuário e senha")}
                                    </p>
                                    <Entrada
                                        rotulo={t("Usuário")}
                                        icone={IconUser}
                                        required
                                        dir="ltr"
                                        autoComplete="off"
                                        autoCapitalize="none"
                                        spellCheck={false}
                                        valor={acesso.data.usuario}
                                        aoMudar={(v) => acesso.setData("usuario", v)}
                                        erro={acesso.errors.usuario}
                                    />
                                    <Entrada
                                        rotulo={t("Senha inicial")}
                                        icone={IconShieldLock}
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        valor={acesso.data.senha}
                                        aoMudar={(v) => acesso.setData("senha", v)}
                                        erro={acesso.errors.senha}
                                    />
                                    <div className="flex justify-end sm:col-span-2">
                                        <Botao type="submit" variante="secundario" disabled={acesso.processing} className="max-sm:h-11 max-sm:w-full">
                                            {t("Salvar acesso")}
                                        </Botao>
                                    </div>
                                </form>
                            </div>
                        )}
                    </Cartao>
                </div>

                <Cartao titulo={t("Como funciona")} icone={IconInfoCircle} className="self-start">
                    <ul className="flex list-disc flex-col gap-2 ps-4 text-corpo text-tinta-media">
                        <li>{t("Um login por barraquinha. A senha é guardada com hash: ninguém consegue vê-la, só gerar outra.")}</li>
                        <li>{t("Senha gerada pelo sistema é provisória: a equipe escolhe a definitiva no primeiro acesso.")}</li>
                        <li>{t("Bloquear tira a equipe do sistema na hora; itens, vendas e lançamentos continuam guardados.")}</li>
                        <li>{t("A meta de vendas é opcional e aparece como barra de progresso no painel da barraquinha.")}</li>
                    </ul>
                </Cartao>
            </div>

            <Confirmar
                aberto={confirmar === "redefinir"}
                aoFechar={() => setConfirmar(null)}
                perigo={false}
                titulo={t("Redefinir a senha?")}
                descricao={t("A senha atual deixa de funcionar na hora e as sessões abertas são encerradas.")}
                rotuloConfirmar={t("Gerar nova senha")}
                aoConfirmar={() => enviar("post", "admin.barraquinhas.credenciais.redefinir")}
            />
            <Confirmar
                aberto={confirmar === "bloquear"}
                aoFechar={() => setConfirmar(null)}
                titulo={t("Bloquear o acesso de :nome?", { nome: b.nome })}
                descricao={t("A equipe sai do sistema na hora. Itens, vendas e lançamentos são mantidos.")}
                rotuloConfirmar={t("Bloquear")}
                aoConfirmar={() => enviar("patch", "admin.barraquinhas.bloquear")}
            />
        </>
    );
}

function CredenciaisUmaVez({ credenciais }: { credenciais: Credenciais }) {
    const t = useT();
    const [copiado, setCopiado] = useState(false);
    const texto = `${t("Usuário")}: ${credenciais.usuario}\n${t("Senha")}: ${credenciais.senha}`;

    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(texto);
            setCopiado(true);
        } catch {
            avisar(t("Não foi possível copiar. Selecione e copie manualmente."), "erro");
        }
    };

    return (
        <section role="status" className="mb-4 flex flex-col gap-4 rounded-cartao border border-secundaria bg-secundaria-suave p-4 sm:p-5 md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secundaria text-secundaria-tinta">
                    <IconKey size={20} stroke={TRACO} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-ui font-semibold text-tinta">{t("Credenciais da equipe")}</p>
                    <p className="mb-3 text-corpo text-tinta-media">{t("Copie e repasse agora: a senha não será exibida de novo.")}</p>
                    <dl dir="ltr" className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-controle bg-superficie px-3 py-2 font-mono text-ui text-tinta">
                        <dt className="text-tinta-suave">{t("Usuário")}</dt>
                        <dd className="break-all">{credenciais.usuario}</dd>
                        <dt className="text-tinta-suave">{t("Senha")}</dt>
                        <dd className="break-all select-all">{credenciais.senha}</dd>
                    </dl>
                </div>
            </div>
            <Botao variante="primario" icone={copiado ? IconCheck : IconCopy} onClick={copiar} className="max-md:h-11 max-md:w-full">
                {copiado ? t("Copiado") : t("Copiar")}
            </Botao>
        </section>
    );
}
