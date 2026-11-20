# Feira Gastronômica UNAERP

Gestão de vendas e caixa das barraquinhas da Feira Gastronômica (UNAERP / Projeto PEG),
conforme a _Especificação Funcional – App de Gestão da Feira Gastronômica_ (27/10/2026).

- O **admin** (professor) cria as feiras, define quantas barraquinhas participam, cria e
  redefine os acessos, e acompanha vendas, saídas, saldos e o consolidado de cada edição.
- Cada **barraquinha** cadastra itens e combos, registra vendas no PDV, lança entradas e
  saídas e exporta os próprios relatórios, sem nunca ver dados de outra barraquinha.

## Stack

| Camada     | Tecnologia                                                                           |
| ---------- | ------------------------------------------------------------------------------------ |
| Back-end   | PHP 8.2+, Laravel 12, sessão nativa (sem JWT)                                        |
| Front-end  | React 19 + TypeScript via Inertia.js v3 (monolito, sem API separada)                 |
| UI         | Radix Primitives (acessibilidade) + Tailwind CSS v4 (tokens), ícones Tabler, fonte Plus Jakarta Sans (`DESIGN.md`) |
| Banco      | MySQL 8 ou MariaDB 10.4+, só tabelas (sem views, triggers nem functions)             |
| Relatórios | XLSX e CSV próprios, PDF com dompdf                                                  |
| Testes     | PHPUnit 11 (SQLite em memória ou MySQL/MariaDB)                                      |

Dependências auditadas: `composer audit` e `npm audit` sem vulnerabilidades conhecidas.

## Como rodar (XAMPP)

```bash
composer install
npm install
cp .env.example .env          # ajuste DB_* e APP_URL
php artisan key:generate
# crie o banco "feira_gastronomica" (utf8mb4) no MySQL/MariaDB
php artisan migrate --seed
npm run build                 # ou "npm run dev" durante o desenvolvimento
```

Acessos de demonstração (seeder; senha em `FEIRA_SENHA_DEMO`):

| Perfil           | Usuário                                                         | Senha       |
| ---------------- | --------------------------------------------------------------- | ----------- |
| Admin            | `coordenacao`                                                   | `feira2027` |
| Barraquinha 2027 | `senhor-dos-pasteis-2027`, `crepeuna-2027`, `pizzarito-2027`... | `feira2027` |

Dados carregados:

- **Feira 2026 (encerrada)**: os 11 totais do anexo da especificação (vendas, custos,
  despesas). O consolidado bate com o relatório: R$ 164.172,67 em vendas, resultado de
  R$ 21.674,75, margem de 13,2%.
- **Feira 2027 (aberta)**: 12 vagas (11 barraquinhas e 1 em branco), itens e combos dos
  exemplos do relatório (Combo do Guerreiro, O Hobbit e o Dragão, Eu Mereço, Combo
  família, Combo com molho) e algumas vendas.

Recriar o banco do zero:

```bash
php artisan migrate:fresh --seed
```

## Testes

```bash
composer test                                                    # SQLite
DB_CONNECTION=mysql DB_DATABASE=feira_gastronomica_testes \
    php vendor/bin/phpunit                                       # MySQL/MariaDB
npx tsc --noEmit                                                 # tipos do front
```

Os testes cobrem a tabela de exemplos de classificação da seção 7, isolamento entre
barraquinhas, autenticação (mensagem genérica, bloqueio após 5 tentativas, troca de senha),
combos, feiras, relatórios, indicadores contra o anexo de 2026 e a completude das traduções.

## Deploy (branch prod + git ftp)

O servidor não roda `composer` nem `npm`, então há duas branches:

| Branch | Conteúdo | Uso |
| --- | --- | --- |
| `master` | Só código-fonte, com `.gitignore` (sem `vendor/` nem `public/build/`) | Desenvolvimento e commits do dia a dia |
| `prod` | Código da master + `vendor/` de produção (sem dev) + `public/build/` compilado, **sem** o `.gitignore` | `git ftp push` |

A `prod` não é editada à mão: o script a gera a partir do último commit da master, numa
pasta irmã (`../unaerp-prod`, uma *worktree* do git), sem mexer no `vendor/` local.

