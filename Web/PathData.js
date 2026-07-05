//	Pure path-data logic — no DOM, shared by Web/ and tools/.
//	A parsed d is an array of absolute segments:
//		[ 'M', x, y ] | [ 'L', x, y ] | [ 'C', x1, y1, x2, y2, x, y ]
//	|	[ 'S', x2, y2, x, y ] | [ 'Q', x1, y1, x, y ] | [ 'T', x, y ]
//	|	[ 'A', rx, ry, deg, laf, sf, x, y ] | [ 'Z' ]
//	H / V and every relative command are absolutized at parse time.

export	const
PRESENTATION_ATTRS	= [
	'fill'
,	'fill-rule'
,	'fill-opacity'
,	'stroke'
,	'stroke-width'
,	'stroke-linecap'
,	'stroke-linejoin'
,	'stroke-miterlimit'
,	'stroke-dasharray'
,	'stroke-dashoffset'
,	'stroke-opacity'
,	'opacity'
]

const
NUM	= /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/

export	const
ParseD	= d => {
	const
	tokens = String( d ).match(
		new RegExp( `[MmLlHhVvCcSsQqTtAaZz]|${ NUM.source }`, 'g' )
	) ?? []

	const
	$ = []

	let	i	= 0
	let	cmd	= null
	let	x	= 0, y	= 0		//	current point
	let	sx	= 0, sy	= 0		//	subpath start

	const
	Num	= () => {
		const
		_ = Number( tokens[ i++ ] )
		if	( !Number.isFinite( _ ) ) throw new Error( `Invalid number in path data: ${ tokens[ i - 1 ] }` )
		return _
	}
	const
	Flag	= () => {
		const
		_ = Num()
		if	( _ !== 0 && _ !== 1 ) throw new Error( `Invalid arc flag in path data: ${ _ }` )
		return _
	}

	while ( i < tokens.length ) {

		/^[A-Za-z]$/.test( tokens[ i ] ) && ( cmd = tokens[ i++ ] )
		if	( cmd === null ) throw new Error( `Path data must start with a command: ${ tokens[ i ] }` )

		const
		rel	= cmd === cmd.toLowerCase()
	,	C	= cmd.toUpperCase()

		switch ( C ) {
		case 'M': {
			const	X = Num() + ( rel ? x : 0 )
			const	Y = Num() + ( rel ? y : 0 )
			$.push( [ 'M', X, Y ] )
			x = sx = X, y = sy = Y
			cmd = rel ? 'l' : 'L'	//	implicit lineto after moveto
			break
		}
		case 'L': {
			const	X = Num() + ( rel ? x : 0 )
			const	Y = Num() + ( rel ? y : 0 )
			$.push( [ 'L', X, Y ] )
			x = X, y = Y
			break
		}
		case 'H': {
			const	X = Num() + ( rel ? x : 0 )
			$.push( [ 'L', X, y ] )
			x = X
			break
		}
		case 'V': {
			const	Y = Num() + ( rel ? y : 0 )
			$.push( [ 'L', x, Y ] )
			y = Y
			break
		}
		case 'C': {
			const	_ = [ Num(), Num(), Num(), Num(), Num(), Num() ]
			rel && ( _[ 0 ] += x, _[ 2 ] += x, _[ 4 ] += x, _[ 1 ] += y, _[ 3 ] += y, _[ 5 ] += y )
			$.push( [ 'C', ..._ ] )
			x = _[ 4 ], y = _[ 5 ]
			break
		}
		case 'S': {
			const	_ = [ Num(), Num(), Num(), Num() ]
			rel && ( _[ 0 ] += x, _[ 2 ] += x, _[ 1 ] += y, _[ 3 ] += y )
			$.push( [ 'S', ..._ ] )
			x = _[ 2 ], y = _[ 3 ]
			break
		}
		case 'Q': {
			const	_ = [ Num(), Num(), Num(), Num() ]
			rel && ( _[ 0 ] += x, _[ 2 ] += x, _[ 1 ] += y, _[ 3 ] += y )
			$.push( [ 'Q', ..._ ] )
			x = _[ 2 ], y = _[ 3 ]
			break
		}
		case 'T': {
			const	X = Num() + ( rel ? x : 0 )
			const	Y = Num() + ( rel ? y : 0 )
			$.push( [ 'T', X, Y ] )
			x = X, y = Y
			break
		}
		case 'A': {
			const	rx	= Num()
			const	ry	= Num()
			const	deg	= Num()
			const	laf	= Flag()
			const	sf	= Flag()
			const	X	= Num() + ( rel ? x : 0 )
			const	Y	= Num() + ( rel ? y : 0 )
			$.push( [ 'A', rx, ry, deg, laf, sf, X, Y ] )
			x = X, y = Y
			break
		}
		case 'Z':
			$.push( [ 'Z' ] )
			x = sx, y = sy
			cmd = null	//	a number straight after Z is an error
			break
		default:
			throw new Error( `Unknown path command: ${ cmd }` )
		}
	}
	return $
}

