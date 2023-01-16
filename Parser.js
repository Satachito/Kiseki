import { CF, Add, Sub } from './JP/JS/G.js'

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
console.log( mnemonic )
		switch ( mnemonic ) {
		case 'Z', 'z':
if ( v && v.length == 1 ) console.log( 'v.length == 1 ', v )
			v && v.length >= 2 && v[ 0 ][ 0 ][ 0 ] == v[ 1 ][ 0 ][ 0 ] && v[ 0 ][ 0 ][ 1 ] == v[ 1 ][ 0 ][ 1 ] && v.pop()
			v && $.push( [ true, v ] )
			lastC2 = lastC3 = null
			v = null
			break
		case 'M':
			v && $.push( [ false, v ] )
			{	const xys = XYs()
				v = [ [ cp = xys[ 0 ] ] ]
				for ( let _ = 1; _ < xys.length; _++ ) v.push( [ cp = xys[ _ ] ] )
			}
			lastC2 = lastC3 = null
			break
		case 'm':
			if ( v ) $.push( [ false, v ] )
			{	const xys = XYs()
				v = [ [ Rel( xys[ 0 ] ) ] ]
				for ( let _ = 1; _ < xys.length; _++ ) v.push( [ Rel( xys[ _ ] ) ] )
			}
			lastC2 = lastC3 = null
			break
		case 'L':
			{	const xys = XYs()
				for ( let _ = 0; _ < xys.length; _++ ) v.push( [ cp = xys[ _ ] ] )
			}
			lastC2 = lastC3 = null
			break
		case 'l':
			{	const xys = XYs()
				for ( let _ = 0; _ < xys.length; _++ ) v.push( [ Rel( xys[ _ ] ) ] )
			}
			lastC2 = lastC3 = null
			break
		case 'H':
			{	const ns = Ns()
				for ( let _ = 0; _ < ns.length; _++ ) v.push( [ AbsH( ns[ _ ] ) ] )
			}
			lastC2 = lastC3 = null
			break
		case 'h':
			{	const ns = Ns()
				for ( let _ = 0; _ < ns.length; _++ ) v.push( [ RelH( ns[ _ ] ) ] )
			}
			lastC2 = lastC3 = null
			break
		case 'V':
			{	const ns = Ns()
				for ( let _ = 0; _ < ns.length; _++ ) v.push( [ AbsV( ns[ _ ] ) ] )
			}
			lastC2 = lastC3 = null
			break
		case 'v':
			{	const ns = Ns()
				for ( let _ = 0; _ < ns.length; _++ ) v.push( [ RelV( ns[ _ ] ) ] )
			}
			lastC2 = lastC3 = null
			break
		case 'C':
			{	const	xys_3 = XYs_3()
				for ( let _ = 0; _ < xys_3.length; _++ ) {
					const	$ = xys_3[ _ ]
					v.push( [ cp = $[ 2 ], lastC3 = $[ 1 ], $[ 0 ] ] )
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
					v.push( [ Rel( $[ 2 ] ), lastC3 = q, r ] )
				}
			}
			lastC2 = null
			break
		case 'S':
			{	const	xys_2 = XYs_2()
				for ( let _ = 0; _ < xys_2.length; _++ ) {
					const	$ = xys_2[ _ ]
					const	r = lastC3 ? Sub( cp, Sub( lastC3, cp ) ) : cp
					v.push( [ cp = $[ 1 ], lastC3 = $[ 0 ], r ] )
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
					v.push( [ Rel( $[ 1 ] ), lastC3 = q, r ] )
				}
			}
			lastC2 = null
			break
		case 'Q':
			{	const	xys_2 = XYs_2()
				for ( let _ = 0; _ < xys_2.length; _++ ) {
					const	$ = xys_2[ _ ]
					v.push( [ cp = $[ 1 ], lastC2 = $[ 0 ] ] )
				}
			}
			lastC3 = null
			break
		case 'q':
			{	const	xys_2 = XYs_2()
				for ( let _ = 0; _ < xys_2.length; _++ ) {
					const	$ = xys_2[ _ ]
					const	q = Add( cp, $[ 0 ] )
					v.push( [ Rel( $[ 1 ] ), lastC2 = q ] )
				}
			}
			lastC3 = null
			break
		case 'T':
			{	const	xys = XYs()
				for ( let _ = 0; _ < xys.length; _++ ) {
					const	q = lastC2 ? Sub( cp, Sub( lastC2, cp ) ) : cp
					v.push( [ cp = xys[ _ ], lastC2 = q ] )
				}
			}
			lastC3 = null
			break
		case 't':
			{	const	xys = XYs()
				for ( let _ = 0; _ < xys.length; _++ ) {
					const	q = lastC2 ? Sub( cp, Sub( lastC2, cp ) ) : cp
					v.push( [ Rel( xys[ _ ] ), lastC2 = q ] )
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
				v.push( [ cp = xy ] )
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
				v.push( [ Rel( xy ) ] )
			}
			lastC2 = lastC3 = null
			break
		default:
console.log( 'UNKNOWN MNEMONIC', mnemonic )
			break
		}
	}
	v && $.push( [ false, v ] )
	return $
}

