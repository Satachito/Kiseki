#!/usr/bin/env node
//	Kiseki dev server: static Web/ + Samples live-reload + model RPC bridge.
//
//	Browser ( window.VE ) ↔ WebSocket ↔ this server ↔ HTTP ↔ ve-mcp.mjs
//
//	Usage:
//	  node tools/ve-server.mjs [ port ]
//	  open http://localhost:8282/?ve=Samples/Demo.ve

import { createServer	} from 'node:http'
import { createHash, randomUUID	} from 'node:crypto'
import { stat	} from 'node:fs/promises'
import { watch		} from 'node:fs'
import { createReadStream	} from 'node:fs'
import path from 'node:path'
import { ROOT, WEB, PORT as DEFAULT_PORT, isUnderWeb	} from './ve-paths.mjs'

const
PORT	= Number( process.argv[ 2 ] ) || DEFAULT_PORT

const
WS_PATH	= '/__ve/ws'
,	clients	= new Set
,	RPC_DEFAULT_MS	= 15_000

let
editor		= null
,	lastSnapshot	= null
,	debounce	= null
,	pendingRpc	= new Map

const
MIME	= {
	'.html'	: 'text/html; charset=utf-8'
,	'.js'	: 'text/javascript; charset=utf-8'
,	'.css'	: 'text/css; charset=utf-8'
,	'.json'	: 'application/json; charset=utf-8'
,	'.ve'	: 'image/svg+xml'
,	'.svg'	: 'image/svg+xml'
,	'.png'	: 'image/png'
,	'.zip'	: 'application/zip'
,	'.ico'	: 'image/x-icon'
}

const
log	= ( ...a ) => console.log( '[ve-server]', ...a )

const
json	= ( res, code, body ) => {
	res.writeHead( code, {
		'Content-Type'	: 'application/json; charset=utf-8'
	,	'Cache-Control'	: 'no-store'
	} )
	res.end( JSON.stringify( body ) )
}

const
readBody	= req => new Promise( ( resolve, reject ) => {
	const	chunks = []
	req.on( 'data', c => chunks.push( c ) )
	req.on( 'end', () => resolve( Buffer.concat( chunks ).toString( 'utf8' ) ) )
	req.on( 'error', reject )
} )

const
vePathFromAbs	= abs => {
	const
	rel = path.relative( WEB, abs )
	if	( rel.startsWith( '..' ) || path.isAbsolute( rel ) ) return null
	return	rel.split( path.sep ).join( '/' )
}

const
safeWebPath	= urlPath => {
	const
	clean = decodeURIComponent( urlPath.split( '?' )[ 0 ] )
	,	rel = clean.replace( /^\/+/, '' ) || 'index.html'
	,	abs = path.normalize( path.join( WEB, rel ) )
	if	( !isUnderWeb( abs ) ) return null
	return	abs
}

const
wsSend	= ( socket, text ) => {
	const
	data = Buffer.from( text )
	,	len = data.length
	let	header
	if	( len < 126 ) {
		header = Buffer.from( [ 0x81, len ] )
	} else if	( len < 65536 ) {
		header = Buffer.alloc( 4 )
		header[ 0 ] = 0x81
		header[ 1 ] = 126
		header.writeUInt16BE( len, 2 )
	} else {
		header = Buffer.alloc( 10 )
		header[ 0 ] = 0x81
		header[ 1 ] = 127
		header.writeBigUInt64BE( BigInt( len ), 2 )
	}
	socket.write( Buffer.concat( [ header, data ] ) )
}

const
broadcast	= msg => {
	const
	payload = JSON.stringify( msg )
	for	( const socket of clients ) {
		if	( !socket.destroyed ) wsSend( socket, payload )
	}
}

const
setEditor	= socket => {
	if	( editor && editor !== socket && !editor.destroyed ) editor.destroy()
	editor = socket
	log( 'editor connected' )
}

const
clearEditor	= socket => {
	if	( editor === socket ) {
		editor = null
		log( 'editor disconnected' )
	}
}