const
N	= _ => {
	const
	$ = Math.round( _ * 1000 ) / 1000
	return Object.is( $, -0 ) ? '0' : String( $ )
}

export	const
DString	= segs => segs.map(
	( [ C, ..._ ] ) => C + _.map( N ).join( ' ' )
).join( ' ' )

//	Affine matrix { a, b, c, d, e, f }: [ x, y ] → [ ax + cy + e, bx + dy + f ]

export	const
Identity	= () => ( { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } )

export	const
Translation	= ( x, y ) => ( { a: 1, b: 0, c: 0, d: 1, e: x, f: y } )

export	const
MulM	= ( P, C ) => ( {
	a: P.a * C.a + P.c * C.b
,	b: P.b * C.a + P.d * C.b
,	c: P.a * C.c + P.c * C.d
,	d: P.b * C.c + P.d * C.d
,	e: P.a * C.e + P.c * C.f + P.e
,	f: P.b * C.e + P.d * C.f + P.f
} )

export	const
XY_M	= ( m, x, y ) => [ m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f ]

//	SVG transform attribute → matrix ( left to right, outermost first )
export	const
ParseTransform	= str => {
	let	$ = Identity()
	if	( !str ) return $
	for ( const [ , fn, args ] of String( str ).matchAll( /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g ) ) {
		const
		_ = args.trim().split( /[\s,]+/ ).map( Number )
		switch ( fn ) {
		case 'matrix':
			$ = MulM( $, { a: _[ 0 ], b: _[ 1 ], c: _[ 2 ], d: _[ 3 ], e: _[ 4 ], f: _[ 5 ] } )
			break
		case 'translate':
			$ = MulM( $, Translation( _[ 0 ], _[ 1 ] ?? 0 ) )
			break
		case 'scale':
			$ = MulM( $, { a: _[ 0 ], b: 0, c: 0, d: _[ 1 ] ?? _[ 0 ], e: 0, f: 0 } )
			break
		case 'rotate': {
			const	r = _[ 0 ] * Math.PI / 180
			const	[ cx, cy ] = [ _[ 1 ] ?? 0, _[ 2 ] ?? 0 ]
			$ = MulM( $, Translation( cx, cy ) )
			$ = MulM( $, { a: Math.cos( r ), b: Math.sin( r ), c: -Math.sin( r ), d: Math.cos( r ), e: 0, f: 0 } )
			$ = MulM( $, Translation( -cx, -cy ) )
			break
		}
		case 'skewX':
			$ = MulM( $, { a: 1, b: 0, c: Math.tan( _[ 0 ] * Math.PI / 180 ), d: 1, e: 0, f: 0 } )
			break
		case 'skewY':
			$ = MulM( $, { a: 1, b: Math.tan( _[ 0 ] * Math.PI / 180 ), c: 0, d: 1, e: 0, f: 0 } )
			break
		}
	}
	return $
}

//	transform an arc's radii / rotation / sweep under an affine map:
//	SVD of linear( m ) · R( φ ) · diag( rx, ry ) gives the new axes.
const
TransformArc	= ( m, [ rx, ry, deg, laf, sf ], X, Y ) => {
	const
	φ	= deg * Math.PI / 180
,	cos	= Math.cos( φ )
,	sin	= Math.sin( φ )

	const
	m00 = m.a * cos * rx + m.c * sin * rx
,	m01 = -m.a * sin * ry + m.c * cos * ry
,	m10 = m.b * cos * rx + m.d * sin * rx
,	m11 = -m.b * sin * ry + m.d * cos * ry

	const
	E = ( m00 + m11 ) / 2
,	F = ( m00 - m11 ) / 2
,	G = ( m10 + m01 ) / 2
,	H = ( m10 - m01 ) / 2

	const
	Q = Math.hypot( E, H )
,	R = Math.hypot( F, G )

	return [
		Q + R
	,	Math.abs( Q - R )
	,	( Math.atan2( G, F ) + Math.atan2( H, E ) ) / 2 * 180 / Math.PI
	,	laf
	,	m.a * m.d - m.b * m.c < 0 ? 1 - sf : sf
	,	X
	,	Y
	]
}

