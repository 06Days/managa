# managa

**A modular home for your self-productivity apps.**

managa is a small platform, not another app. It installs compatible
self-productivity app bundles from GitHub, generates a dashboard card for each
one, and gives you a single switch to start or stop both sides. Each app runs as
its own process on allocated ports, with its own logs, data directory and health
checks.

The repository ships with **Taska** — the included sample task-list app — as the
reference compatible app.

```
┌──────────────────────────────┐        ┌─────────────────────────────────┐
│  managa-client (Next.js :3000)│  HTTP  │  managa-server (NestJS :5100)   │
│  dashboard / catalog / install│ ─────► │  registry · jobs · process mgr  │
└──────────────────────────────┘        └──────────────┬──────────────────┘
                                                       │ spawns and supervises
                                    ┌──────────────────┴──────────────────┐
                                    │  Taska client :3100  +  Taska API :4100 │
                                    │  (or any installed compatible app)      │
                                    └─────────────────────────────────────────┘
```

## Quick start

Requirements: **Node.js 20.12+** (22 recommended), **npm**, and **git**.

```bash
npm run install:all
npm run dev
```

Open **http://localhost:3000**.

| Service | URL |
| --- | --- |
| managa dashboard | http://localhost:3000 |
| managa server API | http://localhost:5100 |
| Swagger docs | http://localhost:5100/docs |

Taska is registered automatically on first boot. Flip its switch on the
dashboard. On the first start managa builds both components, then launches the
API on `:4100` and the client on `:3100`. Click **Open**.

> First `npm run dev` only installs the two managa packages. Taska's own
> dependencies are installed and built the first time you toggle it on, which
> keeps the platform checkout small.

### Run production builds

```bash
npm run build
npm start
```

The root scripts run both packages with prefixed output and shut them down
together. You can also run each side separately:

```bash
npm run dev:server
npm run dev:client
```

## What is in this repository

```
managa/
├── managa-server/            NestJS app server
│   ├── src/appmanager/       registry, manifests, jobs, processes, GitHub
│   ├── catalog.json          bundled / curated catalog
│   └── schema/               JSON Schema for app manifests
├── managa-client/            Next.js dashboard
│   ├── app/                  dashboard, app detail, catalog, install
│   ├── components/
│   ├── public/vendor/        vendored Bootstrap CSS and icon fonts
│   └── lib/ + hooks/         typed API client and polling hooks
├── client/taska-client/      bundled Taska client (sample compatible app)
├── server/taska-server/      bundled Taska server (sample compatible app)
├── taska.app.json            Taska's managa manifest
├── data/                     runtime state (gitignored)
└── scripts/stack.mjs         runs both managa packages
```

Runtime state is kept out of source control in `data/`:

```
data/
├── registry.json             installed apps, ports, desired state, prepared builds
├── apps/<id>/                apps cloned from GitHub
├── app-data/<id>/            writable per-app data (databases, uploads)
├── logs/<id>-client.log
├── logs/<id>-server.log
└── tmp/                      clone staging
```

## Installing an app from GitHub

Open **Install** or click **Install from GitHub** on the dashboard and paste a
repository URL. managa:

1. validates the GitHub URL and clones the repository into a staging directory;
2. reads and validates `managa.app.json` from the repository root;
3. allocates free client/server ports;
4. moves the app into `data/apps/<id>`;
5. runs the component `install` commands when `node_modules` is missing;
6. runs the component `build` commands (cached per resolved environment);
7. registers the app with its switch **off**.

Accepted inputs:

```
https://github.com/owner/repo
https://github.com/owner/repo.git
https://github.com/owner/repo#develop
owner/repo
git@github.com:owner/repo.git
```

Install, build and start commands are defined by the app manifest. **Installing
an app runs code from that repository** — only install apps you trust.

Set `MANAGA_ALLOW_GIT=false` to disable GitHub installs entirely. Private
repositories work through your normal git credential helper.

For local development you can install from a local git repository instead of
GitHub by setting `MANAGA_ALLOW_LOCAL_SOURCES=true` and pasting a path or
`file://` URL into the install form. This is a development-only escape hatch —
leave it off in any environment you expose to others.

## The app manifest

Any repository with a `managa.app.json` at its root is a compatible app. At
least one of `client` or `server` is required.

```json
{
  "$schema": "./managa-server/schema/app-manifest.schema.json",
  "id": "hello-managa",
  "name": "Hello Managá",
  "description": "A tiny compatible app.",
  "version": "0.1.0",
  "icon": "👋",
  "tags": ["example"],
  "client": {
    "dir": "client",
    "port": 3100,
    "install": "npm ci",
    "build": "npm run build",
    "buildOutput": ".next",
    "start": "npm run start",
    "healthPath": "/",
    "env": {
      "NEXT_PUBLIC_API_URL": "{{serverUrl}}"
    }
  },
  "server": {
    "dir": "server",
    "port": 4100,
    "install": "npm ci",
    "build": "npm run build",
    "buildOutput": "dist",
    "start": "npm run start:prod",
    "healthPath": "/",
    "env": {
      "DATABASE_PATH": "{{appDataDir}}/database.sqlite"
    }
  }
}
```

