#!/usr/bin/env bash

set -euo pipefail

RAIZ="$(git rev-parse --show-toplevel)"
cd "$RAIZ"
BRANCH_PROD="prod"
PASTA_PROD="${PASTA_PROD:-$(dirname "$RAIZ")/$(basename "$RAIZ")-prod}"

falhar() { echo "✗ $*" >&2; exit 1; }
passo() { echo "→ $*"; }

[ "$(git branch --show-current)" = "master" ] || falhar "Rode a partir da branch master."
[ -z "$(git status --porcelain)" ] || falhar "Há alterações não commitadas na master. Commite antes de publicar."
COMMIT="$(git rev-parse --short HEAD)"

passo "Compilando o front (npm run build)"
npm run build --silent
rm -f public/hot

if ! git show-ref --verify --quiet "refs/heads/$BRANCH_PROD"; then
    passo "Criando a branch $BRANCH_PROD"
    git branch "$BRANCH_PROD" master
fi
if [ ! -e "$PASTA_PROD/.git" ]; then
    passo "Criando a worktree em $PASTA_PROD"
    git worktree add -q "$PASTA_PROD" "$BRANCH_PROD"
fi

cd "$PASTA_PROD"
git merge --abort 2>/dev/null || true
git reset -q --hard HEAD

git merge -q -s ours --no-commit --allow-unrelated-histories master >/dev/null 2>&1 || true

passo "Sincronizando com a master ($COMMIT)"
{ git ls-tree -r -z --name-only HEAD | grep -zv -e '^vendor/' -e '^public/build/' || true; } | xargs -0 -r rm -f
git read-tree master
git checkout-index -a -f

rm -f .gitignore
cp deploy/raiz.htaccess .htaccess
if [ -f "$RAIZ/public/.htaccess" ]; then
    cp "$RAIZ/public/.htaccess" public/.htaccess
else
    echo "! public/.htaccess não existe localmente: as rotas do Laravel não funcionam no Apache sem ele." >&2
fi

rm -rf public/build
cp -r "$RAIZ/public/build" public/build

passo "Instalando o vendor de produção (composer install --no-dev)"
COMPOSER_ROOT_VERSION=dev-master composer install --no-dev --optimize-autoloader --no-interaction --no-progress --quiet

git add -A
if git diff --cached --name-only | grep -Eq '(^|/)\.env(\.backup|\.production)?$|^node_modules/|(^|/)auth\.json$'; then
    git diff --cached --name-only | grep -E '(^|/)\.env(\.backup|\.production)?$|^node_modules/|(^|/)auth\.json$' >&2
    git reset -q
    falhar "Arquivo sensível na prod. Nada foi commitado."
fi

if git rev-parse -q --verify MERGE_HEAD >/dev/null || ! git diff --cached --quiet; then
    git commit -q -m "deploy: master $COMMIT" -m "Gerado por scripts/publicar-prod.sh: código da master + vendor (sem dev) + public/build, sem .gitignore."
    passo "Branch $BRANCH_PROD atualizada: $(git log -1 --format='%h %s')"
else
    passo "A prod já estava igual à master $COMMIT."
fi

if [ "${1:-}" = "--push" ]; then
    passo "Enviando por FTP (git ftp push)"
    git ftp push || falhar "git ftp push falhou. Na primeira vez use 'git ftp init' (ou 'git ftp catchup') em $PASTA_PROD."
else
    echo
    echo "Para enviar ao servidor:"
    echo "  cd \"$PASTA_PROD\" && git ftp push"
    echo "  (primeira vez: git ftp init, ou git ftp catchup se os arquivos já estiverem lá)"
fi
