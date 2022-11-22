const
Loop = ( N, $ ) => {
	for ( let _ = 0; _ < N; _++ ) $()
}
const
Iterate = ( N, $ ) => {
	for ( let _ = 0; _ < N; _++ ) $( _ )
}

const
Permutations = ( N, $ ) => {
	for ( let p = 0; p < N - 1; p++ ) for ( let q = p + 1; q < N; q++ ) $( p, q )
}
const
ArrayPermutations = ( _, $ ) => {
	const L = _.length
	for ( let p = 0; p < L - 1; p++ ) for ( let q = p + 1; q < L; q++ ) $( _[ p ], _[ q ] )
}

const
Product = ( P, Q, $ ) => {
	for ( let p = 0; p < P; p++ ) for ( let q = 0; q < Q; q++ ) $( p, q )
}

import {
	CF
,	EQ
,	Round
,	Abs
,	Next
,	Near
,	Add
,	Sub
,	Vec
,	Mul
,	Div
,	Dot
,	Mid
,	Angle
,	BBox
,	BBoxOr

//	Bezier
,	FindCubeBezierT
,	FindQuadBezierT
,	DivideCubeBezier
,	DivideQuadBezier
,	FitCubeBezier
,	FitQuadBezier

//	GRID
,	LineGrids
,	QuadGrids
,	CubeGrids
,	IntersectingGrids
,	IsLineGrids

,	PerpendicularLength2V
,	IsLinePixels
} from './JP/JS/G.js'

////////

const
cMain = CANVAS.getContext( '2d' )

const
cDebug = D_CANVAS.getContext( '2d' )

let
glyph = []

const
Grids = ( cp, S ) => {
	switch ( S.length ) {
	case 1	: return LineGrids( cp, S[ 0 ] )
	case 2	: return QuadGrids( cp, S[ 1 ], S[ 0 ] )
	case 3	: return CubeGrids( cp, S[ 2 ], S[ 1 ], S[ 0 ] )
	default	: debugger
	}
}