export	const
TransformSegs	= ( segs, m ) => segs.map(
	( [ C, ..._ ] ) => {
		switch ( C ) {
		case 'A':
			return [ 'A', ...TransformArc( m, _, ...XY_M( m, _[ 5 ], _[ 6 ] ) ) ]
		case 'Z':
			return [ 'Z' ]
		default: {
			const
			$ = [ C ]
			for ( let i = 0; i < _.length; i += 2 ) $.push( ...XY_M( m, _[ i ], _[ i + 1 ] ) )
			return $
		}
		}
	}
)

export	const
TranslateD	= ( d, x, y ) => DString( TransformSegs( ParseD( d ), Translation( x, y ) ) )

//	W3C F.6.5: arc endpoint → center parameterization, for sampling
const
ArcCenter	= ( x1, y1, [ rx, ry, deg, laf, sf, x2, y2 ] ) => {
	const
	φ	= deg * Math.PI / 180
,	cos	= Math.cos( φ )
,	sin	= Math.sin( φ )

	const
	dx	= ( x1 - x2 ) / 2
,	dy	= ( y1 - y2 ) / 2
,	X1	= cos * dx + sin * dy
,	Y1	= -sin * dx + cos * dy

	rx	= Math.abs( rx )
,	ry	= Math.abs( ry )

	//	scale radii up if the endpoints cannot be joined
	const
	Λ	= X1 * X1 / ( rx * rx ) + Y1 * Y1 / ( ry * ry )
	Λ > 1 && ( rx *= Math.sqrt( Λ ), ry *= Math.sqrt( Λ ) )

	const
	sign	= laf === sf ? -1 : 1
,	num		= rx * rx * ry * ry - rx * rx * Y1 * Y1 - ry * ry * X1 * X1
,	den		= rx * rx * Y1 * Y1 + ry * ry * X1 * X1
,	co		= sign * Math.sqrt( Math.max( 0, num / den ) )

	const
	CX1	= co * rx * Y1 / ry
,	CY1	= co * -ry * X1 / rx

	const
	cx	= cos * CX1 - sin * CY1 + ( x1 + x2 ) / 2
,	cy	= sin * CX1 + cos * CY1 + ( y1 + y2 ) / 2

	const
	Angle	= ( ux, uy, vx, vy ) => {
		const
		sign = ux * vy - uy * vx < 0 ? -1 : 1
		return sign * Math.acos(
			Math.min( 1, Math.max( -1
			,	( ux * vx + uy * vy ) / ( Math.hypot( ux, uy ) * Math.hypot( vx, vy ) )
			) )
		)
	}

	const
	θ1	= Angle( 1, 0, ( X1 - CX1 ) / rx, ( Y1 - CY1 ) / ry )
	let
	Δθ	= Angle( ( X1 - CX1 ) / rx, ( Y1 - CY1 ) / ry, ( -X1 - CX1 ) / rx, ( -Y1 - CY1 ) / ry )
	!sf && Δθ > 0 && ( Δθ -= Math.PI * 2 )
	sf && Δθ < 0 && ( Δθ += Math.PI * 2 )

	return { cx, cy, rx, ry, φ, θ1, Δθ }
}

const
SAMPLES	= 16

