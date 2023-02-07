import { Round, EQ, CF, Add, Sub, Mid, Mul, Div } from './JP/JS/G.js'

const
UnitArcByCB = θ => {	// θ: -2π < Angle < 2π
	const L = 4 / 3 * Math.tan( θ / 4 )
	const sinθ = Math.sin( θ )
	const cosθ = Math.cos( θ )
	return [
		[ 1, 0 ]
	,	[ 1, L ]
	,	[ cosθ + sinθ * L, sinθ - cosθ * L ]
	,	[ cosθ, sinθ ]
	]
}

const
UnitArcByCBs = θ => {	// θ: -2π < Angle < 2π
	const nArcs = Math.ceil( Math.abs( 2 * θ / Math.PI ) )
	switch ( nArcs ) {
	case 0:
		return [ 1, 0 ]
	case 1:
		return UnitArcByCB( θ )
	default:
		{	θ = θ / nArcs
			const $ = UnitArcByCB( θ )
			const _ = $.slice( 1 )
			for ( let i = 1; i < nArcs; i++ ) {
				const sinθ = Math.sin( θ * i )
				const cosθ = Math.cos( θ * i )
				$.push( ..._.map( ( [ x, y ] ) => [ cosθ * x - sinθ * y, sinθ * x + cosθ * y ] ) )
			}
			return $
		}
	}
}

//	https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
const
ArcByCBs = ( d, r, φ, fA, fS ) => {

	const sinφ = Math.sin( φ )
	const cosφ = Math.cos( φ )
	const RotateL = ( [ x, y ] ) => [ cosφ * x + sinφ * y, cosφ * y - sinφ * x ]
	const RotateR = ( [ x, y ] ) => [ cosφ * x - sinφ * y, cosφ * y + sinφ * x ]

	const [ dX , dY  ] = RotateL( d )
	const [ dX2, dY2 ] = [ dX * dX, dY * dY ]
	const [ rH , rV  ] = r
	const [ rH2, rV2 ] = [ rH * rH, rV * rV ]

	const num = rH2 * rV2 - rH2 * dY2 - rV2 * dX2
	if ( num < 0 ) return []

	const _ = Math.sqrt(
		( rH2 * rV2 - rH2 * dY2 - rV2 * dX2 )
	/	( rH2 * dY2 + rV2 * dX2 )
	)
	const o = RotateR( Mul( [ rH * dY / rV, - rV * dX / rH ], fA === fS ? -_ : _ ) )
	const [ oX, oY ] = o

	const Angle = ( x, y ) => ( y > 0 ? 1 : -1 ) * Math.acos( x / ( x * x + y * y ) )
	//	acos's return value: in radians between 0 and π, inclusive 
	//	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/acos
	let sθ = Angle( (  dX - oX ) / rH, (  dY - oY ) / rV )
	let eθ = Angle( ( -dX - oX ) / rH, ( -dY - oY ) / rV )

	//	fS: 0: CC, 1: Clockwise
	fS || ( [ eθ, sθ ] = [ sθ, eθ ] )

	let Δ = eθ - sθ
	while ( Δ < 0 ) Δ += Math.PI * 2
	fA && Δ < Math.PI && ( Δ = Math.PI * 2 - Δ )

	const s = Math.sin( sθ )
	const c = Math.cos( sθ )
	const $ = UnitArcByCBs( Δ ).map(
		( [ x, y ] ) => Add(
			RotateR( [ ( c * x - s * y ) * rH, ( s * x + c * y ) * rV ] )
		,	o
		)
	)
	return ( fS ? $ : $.reverse() ).slice( 1 )
}

//	VIA VE
const
Arc = ( s, r, φ, fA, fS, e ) => {
	const m = Mid( s, e )
	//	DESTRUCTIVE
	const _ = ArcByCBs( Div( Sub( s, e ), 2 ), r, φ, fA, fS ).map( _ => Add( _, m ) )
	if ( !_.length ) return [ [ e ] ]
	const $ = []
	while ( _.length ) (
		$.unshift( _.slice( 0, 3 ).reverse() )
	,	_.splice( 0, 3 )
	)
	return $
}

