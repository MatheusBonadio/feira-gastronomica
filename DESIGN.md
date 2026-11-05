# Design system — Feira Gastronômica UNAERP

Interface clara de painel de trabalho, inspirada num dashboard de gestão de projetos
(barra lateral branca com marca serifada, topo com busca ⌘K e botão dividido, saudação
com pílula de números, tabela com divisórias verticais, chips pastel, agenda semanal e
checklist), recolorida com a identidade da UNAERP.

Fonte única dos valores: [`resources/js/styles/tokens.css`](resources/js/styles/tokens.css).
Base técnica: **Radix Primitives** (`radix-ui`) para comportamento e acessibilidade de tudo
que é interativo, e **Tailwind CSS v4** com os tokens para o visual. Os primitivos não trazem
estilo; o kit em `resources/js/components/` veste cada um com o design abaixo.

---

## 1. Princípios

1. **Branco e borda fina.** Superfícies brancas separadas por bordas de 1px (`border-linha`);
   sombra só em botão e camada flutuante. Cor é para dado e ação, não para enfeite.
2. **Azul conduz, amarelo destaca.** O azul-marinho (#003087) marca ação primária,
   navegação ativa e a série principal dos gráficos. O amarelo (#ecdd12) marca o que está
   em evidência: o KPI principal, o dia selecionado, a 1ª posição do ranking, pendência resolvida.
3. **Tela inteira.** Conteúdo em largura total, sem `max-width` de página; a grade de 12
   colunas reparte o espaço a partir de `xl`.
4. **Mesmo layout em todo tamanho.** Do celular de 360px ao monitor largo, sem rolagem
   horizontal da página (seção 9).
5. **Só tokens.** Nenhuma tela usa hex, `white`/`black`/`gray-*` ou `dark:`. O modo escuro
   troca os valores dos mesmos nomes.

---

## 2. Cores

Declaradas em `:root` (claro) e `.dark` (escuro), expostas ao Tailwind por `@theme inline`
(`bg-primaria`, `text-tinta-suave`, `border-linha`...).

### Marca

| Token | Claro | Papel |
| --- | --- | --- |
| `primaria` | `#003087` | Botão primário, item ativo da navegação, série 1 dos gráficos, logo |
| `primaria-hover` | `#00246a` | Hover do primário |
| `primaria-tinta` | `#ffffff` | Texto/ícone sobre `primaria` (contraste 11,9:1) |
| `primaria-suave` | `#e8eef8` | Fundo de realce azul (chip, seleção) |
| `secundaria` | `#ecdd12` | Destaque: KPI principal, dia selecionado, 1º do ranking, meta |
| `secundaria-tinta` | `#1f1a00` | **Único** texto permitido sobre o amarelo (contraste 12,4:1) |
| `secundaria-suave` | `#fcf8d2` | Linha recém-chegada no tempo real, fundo de aviso leve |
| `foco` | `#6f8fd0` | Anel de foco do teclado (`focus-visible:ring-foco`) |

> **Amarelo nunca é texto.** Sobre branco ele tem contraste 1,4:1. Use-o só como fundo,
> sempre com `text-secundaria-tinta`, ou como marca gráfica (barra, ponto, fatia).

### Superfícies e texto

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `fundo` | `#ffffff` | `#0b0b0d` | Chão da página |
| `superficie` | `#ffffff` | `#131316` | Cartões, sidebar, topo |
| `superficie-suave` | `#f7f7f8` | `#1a1a1e` | Cabeçalho de tabela, campo de busca, pílula de números |
| `superficie-hover` / `-ativa` | `#f4f4f5` / `#ececee` | — | Hover e pressionado |
| `linha` / `linha-forte` | `#e8e8eb` / `#d9d9de` | — | Bordas e divisórias |
| `tinta` | `#18181b` | `#f4f4f5` | Texto principal e números |
| `tinta-media` | `#52525b` | — | Ícones, texto de navegação |
| `tinta-suave` | `#71717a` | — | Rótulos, descrições (4,8:1 sobre branco) |
| `tinta-fraca` | `#a1a1aa` | — | Placeholder, desabilitado (não usar para texto essencial) |
| `veu` | 40% preto | 60% preto | Fundo atrás de diálogo e gaveta |

### Pastéis (chips e agenda)

Cada cor tem três tons: o forte (barra, ponto), o `-suave` (fundo de chip) e o `-tinta`
(texto do chip): `rosa`, `verde`, `azul`, `ambar`, `vermelho`.

| Significado | Chip |
| --- | --- |
| Canal **Pré-venda** / **Feira** / **Pós-evento** | barra amarela / azul / verde (`COR_CANAL`) |
| Pagamento **Dinheiro** / **Pix** / **Cartão** | verde / azul / rosa (`COR_PAGAMENTO`) |
| Status ativa · aberta / planejada / bloqueada · cancelada / encerrada | verde / âmbar / vermelho / neutro (`ChipStatus`) |
| Tag **Combo N** / **Comum** | `primaria-suave` com texto azul / neutro (`ChipTag`) |

### Valores e gráficos

- `positivo` `#15803d` e `negativo` `#dc2626`: resultado, saldo e margem. Valor negativo
  também ganha ícone de alerta, não só cor.
- Séries: `grafico-1` (azul) → `grafico-2` (amarelo) → `grafico-3` (verde) → `grafico-4`
  (rosa) → `grafico-5` (azul claro) → `grafico-6` (âmbar). `grafico-grade` para as linhas de grade.
- Impressão (`impressao-*`): cores do PDF, lidas em hex por `App\Support\Tema`.

---

## 3. Tipografia

| Família | Uso | Pacote |
| --- | --- | --- |
| **Inter Variable** (com eixo óptico) | Toda a interface, números com `tabular-nums` | `@fontsource-variable/inter` |
| **Fraunces Variable** | Só a marca "Feira Gastronômica" na sidebar e no login | `@fontsource-variable/fraunces` |

As fontes vêm empacotadas pelo Vite (sem CDN, funcionam offline na rede da feira).

| Utilitário | Tamanho / altura | Uso |
| --- | --- | --- |
| `text-micro` | 11 / 16 | Dia da semana, metadados de linha |
| `text-rotulo` | 12 / 16 | Rótulos de campo, descrições de cartão |
| `text-corpo` | 13 / 20 | Tabelas, listas, chips |
| `text-ui` | 14 / 20 | Texto padrão, botões, navegação |
| `text-titulo` | 16 / 24 | Título de cartão, valor da pílula |
| `text-numero` | 22 / 28 | Valor de KPI |
| `text-cabecalho` | 24 / 32 | Título de página no celular |
| `text-saudacao` | 30 / 36, −0,02em | Título de página a partir de `sm` ("Boa tarde, Ana!") |

Pesos: 400 corpo, 500 títulos e itens ativos, 600 números e valores. Nada abaixo de 11px.

---

## 4. Forma, espaço e profundidade

| Token | Valor | Uso |
| --- | --- | --- |
| `rounded-controle` | 8px | Botões, campos, itens de menu |
| `rounded-cartao` | 14px | Cartões e painéis |
| `rounded-xl` / `rounded-2xl` | 12 / 16px | Cartões de tabela no celular, diálogos |
| `rounded-full` | — | Pílulas, chips, avatar, selo "Ao vivo", botão flutuante |
| `shadow-botao` | sutil + brilho interno | Botões preenchidos |
| `shadow-flutuante` | difusa | Menus, diálogos, paleta, gaveta, botão flutuante |
| `w-sidebar` | 15,5rem | Barra lateral |
| `h-topbar` | 3,75rem | Topo |
| `toque` | 3rem | Alvo de toque mínimo do PDV |

Espaçamento na escala do Tailwind: `gap-4` entre cartões, `p-4` dentro do cartão, `mb-5`
entre faixas do painel. Página: `px-4 py-6` no celular, `px-8 py-7` a partir de `lg`.

Movimento: `animate-surgir` (160ms, menus e diálogos), `animate-chegar` (2,4s, linha nova no
tempo real), `animate-ping` no ponto "Ao vivo". Tudo some com `prefers-reduced-motion`.

---

## 5. Estrutura da tela

```
┌──────────────┬───────────────────────────────────────────────────────────────┐
│ ■ Feira      │ [≡] [🔍 Buscar ou digitar um comando  Ctrl K]  [+ Nova venda|▾] 🌐 ☀ (A) │
│   Gastronô-  ├───────────────────────────────────────────────────────────────┤
│   mica       │ quinta-feira, 19 de novembro · Feira 2027                      │
│ [Feira ▾]    │ Boa tarde, Ana!                    (● Ao vivo · agora ⟳) [Exportar] │
│ ▸ Painel     │ ( R$ 12.430 em vendas | 318 vendas | R$ 39 ticket | 12 barraq. )│
│   Vendas     │ [Filtros: De Até Canal Pagamento Tag  Filtrar]                 │
│   ...        │ [KPI amarelo][KPI][KPI][KPI][KPI]                              │
│ Atalhos      │ [Vendas por dia ············· 8 col][Por canal ····· 4 col]    │
│ ● Pastel     │ [Comparativo (tabela) ······· 8 col][Pendências ···· 4 col]    │
│ ● Doces      │ [Ranking 4][Últimas vendas + semana 4][Por tag 4]              │
│ Minha senha  │                                                               │
│ Sair         │                                                               │
└──────────────┴───────────────────────────────────────────────────────────────┘
```

- **Sidebar** (`lg+` fixa; no celular, gaveta pelo ☰): logo (quadrado azul com quadrado
  amarelo), marca em Fraunces, seletor de feira (admin), navegação, atalhos coloridos
  (barraquinhas para o admin; Nova venda/entrada/saída para a barraquinha), conta no rodapé.
- **Topo** fixo translúcido: busca que abre a **paleta de comandos** (Ctrl/⌘K), ação
  principal como **botão dividido** (principal + menu de extras), idioma, tema e conta.
- **Cabeçalho de página**: sobretítulo (data · contexto), título grande, ações à direita
  (quebram linha no celular) e, opcionalmente, a **pílula de números**.
- **Formulários**: grade `lg:grid-cols-3`, formulário em 2 colunas e ajuda/resumo na 3ª.

---

## 6. Componentes

| Peça | Arquivo | Primitivo Radix | Notas |
| --- | --- | --- | --- |
| `Botao`, `BotaoLink`, `BotaoDividido` | `ui/botao.tsx` | — (`DropdownMenu` no dividido) | Variantes `primario`, `secundario`, `destaque` (amarelo), `suave`, `fantasma`, `perigo`; tamanhos `sm` `md` `lg` (mais altos no celular) |
| `Menu` | `ui/menu.tsx` | `DropdownMenu` | Setas, busca por letra, Esc, foco de volta ao gatilho, não sai da tela |
| `Campo` (rótulo) | `ui/campos.tsx` | `Label` | Rótulo, dica e erro em volta de qualquer controle |
| `Entrada`, `CampoMoeda`, `CampoNumero`, `CampoData`, `AreaTexto`, `CampoArquivo` | `ui/campos.tsx` | — (`<input>` nativo) | Teclado certo no celular; 16px abaixo de `md` (sem zoom no iOS) |
| `Selecao` | `ui/campos.tsx` | `Select` | Opção vazia ("Todos"), grupos com título, lista que rola |
| `CaixaSelecao` | `ui/campos.tsx` | `Checkbox` | Área de toque ampliada sem mudar o desenho |
| `Interruptor` | `ui/campos.tsx` | `Switch` | Espelhado em RTL; `rotuloAcessivel` quando o texto visível é só o estado |
| `Segmentos`, `OpcoesCartao` | `ui/campos.tsx` | `RadioGroup` | Setas e foco itinerante; `grande` = 44px (PDV), `cores` = ponto por opção |
| `Dialogo`, `Confirmar`, `Folha` | `ui/dialogo.tsx` | `Dialog`, `AlertDialog` | `Confirmar` aceita Promise e não fecha clicando fora; `Folha` sobe do rodapé (carrinho do PDV) ou entra pela lateral (menu no celular) |
| `Dica` | `ui/dica.tsx` | `Tooltip` | Para botões só de ícone; abre no hover e no foco do teclado |
| `avisar()` + `Avisos` | `ui/avisos.tsx` | `Toast` | Anunciados a leitor de tela, pausam no hover, arrastar fecha, F8 leva até eles |
| `Cartao`, `CabecalhoPagina`, `PilulaStats`, `Kpi`, `Detalhe`, `Vazio`, `Faixa` | `ui/cartao.tsx` | — | `Kpi destaque` = fundo azul, ícone amarelo e sparkline |
| `Chip`, `ChipStatus`, `ChipTag`, `Ponto`, `Avatar`, `Kbd`, `Contador` | `ui/marcadores.tsx` | `Avatar` | Avatar com foto ou iniciais em cor estável por nome |
| `Tabela`, `Linha`, `Celula` | `ui/tabela.tsx` | `Select` (ordenação no celular) | Divisórias verticais, ordenação, **modo cartão** no celular |
| `Paginacao` | `ui/paginacao.tsx` | — | No celular só "3 / 10" com setas |
| `PaletaComandos` | `app/paleta-comandos.tsx` | `Dialog` | Ctrl/⌘K |
| `Provedores` | `app/provedores.tsx` | `Direction`, `Tooltip.Provider`, `Toast.Provider` | Direção do texto pelo idioma, atraso comum das dicas |
| `FiltrosVendas` | `painel/filtros.tsx` | `Collapsible` | Filtros pela URL; recolhidos no celular, sempre abertos a partir de `md` |
| Meta de vendas | `pages/loja/Painel.tsx` | `Progress` | — |
| `FaixaDias`, `ListaVendas`, `ListaPendencias`, `TabelaTags` | `painel/widgets.tsx` | `Tooltip` (dias) | Agenda de 7 dias, últimas vendas com barra do canal, checklist |
| `AoVivo` | `painel/ao-vivo.tsx` | `Tooltip` | Selo de tempo real |

Importação: `import { Dialog, Select } from "radix-ui"` (pacote único, versão fixa). Estados do
Radix viram estilo por atributo: `data-[state=open]:animate-surgir`,
`data-[state=checked]:bg-primaria`, `data-[highlighted]:bg-superficie-hover`.

Ícones: **Tabler Icons** (`@tabler/icons-react`), traço `1.5` (`TRACO`), 16px em tabela e
campo, 18–20px em navegação e cabeçalho de cartão. Sempre `aria-hidden` quando acompanham texto.

---

## 7. Gráficos

SVG próprio (`components/graficos/graficos.tsx`), medido com `ResizeObserver`, sem biblioteca.

| Gráfico | Uso | Detalhes |
| --- | --- | --- |
| `GraficoArea` | Vendas por dia | Gradiente da série, grade horizontal, rótulos do eixo X rareados pela largura, tooltip com valor e nº de vendas |
| `GraficoBarras` | Comparar feiras | Séries agrupadas com legenda |
| `GraficoRosca` | Canal, forma de pagamento | Total no centro; legenda com % e valor; empilha pela largura do cartão (container query) |
| `BarrasHorizontais` | Ranking de barraquinhas e itens | 1º lugar em amarelo, demais em azul |
| `Sparkline` | Tendência dentro do KPI | Sem eixos |

Todo gráfico tem `role="img"` e `aria-label`; os números também aparecem em texto (legenda,
tabela ou tooltip), então a cor nunca é a única fonte da informação.

---

## 8. Tempo real

Os dois painéis (feira e barraquinha) se atualizam sozinhos, sem servidor de WebSocket
(roda no XAMPP e em hospedagem comum):

1. O painel recebe a prop `versao`, uma assinatura das vendas, cancelamentos e lançamentos
   (e, no do admin, do cadastro das barraquinhas), calculada **antes** dos dados.
2. `useTempoReal` consulta `GET …/pulso` a cada 3s (uma consulta agregada, poucos bytes).
3. Versão diferente → recarga parcial do Inertia só com as props do painel. As props são
   closures no controller, então só essas consultas rodam. Filtros, rolagem e estado da
   tela são preservados.
4. Aba escondida pausa as consultas; voltar à aba sincroniza na hora. Sem rede, recua
   até 30s. Sessão expirada para as consultas.

Na tela: selo **● Ao vivo · agora ⟳** (verde pulsando; amarelo atualizando; cinza
pausado; vermelho sem conexão), anunciado a leitores de tela, com botão de atualizar.
Venda nova acende em amarelo na lista "Últimas vendas" e esmaece.

Para trocar por WebSocket no futuro (Reverb/Pusher): basta transmitir um evento com a
nova versão e chamar a mesma recarga parcial; o resto da tela não muda.

---

## 9. Responsividade

Testado de 360px a 1920px; nenhuma tela pode ter rolagem horizontal da página.

| Faixa | Comportamento |
| --- | --- |
| `< md` (até 767px) | Sidebar vira gaveta; **tabelas viram cartões**; filtros recolhidos em "Filtros (n)"; ações quebram linha; botão flutuante **Nova venda** (barraquinha) |
| `md` – `lg` | Tabelas completas (rolagem interna se faltar espaço); grades de 2 colunas |
| `lg+` | Sidebar fixa; formulários em 3 colunas (form + ajuda) |
| `xl+` | Painel em 12 colunas |
| `2xl+` | 5 KPIs na mesma linha |

**Tabela → cartão.** Abaixo de `md` cada linha vira um cartão: a célula `cabecalho` é o
título, cada coluna vira "rótulo: valor" (os rótulos vêm das próprias colunas) e a coluna
`acoes` vai para o rodapé do cartão. Coluna secundária: `cartao: "oculta"`. A ordenação
continua por um seletor acima da lista. Nenhuma página precisa repetir marcação.

**PDV no celular.** Cartões de item grandes (alvo ≥ 44px) em 2 colunas, canal e pagamento
em segmentos, barra fixa no rodapé com total e "Registrar venda" (respeita a área segura do
aparelho); no desktop o carrinho é uma coluna fixa à direita.

---

## 10. Acessibilidade, idioma e tema

- Foco visível em tudo que é clicável: `outline-none focus-visible:ring-2 focus-visible:ring-foco`.
- Contraste AA em texto (`tinta-suave` é o mais claro permitido para texto essencial).
- Diálogos, menus, seleção, rádios, caixas e dicas vêm do Radix: foco preso e devolvido,
  navegação por teclado e papéis ARIA corretos sem código próprio.
- `prefers-reduced-motion` desliga animações.
- **Direção**: só propriedades lógicas (`ms`/`me`, `ps`/`pe`, `start`/`end`, `text-start`,
  `border-s`/`border-e`); os gráficos mantêm coordenadas físicas.
- **Idioma**: todo texto passa por `t("Frase em português")`; inglês em `lang/en.json`.
- **Tema**: claro/escuro pela classe `.dark` no `<html>`, escolhido no topo e lembrado no
  navegador; o script no `app.blade.php` aplica antes de pintar (sem piscar).

---

## 11. Regras para quem for criar tela

1. Monte com o kit (`components/ui`, `components/painel`, `components/graficos`); se faltar
   peça, crie no kit sobre o primitivo Radix correspondente, não na página.
2. Tabela sempre com `Tabela`/`Linha`/`Celula` (ganha o modo cartão de graça).
3. Só tokens; token novo vai em `:root`, `.dark` e `@theme inline` do `tokens.css`.
4. Amarelo só como fundo com `text-secundaria-tinta`.
5. Confira em 360px, 768px e 1440px, claro e escuro, pt-BR e inglês.