```bash
# na master, com tudo commitado
bash scripts/publicar-prod.sh            # atualiza a prod
cd ../unaerp-prod && git ftp push        # envia (1ª vez: git ftp init, ou git ftp catchup)
# ou tudo de uma vez:
bash scripts/publicar-prod.sh --push
```

O que o script garante:

- o `public/build/` sai do código commitado (`npm run build`) e o `vendor/` vem de
  `composer install --no-dev --optimize-autoloader`;
- a prod ganha o `.htaccess` da raiz (`deploy/raiz.htaccess`): o projeto sobe para o
  `htdocs`, que é a raiz web, e todo pedido é reescrito para `public/`, então `.env`,
  `vendor/` e `storage/` nunca são servidos; o `public/.htaccess` local também vai;
- `.env`, `node_modules/` e `auth.json` nunca entram (o script recusa o commit);
- cada commit da prod tem a master como segundo pai (`git log prod` mostra a origem).

O `.git-ftp-ignore` evita enviar o que só serve para desenvolver (testes, `resources/js`,
documentação, configs do Node). O `.env` do servidor é criado uma vez, à mão, por FTP.

As fotos enviadas (perfil e barraquinha) ficam em `public/fotos/` no servidor: não são
versionadas e o `git ftp push` não as toca. A pasta precisa aceitar escrita pelo PHP; o
`public/fotos/.htaccess` (versionado) só deixa servir imagens.

## Como as exigências foram atendidas

### Isolamento total (na aplicação)

O banco tem só tabelas, sem views, triggers nem functions, para subir em hospedagem
compartilhada (InfinityFree e similares) que não aceita esses objetos. O isolamento fica
todo na aplicação:

- o escopo global `BarraquinhaScope` filtra toda consulta da barraquinha pelo id da
  sessão, nunca por parâmetro da tela, e o `creating` do trait grava o `barraquinha_id`
  da sessão em todo registro novo;
- link ou id alterado para dado de outra barraquinha responde _403 Acesso negado_ e grava
  auditoria (`PertenceABarraquinha`); nas rotas do admin, o `LojaCoerente` confere que os
  registros da URL são da barraquinha escolhida;
- feiras e barraquinhas só são gravadas pelas rotas do admin (`perfil:admin`), e a trilha
  de auditoria só recebe insert (`AuditoriaLog::registrar()`);
- a barraquinha não recebe no navegador nem os nomes das rotas do admin (Ziggy por grupo).

### Perfil, fotos e checkout da barraquinha

- **Meu perfil** (admin e barraquinha): foto, nome, tema, idioma e atalho para a senha.
- **Configurações da barraquinha**: foto da barraquinha e o jeito do checkout (PDV), escolhido
  pelo gestor: formas de pagamento aceitas e a já marcada, canal padrão, itens em grade ou
  lista, por categoria ou não, em ordem alfabética ou de mais vendidos, lista de combos,
  calculadora de troco, chave Pix com botão de copiar e confirmação antes de registrar.
- A foto é recortada e reduzida no navegador antes do envio (algumas dezenas de KB), então o
  servidor não precisa da extensão GD.

### Navegação e transições

- Os links fazem prefetch ao passar o mouse: a tela abre na hora e se atualiza sozinha em
  segundo plano se o dado tiver mais de 15 s. Qualquer gravação limpa esse cache.
- No tempo ocioso o navegador baixa o JS das telas do perfil (nunca com "economia de dados").
- O login entra sem recarregar a página: o quadro do login recua, o símbolo da UNAERP vai até
  a sidebar e o app sobe. A troca de tema é um esmaecimento único da tela.

### Design system e tema

Descrito em [`DESIGN.md`](DESIGN.md). Toda cor, fonte, raio e medida vem de
`resources/js/styles/tokens.css`: azul-marinho UNAERP `#003087` como cor principal e
amarelo `#ecdd12` como secundária (sempre com texto escuro). As telas usam só classes de
token (`bg-superficie`, `text-tinta-suave`, `bg-primaria`); o modo escuro (claro, escuro ou
o do sistema, escolhido na engrenagem do topo) troca os valores pela classe `.dark`. Os PDFs leem as mesmas cores em hex (`App\Support\Tema`).

