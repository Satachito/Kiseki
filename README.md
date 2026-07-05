# Kiseki — The Vector Editor

Canvas-based vector editor for **path-only SVG**.

A document is plain SVG containing nothing but `<path>` elements, saved with the
`.ve` extension — editable by hand, by AI, or in any text editor, and renderable
by any SVG viewer as-is.

## Features

- **Canvas editing** with pan ( space + drag ) and zoom
- **Tools** — select / move, rect, ellipse, line, pen ( polyline, click-to-close )
- **Path editor** — raw `d` and every SVG presentation attribute, per path
- **Draw-order list** — front-most on top, restack via context menu
- **Undo / redo** — every operation is one history step ( ⌘Z / ⇧⌘Z )
- **Import** — any plain `.svg`: groups, transforms, and basic shapes
  ( rect / circle / ellipse / line / polyline / polygon ) are flattened into paths
- **Export** — `.ve`, `.svg`, and copy-to-clipboard ( paste into Figma / Illustrator / editors )
- **Session restore** — last document is kept in `localStorage`
- **Light / dark mode** — follows system preference
- **AI editing** — `window.VE` command API ( see **[AI.md](AI.md)** )

## Quick start

```bash
cd Web && npm run dev
# http://localhost:8282/?ve=Samples/Demo.ve
```

1. Click a **Sample** button at top right ( Tiger, SVGLogo, … ).
2. **Click** to select a path, **drag** to move it, **⇧click** to extend the selection.
3. Pick **Rect / Ellipse / Line** and drag — or **Pen** and click point by point
   ( **Enter** / double-click commits, clicking the first point closes ).
4. Edit `d` and paint attributes in the right panel, **Apply/Create Path**.
5. Press **Save .ve** to download.

Any static file server works — the app is plain HTML + ES modules, no build step.
`Web/Samples` symlinks to `../Samples`.

## The `.ve` format

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	<path id="sun" d="M96 128A64 64 0 1 0 224 128A64 64 0 1 0 96 128Z" fill="gold" stroke="orange" stroke-width="4"/>
</svg>
```

- Root `<svg>` with `viewBox` — the canvas.
- Direct `<path>` children only. Draw order = document order ( later on top ).
- Each path: unique `id`, `d`, and optional presentation attributes
  ( `fill`, `fill-rule`, `stroke`, `stroke-width`, `stroke-linecap`,
  `stroke-linejoin`, `stroke-miterlimit`, `stroke-dasharray`,
  `stroke-dashoffset`, `opacity`, … ).

Rename a `.ve` to `.svg` and it opens anywhere. Going the other way, the app
( and `tools/svg2ve.mjs` ) flattens arbitrary SVG structure into path-only form.

Authoring rules for AI and hand edits: **[AI.md](AI.md)** ·
Sample files: **[Samples/](Samples/)**

## Local development & MCP

Same design as Zukai / EzuSVG: `ve-server` serves `Web/`, watches `Samples/` for
live reload, and bridges the open browser tab to MCP over HTTP/WebSocket.

```bash
cd Web && npm run dev
cd ../tools && npm install   # MCP (one-time)
```

Open `http://localhost:8282/?ve=Samples/Demo.ve`. Enable the **`kiseki`**
MCP server in Cursor (**Settings → Tools & MCP**) or use [.mcp.json](.mcp.json).
See **[USAGE.md](USAGE.md)** for Phase 2 / 3 / 4 workflow and client setup.

Tools: `ve_status` · `ve_get_model` · `ve_get_text` · `ve_validate` ·
`ve_apply` (same ops as `window.VE.apply`) · `ve_load_file` · `ve_save_file` ·
`ve_read_file`.

Default port is **8282** ( Zukai uses 8281 ). Override with `VE_PORT`; if busy, try **8280**.

## Tools

```bash
node tools/svg2ve.mjs input.svg [ output.ve ]
```

Bakes groups, transforms, and basic shapes into `<path>` elements — used to
generate the bundled samples from their original SVGs.

## Project layout

```
Kiseki/
├── Web/              App ( HTML + ES modules, ai-api.js )
│   ├── PathData.js   Path-data parse / serialize / transform ( pure, shared )
│   ├── VE.js         .ve read / write, .svg flattening import
│   ├── Application.js  Model, undo integration, operations
│   └── main-editor.js  Canvas drawing, hit testing, gestures
├── Samples/          Example .ve files
├── tools/            ve-server, ve-mcp, svg2ve, ve-validate
├── .mcp.json         Cursor MCP config
├── README.md         This file
├── USAGE.md          AI & dev workflow guide
└── AI.md             AI contract + window.VE ops
```

## Author

Satoru Ogura — with help from AIs.

## License

ISC