/*	reserved ABBREVIATION
	X, Y, Z, x, y, z
	W, H, D
	G: Glyph
	C: Contour
	S: Section
	P: Point
*/
const
BitRGBAs = _ => {	//	All C in _ Must be closed
	const bbox = BBox( _.flat().flat() )
	const X = Math.floor( bbox[ 0 ] )
	const Y = Math.floor( bbox[ 1 ] )
	const W = Math.ceil( bbox[ 2 ] ) - X + 4
	const H = Math.ceil( bbox[ 3 ] ) - Y + 4
	const $ = new Int8Array( W * H )
	$.fill( 0 )
	
//	!!!! TRICS !!!!	ATTACHING GRIDS TO SEGMENT IN INNER LOOP
	const OFFSET = [ X - 2, Y - 2 ]
	_.forEach( 
		C => {
			const
			grids = []
			let	cp = C[ 0 ][ 0 ]
			let iC = C.length
			while ( iC-- ) {
				const S = C[ iC ]
				//v	PULLING A TRICK
				S.grids = Grids( cp, S ).map( _ => Sub( _, OFFSET ) )
				//^
				const _ = Sub( Round( S[ 0 ] ), OFFSET )
				S.grids.length
				?	grids.push( ...S.grids, _ )
				:	EQ( Sub( Round( cp ), OFFSET ), _ ) || grids.push( _ )
				cp = S[ 0 ]
			}
//console.log( grids )
			let [ pX, pY ] = grids.at( -1 )
			grids.forEach(
				( [ cX, cY ] ) => (
					pY !== cY && (
						pY < cY
						?	$[ pY * W + ( pX < cX ? pX : cX ) ]++
						:	$[ cY * W + ( pX < cX ? cX : pX ) ]--
					)
				,	[ pX, pY ] = [ cX, cY ]
				)
			)
		}
	)

	//					xxxxrgba	
	//	transparent	:	bbbbbbb0
	//	black		:	bbbb0001
	//	red			:	bbbb1001
	//	white		:	bbbb1111
	switch ( 'nonzero' ) {
	case 'nonzero':
		for ( let y = 2; y < H - 2; y++ ) {
			let _ = 0
			let i = y * W + 2
			while ( i < y * W + W - 2 ) (
				_ += $[ i ]
			,	$[ i ] = _ ? 0x01 : 0
			,	i++
			)
			_ += $[ i ]
			if ( _ ) debugger
//	DELETING LAST EDGE
			$[ i ] = 0
		}
		break
	case 'evenodd':
		break
	}

	const
	Get = ( x, y ) => $[ y * W + x ]

//for ( let y = 0; y < H; y++ ) {
//	let _ = y.toString( 16 ) + ':' 
//	for ( let x = 0; x < W; x++ ) _ += Get( x, y ) ? x.toString( 16 ) : '_'
//	console.log( _ )
//}

	const
	joints = _.map( C => C.map( S => Sub( S[ 0 ], OFFSET ) ) ).flat()
	const
	inters = []
	ArrayPermutations(
		_.flat().map( S => S.grids )	//	!!!! TRICK EFFECTS !!!!
	,	( p, q ) => inters.push( ...IntersectingGrids( p, q ) )
	)

if ( true ) {
	const
	POIs = [ ...joints ]
	inters.forEach(
		( [ x, y ] ) => Number.isInteger( x )
		?	POIs.push( [ x, y ] )
		:	(	x = ~~x
			,	y = ~~y
			,	POIs.push( [ x    , y     ] )
			,	POIs.push( [ x + 1, y     ] )
			,	POIs.push( [ x    , y + 1 ] )
			,	POIs.push( [ x + 1, y + 1 ] )
			)
	)

//	console.log( joints )
//	console.log( inters )
//	console.log( POIs )
	while ( true ) {
		let	isSet = 0
		const
		Set = ( x, y ) => ( $[ y * W + x ] |= 0x81, isSet++, console.log( 'Set:', x, y ) )
		const
		Connect = ( x, y ) => (
			//	Diagonal first
		 	!Get( x - 1, y - 1 ) && Get( x - 2, y - 2 ) && Set( x - 1, y - 1 )
		,	!Get( x    , y     ) && Get( x + 1, y + 1 ) && Set( x    , y     )
		,	!Get( x    , y - 1 ) && Get( x + 1, y - 2 ) && Set( x    , y - 1 )
		,	!Get( x - 1, y     ) && Get( x - 2, y + 1 ) && Set( x - 1, y     )
			//
		,	!Get( x - 1, y ) && !Get( x - 1, y - 1 ) && ( Get( x - 2, y ) && Set( x - 1, y ), Get( x - 2, y - 1 ) && Set( x - 1, y - 1 ) )
		,	!Get( x    , y ) && !Get( x    , y - 1 ) && ( Get( x + 1, y ) && Set( x    , y ), Get( x + 1, y - 1 ) && Set( x    , y - 1 ) )
		,	!Get( x, y - 1 ) && !Get( x - 1, y - 1 ) && ( Get( x, y - 2 ) && Set( x, y - 1 ), Get( x - 1, y - 2 ) && Set( x - 1, y - 1 ) )
		,	!Get( x, y     ) && !Get( x - 1, y     ) && ( Get( x, y + 1 ) && Set( x, y     ), Get( x - 1, y + 1 ) && Set( x - 1, y     ) )
		)
		POIs.forEach( ( [ x, y ] ) => Connect( x, y ) )
		if ( !isSet ) break
	}
}

////	DEBUG	////
	joints.forEach(
		( [ x, y ] ) => {
			let _ = y * W + x	; $[ _ ] |= 0x40
			_ -= 1				; $[ _ ] |= 0x40
			_ -= W				; $[ _ ] |= 0x40
			_ += 1				; $[ _ ] |= 0x40
		}
	)
	inters.forEach(
		( [ x, y ] ) => {
			if ( Number.isInteger( x ) && Number.isInteger( y ) ) {
				let _ = y * W + x	; $[ _ ] |= 0x20
				_ -= 1				; $[ _ ] |= 0x20
				_ -= W				; $[ _ ] |= 0x20
				_ += 1				; $[ _ ] |= 0x20
			} else {
				$[ ~~y * W + ~~x ] |= 0x10
			}
		}
	)

	return [ $, X - 2, Y - 2, W, H ]
}

const
Stroke = _ => {
	const bbox = BBox( _.flat().flat() )
	const X = Math.floor( bbox[ 0 ] )
	const Y = Math.floor( bbox[ 1 ] )
	const W = Math.ceil( bbox[ 2 ] ) - X + 1
	const H = Math.ceil( bbox[ 3 ] ) - Y + 1
	
	const
	$ = cMain.createImageData( W, H )
	const
	data = $.data
	const
	Black = ( [ x, y ] ) => data[ ( y * W + x ) * 4 + 3 ] = 0xff

	const OFFSET = [ X, Y ]
	_.forEach( 
		C => {
			let	cp = C[ 0 ][ 0 ]
			Black( Sub( Round( cp ), OFFSET ) )
			let iC = C.length
			while ( iC-- ) {
				const S = C[ iC ]
				Grids( cp, S ).forEach( _ => Black( Sub( _, OFFSET ) ) )
				Black( Sub( Round( S[ 0 ] ), OFFSET ) )
				cp = S[ 0 ]
			}
		}
	)
	cMain.putImageData( $, X, Y )
}

const
Fill = _ => {
	const
	[ bitRGBAs, X, Y, W, H ] = BitRGBAs( _ )
	const
	$ = cMain.createImageData( W, H )
	const
	data = $.data
	const
	nPerV = W * 4
	const
	Black = ( x, y ) => data[ ( y * W + x ) * 4 + 3 ] = 0xff

	Product( H, W, ( y, x ) => bitRGBAs[ y * W + x ] & 0x0f && Black( x, y ) )
	cMain.putImageData( $, X, Y )
}