### Component fields

| Field | Required | Purpose |
| --- | --- | --- |
| `dir` | yes | Component directory relative to the app root. Cannot escape it. |
| `start` | yes | Foreground start command (production server, not a dev watcher). |
| `install` | no | Dependency install command, run when `node_modules` is absent. |
| `build` | no | Production build command. |
| `buildOutput` | no | Artefact checked after building (`.next`, `dist`, …). |
| `port` | no | Preferred port. managa picks the next free port if taken. |
| `healthPath` | no | Path polled until it returns non-5xx. Defaults to `/`. |
| `readyTimeoutMs` | no | Startup health timeout. Defaults to 45000. |
| `env` | no | Environment variables, with `{{token}}` substitution. |

### Environment tokens

| Token | Value |
| --- | --- |
| `{{serverUrl}}` / `{{clientUrl}}` | Public URL on the allocated port |
| `{{serverPort}}` / `{{clientPort}}` | Allocated port |
| `{{appDir}}` | App root directory |
| `{{componentDir}}` | Current component directory |
| `{{appDataDir}}` | Writable per-app data directory |
| `{{dataDir}}` | managa data directory |
| `{{appId}}` / `{{appName}}` | App identity |

managa always injects `PORT`, `MANAGA=1`, `MANAGA_APP_ID` and
`MANAGA_APP_URL`.

`buildOutput` is cached together with a hash of the resolved environment. If the
allocated ports (and therefore URLs) change, the app is rebuilt on the next
start. Builds can also be forced from the app detail page after stopping the
app.

## Dashboard

- **Dashboard** — generated cards for every installed app. Each card shows the
  client/server state, ports, source, version and a master switch. Actions:
  open, manage, logs, uninstall, toggle.
- **App detail** — component health, PIDs, ports, URLs, start commands, full
  logs, rebuild and uninstall.
- **Catalog** — bundled apps plus optional remote catalog entries. Restore an
  uninstalled bundled app in one click.
- **Install** — GitHub install form.

The dashboard polls the managa server every few seconds, so status updates and
auto-start transitions appear without a refresh.

### Offline UI assets

The dashboard is built on Bootstrap 5.3.8 with Bootstrap Icons 1.13.1. Both are
checked into `managa-client/public/vendor/` together with their web fonts, and
`app/layout.tsx` loads them from `/vendor/...`. There are no CDN links, remote
fonts or external images, so the dashboard renders fully offline. The favicon is
a local SVG at `managa-client/public/favicon.svg`.

## API

All endpoints are under `/appmanager`. Swagger is at `/docs`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/appmanager/apps` | List installed apps and runtime state |
| `GET` | `/appmanager/apps/:id` | One app |
| `POST` | `/appmanager/apps/install` | Install from GitHub (`202` + job) |
| `POST` | `/appmanager/apps/:id/start` | Start server then client |
| `POST` | `/appmanager/apps/:id/stop` | Stop the app |
| `POST` | `/appmanager/apps/:id/toggle` | Body `{ "enabled": true }` |
| `POST` | `/appmanager/apps/:id/rebuild` | Rebuild a stopped app |
| `DELETE` | `/appmanager/apps/:id` | Stop + uninstall (`?purgeData=true` optional) |
| `GET` | `/appmanager/apps/:id/logs?component=server` | Log tail |
| `GET` | `/appmanager/jobs/:id` | Poll a job (progress + streamed output) |
| `GET` | `/appmanager/catalog` | Bundled + remote catalog |
| `POST` | `/appmanager/builtins/:id/install` | Restore an uninstalled bundled app |
| `GET` | `/` | managa server info + summary |
| `GET` | `/health` | Health probe |

Long-running actions (install, start, stop, uninstall, rebuild) return a job
immediately. Poll the job for progress and logs.

## Configuration

`managa-server/.env` is loaded automatically if present. See
`managa-server/.env.example`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5100` | managa server port |
| `MANAGA_ROOT_DIR` | parent of `managa-server` | Repository root |
| `MANAGA_DATA_DIR` | `<root>/data` | Registry, clones, logs, app data |
| `MANAGA_PUBLIC_HOST` | `http://localhost` | Host used in app URLs; set to the Pi's hostname/IP in Docker |
| `AUTO_START` | `true` | Restart enabled apps when managa-server boots |
| `MANAGA_BUILTIN_MANIFESTS` | `taska.app.json` | Comma-separated bundled manifests |
| `MANAGA_CATALOG_URL` | — | Optional remote catalog JSON |
| `MANAGA_ALLOW_GIT` | `true` | Set `false` to disable GitHub installs |
| `MANAGA_ALLOW_LOCAL_SOURCES` | `false` | Dev-only: allow local path/`file://` git sources |

