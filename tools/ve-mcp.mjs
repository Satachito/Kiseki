#!/usr/bin/env node
//	Kiseki MCP server — natural-language agents control the live .ve editor via ve-server.
//
//	Prerequisites:
//	  cd Web && npm run dev          ( ve-server on :8282 )
//	  open http://localhost:8282/?ve=Samples/Demo.ve
//
//	Cursor MCP config ( .mcp.json ):
//	  { "mcpServers": { "kiseki": { "command": "node", "args": ["tools/ve-mcp.mjs"] } } }

import { McpServer	} from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport	} from '@modelcontextprotocol/sdk/server/stdio.js'
import { readFile, writeFile	} from 'node:fs/promises'
import { z	} from 'zod'
import { veStatus, veGetModel, veRpc	} from './ve-client.mjs'
import { webPath, isUnderWeb	} from './ve-paths.mjs'
import { validateModel, parseVeText, formatVeDoc	} from './ve-validate.mjs'

const
server = new McpServer( {
	name	: 'kiseki'
,	version	: '1.0.0'
} )

const
textResult	= obj => ( {
	content	: [ { type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify( obj, null, '\t' ) } ]
} )

const
resolveVePath	= rel => {
	const
	clean = rel.replace( /^\/+/, '' )
	,	abs = webPath( clean )
	if	( !isUnderWeb( abs ) ) throw new Error( `Path must be under Web/: ${ rel }` )
	if	( !clean.endsWith( '.ve' ) ) throw new Error( 'Path must end with .ve' )
	return	{ rel: clean, abs }
}

server.tool(
	've_status'
,	'Check whether a browser editor is connected to ve-server and which .ve file is watched.'
,	{}
,	async () => textResult( await veStatus() )
)

server.tool(
	've_get_model'
,	'Read the live document from the open browser ( viewBox + paths ). Falls back to the last cached snapshot.'
,	{}
,	async () => textResult( await veGetModel() )
)

server.tool(
	've_get_text'
,	'Read the live document as .ve markup from the open browser.'
,	{}
,	async () => {
		const	{ result } = await veRpc( 'getText', {} )
		return	textResult( { text: result } )
	}
)

server.tool(
	've_validate'
,	'Validate a Kiseki model. Omit model to validate the live browser document.'
,	{
		model	: z.object( {
			viewBox	: z.array( z.number() ).optional()
		,	paths	: z.array( z.any() ).optional()
		} ).optional()
	}
,	async ( { model } ) => {
		if	( model ) return textResult( { ok: !validateModel( model ).length, issues: validateModel( model ) } )
		const	{ result } = await veRpc( 'validate', {} )
		return	textResult( { ok: !result.length, issues: result } )
	}
)

server.tool(
	've_apply'
,	`Apply one or more ops to the live document ( same ops as window.VE.apply; one call = one undo step per op ).
Ops: addPath, updatePath, translatePath, removePath, restack, setViewBox.
Example: { "op": "updatePath", "id": "sun", "attrs": { "fill": "red" } }`
,	{
		ops	: z.array( z.record( z.any() ) )
	}
,	async ( { ops } ) => {
		const	{ result: issues } = await veRpc( 'apply', { ops } )
		const	snap = await veGetModel()
		return	textResult( { issues, ...snap } )
	}
)

server.tool(
	've_load_file'
,	'Load a .ve file into the browser editor and watch it for live reload. Path is relative to Web/ ( e.g. Samples/Demo.ve ).'
,	{
		path	: z.string()
	}
,	async ( { path: rel } ) => {
		resolveVePath( rel )
		const	{ result } = await veRpc( 'loadVe', { path: rel.replace( /^\/+/, '' ) } )
		return	textResult( result )
	}
)

server.tool(
	've_save_file'
,	'Save the live document to a .ve file under Web/.'
,	{
		path	: z.string()
	}
,	async ( { path: rel } ) => {
		const	{ rel: clean, abs } = resolveVePath( rel )
		,	snap = await veGetModel()
		,	model = snap.model
		if	( !model ) throw new Error( 'No document to save.' )
		const
		issues = validateModel( model )
		if	( issues.length ) return textResult( { saved: false, issues } )
		await writeFile( abs, formatVeDoc( model ) + '\n', 'utf8' )
		return	textResult( { saved: true, path: clean, pathCount: model.paths.length } )
	}
)

server.tool(
	've_read_file'
,	'Read a .ve file from disk ( no browser required ). Path relative to Web/.'
,	{
		path	: z.string()
	}
,	async ( { path: rel } ) => {
		const	{ rel: clean, abs } = resolveVePath( rel )
		,	model = parseVeText( await readFile( abs, 'utf8' ) )
		return	textResult( { path: clean, model, issues: validateModel( model ) } )
	}
)

const
transport = new StdioServerTransport()
await server.connect( transport )
