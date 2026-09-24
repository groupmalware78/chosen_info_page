#!/usr/bin/env bash
# Deploy Chosen Logistics to Railway.
#
# First run:  sets up the project, service, persistent volume, environment variables
#             and a public domain, then deploys.
# Later runs: safe to re-run. Existing settings are kept and only the code is redeployed.
#
# Usage:
#   npm run deploy
#   RAILWAY_SERVICE=web ADMIN_EMAIL=you@company.com npm run deploy
#
# Options (environment variables):
#   RAILWAY_PROJECT   Project name to create if this folder isn't linked yet (default: chosen-logistics)
#   RAILWAY_SERVICE   Service name (default: web)
#   ADMIN_EMAIL       Admin login email, used the first time the database is created
#   ADMIN_PASSWORD    Admin password for first boot. Generated if not set.
#   CUSTOM_DOMAIN     Optional custom domain, e.g. www.chosenlogistics.com
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT_NAME="${RAILWAY_PROJECT:-chosen-logistics}"
SERVICE="${RAILWAY_SERVICE:-web}"
MOUNT_PATH="/data"

bold() { printf '\n\033[1m%s\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
fail() { printf '\n\033[31mError:\033[0m %s\n' "$*" >&2; exit 1; }

# ---------- Preflight ----------

bold "Checking prerequisites"
command -v railway >/dev/null 2>&1 || fail "Railway CLI not found. Install it with: brew install railway  (or npm i -g @railway/cli)"
command -v node >/dev/null 2>&1 || fail "Node.js is required."

if ! railway whoami >/dev/null 2>&1; then
  info "Not logged in to Railway. Opening login..."
  railway login
fi
info "Logged in as $(railway whoami 2>/dev/null | tail -1)"

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  info "Note: you have uncommitted changes. 'railway up' deploys your working folder as-is, including them."
fi

bold "Checking the build locally"
npm run build --silent >/dev/null || fail "The frontend build failed. Fix it before deploying."
info "Build OK"

# ---------- Project & service ----------

bold "Project"
if railway status >/dev/null 2>&1; then
  info "Using linked project."
else
  echo "  This folder isn't linked to a Railway project yet."
  read -r -p "  Create a new project named '$PROJECT_NAME'? [Y/n, or 'l' to link an existing one] " answer
  case "${answer:-y}" in
    l|L) railway link ;;
    n|N) fail "Aborted." ;;
    *) railway init --name "$PROJECT_NAME" ;;
  esac
fi

bold "Service '$SERVICE'"
if railway service list 2>/dev/null | grep -qw -- "$SERVICE"; then
  info "Service exists."
else
  info "Creating service..."
  railway add --service "$SERVICE" >/dev/null
fi
railway service link "$SERVICE" >/dev/null
info "Linked."

# ---------- Persistent storage ----------
# SQLite database and uploaded images live in /data. Without a volume they are wiped on every deploy.

bold "Persistent volume at $MOUNT_PATH"
if railway volume list 2>/dev/null | grep -q -- "$MOUNT_PATH"; then
  info "Volume already attached."
else
  info "Creating volume..."
  railway volume add --mount-path "$MOUNT_PATH" >/dev/null
  info "Volume created."
fi

# ---------- Environment variables ----------

bold "Environment variables"
existing_vars="$(railway variable list --json 2>/dev/null || echo '{}')"
has_var() {
  VARS="$existing_vars" node -e '
    let v = {};
    try { v = JSON.parse(process.env.VARS || "{}"); } catch {}
    if (Array.isArray(v)) v = Object.fromEntries(v.map((x) => [x.name ?? x.key, x.value]));
    process.exit(v[process.argv[1]] ? 0 : 1);
  ' "$1"
}

railway variable set \
  NODE_ENV=production \
  DATA_DIR="$MOUNT_PATH" \
  TRUST_PROXY=1 \
  --skip-deploys >/dev/null
info "Set NODE_ENV, DATA_DIR, TRUST_PROXY."

if [ -n "${ADMIN_EMAIL:-}" ] || ! has_var ADMIN_EMAIL; then
  railway variable set ADMIN_EMAIL="${ADMIN_EMAIL:-admin@chosenlogistics.com}" --skip-deploys >/dev/null
  info "Set ADMIN_EMAIL=${ADMIN_EMAIL:-admin@chosenlogistics.com}"
fi

generated_password=""
if [ -n "${ADMIN_PASSWORD:-}" ]; then
  printf '%s' "$ADMIN_PASSWORD" | railway variable set ADMIN_PASSWORD --stdin --skip-deploys >/dev/null
  info "Set ADMIN_PASSWORD from your environment."
elif ! has_var ADMIN_PASSWORD; then
  generated_password="$(node -e 'process.stdout.write(require("crypto").randomBytes(15).toString("base64url"))')"
  printf '%s' "$generated_password" | railway variable set ADMIN_PASSWORD --stdin --skip-deploys >/dev/null
  info "Generated an admin password (shown at the end)."
else
  info "ADMIN_PASSWORD already set; leaving it unchanged."
fi

# ---------- Deploy ----------

bold "Deploying (build logs follow)"
railway up --ci --service "$SERVICE"

# ---------- Domain ----------

bold "Domain"
if [ -n "${CUSTOM_DOMAIN:-}" ]; then
  railway domain "$CUSTOM_DOMAIN" --service "$SERVICE" || true
  info "Add the DNS records shown above at your domain registrar."
fi
domain_output="$(railway domain --service "$SERVICE" 2>&1 || true)"
url="$(printf '%s\n' "$domain_output" | grep -Eo 'https://[A-Za-z0-9.-]+' | head -1)"

bold "Done"
if [ -n "$url" ]; then
  info "Site:  $url"
  info "Admin: $url/admin"
else
  printf '%s\n' "$domain_output" | sed 's/^/  /'
fi
if [ -n "$generated_password" ]; then
  echo
  info "Admin login (first deploy only, save it now):"
  info "  Email:    ${ADMIN_EMAIL:-admin@chosenlogistics.com}"
  info "  Password: $generated_password"
fi
info "Note: ADMIN_PASSWORD only applies when the database is first created."
info "Change the password afterwards under Admin → Account."
info "Logs: railway logs --service $SERVICE"
