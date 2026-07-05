# Kiseki AI contract — `.ve` and live editing

Implementation-accurate contract for agents and scripts working on Kiseki.

**Early-development policy:** no legacy normalization or compatibility shims.
Invalid files fail at load or validation so drift is visible.

---

## The `.ve` file

A `.ve` file **is an SVG document** with a strict shape:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	<path id="sun" d="M96 128A64 64 0 1 0 224 128A64 64 0 1 0 96 128Z" fill="gold" stroke="orange" stroke-width="4"/>
</svg>
```

| Rule | Description |
|------|-------------|
| Root | `<svg>` with `viewBox="x y w h"` ( w, h > 0 ) |
| Children | `<path>` elements **only**, directly under the root |
| `id` | Unique non-empty string per path |
| `d` | Valid SVG path data ( parse-checked on load ) |
| Paint | SVG presentation attributes, stored verbatim |
| Z-order | Document order — later paths draw on top |

Recognized presentation attributes: `fill`, `fill-rule`, `fill-opacity`,
`stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin`,
`stroke-miterlimit`, `stroke-dasharray`, `stroke-dashoffset`,
`stroke-opacity`, `opacity`.

Coordinate system: origin top-left, **Y axis downward** ( SVG user units ).

Anything else — `<g>`, `transform`, basic shapes, `<use>`, `<text>` — is **not**
a `.ve`. Loading such a file goes through the SVG import path instead, which
flattens groups / transforms / basic shapes into `<path>` elements
( `Web/VE.js` `ImportSVG`, same logic as `tools/svg2ve.mjs` ).

## In-memory model

```js
app.model = {
	viewBox	: [ 0, 0, 512, 512 ]
,	paths	: [ [ ID, d, attrs ], … ]	//	attrs: presentation-attribute object
}
```

`app.selection` is an array of path IDs — view state, never saved to file.

---

## Authoring rules ( files and agents )

1. **Keep path IDs stable.** Move / restyle via `d` and attributes, not by
   delete-and-recreate.
2. **Never hand-mangle long `d` payloads** ( Tiger, Ikyu, … ) — translate whole
   paths or edit attributes instead.
3. Attribute values are written into the file verbatim — use valid SVG values
   ( `stroke-dasharray="8 4"`, not JSON arrays ).
4. Draw order is the file order: to raise a path, move its line down in the file
   ( or use the `restack` op ).

## Validation ( `validateModel` / `VE.validate` )

`Web/ai-api.js`:

- `viewBox` is `[ x, y, w, h ]`, finite, `w`, `h` > 0
- Path: `[ ID, d, attrs? ]`, non-empty unique `ID`, `d` parses, `attrs` an object

---

## Programmatic API — `window.VE` ( `Web/ai-api.js` )

Via `Application.js`: **one operation = one undo step**.

```js
VE.getModel()		//	clone of { viewBox, paths }
VE.getText()		//	current document as .ve text
VE.validate( model? )	//	array of issue strings ( empty = OK )
VE.apply( [ { op: '…', … }, … ] )
VE.setModel( { viewBox, paths } )
```

**`apply` ops:**

| op | Main arguments |
|----|----------------|
| `addPath` | `id`, `d`, `attrs?` |
| `updatePath` | `id`, `d?`, `attrs?`, `newId?` ( omitted fields keep current ) |
| `removePath` | `id` |
| `restack` | `id`, `toFront?` ( default true ) |
| `setViewBox` | `viewBox: [ x, y, w, h ]` |

---

## Related code

| File | Role |
|------|------|
| `Web/Application.js` | Model, `Load`, `ApplyPath`, `EditPath`, selection, undo |
| `Web/VE.js` | `ParseVE` ( strict ), `ImportSVG` ( flatten ), `VEString` |
| `Web/PathData.js` | Path-data parse / serialize / affine transform / bbox ( pure ) |
| `Web/main-editor.js` | Canvas drawing, hit testing, gestures, context menu |
| `Web/ai-api.js` | `window.VE`, `validateModel` |
| `tools/svg2ve.mjs` | Offline .svg → .ve flattener |
| `tools/ve-server.mjs` | Dev server + WS bridge `/__ve/ws` |
| `tools/ve-mcp.mjs` | stdio MCP ( `ve_status`, `ve_apply`, … ) |

---

## MCP tools ( live browser required unless noted )

| Tool | Purpose |
|------|---------|
| `ve_status` | Connection, watch path, path count |
| `ve_get_model` | Live `{ viewBox, paths }` |
| `ve_get_text` | Live `.ve` markup |
| `ve_validate` | Validate model ( live or passed-in ) |
| `ve_apply` | Apply `window.VE` ops |
| `ve_load_file` | Load `Web/…/*.ve` into browser |
| `ve_save_file` | Save live doc to `Web/…/*.ve` |
| `ve_read_file` | Read `.ve` from disk ( no browser ) |

Run `cd Web && npm run dev` and open a document before using live tools.
