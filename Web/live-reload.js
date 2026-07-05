//	Live .ve reload + WebSocket RPC bridge to window.VE ( tools/ve-server.mjs ).

import { Load	} from './Application.js'

let
watchPath = null
,	ws = null
,	uiRef = null

export const
setWatchPath	= path => {
	watchPath = path
	path && sessionStorage.setItem( 've-watch', path )
}

const
snapshot	= () => ( {
	model		: window.VE.getModel()
,	watchPath
} )

const
pushSnapshot	= () => {
	if	( !ws || ws.readyState !== WebSocket.OPEN ) return
	ws.send( JSON.stringify( { type: 'model-update', ...snapshot() } ) )
}

const
MUTATING	= new Set( [ 'apply', 'setModel', 'addPath', 'updatePath', 'translatePath', 'removePath', 'restack', 'setViewBox' ] )

const
runRpc	= async ( method, params ) => {
	const
	VE = window.VE
	switch ( method ) {
	case 'getModel':
		return	snapshot()
	case 'getText':
		return	VE.getText()
	case 'apply':
		return	VE.apply( params.ops )
	case 'validate':
		return	VE.validate( params.model )
	case 'setModel':
		return	VE.setModel( params.model )
	case 'loadVe':
		await loadVeFile( params.path, uiRef ?? {} )
		return	snapshot()
	default: {
		const	fn = VE[ method ]
		if	( typeof fn !== 'function' ) throw new Error( `unknown RPC method "${ method }"` )
		return	fn( params )
	}
	}
}

const
handleRpc	= async msg => {
	const	{ id, method, params = {} } = msg
	try {
		const
		result = await runRpc( method, params )
		ws.send( JSON.stringify( { type: 'rpc-result', id, result } ) )
		if	( MUTATING.has( method ) ) pushSnapshot()
	} catch ( er ) {
		ws.send( JSON.stringify( { type: 'rpc-error', id, error: String( er.message || er ) } ) )
	}
}

export const
loadVeFile	= async ( path, { SyncViewInputs, FILE_NAME } = {} ) => {
	const
	res = await fetch( new URL( path, import.meta.url ), { cache: 'no-store' } )
	if	( !res.ok ) throw new Error( `${ res.status } ${ path }` )
	await Load( await res.text() )
	setWatchPath( path )
	FILE_NAME && ( FILE_NAME.value = path.replace( /^.*\//, '' ) )
	SyncViewInputs?.()
	pushSnapshot()
}

const
connectBridge	= () => {
	if	( location.protocol !== 'http:' && location.protocol !== 'https:' ) return

	const
	proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
	,	url = `${ proto }//${ location.host }/__ve/ws`
	,	connect = () => {
		ws = new WebSocket( url )
		ws.onopen = () => {
			ws._everOpen = true
			ws.send( JSON.stringify( { type: 'editor-ready', ...snapshot() } ) )
		}
		ws.onmessage = async ev => {
			let	msg
			try { msg = JSON.parse( ev.data ) } catch { return }
			if	( msg.type === 've-changed' ) {
				if	( !watchPath || msg.path !== watchPath ) return
				try {
					await loadVeFile( watchPath, uiRef ?? {} )
				} catch ( er ) {
					console.error( '[live-reload]', er )
				}
				return
			}
			if	( msg.type === 'rpc' ) void handleRpc( msg )
		}
		ws.onclose = ev => { if ( ev.target._everOpen ) setTimeout( connect, 1500 ) }
	}
	connect()
}

export const
initLiveReload	= async ( ui, { Report } = {} ) => {
	uiRef = ui
	const
	fromUrl = new URLSearchParams( location.search ).get( 've' )
	,	fromStore = sessionStorage.getItem( 've-watch' )
	,	path = fromUrl || fromStore

	setWatchPath( path )
	connectBridge()

	if	( fromUrl ) {
		try {
			await loadVeFile( fromUrl, ui )
		} catch ( er ) {
			Report ? Report( er ) : console.error( er )
		}
	} else {
		pushSnapshot()
	}
}