const
callEditor	= ( method, params = {}, timeout = RPC_DEFAULT_MS ) => new Promise( ( resolve, reject ) => {
	if	( !editor || editor.destroyed ) {
		reject( new Error( 'No browser editor connected. Open npm run dev and load a document.' ) )
		return
	}
	const
	id = randomUUID()
	,	timer = setTimeout( () => {
		pendingRpc.delete( id )
		reject( new Error( `RPC timeout (${ method })` ) )
	}, timeout )
	pendingRpc.set( id, { resolve, reject, timer } )
	wsSend( editor, JSON.stringify( { type: 'rpc', id, method, params } ) )
} )

const
handleEditorMessage	= msg => {
	switch ( msg.type ) {
	case 'editor-ready':
	case 'model-update':
		lastSnapshot = {
			model		: msg.model
		,	watchPath	: msg.watchPath ?? lastSnapshot?.watchPath ?? null
		}
		if	( msg.type === 'editor-ready' ) log( 'snapshot', lastSnapshot.watchPath, `${ msg.model?.paths?.length ?? 0 } paths` )
		break
	case 'rpc-result': {
		const	p = pendingRpc.get( msg.id )
		if	( !p ) break
		clearTimeout( p.timer )
		pendingRpc.delete( msg.id )
		p.resolve( msg.result )
		break
	}
	case 'rpc-error': {
		const	p = pendingRpc.get( msg.id )
		if	( !p ) break
		clearTimeout( p.timer )
		pendingRpc.delete( msg.id )
		p.reject( new Error( msg.error || 'RPC failed' ) )
		break
	}
	default:
		break
	}
}

const
attachWsReader	= socket => {
	socket._buf = Buffer.alloc( 0 )
	socket.on( 'data', chunk => {
		socket._buf = Buffer.concat( [ socket._buf, chunk ] )
		while	( socket._buf.length >= 2 ) {
			const
			opcode = socket._buf[ 0 ] & 0x0f
			,	masked = ( socket._buf[ 1 ] & 0x80 ) !== 0
			let	len = socket._buf[ 1 ] & 0x7f
			,	offset = 2
			if	( len === 126 ) {
				if	( socket._buf.length < 4 ) return
				len = socket._buf.readUInt16BE( 2 )
				offset = 4
			} else if	( len === 127 ) {
				if	( socket._buf.length < 10 ) return
				len = Number( socket._buf.readBigUInt64BE( 2 ) )
				offset = 10
			}
			const
			maskLen = masked ? 4 : 0
			,	total = offset + maskLen + len
			if	( socket._buf.length < total ) return
			let	payload = socket._buf.subarray( offset + maskLen, total )
			if	( masked ) {
				const	mask = socket._buf.subarray( offset, offset + 4 )
				payload = Buffer.from( payload )
				for	( let i = 0; i < payload.length; i++ ) payload[ i ] ^= mask[ i & 3 ]
			}
			socket._buf = socket._buf.subarray( total )
			if	( opcode === 0x8 ) { socket.destroy(); return }
			if	( opcode === 0x1 ) {
				try {
					const	msg = JSON.parse( payload.toString( 'utf8' ) )
					if	( msg.type === 'editor-ready' ) setEditor( socket )
					handleEditorMessage( msg )
				} catch ( er ) {
					log( 'bad ws json', er.message )
				}
			}
		}
	} )
}

const
notifyVe	= abs => {
	const
	rel = vePathFromAbs( abs )
	if	( !rel ) return
	clearTimeout( debounce )
	debounce = setTimeout( () => {
		log( 've-changed', rel )
		broadcast( { type: 've-changed', path: rel } )
	}, 80 )
}

const
watchVeTree	= dir => {
	watch( dir, { recursive: true }, ( ev, name ) => {
		if	( !name || !name.endsWith( '.ve' ) ) return
		notifyVe( path.join( dir, name ) )
	} )
	log( 'watching', path.relative( ROOT, dir ) || '.' )
}

watchVeTree( path.join( WEB, 'Samples' ) )

