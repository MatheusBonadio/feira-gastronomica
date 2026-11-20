import { Link, router, usePage } from "@inertiajs/react";
import {
    IconAlertTriangle,
    IconArrowDownRight,
    IconArrowUpRight,
    IconBell,
    IconBolt,
    IconCalendarEvent,
    IconChartBar,
    IconChevronDown,
    IconFileAnalytics,
    IconKey,
    IconLanguage,
    IconLayoutSidebarLeftCollapse,
    IconLayoutSidebarLeftExpand,
    IconLogout,
    IconMenu2,
    IconPlus,
    IconSearch,
    IconSettings,
    IconShieldCheck,
    IconShoppingCart,
    IconStack2,
    IconTag,
    IconUserCircle,
    IconX,
} from "@tabler/icons-react";
import { Collapsible, Popover, Separator } from "radix-ui";
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Marca } from "@/components/app/marca";
import { useNavegacao, type ItemNavegacao } from "@/components/app/navegacao";
import { PaletaComandos, useAtalhoPaleta } from "@/components/app/paleta-comandos";
import { definirTema, useOpcoesTema, useTema } from "@/components/app/tema";
import { ListaPendencias, type Pendencia } from "@/components/painel/widgets";
import { BotaoDividido, BotaoLink, classesBotao } from "@/components/ui/botao";
import { Selecao } from "@/components/ui/campos";
import { Faixa } from "@/components/ui/cartao";
import { Dica } from "@/components/ui/dica";
import { Folha } from "@/components/ui/dialogo";
import { TRACO, type Icone } from "@/components/ui/icone";
import { Menu, MenuEscolhas, type ItemMenu } from "@/components/ui/menu";
import { Avatar, Contador, Kbd } from "@/components/ui/marcadores";
import { cx } from "@/lib/cx";
import { useT } from "@/lib/i18n";
import { rota, useRotaLoja } from "@/lib/rotas";

const CHAVE_RECOLHIDO = "menu-recolhido";
const ouvintesMenu = new Set<() => void>();
function lerRecolhido() {
    try {
        return localStorage.getItem(CHAVE_RECOLHIDO) === "1";
    } catch {
        return false;
    }
}
function useMenuRecolhido(): [boolean, (valor: boolean) => void] {
    const recolhido = useSyncExternalStore(
        (o) => {
            ouvintesMenu.add(o);
            return () => ouvintesMenu.delete(o);
        },
        lerRecolhido,
        () => false,
    );
    const definir = useCallback((valor: boolean) => {
        try {
            localStorage.setItem(CHAVE_RECOLHIDO, valor ? "1" : "0");
        } catch {
        }
        ouvintesMenu.forEach((o) => o());
    }, []);
    return [recolhido, definir];
}