const
D2Path = _ => {

	let		i = 0

	const
	ReadNumber = () => {

		const
		Valid = _ => ~'0123456789.-'.indexOf( _ )

		let v = ''
		while ( i < _.length ) {
			let c = _[ i ]
			let trimC = c.trim()
			if ( trimC === '' || trimC === ',' ) {
				i++
				continue
			}
			if ( !Valid( c ) ) return NaN
			v += c
			let readDot = c === '.'
			i++
			while ( i < _.length ) {
				c = _[ i ]
				if ( c === '.' ) {
					if ( readDot ) break
					readDot = true
				}
				if ( c === '-' ) break
				if ( !Valid( c ) ) break
				i++
				v += c
			}
			break
		}
		return v == '' ? NaN : Number( v )
	}

	const
	Ns = () => {
		const v = []
		while ( i < _.length ) {
			const n = ReadNumber()
			if ( Number.isNaN( n ) ) break
			v.push( n )
		}
		return v
	}

	const
	XY = () => {
		if ( i < _.length ) {
			const x = ReadNumber()
			if ( Number.isNaN( x ) ) return null
			const y = ReadNumber()
			if ( Number.isNaN( y ) ) throw 'XYs: y is NaN'	//	TODO	break in production
			return [ x, y ]
		} else {
			return null
		}
	}
	const
	XYs = () => {
		const v = []
		while ( i < _.length ) {
			const $ = XY();	if ( !$ ) break
			v.push( $ )
		}
		return v
	}
	const
	XYs_2 = () => {
		const v = []
		while ( i < _.length ) {
			const $0 = XY();	if ( !$0 ) break
			const $1 = XY();	if ( !$1 ) break
			v.push( [ $0, $1 ] )
		}
		return v
	}
	const
	XYs_3 = () => {
		const v = []
		while ( i < _.length ) {
			const $0 = XY();	if ( !$0 ) break
			const $1 = XY();	if ( !$1 ) break
			const $2 = XY();	if ( !$2 ) break
			v.push( [ $0, $1, $2 ] )
		}
		return v
	}

	let cp = [ 0, 0 ]

	const AbsH	= _ => cp = [ _, cp[ 1 ] ]
	const AbsV	= _ => cp = [ cp[ 0 ], _ ]
	const Rel	= _ => cp = Add( cp, _ )
	const RelH	= _ => cp = [ cp[ 0 ] + _, cp[ 1 ] ]
	const RelV	= _ => cp = [ cp[ 0 ], cp[ 1 ] + _ ]

	let	lastC3 = null
	let	lastC2 = null

	const	$ = []
	let		v = null
	while ( i < _.length ) {
//console.log( "'" + _.slice( i, i + 16 ) + "'" )
		const mnemonic = _[ i++ ]
		switch ( mnemonic ) {
		case 'Z':
		case 'z':
			if ( v === null ) debugger
			if ( v[ 0 ] === null ) debugger
			if ( v[ 1 ] === null ) debugger
			v[ 1 ].length && (
				EQ( v[ 0 ], v[ 1 ][ 0 ][ 0 ] ) || v[ 1 ].unshift( [ v[ 0 ] ] )
			,	v[ 0 ] = null
			,	$.push( v )
			)
			v = null
			lastC2 = lastC3 = null
			break
		case 'M':
			v && $.push( v )
			{	const xys = XYs()
				v = [ cp = xys[ 0 ], [] ]
				for ( let _ = 1; _ < xys.length; _++ ) v[ 1 ].unshift( [ cp = xys[ _ ] ] )
			}
			lastC2 = lastC3 = null
			break
		case 'm':
			v && $.push( v )
			{	const xys = XYs()
				v = [ Rel( xys[ 0 ] ), [] ]
				for ( let _ = 1; _ < xys.length; _++ ) v[ 1 ].unshift( [ Rel( xys[ _ ] ) ] )
			}
			lastC2 = lastC3 = null
			break
		case 'L':
			{	const xys = XYs()
				for ( let _ = 0; _ < xys.length; _++ ) v[ 1 ].unshift( [ cp = xys[ _ ] ] )
			}
			lastC2 = lastC3 = null
			break
		case 'l':
			{	const xys = XYs()
				for ( let _ = 0; _ < xys.length; _++ ) v[ 1 ].unshift( [ Rel( xys[ _ ] ) ] )
			}
			lastC2 = lastC3 = null
			break
		case 'H':
			{	const ns = Ns()
				for ( let _ = 0; _ < ns.length; _++ ) v[ 1 ].unshift( [ AbsH( ns[ _ ] ) ] )
			}
			lastC2 = lastC3 = null
			break
		case 'h':
			{	const ns = Ns()
				for ( let _ = 0; _ < ns.length; _++ ) v[ 1 ].unshift( [ RelH( ns[ _ ] ) ] )
			}
			lastC2 = lastC3 = null
			break
		case 'V':
			{	const ns = Ns()
				for ( let _ = 0; _ < ns.length; _++ ) v[ 1 ].unshift( [ AbsV( ns[ _ ] ) ] )
			}
			lastC2 = lastC3 = null
			break
		case 'v':
			{	const ns = Ns()
				for ( let _ = 0; _ < ns.length; _++ ) v[ 1 ].unshift( [ RelV( ns[ _ ] ) ] )
			}
			lastC2 = lastC3 = null
			break
		case 'C':
			{	const	xys_3 = XYs_3()
				for ( let _ = 0; _ < xys_3.length; _++ ) {
					const	$ = xys_3[ _ ]
					v[ 1 ].unshift( [ cp = $[ 2 ], lastC3 = $[ 1 ], $[ 0 ] ] )
				}
			}
			lastC2 = null
			break
		case 'c':
			{	const	xys_3 = XYs_3()
				for ( let _ = 0; _ < xys_3.length; _++ ) {
					const	$ = xys_3[ _ ]
					const	q = Add( cp, $[ 1 ] )
					const	r = Add( cp, $[ 0 ] )
					v[ 1 ].unshift( [ Rel( $[ 2 ] ), lastC3 = q, r ] )
				}
			}
			lastC2 = null
			break
		case 'S':
			{	const	xys_2 = XYs_2()
				for ( let _ = 0; _ < xys_2.length; _++ ) {
					const	$ = xys_2[ _ ]
					const	r = lastC3 ? Sub( cp, Sub( lastC3, cp ) ) : cp
					v[ 1 ].unshift( [ cp = $[ 1 ], lastC3 = $[ 0 ], r ] )
				}
			}
			lastC2 = null
			break
		case 's':
			{	const	xys_2 = XYs_2()
				for ( let _ = 0; _ < xys_2.length; _++ ) {
					const	$ = xys_2[ _ ]
					const	q = Add( cp, $[ 0 ] )
					const	r = lastC3 ? Sub( cp, Sub( lastC3, cp ) ) : cp
					v[ 1 ].unshift( [ Rel( $[ 1 ] ), lastC3 = q, r ] )
				}
			}
			lastC2 = null
			break
		case 'Q':
			{	const	xys_2 = XYs_2()
				for ( let _ = 0; _ < xys_2.length; _++ ) {
					const	$ = xys_2[ _ ]
					v[ 1 ].unshift( [ cp = $[ 1 ], lastC2 = $[ 0 ] ] )
				}
			}
			lastC3 = null
			break
		case 'q':
			{	const	xys_2 = XYs_2()
				for ( let _ = 0; _ < xys_2.length; _++ ) {
					const	$ = xys_2[ _ ]
					const	q = Add( cp, $[ 0 ] )
					v[ 1 ].unshift( [ Rel( $[ 1 ] ), lastC2 = q ] )
				}
			}
			lastC3 = null
			break
		case 'T':
			{	const	xys = XYs()
				for ( let _ = 0; _ < xys.length; _++ ) {
					const	q = lastC2 ? Sub( cp, Sub( lastC2, cp ) ) : cp
					v[ 1 ].unshift( [ cp = xys[ _ ], lastC2 = q ] )
				}
			}
			lastC3 = null
			break
		case 't':
			{	const	xys = XYs()
				for ( let _ = 0; _ < xys.length; _++ ) {
					const	q = lastC2 ? Sub( cp, Sub( lastC2, cp ) ) : cp
					v[ 1 ].unshift( [ Rel( xys[ _ ] ), lastC2 = q ] )
				}
			}
			lastC3 = null
			break
		case 'A':
			{	const	ns = Ns()
				for ( let iNs = 0; iNs < ns.length; iNs += 7 ) {
					const [ rx, ry, angle, large, sweep, x, y ] = ns.slice( iNs )
					v[ 1 ].unshift( ...Arc( cp, [ rx, ry ], angle * Math.PI / 180, large, sweep, cp = [ x, y ] ) )
				}
			}
			lastC2 = lastC3 = null
			break
		case 'a':
			{	const	ns = Ns()
				for ( let iNs = 0; iNs < ns.length; iNs += 7 ) {
					const [ rx, ry, angle, large, sweep, dx, dy ] = ns.slice( iNs )
					v[ 1 ].unshift( ...Arc( cp, [ rx, ry ], angle * Math.PI / 180, large, sweep, Rel( [ dx, dy ] ) ) )
				}
			}
			lastC2 = lastC3 = null
			break
		default:
console.log( 'UNKNOWN MNEMONIC', "'" + mnemonic + "'" )
			break
		}
	}
	v && $.push( v )
	return $
}

