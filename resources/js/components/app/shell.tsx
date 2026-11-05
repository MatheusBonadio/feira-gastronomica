import { Link, router, usePage } from "@inertiajs/react";
import {
    IconAlertTriangle,
    IconArrowDownRight,
    IconArrowUpRight,
    IconCalendarEvent,
    IconChartBar,
    IconFileAnalytics,
    IconKey,
    IconLanguage,
    IconLogout,
    IconMenu2,
    IconPlus,
    IconSearch,
    IconSettings,
    IconShieldCheck,
    IconShoppingCart,
    IconStack2,
    IconTag,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavegacao, type ItemNavegacao } from "@/components/app/navegacao";
import { PaletaComandos, useAtalhoPaleta } from "@/components/app/paleta-comandos";
import { BotaoTema } from "@/components/app/tema";
import { BotaoDividido, classesBotao } from "@/components/ui/botao";
import { Selecao } from "@/components/ui/campos";
import { Faixa } from "@/components/ui/cartao";
import { Dica } from "@/components/ui/dica";
import { Folha } from "@/components/ui/dialogo";
import { TRACO, type Icone } from "@/components/ui/icone";
import { Menu, type ItemMenu } from "@/components/ui/menu";
import { Avatar, Kbd, Ponto } from "@/components/ui/marcadores";
import { cx } from "@/lib/cx";
import { useT } from "@/lib/i18n";
import { rota, rotaAtiva, useRotaLoja } from "@/lib/rotas";

/** Cores dos atalhos da sidebar (como os quadradinhos de "Projects"). */
const CORES_ATALHO = ["bg-primaria", "bg-secundaria", "bg-rosa", "bg-verde", "bg-azul", "bg-ambar"];

/** Telas autenticadas: sidebar fixa, topbar e conteúdo em largura total. */
export function Shell({ children }: { children: ReactNode }) {
    const t = useT();
    const { props: { loja, auth }, url } = usePage();
    const [gaveta, setGaveta] = useState(false);
    const [paleta, setPaleta] = useState(false);
    const acoes = useAcaoPrincipal();
    const abrirPaleta = useCallback(() => setPaleta(true), []);

    useAtalhoPaleta(abrirPaleta);
    useEffect(() => router.on("navigate", () => setGaveta(false)), []);

    const encerrada = loja?.encerrada ?? auth?.barraquinha?.feiraEncerrada ?? false;
    // No celular a ação principal (Nova venda) vira botão flutuante, menos na própria tela dela.
    const flutuante = acoes?.principal.flutuante && new URL(acoes.principal.href, window.location.origin).pathname !== url.split("?")[0] ? acoes.principal : null;

    return (
        <div className="min-h-dvh bg-fundo">
            <aside className="fixed inset-y-0 inset-s-0 z-40 hidden w-sidebar border-e border-linha bg-superficie lg:block">
                <Sidebar />
            </aside>

            {/* Celular e tablet: a mesma sidebar numa folha lateral (Radix Dialog). */}
            <Folha aberta={gaveta} aoFechar={() => setGaveta(false)} titulo={t("Menu")} lado="inicio" ocultarCabecalho corpo="h-full min-h-0">
                <Sidebar />
            </Folha>

            <div className="flex min-h-dvh flex-col lg:ps-sidebar">
                <header className="sticky top-0 z-30 flex h-topbar items-center gap-3 border-b border-linha bg-superficie/85 px-4 backdrop-blur lg:px-8">
                    <Dica rotulo={t("Abrir menu")}>
                        <button type="button" onClick={() => setGaveta(true)} aria-label={t("Abrir menu")} className={cx(classesBotao("fantasma", "md", true), "lg:hidden")}>
                            <IconMenu2 size={20} stroke={TRACO} aria-hidden />
                        </button>
                    </Dica>
                    <button
                        type="button"
                        onClick={abrirPaleta}
                        className="flex h-9 w-full max-w-md min-w-0 items-center gap-2.5 rounded-controle bg-superficie-suave px-3 text-start text-ui text-tinta-fraca transition-colors hover:bg-superficie-hover"
                    >
                        <IconSearch size={16} stroke={TRACO} aria-hidden />
                        <span className="flex-1 truncate">{t("Buscar ou digitar um comando")}</span>
                        <span className="hidden sm:inline-flex"><Kbd>Ctrl K</Kbd></span>
                    </button>
                    <div className="ms-auto flex items-center gap-1.5">
                        {acoes && (
                            <div className="hidden sm:block">
                                <BotaoDividido href={acoes.principal.href} icone={IconPlus} itens={acoes.extras} rotuloMenu={t("Mais ações")}>
                                    {acoes.principal.rotulo}
                                </BotaoDividido>
                            </div>
                        )}
                        <MenuIdioma />
                        <BotaoTema />
                        <MenuConta />
                    </div>
                </header>

                <main className={cx("min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-7", flutuante && "pb-24 sm:pb-6")}>
                    {encerrada && (
                        <div className="mb-5">
                            <Faixa tom="aviso" icone={IconAlertTriangle}>{t("Feira encerrada: vendas e lançamentos estão bloqueados e os relatórios, congelados.")}</Faixa>
                        </div>
                    )}
                    {children}
                </main>
            </div>

            {flutuante && (
                <Link
                    href={flutuante.href}
                    className="fixed inset-e-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 flex h-14 items-center gap-2 rounded-full bg-primaria ps-5 pe-6 text-ui font-semibold text-primaria-tinta shadow-flutuante outline-none focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-offset-2 sm:hidden"
                >
                    {flutuante.icone && <flutuante.icone size={20} stroke={2} aria-hidden />}
                    {flutuante.rotulo}
                </Link>
            )}

            <PaletaComandos
                aberta={paleta}
                aoFechar={() => setPaleta(false)}
                acoes={acoes ? [acoes.principal, ...acoes.extras.filter((e) => e.href)].map((a) => ({ rotulo: a.rotulo, grupo: t("Ações"), href: a.href!, icone: a.icone ?? IconPlus })) : []}
            />
        </div>
    );
}