//	[ T, L, B, R ] of a parsed d — curves and arcs are sampled, so the box is
//	tight enough for selection outlines ( not exact for wide strokes ).
export	const
BBoxSegs	= segs => {
	let	T = Infinity, L = Infinity, B = -Infinity, R = -Infinity
	const
	Grow	= ( x, y ) => (
		y < T && ( T = y )
	,	x < L && ( L = x )
	,	y > B && ( B = y )
	,	x > R && ( R = x )
	)

	let	x = 0, y = 0
	let	sx = 0, sy = 0

	for ( const [ C, ..._ ] of segs ) {
		switch ( C ) {
		case 'M':
			[ x, y ] = _, [ sx, sy ] = _
			Grow( x, y )
			break
		case 'L':
		case 'T':	//	sampled as its endpoint: reflection needs sibling context
			[ x, y ] = _.slice( -2 )
			Grow( x, y )
			break
		case 'C': {
			const	[ x1, y1, x2, y2, X, Y ] = _
			for ( let i = 1; i <= SAMPLES; ++i ) {
				const	t = i / SAMPLES, u = 1 - t
				Grow(
					u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * X
				,	u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * Y
				)
			}
			x = X, y = Y
			break
		}
		case 'S': {
			//	without the previous control point treat it as a quadratic-ish hull
			const	[ x2, y2, X, Y ] = _
			Grow( x2, y2 ), Grow( X, Y )
			x = X, y = Y
			break
		}
		case 'Q': {
			const	[ x1, y1, X, Y ] = _
			for ( let i = 1; i <= SAMPLES; ++i ) {
				const	t = i / SAMPLES, u = 1 - t
				Grow(
					u * u * x + 2 * u * t * x1 + t * t * X
				,	u * u * y + 2 * u * t * y1 + t * t * Y
				)
			}
			x = X, y = Y
			break
		}
		case 'A': {
			const
			{ cx, cy, rx, ry, φ, θ1, Δθ } = ArcCenter( x, y, _ )
			for ( let i = 0; i <= SAMPLES; ++i ) {
				const	θ = θ1 + Δθ * i / SAMPLES
				Grow(
					cx + rx * Math.cos( θ ) * Math.cos( φ ) - ry * Math.sin( θ ) * Math.sin( φ )
				,	cy + rx * Math.cos( θ ) * Math.sin( φ ) + ry * Math.sin( θ ) * Math.cos( φ )
				)
			}
			x = _[ 5 ], y = _[ 6 ]
			break
		}
		case 'Z':
			x = sx, y = sy
			break
		}
	}
	return [ T, L, B, R ]
}

export	const
BBoxD	= d => BBoxSegs( ParseD( d ) )

//	basic shapes → path data ( for importing plain .svg files )
export	const
ShapeD	= ( tag, A ) => {
	const
	V = _ => Number( A[ _ ] ?? 0 )
	switch ( tag ) {
	case 'rect': {
		const
		x = V( 'x' ), y = V( 'y' ), w = V( 'width' ), h = V( 'height' )
		let
		rx = A.rx !== undefined ? Number( A.rx ) : A.ry !== undefined ? Number( A.ry ) : 0
	,	ry = A.ry !== undefined ? Number( A.ry ) : rx
		rx = Math.min( rx, w / 2 ), ry = Math.min( ry, h / 2 )
		return rx > 0 || ry > 0
		?	DString( ParseD(
				`M${ x + rx } ${ y }H${ x + w - rx }A${ rx } ${ ry } 0 0 1 ${ x + w } ${ y + ry }`
			+	`V${ y + h - ry }A${ rx } ${ ry } 0 0 1 ${ x + w - rx } ${ y + h }`
			+	`H${ x + rx }A${ rx } ${ ry } 0 0 1 ${ x } ${ y + h - ry }`
			+	`V${ y + ry }A${ rx } ${ ry } 0 0 1 ${ x + rx } ${ y }Z`
			) )
		:	`M${ x } ${ y }L${ x + w } ${ y }L${ x + w } ${ y + h }L${ x } ${ y + h }Z`
	}
	case 'circle':
	case 'ellipse': {
		const
		cx = V( 'cx' ), cy = V( 'cy' )
	,	rx = tag === 'circle' ? V( 'r' ) : V( 'rx' )
	,	ry = tag === 'circle' ? V( 'r' ) : V( 'ry' )
		return `M${ cx - rx } ${ cy }A${ rx } ${ ry } 0 1 0 ${ cx + rx } ${ cy }A${ rx } ${ ry } 0 1 0 ${ cx - rx } ${ cy }Z`
	}
	case 'line':
		return `M${ V( 'x1' ) } ${ V( 'y1' ) }L${ V( 'x2' ) } ${ V( 'y2' ) }`
	case 'polyline':
	case 'polygon': {
		const
		_ = String( A.points ?? '' ).trim().split( /[\s,]+/ ).map( Number )
		if	( _.length < 4 ) return null
		let
		$ = `M${ _[ 0 ] } ${ _[ 1 ] }`
		for ( let i = 2; i + 1 < _.length; i += 2 ) $ += `L${ _[ i ] } ${ _[ i + 1 ] }`
		tag === 'polygon' && ( $ += 'Z' )
		return $
	}
	}
	return null
}

