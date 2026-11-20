# Regras de interface da Feira Gastronômica UNAERP

React 19 + Inertia v3 + **Radix Primitives** (`radix-ui`, comportamento e acessibilidade) +
**Tailwind CSS v4** (visual, só tokens). O kit é do próprio projeto, em `resources/js/components/`. Descrição completa do design system em
`DESIGN.md`; manutenção geral em `SKILL.md`. Estas regras valem para todo código de tela.

## Componentes primeiro

- Antes de escrever marcação, procure a peça no kit: `components/ui` (botão, campos,
  cartão, tabela, diálogo, menu, marcadores, avisos, paginação), `components/painel`
  (filtros, widgets, selo ao vivo), `components/graficos` e `components/app` (shell, paleta).
- Faltou peça? Crie no kit, com tokens, e reutilize; não duplique visual dentro da página.
- Tudo que é interativo parte de um primitivo Radix (`import { Dialog } from "radix-ui"`):
  diálogo/folha (`Dialog`, `AlertDialog`), menu (`DropdownMenu`), seleção (`Select`),
  caixa (`Checkbox`), interruptor (`Switch`), escolha única (`RadioGroup`), dica (`Tooltip`),
  aviso (`Toast`), recolher (`Collapsible`), progresso (`Progress`), rótulo (`Label`), avatar
  (`Avatar`). Nunca escreva `<dialog>`, `<select>`, `role="switch"` ou similares à mão.
- Estilize estados pelos atributos do Radix: `data-[state=open]:`, `data-[state=checked]:`,
  `data-[highlighted]:`, `data-[disabled]:`. Camadas em `Portal`, com `z-50`/`z-60`.
- Importe pelo alias `@/` (`import { Botao } from "@/components/ui/botao"`).

## Cor: só tokens

- Nada de hex, `white`, `black`, `gray-*`, `zinc-*` nem `dark:`. As cores vêm de
  `resources/js/styles/tokens.css` e o modo escuro troca os valores sozinho.
- Texto: `text-tinta`, `text-tinta-media`, `text-tinta-suave`, `text-tinta-fraca` (só não essencial).
- Superfícies: chão `bg-fundo` (cinza), cartões `bg-superficie`; `bg-superficie-suave`/`-hover`/`-ativa` para estados.
- Bordas: `border-linha`, `border-linha-forte`; contorno de cartão `border-cartao-borda` (some no claro). Véu: `bg-veu`.
- Invertido (contador, dica, botão `escuro`): `bg-inverso` + `text-inverso-tinta`.
- Marca: `bg-primaria` + `text-primaria-tinta` (ação principal, item ativo);
  `bg-secundaria` + `text-secundaria-tinta` (destaque); `bg-secundaria-suave` + `text-secundaria-texto`.
  **Amarelo nunca é cor de texto.**
- Valores: `text-positivo` / `text-negativo` (com ícone, não só cor).
- Chips e agenda: pastéis `rosa`, `verde`, `azul`, `ambar`, `vermelho` com `-suave` e `-tinta`.
- Gráficos: `CORES` de `components/graficos` (tokens `grafico-1` a `grafico-6`); dado em barra leva
  `hachura` (listras) e o que está fora de foco fica `bg-grafico-inativo`.
- Token novo: declare em `:root`, `.dark` e `@theme inline` do `tokens.css`.

## Tipografia

- Utilitários do projeto: `text-micro`, `text-rotulo`, `text-corpo`, `text-ui`,
  `text-titulo`, `text-numero`, `text-cabecalho`, `text-valor` (valor principal do cartão),
  com peso `font-semibold`. Números com `tabular-nums`.
- Plus Jakarta Sans para tudo (a marca em `font-extrabold`).

## Espaço e forma

- Escala do Tailwind (`gap-4`, `p-4`); prefira `gap` a margens por filho. Valor arbitrário
  só com motivo (ex.: `env(safe-area-inset-bottom)`).
- Cartões sempre pelo `Cartao` (`rounded-cartao border-cartao-borda bg-superficie`, sem sombra);
  campos e botões `rounded-controle`; itens da sidebar `rounded-xl`; chips `rounded-full`.
- Sombra só no que flutua (`shadow-flutuante`: menus, popovers, dicas, diálogos).

## Responsividade (obrigatória)

- Toda tela funciona de 360px a 1920px sem rolagem horizontal da página.
- Tabela sempre com `Tabela`/`Linha`/`Celula`: abaixo de `md` vira cartões
  automaticamente (célula `cabecalho` = título, coluna `acoes` = rodapé; coluna
  secundária com `cartao: "oculta"`).
- Grades com `grid-cols-1` no celular; formulários `lg:grid-cols-3` (form + ajuda).
- Ações em `flex flex-wrap`; textos longos com `min-w-0` + `truncate` ou quebra.
- Alvo de toque ≥ 40px no celular (≥ 44px no PDV). Componentes que dependem da largura
  do cartão usam container query (`@container` / `@md:`).

## Mecânica

- Direção: o `Provedores` envolve tudo no `Direction.Provider` do Radix pelo idioma. Só
  propriedades lógicas (`ms`/`me`, `ps`/`pe`, `inset-s`/`inset-e`, `text-start`/`text-end`,
  `border-s`/`border-e`, `rounded-s`/`rounded-e`). Gráficos e geometria medida ficam físicos.
- Classes com `cx()` de `@/lib/cx`; nada de concatenação de string.
- Ícones de `@tabler/icons-react`, `stroke={TRACO}`, passados como componente
  (`icone={IconPlus}`); `aria-hidden` quando há texto ao lado. Botão só de ícone: `aria-label`
  + `Dica` (nunca `title`).
- Foco: `outline-none focus-visible:ring-2 focus-visible:ring-foco`.
- Texto sempre por `t("Frase em português")` (`useT`); tradução em `lang/en.json`.
- Datas, moeda e números por `useFormato()`; o servidor manda valores crus.
- URLs por `rota()` (Ziggy) ou `useRotaLoja()` nas telas de barraquinha.
- Tema: claro, escuro ou do sistema (`useTema`/`definirTema` de `components/app/tema`); nada de `dark:`.
- Animação curta e opcional; respeite `prefers-reduced-motion` (já global).