const
Draw = () => {
	if ( STROKE_CB.
}

CANVAS.onmousedown = md => {
}

const
DebugFill = ( _, N ) => {

	const
	[ bitRGBAs, X, Y, W, H ] = BitRGBAs( _ )
	const
	$ = cDebug.createImageData( W * N, H * N )
	const
	data = $.data
	const
	nPerH = N * 4
	const
	nPerLine = W * nPerH
	const
	nPerV = nPerLine * N
	const
	Plot = ( x, y, r, g, b, a ) => {
		x *= nPerH
		y *= nPerV
		for ( let _y = 0; _y < N; _y++ ) {
			let _ = y + x
			for ( let _x = 0; _x < N; _x++ ) (
				data[ _++ ] = r
			,	data[ _++ ] = g
			,	data[ _++ ] = b
			,	data[ _++ ] = a
			)
			y += nPerLine
		}
	}

	Product(
		H
	,	W
	,	( y, x ) => {
			switch ( bitRGBAs[ y * W + x ] & 0x60 ) {
			case 0x60:	Plot( x, y, 0xff, 0xff, 0xff, 0xff )	; break
			case 0x40:	Plot( x, y, 0xff, 0x00, 0xff, 0xff )	; break
			case 0x20:	Plot( x, y, 0x00, 0xff, 0xff, 0xff )	; break
			}
			bitRGBAs[ y * W + x ] & 0x10 && Plot( x, y, 0xff, 0x00, 0x00, 0xff )
			bitRGBAs[ y * W + x ] & 0x0f && Plot( x, y, 0x00, 0x00, 0x00, 0xff )
			bitRGBAs[ y * W + x ] & 0x80 && Plot( x, y, 0x40, 0x40, 0x40, 0xff )
		}
	)
	D_CANVAS.width = $.width
	D_CANVAS.height = $.height
	cDebug.putImageData( $, 0, 0 )
}

const
Begin = () => glyph.length = 0

const
MoveTo = _ => {
	const $ = []
	$.moveTo = _
	glyph.unshift( $ )
	return $
}

const
LineTo = _ => {
	const $ = glyph.length ? glyph[ 0 ] : MoveTo( [ 0, 0 ] )
	$.unshift( [ _ ] )
	return $
}

const
QuadTo = ( c, _ ) => {
	const $ = glyph.length ? glyph[ 0 ] : MoveTo( [ 0, 0 ] )
	$.unshift( [ _, c ] )
	return $
}

const
CubeTo = ( p, q, _ ) => {
	const $ = glyph.length ? glyph[ 0 ] : MoveTo( [ 0, 0 ] )
	$.unshift( [ _, q, p ] )
	return $
}

const
ClosePath = () => {
	if ( !glyph.length ) return
	const _ = glyph[ 0 ]
	if ( !_.moveTo ) return
	if ( !EQ( _.moveTo, glyph[ 0 ][ 0 ] ) ) _.unshift( [ _.moveTo ] )
	delete _.moveTo
}

onload = async () => {
	switch ( 4 ) {
	case 0:
		MoveTo( [ 24, 24 ] )
		LineTo( [ 26, 24 ] )
		LineTo( [ 26, 26 ] )
		LineTo( [ 24, 26 ] )
		ClosePath()
		DebugFill( glyph, 4 )
		break
	case 1:
		MoveTo( [ 50, 50 ] )
		LineTo( [ 150, 50 ] )
		QuadTo( [ 200, 100 ], [ 150, 150 ] )
		CubeTo( [ 50, 150 ], [ 50, 150 ], [ 50, 100 ] )
		ClosePath()
		Fill( glyph )
		DebugFill( glyph, 2 )
		break
	case 2:
		glyph = ( await fetch( '_.ved' ).then( _ => _.json() ) )[ 0 ][ 0 ][ 3 ].map( _ => _[ 1 ] )
	//	glyph = [ ( await fetch( '_.ved' ).then( _ => _.json() ) )[ 0 ][ 0 ][ 3 ][ 3 ][ 1 ] ]
		DebugFill( glyph, 8 )
		break
	case 3:
		MoveTo( [ 100, 0 ] )
		LineTo( [ 103, 0 ] )
		LineTo( [ 100, 3 ] )
		LineTo( [ 103, 3 ] )
		ClosePath()
		DebugFill( glyph, 8 )
		break
	case 4:
		MoveTo( [ 100, 0 ] )
		LineTo( [ 103, 3 ] )
		LineTo( [ 100, 3 ] )
		ClosePath()
		MoveTo( [ 100, 3 ] )
		LineTo( [ 100, 0 ] )
		LineTo( [ 103, 0 ] )
		ClosePath()
		DebugFill( glyph, 8 )
		break
	case 5:
		MoveTo( [ 100, 100 ] )
		LineTo( [ 200, 100 ] )
		CubeTo( [ 300, 100 ], [ 300, 200 ], [ 200, 200 ] )
		QuadTo( [ 100, 200 ], [ 100, 100 ] )
		ClosePath()
		Fill( glyph )
	//	Stroke( glyph )
		break
	}
}