//	start point of every segment ( the current point before it runs )
export	const
SegStarts	= segs => {
	const
	$ = []
	let	x = 0, y = 0
	let	sx = 0, sy = 0
	for ( const seg of segs ) {
		$.push( [ x, y ] )
		const
		[ C, ..._ ] = seg
		switch ( C ) {
		case 'M':
			[ x, y ] = _, [ sx, sy ] = _
			break
		case 'Z':
			x = sx, y = sy
			break
		default:
			x = _[ _.length - 2 ], y = _[ _.length - 1 ]
			break
		}
	}
	return $
}

//	rewrite shorthand segments ( S → C, T → Q ) so every control point is explicit
export	const
NormalizeSegs	= segs => {
	const
	starts = SegStarts( segs )
	const
	$ = []
	let	pC = null	//	previous cubic's second control
	let	pQ = null	//	previous quadratic's control
	segs.forEach( ( [ C, ..._ ], i ) => {
		const
		[ x, y ] = starts[ i ]
		switch ( C ) {
		case 'C':
			$.push( [ 'C', ..._ ] )
			pC = [ _[ 2 ], _[ 3 ] ], pQ = null
			break
		case 'S': {
			const
			[ cx, cy ] = pC ? [ 2 * x - pC[ 0 ], 2 * y - pC[ 1 ] ] : [ x, y ]
			$.push( [ 'C', cx, cy, ..._ ] )
			pC = [ _[ 0 ], _[ 1 ] ], pQ = null
			break
		}
		case 'Q':
			$.push( [ 'Q', ..._ ] )
			pQ = [ _[ 0 ], _[ 1 ] ], pC = null
			break
		case 'T': {
			const
			[ cx, cy ] = pQ ? [ 2 * x - pQ[ 0 ], 2 * y - pQ[ 1 ] ] : [ x, y ]
			$.push( [ 'Q', cx, cy, ..._ ] )
			pQ = [ cx, cy ], pC = null
			break
		}
		default:
			$.push( [ C, ..._ ] )
			pC = pQ = null
			break
		}
	} )
	return $
}

//	split into subpaths ( each starting at its M; a leading M-less fragment is kept as-is )
export	const
SubpathsSegs	= segs => {
	const
	$ = []
	for ( const seg of segs ) {
		( seg[ 0 ] === 'M' || !$.length ) && $.push( [] )
		$.at( -1 ).push( seg )
	}
	return $
}

//	reverse the drawing direction of every subpath ( fills are unchanged under
//	nonzero for a single contour, but winding-sensitive holes flip — the point
//	of the old Reverse tool )
export	const
ReverseSegs	= segs => SubpathsSegs( NormalizeSegs( segs ) ).flatMap(
	sub => {
		const
		closed = sub.at( -1 )[ 0 ] === 'Z'
		const
		body = closed ? sub.slice( 0, -1 ) : sub
		if	( body.length < 2 ) return sub

		const
		starts = SegStarts( body )
		const
		endOf = i => {
			const
			_ = body[ i ]
			return [ _[ _.length - 2 ], _[ _.length - 1 ] ]
		}

		const
		[ mx, my ] = starts[ 1 ]			//	subpath start ( M point )
		const
		[ ex, ey ] = endOf( body.length - 1 )	//	last endpoint

		const
		$ = []
		if	( closed ) {
			$.push( [ 'M', mx, my ] )
			;( ex !== mx || ey !== my ) && $.push( [ 'L', ex, ey ] )	//	the implicit Z line, reversed
		} else {
			$.push( [ 'M', ex, ey ] )
		}
		for ( let i = body.length - 1; i >= 1; --i ) {
			const
			[ C, ..._ ] = body[ i ]
			const
			[ sx, sy ] = starts[ i ]
			switch ( C ) {
			case 'L':
				$.push( [ 'L', sx, sy ] )
				break
			case 'C':
				$.push( [ 'C', _[ 2 ], _[ 3 ], _[ 0 ], _[ 1 ], sx, sy ] )
				break
			case 'Q':
				$.push( [ 'Q', _[ 0 ], _[ 1 ], sx, sy ] )
				break
			case 'A':
				$.push( [ 'A', _[ 0 ], _[ 1 ], _[ 2 ], _[ 3 ], 1 - _[ 4 ], sx, sy ] )
				break
			}
		}
		closed && $.push( [ 'Z' ] )
		return $
	}
)

