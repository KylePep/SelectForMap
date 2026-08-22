# Running the Local Backend Demo

Quick-reference checklist for turning the local backend + Cloudflare Tunnel on for a live demo. For the full explanation of *why* each piece exists, see the "Local Backend Demo Setup" section in [README.md](README.md) — this file is just the "click these buttons, in this order" version.

## Every time you want to demo (API only)

1. **Terminal 1** — from the repo root, start the backend:
   ```sh
   docker compose up app web db
   ```
   Leave this running.

2. **Terminal 2** — start the tunnel:
   ```sh
   cloudflared tunnel run demo-backend
   ```
   Leave this running too.

3. Done. `https://api-demo.kylepep.dev` is now live, and will keep working as long as both terminals stay open and the laptop stays awake and online.

**Shortcut:** `cd backend && composer demo` runs steps 1 and 2 together in one terminal (stops both if either one dies).

**To stop:** Ctrl+C in both terminals.

## If you also need to reach the database remotely

Do the two steps above first — the tunnel has to already be running. Then, **on whichever machine you're connecting *from*:**

4. **Terminal 3**:
   ```sh
   cloudflared access tcp --hostname db-demo.kylepep.dev --url localhost:13307
   ```
   First time in a while, a browser window pops up — log in with your Cloudflare account. Leave this terminal running. **It will look idle/stuck — that's normal, it only prints on errors, not on successful connections.**

5. Point a MySQL GUI client (HeidiSQL, DBeaver, TablePlus, etc.) at:
   | Field | Value |
   |---|---|
   | Host | `127.0.0.1` |
   | Port | `13307` |
   | Username | `sfm` |
   | Password | `sfm` |
   | Database | `sfm` |

   (These match `backend/.env` — update this table if those ever change.)

## Troubleshooting

- **`Test-NetConnection` says `True` but Terminal 3 shows nothing new** — normal, it only logs errors, not successes. That test alone doesn't prove the DB is reachable, just that the local listener accepted a socket.
- **`websocket: bad handshake` error in Terminal 3** — Terminal 2 (the tunnel) isn't running, or isn't running anymore. Start/restart it.
- **You edited `C:\Users\kaize\.cloudflared\config.yml`** — stop and restart Terminal 2. `cloudflared` only reads that file at startup, it won't pick up changes on its own.
- **`mysql` isn't recognized in PowerShell** — the CLI isn't installed, that's fine, use a GUI client instead (step 5 above).
- **Nothing loads / times out** — check the laptop hasn't gone to sleep, and that Terminal 1 is still actually running (`docker ps` should show `selectformap-web-1`, `selectformap-app-1`, `selectformap-db-1` as `Up`).

## One-time setup (already done — for reference only, don't redo this)

- Tunnel created: `cloudflared tunnel create demo-backend`, credentials at `C:\Users\kaize\.cloudflared\64fbb547-d93b-4503-95b9-31b77936ad91.json`.
- DNS routed: `cloudflared tunnel route dns demo-backend api-demo.kylepep.dev` and `... db-demo.kylepep.dev`.
- Ingress rules configured in `C:\Users\kaize\.cloudflared\config.yml`.
- Cloudflare Access application created for `db-demo.kylepep.dev` in the Zero Trust dashboard (Access → Applications), with an "Only me" Allow policy gating it.
- `backend/.env` → `FRONTEND_URL` set to the deployed (Vercel) frontend origin, so CORS allows it.

See [README.md](README.md) for the full write-up of each of these.
