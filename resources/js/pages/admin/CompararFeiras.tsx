import { IconCalendarEvent, IconChartBar, IconList } from "@tabler/icons-react";
import { CORES, GraficoBarras, Legenda } from "@/components/graficos/graficos";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { ChipStatus } from "@/components/ui/marcadores";
import { Celula, Linha, Tabela } from "@/components/ui/tabela";
import { useFormato } from "@/lib/formato";
import { useT } from "@/lib/i18n";
import type { Opcao } from "@/types/inertia";
import type { Indicadores } from "@/types/dominio";

interface LinhaFeira {
    id: number;
    nome: string;
    status: Opcao;
    barraquinhas: number;
    indicadores: Indicadores;
}

export default function CompararFeiras({ feiras }: { feiras: LinhaFeira[] }) {
    const t = useT();
    const f = useFormato();
    const ordenadas = [...feiras].reverse();
    const series = [
        { nome: t("Vendas"), cor: CORES[0], valores: ordenadas.map((x) => x.indicadores.vendas) },
        { nome: t("Saídas"), cor: CORES[1], valores: ordenadas.map((x) => x.indicadores.saidas) },
        { nome: t("Resultado"), cor: CORES[2], valores: ordenadas.map((x) => x.indicadores.resultado) },
    ];

    return (
        <>
            <CabecalhoPagina titulo={t("Comparar feiras")} descricao={t("Cada edição é independente; aqui elas aparecem lado a lado.")} />

            {feiras.length === 0 ? (
                <Cartao><Vazio icone={IconCalendarEvent} titulo={t("Nenhuma feira cadastrada")} /></Cartao>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <Cartao titulo={t("Vendas, saídas e resultado por edição")} icone={IconChartBar} acoes={<Legenda itens={series.map((s) => ({ rotulo: s.nome, cor: s.cor }))} />}>
                        <GraficoBarras rotulo={t("Comparação entre feiras")} categorias={ordenadas.map((x) => x.nome)} series={series} formatarValor={f.moeda} formatarEixo={f.moedaCompacta} altura={300} />
                    </Cartao>

                    <Cartao titulo={t("Comparação entre feiras")} icone={IconList} corpo="">
                        <Tabela
                            rotulo={t("Comparação entre feiras")}
                            colunas={[
                                { chave: "feira", rotulo: t("Feira"), icone: IconCalendarEvent },
                                { chave: "status", rotulo: t("Status") },
                                { chave: "barraquinhas", rotulo: t("Barraquinhas"), alinhar: "direita" },
                                { chave: "vendas", rotulo: t("Vendas"), alinhar: "direita" },
                                { chave: "outras", rotulo: t("Outras entradas"), alinhar: "direita" },
                                { chave: "custos", rotulo: t("Custos"), alinhar: "direita" },
                                { chave: "despesas", rotulo: t("Despesas"), alinhar: "direita" },
                                { chave: "resultado", rotulo: t("Resultado"), alinhar: "direita" },
                                { chave: "margem", rotulo: t("Margem"), alinhar: "direita" },
                                { chave: "saldo", rotulo: t("Saldo"), alinhar: "direita" },
                            ]}
                        >
                            {feiras.map((x) => (
                                <Linha key={x.id}>
                                    <Celula cabecalho><span className="font-medium text-tinta">{x.nome}</span></Celula>
                                    <Celula><ChipStatus opcao={x.status} /></Celula>
                                    <Celula direita>{f.numero(x.barraquinhas)}</Celula>
                                    <Celula direita>{f.moeda(x.indicadores.vendas)}</Celula>
                                    <Celula direita>{f.moeda(x.indicadores.outrasEntradas)}</Celula>
                                    <Celula direita>{f.moeda(x.indicadores.custos)}</Celula>
                                    <Celula direita>{f.moeda(x.indicadores.despesas)}</Celula>
                                    <Celula direita className={x.indicadores.resultado < 0 ? "text-negativo" : "text-positivo"}>{f.moeda(x.indicadores.resultado)}</Celula>
                                    <Celula direita>{f.percentual(x.indicadores.margem)}</Celula>
                                    <Celula direita className={x.indicadores.saldo < 0 ? "text-negativo" : ""}>{f.moeda(x.indicadores.saldo)}</Celula>
                                </Linha>
                            ))}
                        </Tabela>
                    </Cartao>
                </div>
            )}
        </>
    );
}