export function Shell({ children }: { children: ReactNode }) {
    const t = useT();
    const { props: { loja, auth }, url } = usePage();
    const [gaveta, setGaveta] = useState(false);
    const [paleta, setPaleta] = useState(false);
    const [recolhida, setRecolhida] = useMenuRecolhido();
    const acoes = useAcaoPrincipal();
    const abrirPaleta = useCallback(() => setPaleta(true), []);

    useAtalhoPaleta(abrirPaleta);
    useEffect(() => router.on("navigate", () => setGaveta(false)), []);

    const encerrada = loja?.encerrada ?? auth?.barraquinha?.feiraEncerrada ?? false;
    const flutuante = acoes?.principal.flutuante && new URL(acoes.principal.href, window.location.origin).pathname !== url.split("?")[0] ? acoes.principal : null;

    return (
        <div className="min-h-dvh bg-fundo [view-transition-name:app]">
            <aside className={cx("fixed inset-y-0 inset-s-0 z-40 hidden border-e border-cartao-borda bg-superficie transition-[width] duration-200 lg:block", recolhida ? "w-sidebar-recolhida" : "w-sidebar")}>
                <Sidebar recolhida={recolhida} aoRecolher={() => setRecolhida(!recolhida)} fixa />
            </aside>

            <Folha aberta={gaveta} aoFechar={() => setGaveta(false)} titulo={t("Menu")} lado="inicio" ocultarCabecalho corpo="h-full min-h-0">
                <Sidebar recolhida={false} />
            </Folha>

            <div className={cx("flex min-h-dvh flex-col transition-[padding] duration-200", recolhida ? "lg:ps-sidebar-recolhida" : "lg:ps-sidebar")}>
                <header className="sticky top-0 z-30 flex h-topbar items-center gap-2 bg-fundo/90 px-4 backdrop-blur-md lg:px-6">
                    <Dica rotulo={t("Abrir menu")}>
                        <button type="button" onClick={() => setGaveta(true)} aria-label={t("Abrir menu")} className={cx(classesBotao("superficie", "md", true), "lg:hidden")}>
                            <IconMenu2 size={20} stroke={TRACO} aria-hidden />
                        </button>
                    </Dica>
                    <button
                        type="button"
                        onClick={abrirPaleta}
                        className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-controle border border-cartao-borda bg-superficie px-3 text-start text-ui text-tinta-fraca outline-none transition-colors hover:text-tinta-suave focus-visible:ring-2 focus-visible:ring-foco sm:max-w-80 md:h-9"
                    >
                        <IconSearch size={16} stroke={TRACO} className="shrink-0" aria-hidden />
                        <span className="flex-1 truncate">{t("Busca rápida")}</span>
                        <span className="hidden sm:inline-flex"><Kbd>Ctrl K</Kbd></span>
                    </button>
                    <div className="ms-auto flex items-center gap-2">
                        <Notificacoes />
                        <Configuracoes />
                        <Conta />
                        {acoes && (
                            <div className="hidden md:block">
                                <BotaoDividido href={acoes.principal.href} icone={acoes.principal.icone ?? IconPlus} itens={acoes.extras} rotuloMenu={t("Mais ações")}>
                                    {acoes.principal.rotulo}
                                </BotaoDividido>
                            </div>
                        )}
                    </div>
                </header>

                <main className={cx("min-w-0 flex-1 px-4 pt-2 pb-6 lg:px-6", flutuante && "pb-24 sm:pb-6")}>
                    {encerrada && (
                        <div className="mb-4">
                            <Faixa tom="aviso" icone={IconAlertTriangle}>{t("Feira encerrada: vendas e lançamentos estão bloqueados e os relatórios, congelados.")}</Faixa>
                        </div>
                    )}
                    {children}
                </main>
            </div>

            {flutuante && (
                <Link prefetch
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

function Sidebar({ recolhida, aoRecolher, fixa }: { recolhida: boolean; aoRecolher?: () => void; fixa?: boolean }) {
    const t = useT();
    const { auth, seletorFeira } = usePage().props;
    const { principal, secundario } = useNavegacao();
    const admin = auth?.usuario.perfil === "admin";

    return (
        <div className="flex h-full flex-col">
            <Link href="/" className={cx("flex shrink-0 items-center pt-5 pb-4 outline-none focus-visible:ring-2 focus-visible:ring-foco", recolhida ? "justify-center px-3" : "px-5")} aria-label={t("Feira Gastronômica")}>
                <Marca compacta={recolhida} transicao={fixa} />
            </Link>

            {admin && !recolhida && seletorFeira && seletorFeira.lista.length > 0 && (
                <Selecao
                    className="mb-3 px-4"
                    tamanho="sm"
                    aria-label={t("Feira")}
                    valor={String(seletorFeira.atual?.id ?? "")}
                    aoMudar={(feira) => router.post(rota("admin.feiras.selecionar", { feira }), {}, { preserveScroll: true })}
                    opcoes={seletorFeira.lista.map((f) => ({ valor: String(f.id), rotulo: `${f.nome} · ${f.status}` }))}
                />
            )}

            <nav aria-label={t("Navegação principal")} className={cx("rolagem-fina min-h-0 flex-1 overflow-y-auto py-1", recolhida ? "px-3" : "px-4")}>
                <ul className="flex flex-col gap-0.5">
                    {principal.map((item) => <ItemSidebar key={item.href} item={item} recolhida={recolhida} />)}
                </ul>
                {secundario.length > 0 && (
                    <>
                        <Separator.Root className="mx-2 my-4 h-px bg-linha" />
                        <ul className="flex flex-col gap-0.5">
                            {secundario.map((item) => <ItemSidebar key={item.href} item={item} recolhida={recolhida} />)}
                        </ul>
                    </>
                )}
            </nav>

            {!recolhida && <CartaoPromo />}

            <div className={cx("flex shrink-0 flex-col gap-0.5 pt-2 pb-4", recolhida ? "px-3" : "px-4")}>
                <BotaoLateral icone={IconLogout} rotulo={t("Sair")} recolhida={recolhida} aoClicar={() => router.post(rota("logout"))} />
                {aoRecolher && (
                    <BotaoLateral
                        icone={recolhida ? IconLayoutSidebarLeftExpand : IconLayoutSidebarLeftCollapse}
                        rotulo={recolhida ? t("Expandir menu") : t("Recolher menu")}
                        recolhida={recolhida}
                        aoClicar={aoRecolher}
                    />
                )}
            </div>
        </div>
    );
}

const CLASSE_ITEM = "relative flex h-10 items-center gap-3 rounded-xl text-ui outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foco";

function ItemSidebar({ item, recolhida }: { item: ItemNavegacao; recolhida: boolean }) {
    const { rotulo, href, icone: I, ativo, filhos, tituloFilhos, contador } = item;
    const [aberto, setAberto] = useState(ativo);
    useEffect(() => setAberto((a) => a || ativo), [ativo]);

    const link = (
        <Link prefetch
            href={href}
            aria-current={ativo && !filhos?.some((f) => f.ativo) ? "page" : undefined}
            className={cx(
                CLASSE_ITEM,
                recolhida ? "w-10 justify-center self-center" : "px-3",
                ativo ? "bg-superficie-suave font-semibold text-tinta" : "text-tinta-media hover:bg-superficie-hover hover:text-tinta",
            )}
        >
            {ativo && <span className="absolute inset-y-2 -inset-s-4 w-1 rounded-e-full bg-primaria" aria-hidden />}
            <I size={19} stroke={TRACO} className={ativo ? "text-tinta" : "text-tinta-suave"} aria-hidden />
            {!recolhida && <span className="flex-1 truncate">{rotulo}</span>}
            {!recolhida && contador !== undefined && contador > 0 && <Contador>{contador}</Contador>}
        </Link>
    );

    if (recolhida) {
        return (
            <li className="flex justify-center">
                <Dica rotulo={rotulo} lado="right">{link}</Dica>
            </li>
        );
    }
    if (!filhos?.length) return <li>{link}</li>;

    return (
        <li>
            <Collapsible.Root open={aberto} onOpenChange={setAberto}>
                <div className="relative">
                    {link}
                    <Collapsible.Trigger
                        aria-label={rotulo}
                        className="absolute inset-y-1 inset-e-1 flex w-8 items-center justify-center rounded-lg text-tinta-suave outline-none hover:bg-superficie-ativa hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco"
                    >
                        <IconChevronDown size={16} stroke={TRACO} className={cx("transition-transform", aberto && "rotate-180")} aria-hidden />
                    </Collapsible.Trigger>
                </div>
                <Collapsible.Content>
                    <div className="relative ms-5 mt-1 mb-1 border-s border-linha ps-3">
                        {tituloFilhos && <p className="truncate px-2 pt-1 pb-1 text-micro font-semibold tracking-wide text-tinta-fraca uppercase">{tituloFilhos}</p>}
                        <ul className="flex flex-col gap-0.5">
                            {filhos.map((f) => (
                                <li key={f.href + f.rotulo}>
                                    <Link prefetch
                                        href={f.href}
                                        aria-current={f.ativo ? "page" : undefined}
                                        className={cx(
                                            "flex h-8 items-center gap-2 rounded-lg px-2 text-corpo outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foco",
                                            f.ativo ? "font-semibold text-tinta" : "text-tinta-suave hover:bg-superficie-hover hover:text-tinta",
                                        )}
                                    >
                                        <span className="flex-1 truncate">{f.rotulo}</span>
                                        {f.contador !== undefined && f.contador > 0 && <Contador>{f.contador}</Contador>}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Collapsible.Content>
            </Collapsible.Root>
        </li>
    );
}

function BotaoLateral({ icone: I, rotulo, recolhida, aoClicar }: { icone: Icone; rotulo: string; recolhida: boolean; aoClicar: () => void }) {
    const botao = (
        <button type="button" onClick={aoClicar} aria-label={recolhida ? rotulo : undefined} className={cx(CLASSE_ITEM, "text-tinta-media hover:bg-superficie-hover hover:text-tinta", recolhida ? "w-10 justify-center self-center" : "px-3")}>
            <I size={19} stroke={TRACO} className="text-tinta-suave" aria-hidden />
            {!recolhida && <span className="truncate">{rotulo}</span>}
        </button>
    );
    return recolhida ? <Dica rotulo={rotulo} lado="right">{botao}</Dica> : botao;
}

function CartaoPromo() {
    const t = useT();
    const { props: { auth, loja }, url } = usePage();
    const rotaLoja = useRotaLoja();
    const admin = auth?.usuario.perfil === "admin";
    const chave = `promo-fechado:${admin ? "admin" : "loja"}`;
    const [fechado, setFechado] = useState(() => {
        try {
            return localStorage.getItem(chave) === "1";
        } catch {
            return false;
        }
    });
    if (fechado) return null;

    const conteudo = admin
        ? { titulo: t("Relatório da feira"), texto: t("Vendas, saídas e o consolidado em PDF, Excel ou CSV."), rotulo: t("Exportar"), href: rota("admin.relatorios.index") }
        : loja?.podeVender && !loja.encerrada
          ? { titulo: t("Hora de vender!"), texto: t("Abra o PDV no celular; o painel atualiza sozinho a cada venda."), rotulo: t("Abrir PDV"), href: rotaLoja("vendas.create") }
          : null;
    if (!conteudo || new URL(conteudo.href, window.location.origin).pathname === url.split("?")[0]) return null;

    return (
        <div className="mx-4 mb-2 shrink-0 rounded-2xl border border-linha bg-superficie p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-inverso text-inverso-tinta">
                    <IconBolt size={18} stroke={TRACO} aria-hidden />
                </span>
                <button
                    type="button"
                    aria-label={t("Fechar")}
                    onClick={() => {
                        setFechado(true);
                        try {
                            localStorage.setItem(chave, "1");
                        } catch {
                        }
                    }}
                    className="-me-1 -mt-1 flex size-8 items-center justify-center rounded-lg text-tinta-fraca outline-none hover:bg-superficie-hover hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco"
                >
                    <IconX size={15} stroke={TRACO} aria-hidden />
                </button>
            </div>
            <p className="text-ui font-bold text-tinta">{conteudo.titulo}</p>
            <p className="mt-1 text-rotulo text-tinta-suave">{conteudo.texto}</p>
            <BotaoLink href={conteudo.href} variante="escuro" className="mt-3 w-full">{conteudo.rotulo}</BotaoLink>
        </div>
    );
}

function Notificacoes() {
    const t = useT();
    const { auth } = usePage().props;
    const [lista, setLista] = useState<Pendencia[] | null>(null);
    const [aberto, setAberto] = useState(false);
    const url = auth?.usuario.perfil === "admin" ? rota("admin.pendencias") : rota("barraquinha.pendencias");

    const carregar = useCallback(async () => {
        try {
            const resposta = await fetch(url, { headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" }, credentials: "same-origin" });
            if (resposta.ok && resposta.headers.get("content-type")?.includes("json")) setLista(((await resposta.json()) as { pendencias: Pendencia[] }).pendencias);
        } catch {
        }
    }, [url]);

    useEffect(() => {
        void carregar();
        return router.on("success", () => void carregar());
    }, [carregar]);

    const abertas = lista?.filter((p) => !p.feito).length ?? 0;
    const rotulo = abertas ? t("Pendências (:n)", { n: abertas }) : t("Pendências");

    return (
        <Popover.Root open={aberto} onOpenChange={setAberto}>
            <Dica rotulo={rotulo}>
                <Popover.Trigger aria-label={rotulo} className={cx(classesBotao("superficie", "md", true), "relative")}>
                    <IconBell size={19} stroke={TRACO} aria-hidden />
                    {abertas > 0 && <Contador tom="secundaria" className="absolute -inset-e-1 -top-1 h-4.5 min-w-4.5 px-1">{abertas}</Contador>}
                </Popover.Trigger>
            </Dica>
            <Popover.Portal>
                <Popover.Content
                    align="end"
                    sideOffset={8}
                    collisionPadding={8}
                    className="z-50 w-80 max-w-[calc(100vw-1rem)] rounded-2xl border border-linha bg-superficie p-2 text-tinta shadow-flutuante outline-none data-[state=open]:animate-surgir"
                >
                    <div className="flex items-center justify-between px-3 pt-1.5 pb-2">
                        <p className="text-titulo font-semibold">{t("Pendências")}</p>
                        {abertas > 0 && <Contador>{abertas}</Contador>}
                    </div>
                    {lista === null ? (
                        <p className="px-3 pb-3 text-corpo text-tinta-suave">{t("Carregando…")}</p>
                    ) : lista.length === 0 ? (
                        <p className="px-3 pb-3 text-corpo text-tinta-suave">{t("Tudo em dia por aqui.")}</p>
                    ) : (
                        <ListaPendencias pendencias={lista} aoNavegar={() => setAberto(false)} />
                    )}
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}

function Configuracoes() {
    const t = useT();
    const { app } = usePage().props;
    const { preferencia } = useTema();
    const opcoesTema = useOpcoesTema();

    return (
        <MenuEscolhas
            grupos={[
                { rotulo: t("Tema"), valor: preferencia, opcoes: opcoesTema, aoEscolher: (v) => definirTema(v as typeof preferencia) },
                {
                    rotulo: t("Idioma"),
                    valor: app.idioma,
                    opcoes: Object.entries(app.idiomas).map(([codigo, nome]) => ({ valor: codigo, rotulo: nome, icone: IconLanguage })),
                    aoEscolher: (idioma) => idioma !== app.idioma && window.location.assign(rota("idioma", { idioma })),
                },
            ]}
            gatilho={(props) => (
                <Dica rotulo={t("Configurações")} {...props}>
                    <button type="button" aria-label={t("Configurações")} className={classesBotao("superficie", "md", true)}>
                        <IconSettings size={19} stroke={TRACO} aria-hidden />
                    </button>
                </Dica>
            )}
        />
    );
}

function Conta() {
    const t = useT();
    const { auth } = usePage().props;
    if (!auth) return null;

    return (
        <Menu
            alinhamento="fim"
            cabecalho={
                <div className="min-w-0">
                    <p className="truncate text-ui font-semibold text-tinta">{auth.usuario.nome}</p>
                    <p className="truncate text-rotulo text-tinta-suave">{auth.usuario.perfilLabel} · {auth.usuario.usuario}</p>
                </div>
            }
            itens={[
                { rotulo: t("Meu perfil"), icone: IconUserCircle, href: rota(auth.usuario.perfil === "admin" ? "admin.perfil" : "barraquinha.perfil") },
                { rotulo: t("Alterar minha senha"), icone: IconKey, href: rota("senha.edit") },
                { rotulo: t("Sair"), icone: IconLogout, aoSelecionar: () => router.post(rota("logout")), separadorAntes: true },
            ]}
            gatilho={(props) => (
                <button
                    {...props}
                    type="button"
                    aria-label={t("Menu da conta")}
                    className="flex h-10 items-center gap-2.5 rounded-controle border border-cartao-borda bg-superficie p-1 outline-none transition-colors hover:bg-superficie-hover focus-visible:ring-2 focus-visible:ring-foco md:h-9 md:pe-3"
                >
                    <Avatar nome={auth.usuario.nome} foto={auth.usuario.foto} tamanho="md" className="md:size-7" />
                    <span className="hidden min-w-0 text-start leading-tight md:block">
                        <span className="block max-w-36 truncate text-rotulo font-semibold text-tinta">{auth.usuario.nome}</span>
                        <span className="block max-w-36 truncate text-micro text-tinta-suave">{auth.usuario.usuario}</span>
                    </span>
                </button>
            )}
        />
    );
}
