# Design system da Feira Gastronômica UNAERP

Painel financeiro claro e respirado, inspirado num dashboard de finanças pessoais
(sidebar branca com árvore de navegação e cartão promocional, chão cinza com cartões
brancos sem borda, valores grandes, barras hachuradas, medidor em meio-círculo, extrato
de transações e "meu cartão" com ações rápidas), recolorido com a identidade da UNAERP:
**azul #003087** (principal) e **amarelo #ecdd12** (secundária).

- Fonte única dos valores: [`resources/js/styles/tokens.css`](resources/js/styles/tokens.css).
- Base técnica: **Radix Primitives** (`radix-ui`) dá comportamento e acessibilidade a tudo
  que é interativo; **Tailwind CSS v4** com os tokens dá o visual. O kit está em
  `resources/js/components/`.

---

## 1. Princípios

1. **Chão cinza, cartão branco.** O conteúdo fica em cartões brancos sem borda nem sombra
   sobre o chão cinza-claro (`bg-fundo`). No escuro os cartões ficam um tom acima do chão,
   com um fio sutil (`border-cartao-borda`).
2. **Valor primeiro.** Cada cartão abre com o número que importa em `text-valor` (30px) e
   uma legenda pequena; o detalhe vem depois.
3. **Dados hachurados.** Barras, blocos e medidores usam listras diagonais (`hachura`)
   sobre a cor da série; o que está fora de foco fica cinza (`grafico-inativo`).
4. **Azul conduz, amarelo destaca.** Azul: ação principal, item ativo, série principal.
   Amarelo: o destaque (pré-venda, 1º do ranking, contador, chip do cartão). Amarelo
   nunca é cor de texto.
5. **Tela inteira, qualquer tela.** Largura total de 360px a 1920px, sem rolagem
   horizontal da página; tabelas viram cartões no celular.

---

## 2. Cores

Declaradas em `:root` (claro) e `.dark` (escuro) e expostas pelo `@theme inline`
(`bg-superficie`, `text-tinta-suave`...). As cores de marca, pastéis, gráficos e
impressão são as mesmas da versão anterior; mudaram os neutros e entraram tokens novos.

### Marca

| Token | Claro | Escuro | Papel |
| --- | --- | --- | --- |
| `primaria` | `#003087` | `#2b57b8` | Ação principal, item ativo, série 1, cartão de identidade |
| `primaria-tinta` | `#ffffff` | `#ffffff` | Texto sobre `primaria` (11,9:1 no claro) |
| `primaria-suave` / `primaria-texto` | `#e8eef8` / `#003087` | `#13254d` / `#8fb0f0` | Fundo e texto de realce azul |
| `secundaria` | `#ecdd12` | `#ecdd12` | Destaque: pré-venda, 1º lugar, contador do sino, chip do cartão |
| `secundaria-tinta` | `#1f1a00` | `#1f1a00` | **Só** texto sobre o amarelo cheio (12,4:1) |
| `secundaria-suave` / `secundaria-texto` | `#fcf8d2` / `#5c5300` | `#3a360a` / `#f3e640` | Fundo e texto de realce amarelo (avatar, ícone de pré-venda, faixa) |
| `foco` | `#6f8fd0` | `#4a72c8` | Anel de foco do teclado |

### Neutros e tokens novos

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `fundo` | `#f2f2f3` | `#09090b` | Chão das telas (o cinza atrás dos cartões) |
| `superficie` | `#ffffff` | `#141417` | Cartões, sidebar, campos, botões do topo |
| `superficie-suave` / `-hover` / `-ativa` | `#f6f6f7` / `#f1f1f3` / `#e8e8eb` | `#1b1b1f` / `#202025` / `#2a2a30` | Item ativo, hover, pressionado |
| `cartao-borda` | transparente | `#1f1f24` | Contorno dos cartões (só aparece no escuro) |
| `linha` / `linha-forte` | `#ececef` / `#dcdce1` | `#25252b` / `#34343b` | Divisórias e bordas de campo |
| `tinta` → `tinta-fraca` | `#18181b` → `#a1a1aa` | `#f4f4f5` → `#6b6b74` | Texto principal, médio, suave, fraco |
| `inverso` / `inverso-tinta` | `#18181b` / `#ffffff` | `#f4f4f5` / `#18181b` | Contadores, dicas, botão `escuro` |
| `hachura` | branco 38% | preto 28% | Listras sobre as marcas de dados |
| `grafico-inativo` | `#ededf0` | `#26262c` | Barras fora de foco, trilhos, blocos vazios do medidor |
| `veu` | preto 40% | preto 60% | Atrás de diálogos e folhas |

