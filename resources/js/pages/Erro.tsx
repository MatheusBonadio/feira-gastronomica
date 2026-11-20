import { Head, usePage } from "@inertiajs/react";
import { IconAlertCircle, IconArrowLeft, IconClockPause, IconHome, IconLock, IconMapSearch, IconRefresh, IconTool } from "@tabler/icons-react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { TRACO, type Icone } from "@/components/ui/icone";
import { useT } from "@/lib/i18n";
import { rota } from "@/lib/rotas";

export default function Erro({ status, mensagem }: { status: number; mensagem?: string | null }) {
    const t = useT();
    const { auth } = usePage().props;

    const conteudo: Record<number, { titulo: string; descricao: string; icone: Icone }> = {
        403: { titulo: t("Acesso negado"), descricao: t("Você não tem permissão para ver isto. A tentativa foi registrada."), icone: IconLock },
        404: { titulo: t("Página não encontrada"), descricao: t("O endereço não existe ou o registro foi removido."), icone: IconMapSearch },
        419: { titulo: t("Sessão expirada"), descricao: t("A página ficou aberta por muito tempo. Recarregue e tente de novo."), icone: IconRefresh },
        422: { titulo: t("Não foi possível continuar"), descricao: mensagem || t("Verifique os dados e tente de novo."), icone: IconAlertCircle },
        429: { titulo: t("Muitas tentativas"), descricao: t("Espere alguns instantes e tente de novo."), icone: IconClockPause },
        500: { titulo: t("Erro no servidor"), descricao: t("Algo deu errado do nosso lado. Tente de novo em instantes."), icone: IconAlertCircle },
        503: { titulo: t("Sistema em manutenção"), descricao: t("Voltamos em instantes."), icone: IconTool },
    };
    const { titulo, descricao, icone: I } = conteudo[status] ?? conteudo[500];
    const inicio = auth ? rota(auth.usuario.perfil === "admin" ? "admin.painel" : "barraquinha.painel") : rota("login");

    return (
        <>
            <Head title={titulo} />
            <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-cartao border border-linha bg-superficie px-5 py-10 text-center sm:px-8 sm:py-12">
                <span className="relative mb-1 flex size-14 items-center justify-center rounded-2xl bg-primaria text-primaria-tinta">
                    <I size={26} stroke={TRACO} aria-hidden />
                    <span className="absolute -inset-e-1.5 -top-1.5 size-4 rounded-full border-2 border-superficie bg-secundaria" aria-hidden />
                </span>
                <p className="font-mono text-rotulo font-semibold tracking-widest text-tinta-suave">{status}</p>
                <h1 className="text-cabecalho font-medium tracking-tight text-balance text-tinta">{titulo}</h1>
                <p className="text-ui text-pretty break-words text-tinta-suave">{descricao}</p>
                <div className="mt-4 flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:justify-center">
                    {status === 419 ? (
                        <Botao variante="secundario" icone={IconRefresh} onClick={() => window.location.reload()} className="max-sm:h-11">
                            {t("Recarregar")}
                        </Botao>
                    ) : (
                        <Botao variante="secundario" icone={IconArrowLeft} onClick={() => window.history.back()} className="max-sm:h-11">
                            {t("Voltar")}
                        </Botao>
                    )}
                    <BotaoLink href={inicio} icone={IconHome} className="max-sm:h-11">
                        {auth ? t("Voltar ao início") : t("Ir para o login")}
                    </BotaoLink>
                </div>
            </div>
        </>
    );
}
