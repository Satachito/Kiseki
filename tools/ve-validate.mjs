//	Validate a Kiseki model and read / write .ve text without a browser
//	( same rules as Web/ai-api.js; same serialization as Web/VE.js ).

import { ParseD, PRESENTATION_ATTRS } from '../Web/PathData.js'
import { VEString } from '../Web/VE.js'

export const
validateModel	= model => {
	const
	issues = []
	if	( !model || typeof model !== 'object' )	return [ 'model must be an object' ]

	const
	vb = model.viewBox
	;(	Array.isArray( vb )
	&&	vb.length === 4
	&&	vb.every( Number.isFinite )
	&&	vb[ 2 ] > 0
	&&	vb[ 3 ] > 0
	) || issues.push( `viewBox must be [ x, y, w, h ] with w, h > 0: ${ JSON.stringify( vb ) }` )

	if	( !Array.isArray( model.paths ) ) {
		issues.push( 'model.paths must be an array' )
		return	issues
	}

	const
	ids = new Set
	model.paths.forEach( ( _, i ) => {
		if	( !Array.isArray( _ ) || _.length < 2 ) return issues.push( `paths[${ i }] must be [ ID, d, attrs ]` )
		const
		[ ID, D, A ] = _
		typeof ID === 'string' && ID.length || issues.push( `paths[${ i }] has an empty / non-string ID` )
		ids.has( ID ) && issues.push( `duplicate path ID "${ ID }"` )
		ids.add( ID )
		try {
			ParseD( D )
		} catch ( er ) {
			issues.push( `path "${ ID }": ${ er.message }` )
		}
		A === undefined || ( A && typeof A === 'object' && !Array.isArray( A ) ) || issues.push( `path "${ ID }": attrs must be an object` )
	} )
	return	issues
}

const
ParseAttrs	= text => Object.fromEntries(
	[ ...text.matchAll( /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g ) ].map(
		( [ , k, v1, v2 ] ) => [ k, v1 ?? v2 ]
	)
)

//	strict .ve reader: <svg> root with <path> elements only ( regex-level XML,
//	fine for machine-written .ve files; no entity decoding )
export const
parseVeText	= text => {
	const
	xml = String( text )
	.	replace( /<!--[\s\S]*?-->/g, '' )
	.	replace( /<\?[\s\S]*?\?>/g, '' )
	.	replace( /<!DOCTYPE[^>]*>/i, '' )

	let	viewBox = null
	const
	paths = []

	for ( const [ , close, name, attrText ] of xml.matchAll(
		/<\s*(\/?)([\w:-]+)((?:"[^"]*"|'[^']*'|[^>])*?)(\/?)\s*>/g
	) ) {
		if	( close ) continue
		if	( name === 'svg' ) {
			if	( viewBox ) throw new Error( 'Not a .ve: nested <svg>' )
			const
			attrs = ParseAttrs( attrText )
			,	_ = ( attrs.viewBox ?? '' ).trim().split( /[\s,]+/ ).map( Number )
			if	( !( _.length === 4 && _.every( Number.isFinite ) && _[ 2 ] > 0 && _[ 3 ] > 0 ) )
				throw new Error( 'Not a .ve: missing / invalid viewBox' )
			viewBox = _
			continue
		}
		if	( name !== 'path' ) throw new Error( `Not a .ve: contains <${ name }>` )
		const
		attrs = ParseAttrs( attrText )
		if	( !attrs.d ) throw new Error( 'Not a .ve: <path> without d' )
		paths.push( [
			attrs.id ?? ''
		,	attrs.d
		,	Object.fromEntries( PRESENTATION_ATTRS.filter( _ => attrs[ _ ] !== undefined ).map( _ => [ _, attrs[ _ ] ] ) )
		] )
	}
	if	( !viewBox ) throw new Error( 'Not a .ve: no <svg> root' )
	return	{ viewBox, paths }
}

export const
formatVeDoc	= model => VEString( model )
