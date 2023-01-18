import { EQ, CF, Add, Sub } from './JP/JS/G.js'

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
		const mnemonic = _[ i++ ]
//console.log( "'" + _.slice( i - 1, 16 ) + "'" )
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
			{	const	[ rx, ry ] = XY()
				const	angle = ReadNumber()
				const	large = ReadNumber()
				const	sweep = ReadNumber()
				const	xy = XY()
				v[ 1 ].unshift( [ cp = xy ] )
			}
			lastC2 = lastC3 = null
			break
		case 'a':
			{	const	[ rx, ry ] = XY()
				const	angle = ReadNumber()
				const	large = ReadNumber()
				const	sweep = ReadNumber()
				const	xy = XY()
console.log( 'a', rx, ry, angle, large, sweep, xy )
				v[ 1 ].unshift( [ Rel( xy ) ] )
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
Crawl = _ => {
	const $ = [
		_.tagName
	,	Array.from( _.children ).map( _ => Crawl( _ ) ).filter( _ => _ )
	,	Object.fromEntries( _.getAttributeNames().map( name => [ name, _.getAttribute( name ) ] ) )
	]
	const [ T, D, A ] = $
	switch ( T ) {
	case 'path':
		$[ 3 ] = D2Path( A.d )
		break
	case 'rect':
		$[ 3 ] = [
			RectPath(
				A.x ? Number( A.x ) : 0
			,	A.y ? Number( A.y ) : 0
			,	Number( A.width )
			,	Number( A.height )
			,	A.rx ? Number( A.rx ) : 0
			,	A.ry ? Number( A.ry ) : 0
			)
		]
		break
	case 'line':
		$[ 3 ] = [
			[	[ Number( A.x1 ), Number( A.y1 ) ]
			,	[ [ [ Number( A.x2 ), Number( A.y2 ) ] ] ]
			]
		]
		break
	case 'polygon':
		{	const nums = A.points.split( /[\,\s]+/ ).filter( _ => _.length ).map( _ => Number( _ ) )
			if ( nums < 4 ) return
			const Ss = []
			for ( let i = 0; i < nums.length; i += 2 ) Ss.unshift( [ [ nums[ i ], nums[ i + 1 ] ] ] )
			$[ 3 ] = [ [ null, Ss ] ]
		}
		break
	case 'polyline':
		{	const nums = A.points.split( /[\,\s]+/ ).filter( _ => _.length ).map( _ => Number( _ ) )
			if ( nums < 4 ) return
			const Ss = []
			for ( let i = 2; i < nums.length; i += 2 ) Ss.unshift( [ [ nums[ i ], nums[ i + 1 ] ] ] )
			$[ 3 ] = [ [ [ nums[ 0 ], nums[ 1 ] ], Ss ] ]
		}
		break
	case 'circle':
		{	if ( !A.r ) return
			const r = Number( A.r )
			const r_cf = r * CF
			const cx = Number( A.cx ) 
			const cy = Number( A.cy )
			$.push(
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
			$.push(
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
	case 'g':	//	Optimization
		if ( D.length == 0 ) return
		if ( Object.keys( A ).length == 0 && D.length == 1 ) return D[ 0 ]
		break
	}
	return $
}

export default
_ => Array.from( new DOMParser().parseFromString( _, 'text/html' ).getElementsByTagName( 'svg' ) ).map( $ => Crawl( $ ) )

