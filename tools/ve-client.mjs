//	Shared HTTP client for ve-server RPC ( used by ve-mcp.mjs ).

import { VE_BASE } from './ve-paths.mjs'

export const
veFetch	= async ( path, init ) => {
	const
	res = await fetch( `${ VE_BASE }${ path }`, init )
	if	( !res.ok ) {
		const	text = await res.text().catch( () => '' )
		throw new Error( text || `${ res.status } ${ path }` )
	}
	return	res.headers.get( 'content-type' )?.includes( 'json' )
		? res.json()
		: res.text()
}

export const
veStatus	= () => veFetch( '/__ve/status' )

export const
veGetModel	= () => veFetch( '/__ve/model' )

export const
veRpc	= ( method, params = {}, timeout ) => veFetch( '/__ve/rpc', {
	method	: 'POST'
,	headers	: { 'Content-Type': 'application/json' }
,	body	: JSON.stringify( { method, params, timeout } )
} )