Pastéis (`rosa`, `verde`, `azul`, `ambar`, `vermelho`, cada um com `-suave` e `-tinta`),
`positivo`/`negativo` e `grafico-1…6` seguem iguais. Canal: pré-venda amarelo, feira
azul, pós-evento verde. Pagamento: dinheiro verde, Pix azul, cartão rosa.

---

## 3. Tipografia

**Plus Jakarta Sans** (variável, empacotada pelo Vite, sem CDN) em tudo, inclusive na marca
(peso 800). Números com `tabular-nums`.

| Utilitário | Tamanho | Uso |
| --- | --- | --- |
| `text-micro` | 11px | Datas e status em listas, rótulos de eixo |
| `text-rotulo` | 12px | Legendas de cartão, rótulos de campo |
| `text-corpo` | 13px | Tabelas, listas, legendas de gráfico |
| `text-ui` | 14px | Texto padrão, botões, navegação |
| `text-titulo` | 15px | Título de cartão |
| `text-marca` | 17px | "Feira Gastronômica" na sidebar |
| `text-cabecalho` | 22px | Título da página |
| `text-numero` | 24px | Números da coluna de totais e do medidor |
| `text-valor` | 30px | O valor principal de um cartão |

Pesos: 400 texto, 600 títulos e valores, 700–800 marca e cartão de identidade.

---

## 4. Forma e profundidade

| Token | Valor | Uso |
| --- | --- | --- |
| `rounded-cartao` | 18px | Cartões |
| `rounded-2xl` | 16px | Cartão de identidade, popovers, folhas |
| `rounded-xl` | 12px | Itens da sidebar, ações rápidas, avatares quadrados |
| `rounded-controle` | 10px | Botões, campos, busca |
| `rounded-full` | - | Chips, contadores, trilhos de progresso |
| `shadow-flutuante` | difusa | Só o que flutua: menus, popovers, dicas, diálogos |

Espaço entre cartões: `gap-3`; dentro do cartão: `px-5`. Página: `px-4` (celular) e
`px-6` (desktop).

---

## 5. Estrutura da tela

```
┌───────────────┬─────────────────────────────────────────────────────────────┐
│ ■ Feira       │ [🔍 Busca rápida  Ctrl K]          (🔔2) (⚙) (CD Nome) [+ Nova venda|▾] │
│   Gastronômica├─────────────────────────────────────────────────────────────┤
│ [Feira 2027 ▾]│ Boa noite · sexta, 20/11          (● Ao vivo ⟳) [Filtros] [Exportar] │
│ ▌Painel       │ Painel da feira                                             │
│  Vendas    ▾  │ ┌ R$ 12.450 ──────────── ▥ ⌇ ┐┌ Total entradas ┐┌ Feira em uso ───┐ │
│   │ Nova venda│ │ ● Pré ● Feira ● Pós        ││ R$ 15.000 ↗5%  ││ ▆▆ cartão azul │ │
│   │ Histórico │ │ ▁ ▁ ▁ █ ▁ ▁ ▁  (dica)      ││ Saídas, Saldo  ││ ▢ ▢ ▢ ▢ ▢       │ │
│  Itens        │ └───────────────────────────┘└────────────────┘│ Acesso rápido   │ │
│  Combos       │ ┌ Meta ███████░░ ┐┌ Próximo passo  ▦▦ ┐          ├ Últimas vendas ─┤ │
│ ───────────── │ ┌ Saídas ▤▤▤▤ ┐┌ Saúde ◠ 75% ┐┌ Estoque/ranking ┐ │ extrato         │ │
│  Relatórios   │ ┌ Comparativo (tabela) ──────────────────────────┐ └────────────────┘ │
│ [Hora de      │ ┌ Vendas por tag ┐┌ Por pagamento ▤▤▤ ┐                              │
│  vender! ▶]   │                                                              │
│  Sair · ⇤     │                                                              │
└───────────────┴─────────────────────────────────────────────────────────────┘
```

