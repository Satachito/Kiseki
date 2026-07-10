#!/usr/bin/env node
//	Kiseki dev server: static Web/ + Samples live-reload + model RPC bridge.
//
//	Browser ( window.VE ) ↔ WebSocket ↔ this server ↔ HTTP ↔ ve-mcp.mjs
//
//	Usage:
//	  node tools/ve-server.mjs [ port ]
//	  open http://localhost:8282/?ve=Samples/Demo.ve

import path from 'node:path'
import { createDevServer } from '../Web/SAT/DevServer.mjs'
import { ROOT, WEB, PORT as DEFAULT_PORT } from './ve-paths.mjs'

const
PORT	= Number( process.argv[ 2 ] ) || DEFAULT_PORT
,	HOST	= process.env.VE_HOST || '127.0.0.1'

createDevServer( {
	name			: 've-server'
,	root			: ROOT
,	web				: WEB
,	port			: PORT
,	host			: HOST
,	apiPrefix		: '/__ve'
,	mime			: { '.ve': 'image/svg+xml' }
,	watch			: [ {
		dir		: path.join( WEB, 'Samples' )
	,	match	: name => name.endsWith( '.ve' )
	} ]
,	changeType		: 've-changed'
,	snapshotTypes	: [ 'editor-ready', 'model-update' ]
,	applySnapshot	: ( msg, prev ) => ( {
		model		: msg.model
	,	watchPath	: msg.watchPath ?? prev?.watchPath ?? null
	} )
,	logSnapshot		: snap => `${ snap.model?.paths?.length ?? 0 } paths`
,	statusOf		: ( snap, connected ) => ( {
		connected
	,	watchPath	: snap?.watchPath ?? null
	,	pathCount	: snap?.model?.paths?.length ?? 0
	,	viewBox		: snap?.model?.viewBox ?? null
	} )
,	documentRoute	: 'model'
,	getDocument		: 'getModel'
,	noDocumentError	: 'No editor connected and no cached model.'
,	noEditorError	: 'No browser editor connected. Open npm run dev and load a document.'
,	noStore			: ext => ext === '.ve'
,	examplePath		: '?ve=Samples/Demo.ve'
,	portEnvHint		: 'VE_PORT=8280 node tools/ve-server.mjs'
} )
