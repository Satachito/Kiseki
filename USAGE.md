# Kiseki — AI & dev workflow guide

This document summarizes how to edit `.ve` documents with **Cursor, Claude, Codex**, the dev server, and MCP. For editor features and the `.ve` format, see **[README.md](README.md)** and **[AI.md](AI.md)**.

**What is shared across clients:** live reload (`?ve=…`), HTTP/WebSocket bridge, MCP tool names (`ve_status`, `ve_apply`, …), and troubleshooting for the dev server / browser.

**What differs:** where you register the MCP server (Cursor settings vs Claude config vs Codex `config.toml`).

## Three layers (Phase 2 / 3 / 4)

| Layer | What it is | When it runs |
|-------|------------|--------------|
| **Phase 2 — live reload** | Save a `.ve` on disk → browser reloads that file | `watchPath` is set (see below) |
| **Phase 3 — WebSocket bridge** | `ve-server` RPCs into the open tab via `window.VE` | `npm run dev` + browser tab open |
| **Phase 4 — MCP** | Chat agent calls MCP tools → Phase 3 → canvas | MCP enabled + same session as Phase 3 |

All three can be used together, or separately:

- **Edit `.ve` files, preview on save** → Phase 2 (`?ve=…`)
- **Script or curl changes the live canvas** → Phase 3 (`/__ve/rpc`)
- **Natural language in chat** → Phase 4 (`ve_apply`, etc.)

Phase 4 does **not** replace Phase 2. MCP changes the **in-memory** document until you call `ve_save_file`.

---

## One-time setup

```bash
cd Web && npm install
cd ../tools && npm install
```

### MCP server (all clients)

Every client runs the same stdio server:

| File | Role |
|------|------|
| **`tools/ve-mcp.mjs`** | MCP tools (`ve_status`, `ve_get_model`, …) |
| **`tools/ve-mcp-run.sh`** | Launcher — `cd`s into `tools/` so `node_modules` resolves |

The MCP process talks to **`ve-server`** (Phase 3) on port **8282** by default. If you use another port, set **`VE_PORT`** in the MCP server's environment **and** when starting the dev server.

---

## Start the dev server (every session)

```bash
cd Web
npm run dev
```

Leave a browser tab open on the dev server (see [Which URL to open](#which-url-to-open)).

The server binds to **`127.0.0.1` only** (override with `VE_HOST`). The HTTP/WebSocket RPC bridge has **no authentication** — it is for same-machine clients (browser tab + MCP). Do not tunnel or publish this port.

---

## Register your MCP client

Replace **`/path/to/Kiseki`** with your clone path (Claude Desktop requires absolute paths).

### Cursor

1. Open this repo at **`Kiseki/`** (project root, not `Web/` alone).
2. **Settings → Tools & MCP**: find **`kiseki`** under **Workspace MCP Servers**.
3. Turn the toggle **ON**.
4. If it does not appear: **Cmd+Q** to quit Cursor completely, reopen, or **Cmd+Shift+P → Developer: Reload Window**.

Config file: **[`.cursor/mcp.json`](.cursor/mcp.json)** (uses `tools/ve-mcp-run.sh`).

### Claude Desktop

Add under `mcpServers` in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kiseki": {
      "command": "/bin/bash",
      "args": ["/path/to/Kiseki/tools/ve-mcp-run.sh"],
      "env": {
        "VE_PORT": "8282"
      }
    }
  }
}
```

Fully quit Claude Desktop (**Cmd+Q**) and reopen.

### Claude Code (CLI)

```bash
claude mcp add kiseki --scope project --env VE_PORT=8282 -- /bin/bash tools/ve-mcp-run.sh
```

Or use **[`.mcp.json`](.mcp.json)** at the project root.

### OpenAI Codex

```bash
codex mcp add kiseki --env VE_PORT=8282 -- /bin/bash /path/to/Kiseki/tools/ve-mcp-run.sh
```

---

## Which URL to open

| URL | Phase 2 (auto-reload on save) | Phase 3 / 4 (live MCP) |
|-----|------------------------------|-------------------------|
| `http://localhost:8282/?ve=Samples/Demo.ve` | **Yes** — watches that file | **Yes** |
| `http://localhost:8282/` | **No** (unless `ve-watch` left in sessionStorage) | **Yes** |
| Sample button in the app | **Yes** — sets watch path | **Yes** |

**Recommended for file + AI editing:** use `?ve=Samples/YourFile.ve`.

**MCP-only experiments:** `http://localhost:8282/` is fine; live edits apply to whatever is on the canvas. They are **not** written to disk until `ve_save_file`.

To clear a stale watch path: DevTools → Application → Session Storage → delete `ve-watch`, or upload a file with **↑** (upload clears the watch).

---

## Phase 2 — edit `.ve`, see it in the browser