/** Botão primário da topbar ("New Project ▾"), conforme o perfil e a tela. */
function useAcaoPrincipal(): { principal: { rotulo: string; href: string; icone?: Icone; flutuante?: boolean }; extras: ItemMenu[] } | null {
    const { auth, loja } = usePage().props;
    const t = useT();
    const rotaLoja = useRotaLoja();

    if (loja?.encerrada) return null;
    if (loja) {
        const extras: ItemMenu[] = [
            { rotulo: t("Nova entrada"), icone: IconArrowDownRight, href: rotaLoja("lancamentos.create", { tipo: "entrada" }) },
            { rotulo: t("Nova saída"), icone: IconArrowUpRight, href: rotaLoja("lancamentos.create", { tipo: "saida" }) },
            { rotulo: t("Novo item"), icone: IconTag, href: rotaLoja("itens.create"), separadorAntes: true },
            { rotulo: t("Novo combo"), icone: IconStack2, href: rotaLoja("combos.create") },
        ];
        return loja.podeVender
            ? { principal: { rotulo: t("Nova venda"), href: rotaLoja("vendas.create"), icone: IconShoppingCart, flutuante: true }, extras }
            : { principal: { rotulo: t("Novo item"), href: rotaLoja("itens.create"), icone: IconTag }, extras: extras.filter((e) => e.href !== rotaLoja("itens.create")) };
    }
    if (auth?.usuario.perfil === "admin") {
        return {
            principal: { rotulo: t("Nova feira"), href: rota("admin.feiras.create"), icone: IconCalendarEvent },
            extras: [
                { rotulo: t("Relatórios"), icone: IconFileAnalytics, href: rota("admin.relatorios.index") },
                { rotulo: t("Comparar feiras"), icone: IconChartBar, href: rota("admin.comparar-feiras") },
                { rotulo: t("Auditoria"), icone: IconShieldCheck, href: rota("admin.auditoria.index") },
            ],
        };
    }
    return null;
}

function Sidebar() {
    const t = useT();
    const { auth, loja, seletorFeira } = usePage().props;
    const { principal, voltar } = useNavegacao();
    const rotaLoja = useRotaLoja();
    const admin = auth?.usuario.perfil === "admin";

    return (
        <div className="rolagem-fina flex h-full flex-col overflow-y-auto px-3 py-5">
            <Link href="/" className="mb-6 flex items-center gap-2.5 px-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primaria">
                    <span className="size-3 rounded-sm bg-secundaria" />
                </span>
                <span className="min-w-0">
                    <span className="block font-serif text-marca font-semibold tracking-tight text-balance text-tinta">{t("Feira Gastronômica")}</span>
                    <span className="block text-micro font-medium tracking-wide text-tinta-suave uppercase">UNAERP · PEG</span>
                </span>
            </Link>

            {admin && seletorFeira && seletorFeira.lista.length > 0 && (
                <Selecao
                    className="mb-4 px-1"
                    tamanho="sm"
                    aria-label={t("Feira")}
                    valor={String(seletorFeira.atual?.id ?? "")}
                    aoMudar={(feira) => router.post(rota("admin.feiras.selecionar", { feira }), {}, { preserveScroll: true })}
                    opcoes={seletorFeira.lista.map((f) => ({ valor: String(f.id), rotulo: `${f.nome} · ${f.status}` }))}
                />
            )}

            <nav aria-label={t("Navegação principal")} className="flex flex-col gap-0.5">
                {voltar && <ItemSidebar item={voltar} discreto />}
                {loja && <p className="mt-2 mb-1 truncate px-2.5 text-micro font-semibold tracking-wide text-tinta-fraca uppercase">{loja.nome}</p>}
                {principal.map((item) => <ItemSidebar key={item.href} item={item} />)}
            </nav>

            <div className="my-5 h-px bg-linha" />

            {admin ? (
                <SecaoAtalhos titulo={t("Barraquinhas")} hrefMais={rota("admin.barraquinhas.index")} rotuloMais={t("Gerenciar barraquinhas")}>
                    {(seletorFeira?.barraquinhas ?? []).map((b, i) => (
                        <Atalho
                            key={b.id}
                            href={rota("admin.loja.painel", { barraquinha: b.id })}
                            cor={CORES_ATALHO[i % CORES_ATALHO.length]}
                            ativo={loja?.id === b.id}
                            apagado={b.bloqueada}
                        >
                            {b.nome}
                        </Atalho>
                    ))}
                </SecaoAtalhos>
            ) : loja && !loja.encerrada ? (
                <SecaoAtalhos titulo={t("Atalhos")}>
                    <Atalho href={rotaLoja("vendas.create")} cor="bg-secundaria">{t("Nova venda")}</Atalho>
                    <Atalho href={rotaLoja("lancamentos.create", { tipo: "entrada" })} cor="bg-verde">{t("Nova entrada")}</Atalho>
                    <Atalho href={rotaLoja("lancamentos.create", { tipo: "saida" })} cor="bg-rosa">{t("Nova saída")}</Atalho>
                </SecaoAtalhos>
            ) : null}

            <div className="mt-auto flex flex-col gap-0.5 pt-6">
                <ItemSidebar item={{ rotulo: t("Minha senha"), href: rota("senha.edit"), icone: IconSettings, ativo: rotaAtiva("senha.*") }} />
                <button type="button" onClick={() => router.post(rota("logout"))} className="flex h-9 items-center gap-2.5 rounded-controle px-2.5 text-ui text-tinta-media transition-colors hover:bg-superficie-hover hover:text-tinta">
                    <IconLogout size={18} stroke={TRACO} aria-hidden />
                    {t("Sair")}
                </button>
            </div>
        </div>
    );
}

