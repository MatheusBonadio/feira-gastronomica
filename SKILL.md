---
name: feira-gastronomica-unaerp
description: |
    Guia para manter o sistema da Feira Gastronômica UNAERP: Laravel 12 + Inertia v3 + React 19
    (TypeScript) + Radix Primitives + Tailwind v4 (kit próprio), MySQL/MariaDB só com tabelas, i18n pt_BR/en. Use ao mexer em
    telas, rotas, feiras, barraquinhas, itens, combos, vendas (PDV), lançamentos, painéis,
    relatórios, painel em tempo real, autenticação, isolamento entre barraquinhas ou tema.
---

# Feira Gastronômica UNAERP — guia de manutenção

Visão geral, como rodar e decisões de produto: ver `README.md`.
Design system: `DESIGN.md`. Regras de interface: `AGENTS.md`.

## Regras que não podem quebrar

1. **Isolamento**: dado de barraquinha só é lido pelo id da sessão.
   - Models com `barraquinha_id` usam o trait `PertenceABarraquinha` (escopo global +
     binding de rota que responde 403 e audita). O isolamento é só da aplicação: consulta
     com `DB::table()` ou `withoutGlobalScopes()` precisa filtrar a barraquinha à mão.
   - Banco só com tabelas: nada de views, triggers, functions, procedures ou eventos nas
     migrations (a hospedagem, InfinityFree, não aceita).
   - Admin vê qualquer barraquinha pelas rotas `admin.loja.*`; o middleware `LojaCoerente`
     confere que os registros da URL são dessa barraquinha.
2. **Classificação de venda** fica só em `ClassificadorVenda` (o PDV pede prévia ao
   servidor). O operador nunca escolhe a tag.
3. **Histórico preservado**: `venda_linhas` e `venda_itens` guardam preço, nome e custo da época.
4. **Feira encerrada** bloqueia escrita: use `VendaService::garantirFeiraAberta()` nos serviços.
5. **Auditoria** via `AuditoriaLog::registrar()`; a trilha só recebe insert (nunca update ou delete).

## Convenções

- Controllers finos; regra de negócio em `app/Services`. Validação em FormRequest ou `validate()`
  com `attributes` traduzidos.
- Controllers devolvem `Inertia::render('pasta/Pagina', props)`; converta models com
  `App\Http\Apresentacao` (nunca envie o model inteiro).
- Telas compartilhadas pelos dois perfis ficam em `resources/js/pages/loja/` e usam
  `useRotaLoja()` para montar URLs.
- **Texto**: sempre `__('Frase em português')` no PHP e `t("Frase em português")` no React,
  com `:parametros`. Adicione a tradução em `lang/en.json` (o `TraducoesTest` cobra).
- **Estilo**: só tokens de `resources/js/styles/tokens.css`. Nada de hex, paleta crua ou
  `dark:`. Token novo: declare em `:root`, `.dark` e `@theme inline`.
- **Componentes**: use o kit (`components/ui`, `painel`, `graficos`, `app`); peça nova vai
  para o kit, sobre o primitivo Radix correspondente (`radix-ui`). Tabela sempre com
  `Tabela`/`Linha`/`Celula` (modo cartão no celular).
- **Responsivo**: toda tela de 360px a 1920px sem rolagem horizontal (ver `AGENTS.md`).
- **Tempo real**: painel que precise se atualizar sozinho recebe a prop `versao`
  (calculada antes dos dados, via `PulsoService`), props pesadas como closures, uma rota
  `pulso` e `useTempoReal({ url, versao, props })`. Movimento novo que deva aparecer no
  painel precisa entrar na assinatura do `PulsoService`.
- **Valores**: o servidor manda números crus; formate no React com `useFormato()`.
- Comentários só para explicar o porquê não óbvio.

## Verificação antes de entregar

```bash
php vendor/bin/phpunit                         # SQLite
DB_CONNECTION=mysql DB_DATABASE=feira_gastronomica_testes php vendor/bin/phpunit   # MySQL/MariaDB
npx tsc --noEmit && npm run build
composer audit && npm audit
```
