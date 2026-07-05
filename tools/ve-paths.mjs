import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const
ROOT	= path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '..' )
,	WEB	= path.join( ROOT, 'Web' )
,	PORT	= Number( process.env.VE_PORT || process.env.PORT ) || 8282
,	VE_BASE	= process.env.VE_BASE || `http://127.0.0.1:${ PORT }`

export const
webPath	= rel => path.join( WEB, rel.replace( /^\/+/, '' ) )

export const
isUnderWeb	= abs => {
	const	n = path.normalize( abs )
	return	n === WEB || n.startsWith( WEB + path.sep )
}