Todas as telas são responsivas de 360px a 1920px: no celular as tabelas viram cartões, os
filtros se recolhem e a barraquinha ganha um botão flutuante de **Nova venda**.

### Painel em tempo real

Os painéis da feira e da barraquinha se atualizam sozinhos, sem servidor de WebSocket:
o navegador consulta um *pulso* (assinatura das vendas e lançamentos) a cada 3 segundos e,
quando ele muda, recarrega só os dados do painel (recarga parcial do Inertia). Pausa com a
aba escondida. Detalhes na seção 8 do `DESIGN.md`.

### Internacionalização

Português (padrão) e inglês, escolhidos pelo usuário (guardado no perfil).
As chaves são as próprias frases em português, tanto no PHP (`__()`) quanto no React (`t()`).
O dicionário inglês está em `lang/en.json`, e o `TraducoesTest` falha se alguma frase
ficar sem tradução. Moeda, números e datas são formatados por `Intl` no navegador e por
`lang/*/formato.php` nas exportações.

### Pontos em aberto da especificação (decisões adotadas)

| #   | Ponto                                | Decisão                                                                                                                       |
| --- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | Admin registra vendas?               | Não. Consulta e corrige (cancela com motivo); o PDV é da barraquinha.                                                         |
| 2   | Controle de estoque?                 | Opcional por item: a baixa é calculada (inclui itens vendidos em combos), mostra "Restam N"/"Esgotado", sem bloquear a venda. |
| 3   | Formas de pagamento e taxa de cartão | Dinheiro, Pix e Cartão. A taxa de cartão é lançada como despesa (categoria própria).                                          |
| 4   | Pré-venda                            | Registrada no PDV pelo canal Pré-venda, com preço próprio por item. Sem fluxo de retirada.                                    |
| 5   | Desconto de combo                    | Os dois: preço fechado ou percentual; a tela calcula o outro valor.                                                           |
| 6   | Item em mais de um combo             | Maior desconto para o cliente; no empate, o combo que cobre mais itens. Combo mais caro que a soma avulsa nunca é aplicado.   |
| 7   | Vários operadores                    | Um login por barraquinha (cada venda grava o operador, pronto para ampliar).                                                  |
| 8   | Modo offline                         | Não implementado. Cada tela do PDV baixa poucos KB; validar a rede do local.                                                  |

### Outras regras

Senhas com hash (bcrypt); o admin só gera outra, nunca vê a existente. A senha gerada
aparece uma única vez, num _flash_ do Inertia que não entra no histórico do navegador.
Redefinir ou bloquear encerra as sessões abertas. Primeira entrada com senha gerada
exige troca. Sessão expira por inatividade (`SESSION_LIFETIME`). Feira encerrada
bloqueia lançamentos e congela relatórios. Vendas guardam o preço e a tag da época.

## Estrutura

```
app/
  Enums/                 Canal, FormaPagamento, LancamentoCategoria (grupos), AcaoAuditoria...
  Http/Controllers/      Admin/ (feiras, barraquinhas, auditoria) · Loja/ (telas dos dois perfis)
  Http/Apresentacao.php  models → props enxutas para o React
  Http/RotasDaLoja.php   mesmas rotas em /barraquinha/... e /admin/barraquinhas/{id}/...
  Services/              Vendas/ClassificadorVenda (Comum × Combo N), Financeiro/, Relatorios/
  Support/               Loja, Formato, Tema, Xlsx/XlsxWriter
resources/js/
  pages/                 páginas Inertia (admin/, loja/, auth/)
  components/ui/         kit: botão, campos, cartão, tabela (modo cartão), diálogo, menu...
  components/painel/     filtros, widgets do painel, selo "Ao vivo"
  components/graficos/   gráficos SVG (área, barras, rosca, sparkline)
  components/app/        shell (sidebar, topo, gaveta), paleta de comandos, tema
  hooks/useTempoReal.ts  pulso + recarga parcial do painel
  styles/tokens.css      design system (fonte única de cores, fontes e medidas)
lang/en.json             dicionário inglês (chaves em português)
DESIGN.md                design system · AGENTS.md: regras de interface para agentes
```