The dashboard reads `NEXT_PUBLIC_MANAGA_API_URL`; when unset it uses
`<current-host>:5100`. See `managa-client/.env.local.example`.

### Lifecycle semantics

- Toggling an app on sets its **desired state** to enabled. Enabled apps are
  restarted automatically when managa-server restarts.
- Starting runs the **server first**, waits for its health endpoint, then starts
  the client. If either fails, the partially started app is stopped and marked
  with the error.
- Stopping sends `SIGTERM` to the detached process group, waits, then uses
  `SIGKILL` if necessary.
- Uninstalling a GitHub app stops it and deletes `data/apps/<id>`. App data and
  logs are kept unless `purgeData=true`. Bundled apps are hidden and can be
  restored from the catalog.
- Stale processes from a previous managa-server run are cleaned up at boot.

## Docker

Docker deployment uses **host networking** for both containers:

```bash
MANAGA_PUBLIC_HOST=http://raspberrypi.local docker compose up --build -d
```

Managed apps bind their allocated ports directly on the host. Docker cannot add
published ports to a running container, so bridge networking would require
publishing the entire managed port range up front. That creates one
`docker-proxy` process per port (over a thousand), which exhausts small hosts
such as a Raspberry Pi. Host networking avoids that and exposes only the ports
that running apps actually use.

The dashboard is available on `:3000`, the API on `:5100`, and each running app
on its allocated port. `data/` is a Docker volume.

`MANAGA_PUBLIC_HOST` must be the address you use to reach the host. It is used
for the **Open** links and baked into app client builds as the API URL. If you
only open the dashboard from the Pi itself, the default `http://localhost`
works. From another machine, set it to the Pi's hostname or IP. Changing it
later requires rebuilding already-installed apps so their client bundles pick
up the new API URL.

For example:

```bash
# Either inline:
MANAGA_PUBLIC_HOST=http://tnetserver docker compose up --build -d

# Or in a .env file next to compose.yaml:
echo 'MANAGA_PUBLIC_HOST=http://tnetserver' > .env
docker compose up --build -d
```

Docker host networking requires a Linux host (including Raspberry Pi OS). For
local development on macOS or Windows, use `npm run dev` instead.

### Raspberry Pi and ARM hosts

The server image is pinned to `node:22-alpine3.22` and retries `apk` package
installs so a transient mirror or DNS failure does not break the build. For the
smoothest experience use 64-bit Raspberry Pi OS; check with `uname -m`
(`aarch64` is 64-bit, `armv7l` is 32-bit).

If `apk add` still fails during `docker compose up --build`:

```bash
# confirm the host has free space
df -h

# see the actual apk error instead of only the exit code
docker build --progress=plain --no-cache \
  -f managa-server/Dockerfile . 2>&1 | tail -50

# if the build container cannot resolve dl-cdn.alpinelinux.org, use host DNS
docker build --network=host -f managa-server/Dockerfile .
```

## Security and limitations

- App manifests are executable configuration. Install/build/start commands run
  with the managa user's permissions.
- managa-server has no authentication. Run it on localhost or put it behind
  an authenticated reverse proxy before exposing it.
- GitHub-only installs are enforced (`github.com`); local paths and arbitrary
  git hosts are rejected. `git clone` is invoked with an argument array, never a
  shell string.
- Apps are expected to bind ports passed through `PORT`/environment tokens.
  managa checks ports are free before allocating them.
- This is a development/self-hosting tool. For production multi-tenant hosting,
  add per-app sandboxing and process isolation.

## Scripts

| Command | Description |
| --- | --- |
| `npm run install:all` | Install both managa packages |
| `npm run dev` | Run managa-server (watch) + dashboard (dev) |
| `npm start` | Run production builds of both |
| `npm run build` | Build both managa packages |
| `npm run dev:server` / `dev:client` | Run one side only |
| `npm run test` | managa-server unit tests |

## Adding a new bundled app

1. Put the app's client and/or server somewhere in this repository.
2. Add a manifest, for example `myapp.app.json` at the repository root.
3. Add it to `MANAGA_BUILTIN_MANIFESTS` (comma-separated) or point the default
   at it.
4. Optionally add a catalog entry in `managa-server/catalog.json`.

The same manifest can be published in a standalone GitHub repository, in which
case it installs through the normal GitHub flow.