const
Lerp	= ( [ ax, ay ], [ bx, by ], t ) => [ ax + ( bx - ax ) * t, ay + ( by - ay ) * t ]

//	point on an L / C / Q segment at parameter t ( start = current point before it )
export	const
EvalSeg	= ( [ C, ..._ ], start, t ) => {
	switch ( C ) {
	case 'L':
		return Lerp( start, [ _[ 0 ], _[ 1 ] ], t )
	case 'Q': {
		const
		a = Lerp( start, [ _[ 0 ], _[ 1 ] ], t )
	,	b = Lerp( [ _[ 0 ], _[ 1 ] ], [ _[ 2 ], _[ 3 ] ], t )
		return Lerp( a, b, t )
	}
	case 'C': {
		const
		a = Lerp( start, [ _[ 0 ], _[ 1 ] ], t )
	,	b = Lerp( [ _[ 0 ], _[ 1 ] ], [ _[ 2 ], _[ 3 ] ], t )
	,	c = Lerp( [ _[ 2 ], _[ 3 ] ], [ _[ 4 ], _[ 5 ] ], t )
		return Lerp( Lerp( a, b, t ), Lerp( b, c, t ), t )
	}
	}
	return null
}

//	nearest parameter on an L / C / Q segment to xy ( sampled; L is exact )
export	const
NearestOnSeg	= ( seg, start, [ x, y ] ) => {
	if	( seg[ 0 ] === 'L' ) {
		const
		[ ax, ay ] = start
	,	[ bx, by ] = [ seg[ 1 ], seg[ 2 ] ]
		const
		len2 = ( bx - ax ) ** 2 + ( by - ay ) ** 2
		const
		t = len2 ? Math.min( 1, Math.max( 0, ( ( x - ax ) * ( bx - ax ) + ( y - ay ) * ( by - ay ) ) / len2 ) ) : 0
		const
		[ px, py ] = Lerp( start, [ bx, by ], t )
		return { t, dist: Math.hypot( x - px, y - py ) }
	}
	if	( seg[ 0 ] !== 'C' && seg[ 0 ] !== 'Q' ) return null
	let	$ = { t: 0, dist: Infinity }
	for ( let i = 0; i <= 32; ++i ) {
		const
		t = i / 32
		const
		[ px, py ] = EvalSeg( seg, start, t )
		const
		dist = Math.hypot( x - px, y - py )
		dist < $.dist && ( $ = { t, dist } )
	}
	return $
}

//	split an L / C / Q segment at t → two segments ( de Casteljau for curves )
export	const
SplitSegAt	= ( [ C, ..._ ], start, t ) => {
	switch ( C ) {
	case 'L': {
		const
		p = Lerp( start, [ _[ 0 ], _[ 1 ] ], t )
		return [ [ 'L', ...p ], [ 'L', _[ 0 ], _[ 1 ] ] ]
	}
	case 'Q': {
		const
		c = [ _[ 0 ], _[ 1 ] ]
	,	e = [ _[ 2 ], _[ 3 ] ]
		const
		c1 = Lerp( start, c, t )
	,	c2 = Lerp( c, e, t )
	,	m = Lerp( c1, c2, t )
		return [ [ 'Q', ...c1, ...m ], [ 'Q', ...c2, ...e ] ]
	}
	case 'C': {
		const
		c1 = [ _[ 0 ], _[ 1 ] ]
	,	c2 = [ _[ 2 ], _[ 3 ] ]
	,	e = [ _[ 4 ], _[ 5 ] ]
		const
		a = Lerp( start, c1, t )
	,	b = Lerp( c1, c2, t )
	,	g = Lerp( c2, e, t )
	,	ab = Lerp( a, b, t )
	,	bg = Lerp( b, g, t )
	,	m = Lerp( ab, bg, t )
		return [ [ 'C', ...a, ...ab, ...m ], [ 'C', ...bg, ...g, ...e ] ]
	}
	}
	return null
}
