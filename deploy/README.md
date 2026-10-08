# Manual deployment to bentito.com

Run from a checkout on the **Linux server as `bentito`**, at
`/var/www/bentito/ERP-Website`. This does not need GitHub Actions or GitHub secrets.
It does require SSH/server access and sudo permission for systemd service control.
The script deploys the checked-out files, including uncommitted edits; it does not
pull Git, upload files, install runtimes, change DNS or alter Nginx automatically.

## Requirements

- Node.js **22.16 or later** (Node 22 LTS recommended), available on PATH.
- Bun **1.4.2**, available on PATH, and network access for locked dependency install.
- Bash, Git, curl, flock, systemd and sudo.
- Nginx, a valid HTTPS certificate for `bentito.com`, and DNS pointing to this host.
- Loopback ports **3100** (site) and **3197** (temporary smoke test) available.
  `SMOKE_PORT` can change the test port. The live port is fixed in the service/template.
- Enough disk for dependencies, build, retained releases and SQLite backups.

The existing Cloudflare build remains `bun run build`. Manual deployment uses
`bun run build:standalone`, a Node SSR build with SQLite demo-request storage.
It starts a production HTTP server, not the Vite development server.

## First deployment

Copy the current repository files to the server (or pull the intended commit if
these changes have already been committed and pushed). Do not copy `.deploy` or
`node_modules` from another machine. Then run:

```bash
cd /var/www/bentito/ERP-Website
node --version
bun --version
bash deploy.sh --setup
bash deploy.sh
```

`--setup` installs and enables `snaperp-website.service` but does not start it.
It refuses to overwrite a differing existing unit. The generated unit is also
saved at `.deploy/snaperp-website.service` for review. Its Node path is captured
from PATH, so reinstall/review the service if you move Node later.

After the script passes, inspect **the existing bentito.com Nginx virtual host**.
Use `deploy/nginx.conf` as the complete desired configuration, or merge its
`location /` proxy block into the existing HTTPS host. Keep correct certificate
paths. Do not create two virtual hosts for the same domain. Do not modify the
separate FA/ERP virtual host for `erp.werevu.co.ke`.

If there is no existing bentito.com configuration and the template's certificate
paths exist, an administrator can install it:

```bash
sudo install -m 644 deploy/nginx.conf /etc/nginx/sites-available/bentito.com
sudo ln -s /etc/nginx/sites-available/bentito.com /etc/nginx/sites-enabled/bentito.com
sudo nginx -t && sudo systemctl reload nginx
curl --fail https://bentito.com/healthz
```

The final health response must contain `status: ok` and the release ID printed by
the script. Check the homepage, features, integrations, pricing and theme switch
in a browser. Confirm the certificate and public routing before calling the site live.

## Later deployments

Update the source checkout, then run `bash deploy.sh` again. The script:

1. Locks deployment and validates tools, location, user and service installation.
2. Installs locked dependencies; runs lint, tests, TypeScript/UI checks and build.
3. Copies a release into `.deploy/releases/<commit>-<time>-<process>`.
4. Tests the actual bundle on a temporary port and database: all public routes,
   static files, migrations, demo submission, duplicates, rate limit and origin checks.
5. Backs up the existing SQLite database, including WAL contents, with `VACUUM INTO`.
6. Applies each new SQL migration transactionally, recording applied names.
7. Atomically switches `.deploy/current`, restarts the service and checks its
   release ID, database availability, pages and assets over loopback.
8. Restores the previous code symlink and restarts it if activation checks fail.
   A failed first release is stopped instead. The command returns nonzero on failure.

There is a short restart window; this is not a zero-downtime deployment.
Nginx/DNS/TLS failures are not automatically repaired. Database migrations are
not reversed by code rollback; keep them compatible with the previous release.
Backups and old releases are retained, never automatically deleted.

## Data and operations

Demo requests live in `.deploy/shared/demo.sqlite`, outside code releases.
The shared directory and backups are private (0700), and the service runs with
umask 0077. Keep database backups off-server using your normal backup procedure.
This creates a **new local database**; existing Cloudflare D1 submissions are not
copied. Submissions are stored, not emailed.

Nginx must overwrite `X-Real-IP` as shown in the template. The application binds
only to `127.0.0.1` and uses that trusted proxy header for rate limiting.

```bash
sudo systemctl status snaperp-website
sudo journalctl -u snaperp-website -n 100 --no-pager
curl --fail http://127.0.0.1:3100/healthz
```

To build and smoke-test without systemd or production changes (also on macOS):

```bash
bash deploy.sh --build-only
```

The script prints the tested release directory. No GitHub workflow is modified
or enabled by this manual deployment path.