const
RectPath = ( x, y, w, h, rx, ry ) => {

	const $ = []

	if ( rx || ry ) {
		rx * 2 > w && ( rx = w / 2 )
		ry * 2 > h && ( rx = h / 2 )

		return [
			null
		,	[	[ [ x + rx, y ], [ x, y ] ]
			,	[ [ x, y + ry ] ]
			,	[ [ x, y + h - ry ], [ x, y + h ] ]
			,	[ [ x + rx, y + h ] ]
			,	[ [ x + w - rx, y + h ], [ x + w, y + h ] ]
			,	[ [ x + w, y + h - ry ] ]
			,	[ [ x + w, y + ry ], [ x + w, y ] ]
			,	[ [ x + w - rx, y ] ]
			]
		]
	} else {
		return [
			null
		,	[	[ [ x		, y		] ]
			,	[ [ x + w	, y		] ]
			,	[ [ x + w	, y + h	] ]
			,	[ [ x		, y + h	] ]
			]
		]
	}

	return [ true, $ ]
}

const
Parse2 = _ => [ 0, 0 ]

const
A2DMul = ( p, q ) => [
	p[ 0 ] * q[ 0 ] + p[ 1 ] * q[ 2 ]
,	p[ 0 ] * q[ 1 ] + p[ 1 ] * q[ 3 ]
,	p[ 2 ] * q[ 0 ] + p[ 3 ] * q[ 2 ]
,	p[ 2 ] * q[ 1 ] + p[ 3 ] * q[ 3 ]
,	p[ 4 ] * q[ 0 ] + p[ 5 ] * q[ 2 ] + q[ 4 ]
,	p[ 4 ] * q[ 1 ] + p[ 5 ] * q[ 3 ] + q[ 5 ]
]