const
RectPath = ( x, y, w, h, rx, ry ) => {	//	rx, ry: NaN, Number
	const $ = []

	if ( Number.isNaN( rx ) ) {
		if ( Number.isNaN( ry ) ) {
			rx = 0
			ry = 0
		} else rx = ry
	} else if ( Number.isNaN( ry ) ) ry = rx

	if ( rx || ry ) {
		rx * 2 > w && ( rx = w / 2 )
		ry * 2 > h && ( rx = h / 2 )

		$.push( [ [ x + rx, y ], [ x, y ] ] )
		$.push( [ [ x + w - rx, y ] ] )
		$.push( [ [ x + w, y + ry ], [ x + w, y ] ] )
		$.push( [ [ x + w, y + h - ry ] ] )
		$.push( [ [ x + w - rx, y + h ], [ x + w, y + h ] ] )
		$.push( [ [ x + rx, y + h ] ] )
		$.push( [ [ x, y + h - ry ], [ x, y + h ] ] )
		$.push( [ [ x, y + ry ] ] )
	} else {
		$.push( [ [ x, y ] ] )
		$.push( [ [ x + w	, y		] ] )
		$.push( [ [ x + w	, y + h	] ] )
		$.push( [ [ x		, y + h	] ] )
	}

	return [ [ true, $ ] ]
}

const
Crawl = _ => {
	const $ = [ _.tagName, [], {} ]	//	tag, CHILDREN, AttributeDict
	$[ 1 ] = Array.from( _.children ).map( _ => Crawl( _ ) ).filter( _ => _ )
	_.getAttributeNames().forEach(
		name => $[ 2 ][ name ] = _.getAttribute( name )
	)
	switch ( _.tagName ) {
	case 'path':
		$.push( D2Path( $[ 2 ].d ) )
		delete $[ 2 ].d
		if ( $[ 3 ].length == 0 ) return null
		break
	case 'rect':
		{	const _ = $[ 2 ]
			const w = _.width  ? Number( _.width  ) : 0	; if ( !w ) return
			const h = _.height ? Number( _.height ) : 0	; if ( !h ) return
			const x = _.x ? Number( _.x ) : 0
			const y = _.y ? Number( _.y ) : 0
			const rx = _.rx ? Number( _.rx ) : NaN
			const ry = _.ry ? Number( _.ry ) : NaN	
			$.push( RectPath( x, y, w, h, rx, ry ) )
		}
		break
	case 'line':
		{	const _ = $[ 2 ]
			$.push( [ [ false, [ [ [ Number( _.x2 ), Number( _.y2 ) ] ], [ [ Number( _.x1 ), Number( _.y1 ) ] ] ] ] ] )
		}
		break
	case 'polygon':
		{	const nums = $[ 2 ].points.split( /[\,\s]+/ ).filter( _ => _.length ).map( _ => Number( _ ) )
			const points = []
			for ( let i = 0; i < nums.length; i += 2 ) points.push( [ [ nums[ i ], nums[ i + 1 ] ] ] )
			$.push( [ [ true, points ] ] )
		}
		break
	case 'polyline':
		{	const nums = $[ 2 ].points.split( /[\,\s]+/ ).filter( _ => _.length ).map( _ => Number( _ ) )
			const points = []
			for ( let i = 0; i < nums.length; i += 2 ) points.push( [ [ nums[ i ], nums[ i + 1 ] ] ] )
			$.push( [ [ false, points ] ] )
		}
		break
	case 'circle':
		{	const _ = $[ 2 ]
			const r = Number( _.r )
			if ( !r ) return null
			const r_cf = r * CF
			const cx = _.cx ? Number( _.cx ) : 0
			const cy = _.cy ? Number( _.cy ) : 0
			$.push(
				[	[	true
					,	[	[ [ cx, cy - r ], [ cx - r_cf, cy - r ], [ cx - r, cy - r_cf ] ]
						,	[ [ cx + r, cy ], [ cx + r, cy - r_cf ], [ cx + r_cf, cy - r ] ]
						,	[ [ cx, cy + r ], [ cx + r_cf, cy + r ], [ cx + r, cy + r_cf ] ]
						,	[ [ cx - r, cy ], [ cx - r, cy + r_cf ], [ cx - r_cf, cy + r ] ]
						]
					]
				]
			)
		}
		break
	case 'ellipse':
		{	const _ = $[ 2 ]
			const rx = Number( _.rx )
			if ( !rx ) return null
			const ry = Number( _.ry )
			if ( !ry ) return null
			const rx_cf = rx * CF
			const ry_cf = ry * CF
			const cx = _.cx ? Number( _.cx ) : 0
			const cy = _.cy ? Number( _.cy ) : 0
			$.push(
				[	[	true
					,	[	[ [ cx, cy - ry ], [ cx - rx_cf, cy - ry ], [ cx - rx, cy - ry_cf ] ]
						,	[ [ cx + rx, cy ], [ cx + rx, cy - ry_cf ], [ cx + rx_cf, cy - ry ] ]
						,	[ [ cx, cy + ry ], [ cx + rx_cf, cy + ry ], [ cx + rx, cy + ry_cf ] ]
						,	[ [ cx - rx, cy ], [ cx - rx, cy + ry_cf ], [ cx - rx_cf, cy + ry ] ]
						]
					]
				]
			)
		}
		break
	case 'g':
		if ( $[ 1 ].length == 0 ) return null
		if ( Object.keys( $[ 2 ] ).length == 0 && $[ 1 ].length == 1 ) return $[ 1 ][ 0 ]
		break
	}
	return $
}

export const
Parse = _ => Array.from( new DOMParser().parseFromString( _, 'text/html' ).getElementsByTagName( 'svg' ) ).map( $ => Crawl( $ ) )