- **Sidebar** (`lg+`): marca, seletor de feira (admin), navegação principal em árvore,
  separador, itens secundários, cartão promocional dispensável, Sair e **Recolher menu**
  (vira trilho de ícones com dicas; a escolha fica no navegador). Item ativo: fundo
  `superficie-suave` e barrinha azul na borda. Abaixo de `lg`, a mesma sidebar abre numa
  folha lateral.
- **Topo** sobre o chão: busca (abre a paleta Ctrl/⌘K), sino de pendências, engrenagem
  (tema e idioma), cartão do usuário e a ação principal num botão dividido.
- **Painéis**: coluna principal + trilho direito de 22rem a partir de `xl`.

---

## 6. Componentes

| Peça | Arquivo | Radix | Notas |
| --- | --- | --- | --- |
| `Botao`, `BotaoLink`, `BotaoDividido` | `ui/botao.tsx` | `DropdownMenu` (dividido) | `primario`, `secundario`, `superficie` (branco sobre o chão), `escuro`, `destaque`, `suave`, `fantasma`, `perigo` |
| `Menu`, `MenuEscolhas` | `ui/menu.tsx` | `DropdownMenu` (+ `RadioGroup`) | Menus de ação; escolhas com marcação (tema, idioma) |
| `Campo`, `Selecao`, `CaixaSelecao`, `Interruptor`, `Segmentos`, `OpcoesCartao` | `ui/campos.tsx` | `Label`, `Select`, `Checkbox`, `Switch`, `RadioGroup` | Texto/data/moeda/arquivo continuam `<input>` nativo |
| `Dialogo`, `Confirmar`, `Folha` | `ui/dialogo.tsx` | `Dialog`, `AlertDialog` | Folha de baixo (carrinho do PDV) ou de lado (menu) |
| `Dica` | `ui/dica.tsx` | `Tooltip` | Todo botão só de ícone |
| `avisar()` + `Avisos` | `ui/avisos.tsx` | `Toast` | Sucesso/erro das ações |
| `Cartao`, `CabecalhoPagina`, `Estatistica`, `Variacao`, `Kpi`, `PilulaStats`, `Detalhe`, `Vazio`, `Faixa` | `ui/cartao.tsx` | - | `Estatistica` + `Variacao` = a coluna de totais com "↗ 5,1% vs. Feira 2026" |
| `Chip`, `ChipStatus`, `TextoStatus`, `ChipTag`, `Avatar`, `Contador`, `Ponto`, `Kbd` | `ui/marcadores.tsx` | `Avatar` | `TextoStatus` = "Concluída/Cancelada" em texto colorido; `Contador` escuro como o "19" da referência |
| `Tabela`, `Linha`, `Celula` | `ui/tabela.tsx` | `Select` (ordenação no celular) | Sem divisórias verticais; **modo cartão** pela largura do container (`cartoesAbaixo`) |
| `VendasPorDia`, `SaidasPorCategoria`, `SaudeFinanceira`, `PorPagamento`, `ProgressoMeta`, `ProximoPasso` | `painel/blocos.tsx` | `ToggleGroup` (barras/linha) | Blocos dos dois painéis |
| `ListaVendas`, `CartaoIdentidade`, `AcoesRapidas`, `AcessoRapido`, `CartaoDica`, `ListaPendencias`, `TabelaTags` | `painel/widgets.tsx` | `Tooltip` | Extrato, "meu cartão", ações quadradas, avatares, dica com bloquinhos |
| `FiltrosVendas`, `BotaoFiltros` | `painel/filtros.tsx` | `Collapsible`, `Popover` | Em linha nas listas; em popover no topo dos painéis |
| `AoVivo` | `painel/ao-vivo.tsx` | `Tooltip` | Selo de tempo real |
| Shell, sino, configurações | `app/shell.tsx` | `Popover`, `Collapsible`, `Separator`, `Dialog` | - |

Ícones: **Tabler** (`@tabler/icons-react`), traço 1,5, 16–19px.

---

## 7. Gráficos

