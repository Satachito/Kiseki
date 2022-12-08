const
Toast = ( severity, ..._ ) => {
	switch ( severity ) {
	case 'red'		: console.error( ..._ )	; break
	case 'yellow'	: console.warn( ..._ )	; break
	case 'green'	: console.info( ..._ )	; break
	default			: console.log( ..._ )	; break
	}
}

import {
	ArrayPermutations
,	Product
} from './JP/JS/JP.js'

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
cMain		= C_MAIN	.getContext( '2d' )

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
	const OFFSET = [ - X + 2, - Y + 2 ]
	_.forEach( 
		C => {
			const
			grids = []
			let	cp = C[ 0 ][ 0 ]
			let iC = C.length
			while ( iC-- ) {
				const S = C[ iC ]
				//v	PULLING A TRICK
				S.grids = Grids( cp, S ).map( _ => Add( _, OFFSET ) )
				//^
				const _ = Add( Round( S[ 0 ] ), OFFSET )
				S.grids.length
				?	grids.push( ...S.grids, _ )
				:	EQ( Add( Round( cp ), OFFSET ), _ ) || grids.push( _ )
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
					//	?	$[ pY * W + ( pX < cX ? cX : pX ) ]++
					//	:	$[ cY * W + ( pX < cX ? pX : cX ) ]--
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
	joints = _.map( C => C.map( S => Add( S[ 0 ], OFFSET ) ) ).flat()
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
			,	$[ y * W + x ] |= 0x81
			)
	)

//	console.log( joints )
//	console.log( inters )
//	console.log( POIs )
	while ( true ) {
		let	isSet = 0
		const
		Set = ( x, y ) => ( $[ y * W + x ] |= 0x81, isSet++, console.log( 'Set:', x, y ) )
		POIs.forEach(
			( [ x, y ] ) => (
				!Get( x - 1, y ) && !Get( x - 1, y - 1 ) && ( Get( x - 2, y ) && Set( x - 1, y ), Get( x - 2, y - 1 ) && Set( x - 1, y - 1 ) )
			,	!Get( x    , y ) && !Get( x    , y - 1 ) && ( Get( x + 1, y ) && Set( x    , y ), Get( x + 1, y - 1 ) && Set( x    , y - 1 ) )
			,	!Get( x, y - 1 ) && !Get( x - 1, y - 1 ) && ( Get( x, y - 2 ) && Set( x, y - 1 ), Get( x - 1, y - 2 ) && Set( x - 1, y - 1 ) )
			,	!Get( x, y     ) && !Get( x - 1, y     ) && ( Get( x, y + 1 ) && Set( x, y     ), Get( x - 1, y + 1 ) && Set( x - 1, y     ) )
			)
		)
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
Draw = _ => {
	const bbox = BBox( _.flat().flat() )
	const X = Math.floor( bbox[ 0 ] )
	const Y = Math.floor( bbox[ 1 ] )
	const W = Math.ceil( bbox[ 2 ] ) - X + 7
	const H = Math.ceil( bbox[ 3 ] ) - Y + 7
	
	const
	$ = cMain.createImageData( W, H )
	const
	data = $.data
	const
	Plot = ( [ x, y ] ) => data[ ( ( y - Y + 3 ) * W + x - X + 3 ) * 4 + 3 ] = 0xff

	_.forEach( 
		C => {
			let	cp = C[ 0 ][ 0 ]
			Plot( Round( cp ) )
			let iC = C.length
			while ( iC-- ) {
				const S = C[ iC ]
				Grids( cp, S ).forEach( _ => Plot( _ ) )
				Plot( Round( S[ 0 ] ) )
				cp = S[ 0 ]
			}
		}
	)
	const
	Circle = ( [ x, y ], rgb ) => {
		let _ = ( ( y - Y ) * W + x - X ) * 4 + rgb
		data[ _ +  8 ] = 0xff
		data[ _ + 12 ] = 0xff
		data[ _ + 16 ] = 0xff
		_ += W * 4
		data[ _ +  4 ] = 0xff
		data[ _ + 20 ] = 0xff
		_ += W * 4
		data[ _ +  0 ] = 0xff
		data[ _ + 24 ] = 0xff
		_ += W * 4
		data[ _ +  0 ] = 0xff
		data[ _ + 24 ] = 0xff
		_ += W * 4
		data[ _ +  0 ] = 0xff
		data[ _ + 24 ] = 0xff
		_ += W * 4
		data[ _ +  4 ] = 0xff
		data[ _ + 20 ] = 0xff
		_ += W * 4
		data[ _ +  8 ] = 0xff
		data[ _ + 12 ] = 0xff
		data[ _ + 16 ] = 0xff
	}
	const
	EndP = _ => (
		Circle( _, 2 )
	,	Circle( _, 3 )
	)
	const
	ControlP = _ => (
		Circle( _, 0 )
	,	Circle( _, 3 )
	)

	_.forEach(
		C => C.forEach(
			S => (
				EndP( Round( S[ 0 ] ) )
			,	S.length > 1 && ControlP( Round( S[ 1 ] ) )
			,	S.length > 2 && ControlP( Round( S[ 2 ] ) )
			)
		)
	)
	cMain.putImageData( $, X - 3, Y - 3 )
}

//C_MAIN.addEventListener( 'mousemove', mm => console.log( mm.offsetX, mm.offsetY ) )

const
ShowClipboard = () => navigator.clipboard.read().then(
	items => items.forEach(
		item => (
			console.log( item, 'item.types.length', item.types.length )
		,	item.types.forEach(
				type => item.getType( type ).then(
					async _ => console.log( type, _, type.startsWith( 'text' ) ? await _.text() : '' )
				)
			)
		)
	)
)

const
Redo	= () => console.log( 'Redo'		)
const
Undo	= () => console.log( 'Undo'		)
const
Cut		= () => console.log( 'Cut'		)
const
Copy	= () => console.log( 'Copy'		)
const
Paste	= () => console.log( 'Paste'	)

C_MAIN.oncut	= _ => console.log( 'C_MAIN cut'	)
C_MAIN.oncopy	= _ => console.log( 'C_MAIN copy'	)
C_MAIN.onpaste	= _ => console.log( 'C_MAIN paste'	)

C_MAIN.onkeydown = kd => {
	if ( kd.metaKey ) {
		kd.preventDefault()
		switch ( kd.code ) {
		case 'KeyZ':
			kd.shiftKey ? Redo() : Undo()
			break
		case 'KeyX':
			Cut()		
			break
		case 'KeyC':
			Copy()		
			break
		case 'KeyV':
			Paste()	
			break
		}
	} else {
		switch ( kd.key ) {
		case '=': ShowClipboard()
			break
		case '+': navigator.clipboard.writeText( 'DUMMY TEXT' ).then( () => Toast( 'green', 'copied' ), er => Toast( 'red', er ) )
			break
		}
	}
}
C_MAIN.focus()



const
cPreview	= C_PREVIEW	.getContext( '2d' )

const
Preview = _ => {
	const
	[ bitRGBAs, X, Y, W, H ] = BitRGBAs( _ )
	const
	$ = cPreview.createImageData( W, H )
	const
	data = $.data
	const
	nPerV = W * 4
	const
	Plot = ( x, y ) => data[ ( y * W + x ) * 4 + 3 ] = 0xff

	Product( H, W, ( y, x ) => bitRGBAs[ y * W + x ] & 0x0f && Plot( x, y ) )
	cPreview.putImageData( $, X, Y )
}

C_MAIN.onmousedown = async md => {
//	C_MAIN.onmousemove = mm => console.log( mm.offsetX, mm.offsetY )
}






Array.from( document.body.getElementsByTagName( 'jp-color-picker' ) ).forEach(
	_ => {
		const list = _.children[ 2 ]
		console.log( list, list.value )
		list.addEventListener( 'change', _ => console.log( _.path[ 1 ], list.value ) )
	}
)

const
cDebug = C_DEBUG.getContext( '2d' )

const
DrawDebug = ( _, N ) => {

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
	cDebug.putImageData( $, X, Y )
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

const
sample = `<?xml version='1.0'?><!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.0//EN''http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd'><svg xmlns="http://www.w3.org/2000/svg" style='fill-opacity:1; color-rendering:auto; color-interpolation:auto; text-rendering:auto; stroke:black; stroke-linecap:square; stroke-miterlimit:10; shape-rendering:auto; stroke-opacity:1; fill:black; stroke-dasharray:none; font-weight:normal; stroke-width:1; font-family:Arial; font-style:normal; stroke-linejoin:miter; font-size:12px; stroke-dashoffset:0; image-rendering:auto;' width='1120' height='760' xmlns='http://www.w3.org/2000/svg'><!--Generated--><defs id='genericDefs'/><g style='stroke-linecap:round; stroke-width:4; fill:none'><line x1='200.0' y1='680.0' x2='200.0' y2='80.0'/><line x1='200.0' y1='680.0' x2='880.0' y2='680.0'/><line x1='200.0' y1='80.0' x2='190.0' y2='100.0'/><line x1='200.0' y1='80.0' x2='210.0' y2='100.0'/><line x1='880.0' y1='680.0' x2='860.0' y2='670.0'/><line x1='880.0' y1='680.0' x2='860.0' y2='690.0'/></g><g style='stroke-linecap:round; stroke-width:4; fill:none'><line x1='200.0' y1='180.0' x2='800.0' y2='680.0'/><line x1='200.0' y1='180.0' x2='500.0' y2='680.0'/><path d='M 250.0 480.0 Q350.0 680.0, 580.0 130.0'/><path d='M 380.0 180.0 Q480.0 410.0, 680.0 200.0'/></g><g style='stroke-width:0;' fill = 'black' font-size = '20' font-family='Arial' alignment-baseline='hanging'></g></svg>`

onload = async () => {
	switch ( 6 ) {
	case 0:
		MoveTo( [ 24, 24 ] )
		LineTo( [ 26, 24 ] )
		LineTo( [ 26, 26 ] )
		LineTo( [ 24, 26 ] )
		ClosePath()
		DrawDebug( glyph, 4 )
		break
	case 1:
		MoveTo( [ 50, 50 ] )
		LineTo( [ 150, 50 ] )
		QuadTo( [ 200, 100 ], [ 150, 150 ] )
		CubeTo( [ 50, 150 ], [ 50, 150 ], [ 50, 100 ] )
		ClosePath()
		Preview( glyph )
		DrawDebug( glyph, 2 )
		break
	case 2:
		glyph = ( await fetch( '_.ved' ).then( _ => _.json() ) )[ 0 ][ 0 ][ 3 ].map( _ => _[ 1 ] )
	//	glyph = [ ( await fetch( '_.ved' ).then( _ => _.json() ) )[ 0 ][ 0 ][ 3 ][ 3 ][ 1 ] ]
		DrawDebug( glyph, 8 )
		break
	case 3:
		MoveTo( [ 100, 0 ] )
		LineTo( [ 103, 0 ] )
		LineTo( [ 100, 3 ] )
		LineTo( [ 103, 3 ] )
		ClosePath()
		DrawDebug( glyph, 8 )
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
		DrawDebug( glyph, 8 )
		break
	case 5:
		MoveTo( [ 100, 100 ] )
		LineTo( [ 200, 100 ] )
		CubeTo( [ 300, 100 ], [ 300, 200 ], [ 200, 200 ] )
		QuadTo( [ 100, 200 ], [ 100, 100 ] )
		ClosePath()
		Preview( glyph )
		Draw( glyph )
		break
	case 6:
		MoveTo( [ 200, 100 ] )
		QuadTo( [ 300, 100 ], [ 300, 200 ] )
		QuadTo( [ 300, 300 ], [ 200, 300 ] )
		QuadTo( [ 100, 300 ], [ 100, 200 ] )
		QuadTo( [ 100, 100 ], [ 200, 100 ] )
		ClosePath()
//		Preview( glyph )
		Draw( glyph )
		break
	case 7:
		MoveTo( [ 1, 0 ] )
		LineTo( [ 2, 1 ] )
		LineTo( [ 1, 2 ] )
		LineTo( [ 0, 1 ] )
		ClosePath()

		MoveTo( [ 4, 3 ] )
		LineTo( [ 3, 4 ] )
		LineTo( [ 4, 5 ] )
		LineTo( [ 5, 4 ] )
		ClosePath()

	//	Preview( glyph )
	//	DrawDebug( glyph, 8 )
		Draw( glyph )
		break
	}
}