const
handleVeApi	= async ( req, res, urlPath ) => {
	if	( urlPath === '/__ve/status' && req.method === 'GET' ) {
		json( res, 200, {
			connected	: !!( editor && !editor.destroyed )
		,	watchPath	: lastSnapshot?.watchPath ?? null
		,	pathCount	: lastSnapshot?.model?.paths?.length ?? 0
		,	viewBox		: lastSnapshot?.model?.viewBox ?? null
		} )
		return
	}
	if	( urlPath === '/__ve/model' && req.method === 'GET' ) {
		try {
			if	( editor && !editor.destroyed ) {
				const	snap = await callEditor( 'getModel' )
				lastSnapshot = snap
				json( res, 200, snap )
			} else if	( lastSnapshot ) {
				json( res, 200, lastSnapshot )
			} else {
				json( res, 503, { error: 'No editor connected and no cached model.' } )
			}
		} catch ( er ) {
			json( res, 503, { error: String( er.message || er ) } )
		}
		return
	}
	if	( urlPath === '/__ve/rpc' && req.method === 'POST' ) {
		try {
			const
			body = JSON.parse( await readBody( req ) || '{}' )
			,	{ method, params = {}, timeout } = body
			if	( !method || typeof method !== 'string' ) {
				json( res, 400, { error: 'Missing "method"' } )
				return
			}
			const	result = await callEditor( method, params, timeout ?? RPC_DEFAULT_MS )
			json( res, 200, { ok: true, result } )
		} catch ( er ) {
			json( res, 503, { error: String( er.message || er ) } )
		}
		return
	}
	json( res, 404, { error: 'Not found' } )
}

const
serveStatic	= async ( req, res ) => {
	const
	abs = safeWebPath( req.url )
	if	( !abs ) {
		res.writeHead( 403 ); res.end( 'Forbidden' ); return
	}
	try {
		const
		st = await stat( abs )
		if	( st.isDirectory() ) {
			res.writeHead( 302, { Location: req.url.replace( /\/?$/, '/' ) + 'index.html' } )
			res.end()
			return
		}
		const
		ext = path.extname( abs )
		res.writeHead( 200, {
			'Content-Type'		: MIME[ ext ] || 'application/octet-stream'
		,	'Cache-Control'		: ext === '.ve' ? 'no-store' : 'default'
		} )
		createReadStream( abs ).pipe( res )
	} catch {
		res.writeHead( 404 ); res.end( 'Not found' )
	}
}

const
acceptWs	= ( req, socket, head ) => {
	if	( req.url !== WS_PATH ) {
		socket.destroy()
		return
	}
	const
	key = req.headers[ 'sec-websocket-key' ]
	if	( !key ) {
		socket.destroy()
		return
	}
	const
	accept = createHash( 'sha1' )
		.update( key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11' )
		.digest( 'base64' )
	socket.write(
		'HTTP/1.1 101 Switching Protocols\r\n'
		+ 'Upgrade: websocket\r\n'
		+ 'Connection: Upgrade\r\n'
		+ `Sec-WebSocket-Accept: ${ accept }\r\n\r\n`
	)
	clients.add( socket )
	attachWsReader( socket )
	socket.on( 'close', () => {
		clients.delete( socket )
		clearEditor( socket )
	} )
	socket.on( 'error', () => {
		clients.delete( socket )
		clearEditor( socket )
	} )
}

const
server = createServer( ( req, res ) => {
	const
	urlPath = req.url.split( '?' )[ 0 ]
	if	( urlPath.startsWith( '/__ve/' ) && urlPath !== WS_PATH ) {
		handleVeApi( req, res, urlPath ).catch( er => {
			log( 'api error', er )
			json( res, 500, { error: 'Internal error' } )
		} )
		return
	}
	serveStatic( req, res ).catch( er => {
		log( 'error', er )
		res.writeHead( 500 ); res.end( 'Internal error' )
	} )
} )

server.on( 'upgrade', acceptWs )

server.listen( PORT, () => {
	log( `http://localhost:${ PORT }/` )
	log( `example: http://localhost:${ PORT }/?ve=Samples/Demo.ve` )
	log( `bridge:  GET http://127.0.0.1:${ PORT }/__ve/status` )
} )

server.on( 'error', er => {
	if	( er.code === 'EADDRINUSE' ) {
		console.error(
			`[ve-server] port ${ PORT } is already in use.\n`
			+ `  kill it:  lsof -ti:${ PORT } | xargs kill\n`
			+ `  or use:   VE_PORT=8280 node tools/ve-server.mjs`
		)
		process.exit( 1 )
	}
	throw er
} )
