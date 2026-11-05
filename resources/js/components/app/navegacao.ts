import { usePage } from "@inertiajs/react";
import {
    IconArrowLeft,
    IconBuildingStore,
    IconCalendarEvent,
    IconChartBar,
    IconFileAnalytics,
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
}

/** Itens de navegação do perfil logado. Usados pela sidebar e pela paleta de comandos. */
export function useNavegacao(): { principal: ItemNavegacao[]; voltar: ItemNavegacao | null } {
    const { auth, loja } = usePage().props;
    const t = useT();
    const rotaLoja = useRotaLoja();
    const admin = auth?.usuario.perfil === "admin";

    if (loja) {
        const p = loja.prefixo;
        return {
            voltar: admin ? { rotulo: t("Todas as barraquinhas"), href: rota("admin.barraquinhas.index"), icone: IconArrowLeft, ativo: false } : null,
            principal: [
                { rotulo: t("Painel"), href: rotaLoja("painel"), icone: IconLayoutDashboard, ativo: rotaAtiva(`${p}painel`) },
                ...(loja.podeVender ? [{ rotulo: t("Nova venda"), href: rotaLoja("vendas.create"), icone: IconShoppingCart, ativo: rotaAtiva(`${p}vendas.create`) }] : []),
                { rotulo: t("Vendas"), href: rotaLoja("vendas.index"), icone: IconReceipt, ativo: rotaAtiva(`${p}vendas.index`) || rotaAtiva(`${p}vendas.show`) },
                { rotulo: t("Itens"), href: rotaLoja("itens.index"), icone: IconTag, ativo: rotaAtiva(`${p}itens.*`) },
                { rotulo: t("Combos"), href: rotaLoja("combos.index"), icone: IconStack2, ativo: rotaAtiva(`${p}combos.*`) },
                { rotulo: t("Entradas e saídas"), href: rotaLoja("lancamentos.index"), icone: IconWallet, ativo: rotaAtiva(`${p}lancamentos.*`) },
                ...(loja.podeVender ? [{ rotulo: t("Relatórios"), href: rota("barraquinha.relatorios.index"), icone: IconFileAnalytics, ativo: rotaAtiva("barraquinha.relatorios.*") }] : []),
            ],
        };
    }

    if (admin) {
        return {
            voltar: null,
            principal: [
                { rotulo: t("Painel da feira"), href: rota("admin.painel"), icone: IconLayoutDashboard, ativo: rotaAtiva("admin.painel") },
                { rotulo: t("Barraquinhas"), href: rota("admin.barraquinhas.index"), icone: IconBuildingStore, ativo: rotaAtiva("admin.barraquinhas.*") },
                { rotulo: t("Feiras"), href: rota("admin.feiras.index"), icone: IconCalendarEvent, ativo: rotaAtiva("admin.feiras.*") },
                { rotulo: t("Comparar feiras"), href: rota("admin.comparar-feiras"), icone: IconChartBar, ativo: rotaAtiva("admin.comparar-feiras") },
                { rotulo: t("Relatórios"), href: rota("admin.relatorios.index"), icone: IconFileAnalytics, ativo: rotaAtiva("admin.relatorios.*") },
                { rotulo: t("Categorias"), href: rota("admin.categorias.index"), icone: IconTag, ativo: rotaAtiva("admin.categorias.*") },
                { rotulo: t("Auditoria"), href: rota("admin.auditoria.index"), icone: IconShieldCheck, ativo: rotaAtiva("admin.auditoria.*") },
            ],
        };
    }

    return { voltar: null, principal: [] };
}