Barras, área, rosca e sparkline usam **Recharts** por baixo (`components/graficos/graficos.tsx`): o contêiner
acompanha a largura do cartão, a dica responde a mouse, toque e teclado e fica dentro do gráfico, e os
rótulos do eixo X se encurtam ou se espaçam para não se sobrepor. As barras são desenhadas pelo kit
(cor do token, `hachura`, cantos arredondados), então o visual é o mesmo do design system. Medidor,
barra segmentada e barras horizontais são HTML/SVG próprios. As telas usam só estes componentes,
nunca o Recharts direto.

| Peça | Como na referência | Comportamento |
| --- | --- | --- |
| `GraficoBarrasDias` | "Balance overview" | Barras por dia empilhadas por canal; dias fora de foco em cinza, dia em foco colorido e hachurado. A dica (data, canais, total) aparece com mouse, toque ou setas; clique, toque ou Enter filtra o painel por aquele dia. Sem interação, o foco volta ao dia filtrado ou ao último. |
| `GraficoArea` | alternativa "linha" | Mesma série em linha com área degradê. |
| `BarraSegmentada` | "Cost analysis" | Blocos hachurados proporcionais + legenda com % e valor. |
| `Medidor` | "Financial health" | Meio-círculo de 11 blocos; os preenchidos vão do amarelo ao azul (mistura dos dois tokens) e são hachurados. |
| `BarraProgresso`, `BarrasHorizontais` | "Monthly spending limit", "Goal tracker" | Trilho cinza com preenchimento hachurado. |
| `GraficoBarras`, `GraficoRosca`, `Sparkline`, `Legenda` | - | Comparar feiras e usos menores. |

Os gráficos têm rótulo acessível e o número também aparece em texto (legenda, dica ou
anúncio para leitor de tela), então a cor nunca é a única fonte da informação.

---

## 8. Tempo real

Sem servidor de WebSocket: o painel consulta o *pulso* (assinatura das vendas e
lançamentos) a cada 3s e, quando muda, faz uma recarga parcial só das props do painel.
O selo **● Ao vivo · agora ⟳** mostra o estado (verde, amarelo atualizando, cinza pausado
com a aba escondida, vermelho sem conexão); venda nova acende em amarelo no extrato.

---

## 9. Modo escuro

- Três opções na engrenagem do topo: **Claro**, **Escuro** e **Do sistema** (padrão, segue o
  aparelho e acompanha a troca na hora). A escolha fica no navegador; o script do
  `app.blade.php` aplica antes da pintura, sem piscar.
- Os mesmos tokens trocam de valor sob `.dark`; nenhuma tela usa `dark:`.
- `color-scheme` acompanha o tema (campos de data e barras de rolagem nativos).
- No escuro: chão quase preto, cartões um tom acima com fio sutil, azul clareado
  (`#2b57b8`) para manter contraste, listras escuras sobre as cores.

---

## 10. Responsividade e acessibilidade

| Faixa | Comportamento |
| --- | --- |
| `< md` | Tabelas em cartões, filtros recolhidos, botão flutuante **Nova venda**, cartão do usuário vira só o avatar |
| `md`–`lg` | Grades de 2 colunas, ação principal no topo |
| `lg+` | Sidebar fixa (recolhível), formulários em 3 colunas |
| `xl+` | Painéis com trilho direito |
| `2xl+` | Três cartões por linha nos blocos do painel |

Foco visível em tudo (`ring-foco`), alvos de toque ≥ 40px no celular (44px no PDV),
`prefers-reduced-motion` respeitado, propriedades lógicas para RTL e diálogos, menus,
seleções e dicas com o teclado e os papéis ARIA do Radix.

---

## 11. Regras para quem for criar tela

1. Monte com o kit; peça nova vai para o kit, sobre o primitivo Radix correspondente.
2. Cartão: `Cartao` (nunca uma `div` com borda própria). Valor principal em `text-valor`.
3. Dados em barra: `hachura` + cor da série; o resto em `grafico-inativo`.
4. Só tokens; amarelo só como fundo (`secundaria-tinta` no cheio, `secundaria-texto` no suave).
5. Confira em 360, 768 e 1440px, claro e escuro, pt-BR e inglês.
