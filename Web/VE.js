//	.ve = an SVG document whose content is <path> elements only, directly under
//	the <svg> root. Anything else ( groups, transforms, basic shapes ) is not a
//	.ve — ImportSVG flattens such files into one.

import { EscapeXML } from './DomUtils.js'

import {
	PRESENTATION_ATTRS
,	ParseD
,	DString
,	TransformSegs
,	ParseTransform
,	MulM
,	Identity
,	ShapeD
}	from './PathData.js'

const
ParseViewBox	= root => {
	const
	_ = ( root.getAttribute( 'viewBox' ) ?? '' ).trim().split( /[\s,]+/ ).map( Number )
	if	( _.length === 4 && _.every( Number.isFinite ) && _[ 2 ] > 0 && _[ 3 ] > 0 ) return _
	const
	w = Number.parseFloat( root.getAttribute( 'width' ) )
,	h = Number.parseFloat( root.getAttribute( 'height' ) )
	if	( w > 0 && h > 0 ) return [ 0, 0, w, h ]
	return [ 0, 0, 1024, 1024 ]
}

const
SVGRoot	= text => {
	const
	doc = new DOMParser().parseFromString( text, 'image/svg+xml' )
	const
	err = doc.querySelector( 'parsererror' )
	if	( err ) throw new Error( `SVG parse error: ${ err.textContent.split( '\n' )[ 0 ] }` )
	const
	root = doc.documentElement
	if	( root.localName !== 'svg' ) throw new Error( `Not an SVG document: <${ root.localName }>` )
	return root
}

const
PathAttrs	= el => {
	const
	$ = {}
	for ( const _ of PRESENTATION_ATTRS ) el.hasAttribute( _ ) && ( $[ _ ] = el.getAttribute( _ ) )
	return $
}

//	strict: <path> children only → { viewBox, paths }
export	const
ParseVE	= text => {
	const
	root = SVGRoot( text )
	const
	paths = []
	for ( const el of root.children ) {
		if	( el.localName !== 'path' ) throw new Error( `Not a .ve: contains <${ el.localName }> — import it as .svg instead` )
		const
		d = el.getAttribute( 'd' )
		if	( !d ) throw new Error( 'Not a .ve: <path> without d' )
		ParseD( d )	//	throws on malformed data
		paths.push( [ el.getAttribute( 'id' ) ?? '', d, PathAttrs( el ) ] )
	}
	return { viewBox: ParseViewBox( root ), paths }
}

//	lenient: flatten groups / transforms / basic shapes of a plain .svg into
//	path-only form. Presentation attributes inherit down, transforms compose
//	and are baked into the path data.
export	const
ImportSVG	= text => {
	const
	root = SVGRoot( text )
	const
	paths = []

	const
	SKIP = new Set( [ 'defs', 'title', 'desc', 'metadata', 'style', 'script', 'symbol', 'clipPath', 'mask', 'pattern', 'marker', 'text' ] )

	const
	Walk	= ( el, m, inherited ) => {
		if	( SKIP.has( el.localName ) ) return

		el.hasAttribute( 'transform' ) && ( m = MulM( m, ParseTransform( el.getAttribute( 'transform' ) ) ) )
		const
		attrs = { ...inherited, ...PathAttrs( el ) }

		const
		d = el.localName === 'path'
		?	el.getAttribute( 'd' )
		:	ShapeD( el.localName, Object.fromEntries(
				[ ...el.attributes ].map( _ => [ _.name, _.value ] )
			) )

		if	( d ) {
			paths.push( [
				el.getAttribute( 'id' ) ?? ''
			,	DString( TransformSegs( ParseD( d ), m ) )
			,	attrs
			] )
			return
		}

		for ( const _ of el.children ) Walk( _, m, attrs )
	}

	for ( const _ of root.children ) Walk( _, Identity(), {} )

	if	( !paths.length ) throw new Error( 'No drawable content found in the SVG' )
	return { viewBox: ParseViewBox( root ), paths }
}

export	const
VEString	= ( { viewBox, paths } ) => [
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ viewBox.join( ' ' ) }">`
,	...paths.map(
		( [ ID, D, A ] ) => `\t<path id="${ EscapeXML( ID ) }" d="${ EscapeXML( D ) }"${
			Object.entries( A ).map( ( [ k, v ] ) => ` ${ k }="${ EscapeXML( v ) }"` ).join( '' )
		}/>`
	)
,	'</svg>'
,	''
].join( '\n' )
