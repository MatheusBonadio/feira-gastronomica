import { usePage } from "@inertiajs/react";
import {
    IconBuildingStore,
    IconCalendarEvent,
    IconChartBar,
    IconFileAnalytics,
    IconHistory,
    IconKey,
    IconLayoutDashboard,
    IconReceipt,
    IconShieldCheck,
    IconShoppingCart,
    IconStack2,
    IconTag,
    IconWallet,
} from "@tabler/icons-react";
import type { Icone } from "@/components/ui/icone";
import { useT } from "@/lib/i18n";
import { rota, rotaAtiva, useRotaLoja } from "@/lib/rotas";

export interface ItemNavegacao {
    rotulo: string;
    href: string;
    icone: Icone;
    ativo: boolean;
    /** Subitens em árvore (o "Transactions › History, Reports" da referência). */
    filhos?: ItemNavegacao[];
    /** Título dos subitens (o nome da barraquinha que o admin está vendo). */
    tituloFilhos?: string;
    contador?: number;
}

/**
 * Itens de navegação do perfil logado: grupo principal e secundário (abaixo
 * do separador). Usados pela sidebar e pela paleta de comandos (`todos`).
 */
export function useNavegacao(): { principal: ItemNavegacao[]; secundario: ItemNavegacao[]; todos: ItemNavegacao[] } {
    const { auth, loja } = usePage().props;
    const t = useT();
    const rotaLoja = useRotaLoja();
    const admin = auth?.usuario.perfil === "admin";
    const minhaSenha: ItemNavegacao = { rotulo: t("Minha senha"), href: rota("senha.edit"), icone: IconKey, ativo: rotaAtiva("senha.*") };

    // Seções de uma barraquinha (a da sessão ou a que o admin abriu).
    const secoesLoja = (): ItemNavegacao[] => {
        if (!loja) return [];
        const p = loja.prefixo;
        return [
            { rotulo: t("Painel"), href: rotaLoja("painel"), icone: IconLayoutDashboard, ativo: rotaAtiva(`${p}painel`) },
            { rotulo: t("Vendas"), href: rotaLoja("vendas.index"), icone: IconReceipt, ativo: rotaAtiva(`${p}vendas.index`) || rotaAtiva(`${p}vendas.show`) },
            { rotulo: t("Itens"), href: rotaLoja("itens.index"), icone: IconTag, ativo: rotaAtiva(`${p}itens.*`) },
            { rotulo: t("Combos"), href: rotaLoja("combos.index"), icone: IconStack2, ativo: rotaAtiva(`${p}combos.*`) },
            { rotulo: t("Entradas e saídas"), href: rotaLoja("lancamentos.index"), icone: IconWallet, ativo: rotaAtiva(`${p}lancamentos.*`) },
        ];
    };

    let principal: ItemNavegacao[] = [];
    let secundario: ItemNavegacao[] = [];

    if (admin) {
        const filhos = secoesLoja();
        principal = [
            { rotulo: t("Painel da feira"), href: rota("admin.painel"), icone: IconLayoutDashboard, ativo: rotaAtiva("admin.painel") },
            {
                rotulo: t("Barraquinhas"),
                href: rota("admin.barraquinhas.index"),
                icone: IconBuildingStore,
                ativo: rotaAtiva("admin.barraquinhas.*") || rotaAtiva("admin.loja.*"),
                filhos: filhos.length ? filhos : undefined,
                tituloFilhos: loja?.nome,
            },
            { rotulo: t("Feiras"), href: rota("admin.feiras.index"), icone: IconCalendarEvent, ativo: rotaAtiva("admin.feiras.*") },
            { rotulo: t("Comparar feiras"), href: rota("admin.comparar-feiras"), icone: IconChartBar, ativo: rotaAtiva("admin.comparar-feiras") },
            { rotulo: t("Relatórios"), href: rota("admin.relatorios.index"), icone: IconFileAnalytics, ativo: rotaAtiva("admin.relatorios.*") },
        ];
        secundario = [
            { rotulo: t("Categorias"), href: rota("admin.categorias.index"), icone: IconTag, ativo: rotaAtiva("admin.categorias.*") },
            { rotulo: t("Auditoria"), href: rota("admin.auditoria.index"), icone: IconShieldCheck, ativo: rotaAtiva("admin.auditoria.*") },
            minhaSenha,
        ];
    } else if (loja) {
        const [painel, vendas, ...resto] = secoesLoja();
        const p = loja.prefixo;
        principal = [
            painel,
            loja.podeVender
                ? {
                      ...vendas,
                      ativo: rotaAtiva(`${p}vendas.*`),
                      filhos: [
                          { rotulo: t("Nova venda"), href: rotaLoja("vendas.create"), icone: IconShoppingCart, ativo: rotaAtiva(`${p}vendas.create`) },
                          { rotulo: t("Histórico"), href: rotaLoja("vendas.index"), icone: IconHistory, ativo: rotaAtiva(`${p}vendas.index`) || rotaAtiva(`${p}vendas.show`) },
                      ],
                  }
                : vendas,
            ...resto,
        ];
        secundario = [
            ...(loja.podeVender ? [{ rotulo: t("Relatórios"), href: rota("barraquinha.relatorios.index"), icone: IconFileAnalytics, ativo: rotaAtiva("barraquinha.relatorios.*") }] : []),
            minhaSenha,
        ];
    }

    const todos = [...principal, ...secundario].flatMap((i) => [i, ...(i.filhos ?? [])]);
    return { principal, secundario, todos };
}