//	https://www.w3.org/TR/SVG/coords.html
//	https://developer.mozilla.org/ja/docs/Web/SVG/Attribute/transform


//v	////////	GLOBAL: to find by id, when tag is 'use'
let svg
//^

const
Crawl = ( _, mat = [ 1, 0, 0, 1, 0, 0 ] ) => {
	let	T = _.tagName
	const A = Object.fromEntries( _.getAttributeNames().map( name => [ name, _.getAttribute( name ) ] ) )
//console.log( T, A.transform, mat )
	let ctm = [ 1, 0, 0, 1, 0, 0 ]
	const
	CTMCat = _ => ctm = A2DMul( ctm, _ )
	const
	$ = A.transform
	if ( $ ) {
		//	https://stackoverflow.com/questions/22131798/using-multiple-svg-transformations-at-the-same-time
		//	REVERSE!!!
		$.split( /\)\s*/ ).map( _ => _.trim() ).filter( _ => _ ).reverse().forEach(
			_ => {
				const
				nums = _.split( '(' )[ 1 ].trim().split( /[\,\s]+/ ).map( _ => Number( _ ) )
				if ( _.startsWith( 'translate' ) ) {
					CTMCat( [ 1, 0, 0, 1, nums[ 0 ] ?? 0, nums[ 1 ] ?? 0 ] )
				}
				if ( _.startsWith( 'scale' ) ) {
					const x = nums[ 0 ] ?? 1
					const y = nums[ 1 ] ?? x
					CTMCat( [ x, 0, 0, y, 0, 0 ] )
				}
				if ( _.startsWith( 'rotate' ) ) {
					const _ = nums[ 0 ] * Math.PI / 180
					const s = Math.sin( _ )
					const c = Math.cos( _ )
					if ( nums.length === 3 ) {
					//	https://stackoverflow.com/questions/31446613/rotating-a-svg-path-around-center-using-matrix
						const x = nums[ 1 ]
						const y = nums[ 2 ]
						CTMCat( [ c, s, -s, c, -c * x + s * y + x, -s * x - c * y + y ] )
					} else {
						CTMCat( [ c, s, -s, c, 0, 0 ] )
					}
				}
				if ( _.startsWith( 'skewX' ) ) {
					//	https://stackoverflow.com/questions/673216/skew-matrix-algorithm
					CTMCat( [ 1, 0, Math.tan( nums[ 0 ] * Math.PI / 180 ), 1, 0, 0 ] )
				}
				if ( _.startsWith( 'skewY' ) ) {
					//	https://stackoverflow.com/questions/673216/skew-matrix-algorithm
					CTMCat( [ 1, Math.tan( nums[ 0 ] * Math.PI / 180 ), 0, 1, 0, 0 ] )
				}
				if ( _.startsWith( 'matrix' ) ) {
					CTMCat( nums )
				}
			}
		)
	}
	CTMCat( mat )

	const
	D = Array.from( _.children ).map( _ => Crawl( _, ctm ) ).filter( _ => _ )
	if ( T === 'g' ) {	//	Optimization
		if ( D.length === 0 ) return
		if ( D.length === 1 ) {
			const $ = D[ 0 ]
			return [ $[ 0 ], $[ 1 ], Object.assign( A, $[ 2 ] ), $[ 3 ] ]
		}
	//	if ( Object.keys( A ).length == 0 && D.length == 1 ) return D[ 0 ]
	}

	const
	Transform = ( [ x, y ] ) => [
		x * ctm[ 0 ] + y * ctm[ 2 ] + ctm[ 4 ]
	,	x * ctm[ 1 ] + y * ctm[ 3 ] + ctm[ 5 ]
	]
	const
	TransformPath = _ => _.map(
		( [ MT, LC ] ) => [
			MT ? Transform( MT ) : null
		,	LC.map( _ => _.map( _ => Transform( _ ) ) )
		]
	)
	let G = null
	switch ( T ) {
	case 'path':
		G = TransformPath( D2Path( A.d ) )
		break
	case 'rect':
		G = TransformPath(
			[	RectPath(
					A.x ? Number( A.x ) : 0
				,	A.y ? Number( A.y ) : 0
				,	Number( A.width )
				,	Number( A.height )
				,	A.rx ? Number( A.rx ) : 0
				,	A.ry ? Number( A.ry ) : 0
				)
			]
		)
		break
	case 'line':
		G = TransformPath(
			[	[	[ Number( A.x1 ), Number( A.y1 ) ]
				,	[ [ [ Number( A.x2 ), Number( A.y2 ) ] ] ]
				]
			]
		)
		break
	case 'polygon':
		{	const nums = A.points.split( /[\,\s]+/ ).filter( _ => _.length ).map( _ => Number( _ ) )
			if ( nums < 4 ) return
			const Ss = []
			for ( let i = 0; i < nums.length; i += 2 ) Ss.unshift( [ [ nums[ i ], nums[ i + 1 ] ] ] )
			G = TransformPath( [ [ null, Ss ] ] )
		}
		break
	case 'polyline':
		{	const nums = A.points.split( /[\,\s]+/ ).filter( _ => _.length ).map( _ => Number( _ ) )
			if ( nums < 4 ) return
			const Ss = []
			for ( let i = 2; i < nums.length; i += 2 ) Ss.unshift( [ [ nums[ i ], nums[ i + 1 ] ] ] )
			G = TransformPath( [ [ [ nums[ 0 ], nums[ 1 ] ], Ss ] ] )
		}
		break
	case 'circle':
		{	if ( !A.r ) return
			const r = Number( A.r )
			const r_cf = r * CF
			const cx = Number( A.cx ) 
			const cy = Number( A.cy )
			G = TransformPath(
				[	[	null
					,	[	[ [ cx - r, cy ], [ cx - r, cy + r_cf ], [ cx - r_cf, cy + r ] ]
						,	[ [ cx, cy + r ], [ cx + r_cf, cy + r ], [ cx + r, cy + r_cf ] ]
						,	[ [ cx + r, cy ], [ cx + r, cy - r_cf ], [ cx + r_cf, cy - r ] ]
						,	[ [ cx, cy - r ], [ cx - r_cf, cy - r ], [ cx - r, cy - r_cf ] ]
						]
					]
				]
			)
		}
		break
	case 'ellipse':
		{	if ( !A.rx ) return
			if ( !A.ry ) return
			const rx = Number( A.rx )
			const ry = Number( A.ry )
			const rx_cf = rx * CF
			const ry_cf = ry * CF
			const cx = Number( A.cx )
			const cy = Number( A.cy )
			G = TransformPath(
				[	[	null
					,	[	[ [ cx - rx, cy ], [ cx - rx, cy + ry_cf ], [ cx - rx_cf, cy + ry ] ]
						,	[ [ cx, cy + ry ], [ cx + rx_cf, cy + ry ], [ cx + rx, cy + ry_cf ] ]
						,	[ [ cx + rx, cy ], [ cx + rx, cy - ry_cf ], [ cx + rx_cf, cy - ry ] ]
						,	[ [ cx, cy - ry ], [ cx - rx_cf, cy - ry ], [ cx - rx, cy - ry_cf ] ]
						]
					]
				]
			)
		}
		break
	case 'use':
		{	const $ = Crawl( svg.querySelector( A[ "xlink:href" ] ) )
			T = $[ 0 ]
			G = TransformPath( $[ 3 ] )
		}
		break
	}
	return [ T, D, A, G ]
}

export default
_ => Array.from( new DOMParser().parseFromString( _, 'text/html' ).getElementsByTagName( 'svg' ) ).map(
	$ => Crawl( svg = $ )
)