1. `npm run dev`
2. Open `http://localhost:8282/?ve=Samples/Demo.ve`
3. Edit `Samples/Demo.ve` in your editor and **save**
4. The browser reloads that file

Port already in use:

```bash
lsof -ti:8282 | xargs kill
# or: VE_PORT=8280 npm run dev
```

---

## Phase 3 — HTTP / WebSocket bridge

Requires a connected browser tab (`ve_status` → `"connected": true`).

```bash
# Connection check
curl -s http://127.0.0.1:8282/__ve/status

# Read live model
curl -s http://127.0.0.1:8282/__ve/model

# Apply ops (example: turn #sun red)
curl -s -X POST http://127.0.0.1:8282/__ve/rpc \
  -H 'Content-Type: application/json' \
  -d '{"method":"apply","params":{"ops":[{"op":"updatePath","id":"sun","attrs":{"fill":"red"}}]}}'
```

Endpoints:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/__ve/status` | Browser connected? watch path, path count |
| GET | `/__ve/model` | Live `{ viewBox, paths }` |
| POST | `/__ve/rpc` | Body: `{ "method": "apply", "params": { "ops": […] } }` |

DevTools: `window.VE` in the browser — see **`Web/ai-api.js`** and **[AI.md](AI.md)**.

---

## Phase 4 — MCP from chat

**Prerequisites:** `npm run dev`, browser tab open, **`kiseki` MCP enabled**.

### Check connection

> Run `ve_status`.

Expect `"connected": true` and a `watchPath` if you opened with `?ve=…`.

### Example — change fill (no save)

> Make the sun red. Use MCP. Do not save to disk.

Typical agent steps:

1. `ve_get_model` — find path `"sun"`
2. `ve_apply` — `{ "op": "updatePath", "id": "sun", "attrs": { "fill": "red" } }`

### Example — move a path

> Move the logo 20px right.

Use `translatePath` instead of rewriting long `d` strings:

```json
{ "op": "translatePath", "id": "logo", "dx": 20, "dy": 0 }
```

### Example — persist

> Save the current document to `Samples/Demo.ve`.

Calls `ve_save_file`.

### MCP tools

| Tool | Purpose |
|------|---------|
| `ve_status` | Connection, watch path, path count |
| `ve_get_model` | Live `{ viewBox, paths }` snapshot |
| `ve_get_text` | Live `.ve` markup |
| `ve_validate` | Validate live or given model |
| `ve_apply` | Apply ops (same as `window.VE.apply`) |
| `ve_load_file` | Load `.ve` into browser (path under `Web/`) |
| `ve_save_file` | Write live document to disk |
| `ve_read_file` | Read `.ve` from disk (no browser needed) |

### `ve_apply` ops

One `ve_apply` call = one undo step per op. See **[AI.md](AI.md)** for the full contract.

```
{ "op": "addPath",       "id", "d", "attrs"? }
{ "op": "updatePath",    "id", "d"?, "attrs"?, "newId"? }
{ "op": "translatePath", "id", "dx", "dy" }
{ "op": "removePath",    "id" }
{ "op": "restack",       "id", "toFront"? }
{ "op": "setViewBox",    "viewBox": [ x, y, w, h ] }
```

### Rules for agents

- **Keep path IDs stable.** Use `updatePath` / `translatePath`, not delete-and-recreate.
- **Never hand-mangle long `d` payloads** (Tiger, Ikyu, …) — translate whole paths or edit attributes instead.
- **`attrs` values** are strings written verbatim into the file.
- **Undo:** live MCP edits are undoable in the browser (⌘Z).
- Only **one browser tab** should connect to `ve-server` at a time (last connection wins).

---

## Quick troubleshooting

| Problem | Fix |
|---------|-----|
| **Cursor:** `kiseki` not in MCP list | Open repo root; Reload Window or quit Cursor (Cmd+Q) |
| **Cursor:** MCP listed but Disabled | Toggle **ON** in Settings → Tools & MCP |
| `connected: false` | Open dev URL in browser; keep tab open |
| RPC timeout | Restart `npm run dev`; close duplicate `:8282` tabs |
| Phase 2 not reloading | Use `?ve=…` or Sample button; check `ve-watch` in sessionStorage |
| Port 8282 in use | `lsof -ti:8282 \| xargs kill` or `VE_PORT=8280 npm run dev` (+ set `VE_PORT` in MCP env) |
| Validation errors on save | Run `ve_validate`; see **[AI.md](AI.md)** |

---

## Project layout (dev / AI)

```
Kiseki/
├── Web/              App + ai-api.js (window.VE)
├── Samples/          Example .ve files
├── tools/
│   ve-server.mjs     Dev server + bridge
│   ve-mcp.mjs        MCP server (stdio)
│   ve-mcp-run.sh     MCP launcher
├── .cursor/mcp.json  Cursor workspace MCP config
├── .mcp.json         Project MCP config
├── AI.md             AI contract + window.VE ops
└── USAGE.md          This file
```
