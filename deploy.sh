#!/usr/bin/env bash
# Run on the production server as bentito. Does not pull Git or modify Nginx.
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-deploy}"
case "$MODE" in deploy|--build-only|--setup) ;; --help|-h)
  echo 'Usage: ./deploy.sh [--setup|--build-only]'
  echo 'Run --setup once to install the systemd service, then ./deploy.sh to release.'
  echo 'Requires Node >=22.16, Bun 1.4.2, Linux/systemd and sudo for service control.'
  exit 0;; *) echo "Unknown option: $MODE" >&2; exit 2;; esac
NODE="$(command -v node || true)"
BUN="$(command -v bun || true)"
[[ -n "$NODE" && -n "$BUN" ]] || { echo 'Install Node >=22.16 and Bun 1.4.2 first.' >&2; exit 1; }
"$NODE" -e 'const [major,minor]=process.versions.node.split(".").map(Number);if(major<22||(major===22&&minor<16))process.exit(1)' || { echo 'Node >=22.16 required' >&2; exit 1; }
[[ "$("$BUN" --version)" == '1.4.2' ]] || { echo 'Use Bun 1.4.2 to match the lockfile and CI.' >&2; exit 1; }
BASE="$ROOT/.deploy"
SERVICE=snaperp-website
mkdir -p "$BASE/releases" "$BASE/shared" "$BASE/backups"
chmod 700 "$BASE/shared" "$BASE/backups"
export SNAPERP_DATABASE="$BASE/shared/demo.sqlite"
export SITE_ORIGIN=https://bentito.com
export PORT=3100
if [[ "$MODE" != --build-only ]]; then
  [[ "$(uname -s)" == Linux ]] || { echo 'Deployment requires Linux/systemd. Use --build-only locally.' >&2; exit 1; }
  [[ "$ROOT" == /var/www/bentito/ERP-Website ]] || { echo 'Production checkout must be /var/www/bentito/ERP-Website' >&2; exit 1; }
  [[ "$(id -un)" == bentito ]] || { echo 'Run as bentito, not root.' >&2; exit 1; }
  command -v flock >/dev/null
  exec 9>"$BASE/deploy.lock"
  flock -n 9 || { echo 'Another deployment is running.' >&2; exit 1; }
fi
if [[ "$MODE" == --setup ]]; then
  [[ "$NODE" != *' '* ]] || { echo 'Node executable path must not contain spaces' >&2; exit 1; }
  unit="$BASE/$SERVICE.service"
  cat > "$unit" <<UNIT
[Unit]
Description=SnapERP marketing website
After=network.target
[Service]
Type=simple
User=bentito
WorkingDirectory=$BASE/current
ExecStart=$NODE $BASE/current/runtime/server.mjs
Environment=NODE_ENV=production
Environment=SITE_ORIGIN=https://bentito.com
Environment=PORT=3100
Environment=SNAPERP_DATABASE=$SNAPERP_DATABASE
Restart=on-failure
RestartSec=3
TimeoutStopSec=15
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=$BASE/shared
[Install]
WantedBy=multi-user.target
UNIT
  if sudo test -e "/etc/systemd/system/$SERVICE.service"; then
    sudo cmp -s "$unit" "/etc/systemd/system/$SERVICE.service" || { echo 'Existing service differs; review it before replacement.' >&2; exit 1; }
  else
    sudo install -m 644 "$unit" "/etc/systemd/system/$SERVICE.service"
  fi
  sudo systemctl daemon-reload
  sudo systemctl enable "$SERVICE"
  echo 'Service installed. Run ./deploy.sh, then configure Nginx using deploy/nginx.conf.'
  exit 0
fi
if [[ "$MODE" == deploy ]]; then
  sudo -v
  sudo systemctl cat "$SERVICE" >/dev/null || { echo 'Run ./deploy.sh --setup first.' >&2; exit 1; }
fi
# Build before touching the running release. This deploys exactly this checkout.
cd "$ROOT/app"
"$BUN" install --frozen-lockfile
"$BUN" run lint
"$BUN" run test
"$BUN" run build:standalone
revision="$(git -C "$ROOT" rev-parse --short=12 HEAD)-$(date -u +%Y%m%dT%H%M%SZ)-$$"
release="$BASE/releases/$revision"
mkdir "$release"
cp -R dist runtime migrations "$release/"
printf '{"type":"module"}\n' > "$release/package.json"
printf 'User-agent: *\nAllow: /\nDisallow: /_serverFn/\nSitemap: https://bentito.com/sitemap.xml\n' > "$release/dist/client/robots.txt"
printf '%s\n' "$revision" > "$release/REVISION"
test -s "$release/dist/server/server.js"
test -s "$release/dist/client/journey.html"
"$NODE" "$ROOT/deploy/smoke.mjs" "$release"
if [[ "$MODE" == --build-only ]]; then
  echo "Built release: $release"
  exit 0
fi
if [[ -s "$SNAPERP_DATABASE" ]]; then
  # VACUUM INTO captures WAL contents in a consistent, standalone backup.
  SNAPERP_BACKUP="$BASE/backups/$revision.sqlite" "$NODE" --input-type=module -e 'import {DatabaseSync} from "node:sqlite";const db=new DatabaseSync(process.env.SNAPERP_DATABASE);db.prepare("VACUUM INTO ?").run(process.env.SNAPERP_BACKUP);db.close();'
fi
"$NODE" "$release/runtime/migrate.mjs"
previous="$(readlink "$BASE/current" || true)"
if [[ -e "$BASE/current" && ! -L "$BASE/current" ]]; then echo 'Refusing to replace a non-symlink current path.' >&2; exit 1; fi
activated=false
rollback() {
  local result=$?
  trap - EXIT
  if [[ "$result" != 0 && "$activated" == true ]]; then
    echo 'Release failed; restoring previous code.' >&2
    if [[ -n "$previous" ]]; then
      ln -s "$previous" "$BASE/rollback-$$"
      mv -Tf "$BASE/rollback-$$" "$BASE/current"
      sudo systemctl restart "$SERVICE" || true
    else
      sudo systemctl stop "$SERVICE" || true
      unlink "$BASE/current"
    fi
    echo 'Database migrations are not reversed. A pre-release backup is retained when a database existed.' >&2
  fi
  exit "$result"
}
trap rollback EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
ln -s "$release" "$BASE/next-$$"
activated=true
mv -Tf "$BASE/next-$$" "$BASE/current"
sudo systemctl restart "$SERVICE"
healthy=false
for attempt in {1..20}; do
  if curl --fail --silent --max-time 3 http://127.0.0.1:3100/healthz | "$NODE" --input-type=module -e 'let s="";for await(const c of process.stdin)s+=c;const h=JSON.parse(s);if(h.status!=="ok"||h.revision!==process.argv[1])process.exit(1)' "$revision" 2>/dev/null; then
    healthy=true; break
  fi
  sleep 1
done
[[ "$healthy" == true ]] || { echo 'Release health check failed.' >&2; exit 1; }
for route in / /features /integrations /pricing /journey.html /theme.js; do
  curl --fail --silent --show-error --max-time 10 "http://127.0.0.1:3100$route" -o /dev/null
done
trap - EXIT INT TERM
printf 'Deployed %s\nVerify public routing: curl --fail https://bentito.com/healthz\n' "$revision"