function ItemSidebar({ item: { rotulo, href, icone: I, ativo }, discreto }: { item: ItemNavegacao; discreto?: boolean }) {
    return (
        <Link
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={cx(
                "flex h-9 items-center gap-2.5 rounded-controle px-2.5 text-ui transition-colors",
                ativo ? "bg-primaria font-medium text-primaria-tinta shadow-botao" : discreto ? "text-tinta-suave hover:text-tinta" : "text-tinta-media hover:bg-superficie-hover hover:text-tinta",
            )}
        >
            <I size={18} stroke={TRACO} aria-hidden />
            <span className="truncate">{rotulo}</span>
        </Link>
    );
}

function SecaoAtalhos({ titulo, hrefMais, rotuloMais, children }: { titulo: string; hrefMais?: string; rotuloMais?: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <div className="mb-1 flex items-center justify-between px-2.5">
                <span className="text-corpo font-medium text-tinta">{titulo}</span>
                {hrefMais && (
                    <Link href={hrefMais} aria-label={rotuloMais} className="rounded-md p-0.5 text-tinta-media hover:bg-superficie-hover">
                        <IconPlus size={16} stroke={TRACO} aria-hidden />
                    </Link>
                )}
            </div>
            {children}
        </div>
    );
}

function Atalho({ href, cor, children, ativo, apagado }: { href: string; cor: string; children: ReactNode; ativo?: boolean; apagado?: boolean }) {
    return (
        <Link
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={cx("flex h-8 items-center gap-2.5 rounded-controle px-2.5 text-corpo transition-colors hover:bg-superficie-hover", ativo ? "bg-superficie-suave font-medium text-tinta" : "text-tinta-media", apagado && "opacity-50")}
        >
            <Ponto cor={cor} />
            <span className="truncate">{children}</span>
        </Link>
    );
}

function MenuIdioma() {
    const t = useT();
    const { app } = usePage().props;
    return (
        <Menu
            alinhamento="fim"
            largura="w-48"
            itens={Object.entries(app.idiomas).map(([codigo, nome]) => ({
                rotulo: nome,
                selecionado: app.idioma === codigo,
                // Recarga completa: o dicionário do idioma novo vem do servidor.
                hrefExterno: rota("idioma", { idioma: codigo }),
            }))}
            gatilho={(props) => (
                <Dica rotulo={t("Idioma")} {...props}>
                    <button type="button" aria-label={t("Idioma")} className={classesBotao("fantasma", "md", true)}>
                        <IconLanguage size={18} stroke={TRACO} aria-hidden />
                    </button>
                </Dica>
            )}
        />
    );
}

function MenuConta() {
    const t = useT();
    const { auth } = usePage().props;
    if (!auth) return null;

    return (
        <Menu
            alinhamento="fim"
            cabecalho={
                <div className="min-w-0">
                    <p className="truncate text-ui font-medium text-tinta">{auth.usuario.nome}</p>
                    <p className="truncate text-rotulo text-tinta-suave">{auth.usuario.perfilLabel} · {auth.usuario.usuario}</p>
                </div>
            }
            itens={[
                { rotulo: t("Alterar minha senha"), icone: IconKey, href: rota("senha.edit") },
                { rotulo: t("Sair"), icone: IconLogout, aoSelecionar: () => router.post(rota("logout")), separadorAntes: true },
            ]}
            gatilho={(props) => (
                <Dica rotulo={t("Menu da conta")} {...props}>
                    <button type="button" aria-label={t("Menu da conta")} className="ms-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-offset-2">
                        <Avatar nome={auth.usuario.nome} />
                    </button>
                </Dica>
            )}
        />
    );
}
