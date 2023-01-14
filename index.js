/*	reserved ABBREVIATION
	X, Y, Z, x, y, z
	W, H, D
	MT	: moveTo
	LC	: Line or Curve
	E	: Element
	G	: Glyph
	F	: Figure( [ MT, LC ] )	MT ? Line : Curve
	S	: Section
	P	: Point

	T	: Tag
	D	: Descendants
	A	: Attribute
*/

const
Toast = ( severity, ..._ ) => {
	switch ( severity ) {
	case 'red'		: console.error	( severity, ..._ ); alert( ..._ ); break
	case 'yellow'	: console.warn	( severity, ..._ ); alert( ..._ ); break
	case 'green'	: console.info	( severity, ..._ ); alert( ..._ ); break
	default			: console.log	( severity, ..._ ); alert( ..._ ); break
	}
}

import {
	XOR
,	ArrayPermutations
,	Product
,	CloneJSONable
,	If
} from './JP/JS/JP.js'

const
CircluatingSlice = ( _, b, e ) => b > e
?	[ ..._.slice( b ), ..._.slice( 0, e ) ]
:	_.slice( b, e )

const
CircluatingShift = ( _, $ ) => [ ..._.slice( $ ), ..._.slice( 0, $ ) ]

import {
	CF

//	Vector
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
} from './JP/JS/G.js'

const
BBoxContains = ( bbox, P ) => bbox.every( ( $, _ ) => $[ 0 ] <= P[ _ ] && P[ _ ] <= $[ 1 ] )

const
Dist2 = ( p, q ) => {
	const _ = Sub( p, q )
	return Dot( _, _ )
}

const
Angles = ( start, Ps, end ) => {
	const $ = []
	let	next = Vec( Ps.at( -1 ), end )
	let	_ = Ps.length - 1
	while ( _-- ) {
		const
		prev = Vec( Ps[ _ ], Ps[ _ + 1 ] )
		$.push( Angle( prev, next ) )
		next = prev
	}
	const
	prev = Vec( start, Ps[ 0 ] )
	$.push( Angle( prev, next ) )
	return $
}
////////

const
undos	= []

const
redos	= []

const
Push	= ( array, $ ) => ( array.push( $ ), $ )
	
const
Job		= ( Undo, Redo ) => (
	redos.length = 0
,	Push( undos, { Undo, Redo } )
)

const
Undo	= () => undos.length && (
	Push( redos, undos.pop() ).Undo()
,	Draw()
)

const
Redo	= () => redos.length && (
	Push( undos, redos.pop() ).Redo()
,	Draw()
)

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
CLIPBOARD_ID = 'vecedit.828.tyoko'

const
AllInclusive = ( [ T, D, A, G ] ) => D.every( E => AllInclusive( E ) ) && G.every(
	( [ MT, LC ] ) => ( MT ? sels.includes( MT ) : true ) && LC.flat().every( P => sels.includes( P ) )
)

const
Copy = () => {
	const Es = Array.from( new Set( sels.map( _ => _.E ) ) )
	if ( !Es.length ) {
		Toast( 'yellow', 'No elements' )
		return false
	}
	if ( !Es.every( E => AllInclusive( E ) ) ) {
		Toast( 'yellow', 'Element only' )
		return false
	}
	navigator.clipboard.writeText( CLIPBOARD_ID + JSON.stringify( Es ) )
	return true
}

const
Cut = () => Copy() && Delete()

const
Paste = async () => {
	const
	_ = await navigator.clipboard.readText()
	if ( _.startsWith( CLIPBOARD_ID ) ) {
		const $ = JSON.parse( _.slice( CLIPBOARD_ID.length ) )
		const newSVG = CloneJSONable( svg )
		newSVG[ 1 ].push( ...$ )
		SVGJob( newSVG, sels.map( _ => FindP( _, newSVG ) ) )
	}
}

const
SelectAll = () => (
	sels = []
,	PathForAll( P => sels.push( P ) )
,	DrawMain()
)

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
console.log( kd )
		switch ( kd.key ) {
		case 'Escape':
			SetMode( SelectB )
			break
		case '=': ShowClipboard()
			break
		case '+': navigator.clipboard.writeText( 'DUMMY TEXT' ).then( () => Toast( 'green', 'copied' ), er => Toast( 'red', er ) )
			break
		}
	}
}
C_MAIN.focus()

const
Grids = ( cp, S ) => {
	switch ( S.length ) {
	case 1	: return LineGrids( cp, S[ 0 ] )
	case 2	: return QuadGrids( cp, S[ 1 ], S[ 0 ] )
	case 3	: return CubeGrids( cp, S[ 2 ], S[ 1 ], S[ 0 ] )
	default	: debugger
	}
}

//	!!!! TRICK !!!!	EACH SEGMENT IS ATTACHED ITS GRIDS
const
BitRGBAs = _ => {	//	Contours, All point must be rounded
	const [ [ X, XX ], [ Y, YY ] ] = BBox( ..._.flat().flat() )
	const W = XX - X + 4
	const H = YY - Y + 4
	const $ = new Int8Array( W * H )
	$.fill( 0 )

	const OFFSET = [ - X + 2, - Y + 2 ]

	_.forEach(
		C => {
//( C, iC ) => {
			const
			grids = []
			let	cp = Add( C[ 0 ][ 0 ], OFFSET )
			let iS = C.length
			while ( iS-- ) {
				const S = C[ iS ]
				//v	TRICK: RETAIN ITS GRIDS
				S.grids = Grids( cp, S.map( _ => Add( _, OFFSET ) ) )
//S.grids.start = cp
//S.grids.iC = iC
//S.grids.iS = iS
//S.grids.S = S.map( _ => Add( _, OFFSET ) )
//console.log( iC, iS, S.grids.start, S.grids.S[ 0 ], S.grids.at( -1 ) )
				//^
				cp = Add( S[ 0 ], OFFSET )
				grids.push( ...S.grids, cp )
			}
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
//	,	( p, q ) => {
//			const $ = IntersectingGrids( p, q )
//			console.log( p.iC, p.iS, p.length, p.start, JSON.stringify( p ), p.S[ 0 ] )
//			console.log( q.iC, q.iS, p.length, q.start, JSON.stringify( q ), q.S[ 0 ] )
//			console.log( $ )
//		}
	)

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

console.log( joints )
console.log( inters )
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

	return [ $, W, H, X - 2, Y - 2, POIs ]
}

const
controlSize		= 3

const
nearSize2		= controlSize * controlSize * 2

const
gripSize		= controlSize * 2

let
mode			= SelectB

const
SetMode = _ => (
	C_MAIN.classList.remove( mode.id )	//	For cursor
,	mode.classList.remove( 'selected' )	//	For border
,	mode = _
,	mode.classList.add( 'selected' )
,	C_MAIN.classList.add( mode.id )
,	C_MAIN.focus()
,	mode === SelectB || ( sels = [], DrawMain() )
)

;[ SelectB, RectB, OvalB, LineB, CurveB, EraserB, PenB, ScissorsB, ChangeB, HandB ].forEach( _ => _.onclick = () => SetMode( _ ) )


let
svg = [ 'svg', [], {}, null ]

const
TagGroup = _ => {
	switch ( _ ) {
	case 'path'		:
	case 'rect'		:
	case 'line'		:
	case 'polygon'	:
	case 'polyline'	:
	case 'circle'	:
	case 'ellipse'	: return 'path'
	default			: return _
	}
}

const
PathForAll = ( CB, _ = svg ) => (
	TagGroup( _[ 0 ] ) === 'path' && _[ 3 ].forEach(
		( F, iF ) => {
			const
			[ MT, LC ] = F
			MT && (
				delete MT[ 'iP' ]
			,	delete MT[ 'S' ]
			,	delete MT[ 'iS' ]
			,	MT.F	= F			// Trick for double click
			,	MT.iF	= iF
			,	MT.E	= _			// Trick for triple click
			,	CB( MT )
			)
			LC.forEach(
				( S, iS ) => S.forEach(
					( P, iP ) => (
						P.iP	= iP
					,	P.S		= S
					,	P.iS	= iS
					,	P.F		= F		// Trick for double click
					,	P.iF	= iF
					,	P.E		= _		// Trick for triple click
					,	CB( P )
					)
				)
			)
		}
	)
,	_[ 1 ].forEach(
		( E, iE ) => (
			E.E = _
		,	E.iE = iE
		,	PathForAll( CB, E )
		)
	)
)

const
AllPoints = () => {
	const $ = []
	PathForAll( _ => $.push( _ ) )
	return $
}

let
sels			= []

let
marginH			= 100
let
marginV			= 100
let
width			= 1000
let
height			= 1000

const
InvertX			= _ => _ - marginH
const
InvertY			= _ => _ - marginV
const
Invert			= ( [ x, y ] ) => [ InvertX( x ), InvertY( y ) ]

const
ProjectX		= _ => _ + marginH
const
ProjectY		= _ => _ + marginV
const
Project			= ( [ x, y ] ) => [ ProjectX( x ), ProjectY( y ) ]

const
cMain			= C_MAIN.getContext( '2d' )

let
drawMainCount	= 0
const
DrawMain		= mdmv => {

	const
	start = performance.now()

	const
	W = C_MAIN.width
	const
	H = C_MAIN.height

	const
	$ = cMain.createImageData( W, H )
	const
	data = $.data
	const
	Plot = ( [ x, y ] ) => data[ ( ( y + marginV ) * W + x + marginH ) * 4 + 3 ] = 0xff

	const
	Circle = ( [ x, y ], rgb ) => {
		let _ = ( ( y + marginV - 3 ) * W + x + marginH - 3 ) * 4 + rgb
		data[ _ +  8 ] = 0xff; data[ _ + 12 ] = 0xff; data[ _ + 16 ] = 0xff	; _ += W * 4
		data[ _ +  4 ] = 0xff; data[ _ + 20 ] = 0xff						; _ += W * 4
		data[ _ +  0 ] = 0xff; data[ _ + 24 ] = 0xff						; _ += W * 4
		data[ _ +  0 ] = 0xff; data[ _ + 24 ] = 0xff						; _ += W * 4
		data[ _ +  0 ] = 0xff; data[ _ + 24 ] = 0xff						; _ += W * 4
		data[ _ +  4 ] = 0xff; data[ _ + 20 ] = 0xff						; _ += W * 4
		data[ _ +  8 ] = 0xff; data[ _ + 12 ] = 0xff; data[ _ + 16 ] = 0xff
	}
	const
	Eye = ( [ x, y ], rgb ) => {
		let _ = ( ( y + marginV - 3 ) * W + x + marginH - 3 ) * 4 + rgb
		data[ _ +  8 ] = 0xff; data[ _ + 12 ] = 0xff; data[ _ + 16 ] = 0xff	; _ += W * 4
		data[ _ +  4 ] = 0xff; data[ _ + 20 ] = 0xff						; _ += W * 4

		data[ _ +  0 ] = 0xff; data[ _ + 24 ] = 0xff;
		data[ _ +  8 ] = 0xff; data[ _ + 12 ] = 0xff; data[ _ + 16 ] = 0xff	; _ += W * 4

		data[ _ +  0 ] = 0xff; data[ _ + 24 ] = 0xff;
		data[ _ +  8 ] = 0xff; data[ _ + 12 ] = 0xff; data[ _ + 16 ] = 0xff	; _ += W * 4

		data[ _ +  0 ] = 0xff; data[ _ + 24 ] = 0xff;
		data[ _ +  8 ] = 0xff; data[ _ + 12 ] = 0xff; data[ _ + 16 ] = 0xff	; _ += W * 4

		data[ _ +  4 ] = 0xff; data[ _ + 20 ] = 0xff						; _ += W * 4
		data[ _ +  8 ] = 0xff; data[ _ + 12 ] = 0xff; data[ _ + 16 ] = 0xff
	}
	const
	Square = ( [ x, y ], rgb ) => {
		let _ = ( ( y + marginV - 4 ) * W + x + marginH - 4 ) * 4 + rgb
		data[ _ +  0 ] = 0xff; data[ _ +  4 ] = 0xff; data[ _ +  8 ] = 0xff; data[ _ + 12 ] = 0xff; data[ _ + 16 ] = 0xff;
		data[ _ + 20 ] = 0xff; data[ _ + 24 ] = 0xff; data[ _ + 28 ] = 0xff; data[ _ + 32 ] = 0xff	; _ += W * 4
		data[ _ +  0 ] = 0xff; data[ _ + 32 ] = 0xff												; _ += W * 4
		data[ _ +  0 ] = 0xff; data[ _ + 32 ] = 0xff												; _ += W * 4
		data[ _ +  0 ] = 0xff; data[ _ + 32 ] = 0xff												; _ += W * 4
		data[ _ +  0 ] = 0xff; data[ _ + 32 ] = 0xff												; _ += W * 4
		data[ _ +  0 ] = 0xff; data[ _ + 32 ] = 0xff												; _ += W * 4
		data[ _ +  0 ] = 0xff; data[ _ + 32 ] = 0xff												; _ += W * 4
		data[ _ +  0 ] = 0xff; data[ _ + 32 ] = 0xff												; _ += W * 4
		data[ _ +  0 ] = 0xff; data[ _ +  4 ] = 0xff; data[ _ +  8 ] = 0xff; data[ _ + 12 ] = 0xff; data[ _ + 16 ] = 0xff;
		data[ _ + 20 ] = 0xff; data[ _ + 24 ] = 0xff; data[ _ + 28 ] = 0xff; data[ _ + 32 ] = 0xff
	}
	const
	HLine = ( y, x, w ) => {
		let
		_ = ( ( y + marginV ) * W + x + marginH ) * 4
		for ( let h = 0; h < w; h++ ) {
			data[ _ ] = 0xff
			data[ _ + 3 ] = 0xff
			_ += 4
		}
	}
	const
	VLine = ( x, y, h ) => {
		let
		_ = ( ( y + marginV ) * W + x + marginH ) * 4
		for ( let v = 0; v < h; v++ ) {
			data[ _ ] = 0xff
			data[ _ + 3 ] = 0xff
			_ += W * 4
		}
	}
	const
	Rect = ( x, y, w, h ) => (
		HLine( y		, x, w )
	,	HLine( y + h - 1, x, w )
	,	VLine( x		, y + 1, h - 2 )
	,	VLine( x + w - 1, y + 1, h - 2 )
	)

	const
	Joint		= _ => Circle( _, 3 )
	const
	Control		= _ => Circle( _, 3 )
	const
	EyeJoint	= _ => Eye( _, 3 )
	const
	EyeControl	= _ => Eye( _, 3 )
	const
	StartEnd	= _ => Square( _, 3 )

	const
	DrawPoint = _ => (
		TagGroup( _[ 0 ] ) === 'path' && (
			_[ 3 ].forEach(
				( [ MT, LC ] ) => {
					if ( MT ) {
						const rMT = Round( MT )
						Joint( rMT )
//						StartEnd( rMT )
					}
					StartEnd( Round( LC[ 0 ][ 0 ] ) )

					let cp = MT ?? LC[ 0 ][ 0 ]
					let iS = LC.length
					while ( iS-- ) {
						const S = LC[ iS ]
						Grids( cp, S ).forEach( _ => Plot( _ ) )
						Joint( Round( S[ 0 ] ) )
						S.length > 1 && Control( Round( S[ 1 ] ) )
						S.length > 2 && Control( Round( S[ 2 ] ) )
						cp = S[ 0 ]
					}
				}
			)
		)
	,	_[ 1 ].forEach( _ => DrawPoint( _ ) )
	)
	DrawPoint( svg )

//console.log( 'sels.length', sels.length )
	sels.forEach(
		P => {
			P.iP
			?	P.S.length === 2
				?	EyeControl( Round( P ) )
				:	EyeControl( Round( P ) )
			:	EyeJoint( Round( P ) )	// 0 or void 0, EndPoint or Joint
		}
	)
	if ( sels.length > 1 ) {
		const bbox = BBox( ...sels )
		const x = Math.floor( bbox[ 0 ][ 0 ] )
		const y = Math.floor( bbox[ 1 ][ 0 ] )
		const X = Math.ceil( bbox[ 0 ][ 1 ] )
		const Y = Math.ceil( bbox[ 1 ][ 1 ] )
//console.log( x, y, X, Y )
		const w = X - x
		const h = Y - y
		HLine( y, x + 1, w )
		HLine( Y, x + 1, w )
		VLine( x, y + 1, h )
		VLine( X, y + 1, h )

		HLine( y - 3, x - 2, w + 6 )
		HLine( Y + 3, x - 2, w + 6 )
		VLine( x - 3, y - 2, h + 6 )
		VLine( X + 3, y - 2, h + 6 )
	}

	if ( mdmv ) {
		const [ [ x, X ], [ y, Y ] ] = BBox( ...mdmv )
		{	let _1 = ( y * W - W	+ x - 1 ) * 4
			let _2 = ( Y * W		+ x - 1 ) * 4
			for ( let h = x - 1; h <= X; h++ ) {
				data[ _1 ] = 0xff
				data[ _1 + 3 ] = 0xff
				_1 += 4
				data[ _2 ] = 0xff
				data[ _2 + 3 ] = 0xff
				_2 += 4
			}
		}
		{	let _1 = ( y * W - W	+ x - 1 ) * 4
			let _2 = ( y * W - W	+ X ) * 4
			for ( let v = y - 1; v <= Y; v++ ) {
				data[ _1 ] = 0xff
				data[ _1 + 3 ] = 0xff
				_1 += W * 4
				data[ _2 ] = 0xff
				data[ _2 + 3 ] = 0xff
				_2 += W * 4
			}
		}
	}

	cMain.clearRect( 0, 0, C_MAIN.width, C_MAIN.height )

	cMain.putImageData( $, 0, 0 )

	const
	elappsed = performance.now() - start
//	elappsed > 5 && console.log( drawMainCount, ':', elappsed )
	drawMainCount++
}

const
cPrev		= C_PREV.getContext( '2d' )

const
DrawPreview	= ( [ tag, children, attr, data ] = svg, _ = {} ) => {
	if ( attr.display === 'none' ) return

	_ = { ..._, ...attr }

	if ( attr.style ) {
		attr.style.split( ';' ).map( $ => $.split( ':' ) ).filter( $ => $.length === 2 ).forEach( $ => _[ $[ 0 ] ] = $[ 1 ] )
		delete _.style
	}

	const
	Assign = ( canvasKey, attrKey ) => _[ attrKey ] && ( cPrev[ canvasKey ] = _[ attrKey ] )

	switch ( TagGroup( tag ) ) {
	case 'path'	:
		{	const
			path = new Path2D
			const
			AddSegment = S => {
				switch ( S.length ) {
				case 1:
					path.lineTo( ...S[ 0 ] )
					break
				case 2:
					path.quadraticCurveTo( ...S[ 1 ], ...S[ 0 ] )
					break
				case 3:
					path.bezierCurveTo( ...S[ 2 ], ...S[ 1 ], ...S[ 0 ] )
					break
				default:
					throw 'eh?'
				}
			}
			data.forEach(
				( [ MT, LC ] ) => {
					path.moveTo( ...( MT ?? LC[ 0 ][ 0 ] ) )
					let iS = LC.length
					while ( iS-- ) AddSegment( LC[ iS ] )
					MT || path.closePath()
				}
			)
			Assign( 'globalAlpha'		, 'opacity'				)
			Assign( 'lineWidth'			, 'stroke-width'		)
			Assign( 'lineCap'			, 'stroke-linecap'		)
			Assign( 'lineJoin'			, 'stroke-linejoin'		)
			Assign( 'miterLimit'		, 'stroke-miterlimit'	)
			Assign( 'lineDashOffset'	, 'stroke-dashoffset'	)
			_[ 'stroke-dasharray' ] && cPrev.setLineDash( _[ 'stroke-dasharray' ].split( ' ' ) )

			_.fill && _.fill != 'none' && (
				cPrev.fillStyle = _.fill
			,	cPrev.fill( path )
			)

			_.stroke && _.stroke != 'none' && (
				cPrev.strokeStyle = _.stroke
			,	cPrev.stroke( path )
			)
		}
		break
	case 'text'	:
		break
	case 'image':
		{	const { src, x, y } = data
			const _ = new Image()
			_.src = src
			_.onload = () => cPrev.drawImage( _, x, y )
		}
		break
	}
	children.forEach( $ => DrawPreview( $, _ ) )
}

PreviewR.oninput = ev => ( C_PREV.style.opacity = ev.target.value, C_MAIN.focus() )
SkeltonR.oninput = ev => ( C_MAIN.style.opacity = ev.target.value, C_MAIN.focus() )

const
Draw = () => (
	cPrev.clearRect( 0, 0, C_PREV.width, C_PREV.height )
,	cPrev.translate( marginH, marginV )
,	DrawPreview()
,	cPrev.translate( -marginH, -marginV )
,	DrawMain()
)

const
FindE = ( _, svg ) => {

	const
	ancestors = []
	{	let E = _.E
		while ( E.E ) (
			ancestors.push( E.iE )
		,	E = E.E
		)
	}

	let
	$ = svg
	while ( ancestors.length ) $ = $[ 1 ][ ancestors.pop() ]
	return $
}

const
FindF = ( _, svg ) => FindE( _, svg )[ 3 ][ _.iF ]

const
FindS = ( _, svg ) => FindF( _, svg )[ 1 ][ _.iS ]

const
FindP = ( _, svg ) => _.S ? FindS( _, svg )[ _.iP ] : FindF( _, svg )[ 0 ]

const
SVGJob = ( newSVG, newSels = [] ) => {
	const
	oldSVG = svg
	const
	oldSels = sels
	Job(
		() => ( sels = oldSels, svg = oldSVG )
	,	() => ( sels = newSels, svg = newSVG )
	).Redo()
	Draw()
}

const
Template = () => {
	const _ = {}
	TempFillC		.checked && ( _[ 'fill'				] = TempFillStyle		.value )
	TempFillRuleC	.checked && ( _[ 'fill-rule'		] = TempFillRuleValue	.value )
	TempStrokeC		.checked && ( _[ 'stroke'			] = TempStrokeStyle		.value )
	TempOpacityC	.checked && ( _[ 'opacity'			] = TempOpacityValue	.value )
	TempStrokeWidthC.checked && ( _[ 'stroke-width'		] = TempStrokeWidthValue.value )
	TempLineCapC	.checked && ( _[ 'stroke-linecap'	] = TempLineCapValue	.value )
	TempLineJoinC	.checked && ( _[ 'stroke-linejoin'	] = TempLineJoinValue	.value )
	TempMiterLimitC	.checked && ( _[ 'stroke-miterlimit'] = TempMiterLimitValue	.value )
	TempDashOffsetC	.checked && ( _[ 'stroke-dashoffset'] = TempDashOffsetValue	.value )
	TempDashArrayC	.checked && ( _[ 'stroke-dasharray'	] = DasTemphArrayValue	.value )
	return _
}

const
NewFigureJob = ( tag, figure ) => {
	const E = [
		tag
	,	[]
	,	Template()
	,	[ figure ]
	]
	Job(
		() => ( sels = [], svg[ 1 ].pop() )
	,	() => ( sels = [], svg[ 1 ].push( E ) )
	).Redo()
	Draw()
}

const
MoveJob = oldXYs => {
	const
	newXYs = sels.map( _ => [ ..._ ] )
	const
	savedSels = [ ...sels ]
	Job(
		() => ( sels = savedSels, sels.forEach( ( $, _ ) => [ $[ 0 ], $[ 1 ] ] = oldXYs[ _ ] ) )
	,	() => ( sels = savedSels, sels.forEach( ( $, _ ) => [ $[ 0 ], $[ 1 ] ] = newXYs[ _ ] ) )
	)
	Draw()
}

const
Change = _ => {

	if ( _.iP === void 0 ) {
		Toast( 'red', "Can't change line end." )
		return
	}

	{	const
		[ MT, LC ] = _.F

		if ( _.iP === 0 ) {
			if ( MT && _.iS === 0 ) {
				Toast( 'yellow', "Can't change line end." )
				return
			}
			if ( _.S.length + LC[ ( _.iS ? _.iS : LC.length ) - 1 ].length > 3 ) {
				Toast( 'green', "Can't change here." )
				return
			}
		}
	}

	const
	newSVG = CloneJSONable( svg )

	const
	[ MT, LC ] = FindF( _, newSVG )
	const
	S = LC[ _.iS ]

	_.iP
	?	LC.splice(
			_.iS, 1
		,	S.slice( 0, _.iP )
		,	S.slice( _.iP )
		)
	:	(	LC.splice( _.iS, 1 )
		,	LC[ ( _.iS ? _.iS : LC.length ) - 1 ].push( ...S )
		)
	
	SVGJob( newSVG )
}

const
NormalizeElement = ( [ T, D, A, G ] ) => {
	if ( TagGroup( T ) === 'path' ) {
		let
		_G = G.length
		while ( _G-- ) {
			const
			[ MT, LC ] = G[ _G ]
			let
			_F = LC.length
			while ( _F-- ) {
				let S = LC[ _F ]
				S.length === 0 && LC.splice( _F, 1 )
			}
			if ( !MT && LC.length === 1 && LC[ 0 ].length === 1 ) LC.splice( 0, 1 )
			LC.length === 0 && G.splice( _G, 1 )
		}
	}
	let	_ = D.length
	while ( _-- ) {
		const E = D[ _ ]
		NormalizeElement( E )
		!E[ 3 ].length && !E[ 1 ].length && D.splice( _, 1 )
	}
}

const
Delete = () => {
	
	if ( !sels.length ) return

	const newSVG = CloneJSONable( svg )

	PathForAll( () => {} )
	sels.filter( P => P.iP === 2 ).forEach( P => FindS( P, newSVG ).splice( 2, 1 ) )
	sels.filter( P => P.iP === 1 ).forEach( P => FindS( P, newSVG ).splice( 1, 1 ) )
	sels.filter( P => P.iP === 0 ).forEach(
		P => {
			const
			[ MT, LC ] = FindF( P, newSVG )
			//	Line end
			if ( ( MT && P.iS === 0 ) || LC.length === 1 ) {
				LC[ 0 ].splice( 0, 1 )
				return
			}
			const
			currS = LC[ P.iS ]
			const
			nextS = LC[ ( P.iS ? P.iS : LC.length ) - 1 ]
			if ( currS.length > 1 ) {
				switch ( nextS.length ) {
				case 1:
					nextS.push( ...currS.slice( 1 ) )
					break
				case 2:
					nextS.push( currS.at( -1 ) )
					break
				case 3:
					nextS[ 2 ] = currS.at( -1 )
					break
				}
			}
			currS.length = 0
		}
	)
	sels.filter( P => P.iP === void 0 ).forEach(
		P => {
			const
			F = FindF( P, newSVG )
			const
			LC = F[ 1 ]
			let
			index = LC.length
			while ( index-- ) {
				const
				S = LC[ index ]
				if ( S.length ) {
					F[ 0 ] = S.pop()
					break
				}
			}
		}
	)
	sels = []
	NormalizeElement( newSVG )
	SVGJob( newSVG )
}

const
MouseXY			= _ => [ _.offsetX, _.offsetY ]

C_MAIN.onmousedown = md => {

	const
	mdXY = MouseXY( md )

	const
	MouseRectWH = _ => [ ...mdXY, ...Sub( MouseXY( _ ), mdXY ) ]

	const
	Hits = () => {
		let $ = []
		PathForAll(
			_ => {
				const D = Dist2( Project( _ ), mdXY )
				D < nearSize2 && (
					_.D = D
				,	$.push( _ )
				)
			}
		)
		return $
	}

	const
	Hit = () => Hits().sort( ( p, q ) => p.D - q.D )[ 0 ]

	const
	GridHit = ( [ T, D, A, G ], $ = null ) => {

		if ( TagGroup( T ) === 'path' ) {
			G.forEach(
				( F, iF ) => {
					const
					[ MT, LC ] = F
					let cp = MT ? MT : LC[ 0 ][ 0 ]
					let iS = LC.length
					while ( iS-- ) {
						const S = LC[ iS ]
						Grids( cp, S ).forEach(
							grid => {
								const d2 = Dist2( mdXY, Project( grid ) )
								d2 <= 32 && ( $ === null || d2 < $[ 0 ] ) && ( $ = [ d2, iF, iS, grid, cp ] )
//d2 <= 32 && console.log( mdXY, Project( grid ), grid, d2, $ )
							}
						)
						cp = S[ 0 ]
					}
				}
			)
		}

		D.forEach( E => ( $ = GridHit( E, $ ) ) )

		return $
	}

	switch ( mode ) {
	case HandB:
		C_MAIN.onmousemove = mv => (
			MAIN.scrollTop  -= mv.movementY
		,	MAIN.scrollLeft -= mv.movementX
		)
		C_MAIN.onmouseup = C_MAIN.onmouseleave = mu => (
			C_MAIN.onmousemove = null
		,	C_MAIN.onmouseup = null
		,	C_MAIN.onmouseleave = null
		)
		break
	case ChangeB:
		If( Hit(), _ => Change( _ ) )
		break
	case SelectB:
		{	let
			hMover
			let
			vMover

			const
			defaultHMover = ( mv, x ) => {
				const biasX = mv.offsetX - mdXY[ 0 ]
				return mv.shiftKey && Math.abs( biasX ) < Math.abs( mv.offsetY - mdXY[ 1 ] )
				?	x
				:	x + biasX
			}
			const
			defaultVMover = ( mv, y ) => {
				const biasY = mv.offsetY - mdXY[ 1 ]
				return mv.shiftKey && Math.abs( biasY ) < Math.abs( mv.offsetX - mdXY[ 0 ] )
				?	y
				:	y + biasY
			}

			const
			hits = Hits()
			if ( hits.length ) {
				sels = md.shiftKey
				?	[	...sels.filter( _ => !hits.includes( _ ) )
					,	...hits.filter( _ => !sels.includes( _ ) )
					]
				:	hits.slice( 0, 1 )

				switch ( md.detail ) {
				case 1:
					break
				case 2:
					{	const
						Fs = Array.from( new Set( sels.map( _ => _.F ) ) )
						sels = Fs.map( _ => _[ 1 ] ).flat().flat().concat( Fs.map( _ => _[ 0 ] ).filter( _ => _ ) )
					}
					break
				case 3:
					{	const
						Fs = Array.from( new Set( sels.map( _ => _.E[ 3 ] ) ) ).flat()
						sels = Fs.map( _ => _[ 1 ] ).flat().flat().concat( Fs.map( _ => _[ 0 ] ).filter( _ => _ ) )
					}
					break
				case 4:
					sels = []
					PathForAll( _ => sels.push( _ ) )
					break
				default:
					break
				}
				DrawMain()

				//	Selection clicked
				sels.some( _ => hits.includes( _ ) ) && (
					hMover = defaultHMover
				,	vMover = defaultVMover
				)
			} else if ( sels.length > 1 ) {
				const [ [ minX, maxX ], [ minY, maxY ] ] = BBox( ...sels )
				const Index = ( $, _1, _2 ) => {
					if ( $ < _1 - gripSize ) return null
					if ( $ < _1 ) return -1
					if ( $ <= _2 ) return 0
					if ( $ <= _2 + gripSize ) return 1
					return null
				}
				let hIndex = Index( mdXY[ 0 ], ProjectX( minX ), ProjectX( maxX ) )
				hIndex !== null && minX === maxX && ( hIndex = 0 )

				let vIndex = Index( mdXY[ 1 ], ProjectY( minY ), ProjectY( maxY ) )
				vIndex !== null && minY === maxY && ( vIndex = 0 )

				switch ( hIndex ) {
				case  0:
					hMover = vIndex === 0
					?	defaultHMover
					:	( mv, x ) => x
					break
				case  1:
					hMover = ( mv, x ) => minX
					+	( x - minX )
					*	( maxX + mv.offsetX - mdXY[ 0 ] - minX )
					/	( maxX - minX )
					break
				case -1:
					hMover = ( mv, x ) => maxX
					+	( x - maxX )
					*	( minX + mv.offsetX - mdXY[ 0 ] - maxX )
					/	( minX - maxX )
					break
				}
				switch ( vIndex ) {
				case  0:
					vMover = hIndex === 0
					?	defaultVMover
					:	( mv, y ) => y
					break
				case  1:
					vMover = ( mv, y ) => minY
					+	( y - minY )
					*	( maxY + mv.offsetY - mdXY[ 1 ] - minY )
					/	( maxY - minY )
					break
				case -1:
					vMover = ( mv, y ) => maxY
					+	( y - maxY )
					*	( minY + mv.offsetY - mdXY[ 1 ] - maxY )
					/	( minY - maxY )
					break
				}
			}

			if ( hMover && vMover ) {

				const
				oldXYs = sels.map( _ => [ ..._ ] )

				C_MAIN.onmousemove = mv => {
					sels.forEach(
						( $, _ ) => {
							const
							[ x, y ] = oldXYs[ _ ]
							$[ 0 ] = hMover( mv, x )
							$[ 1 ] = vMover( mv, y )
						}
					)
					DrawMain()
				}
				C_MAIN.onmouseup = C_MAIN.onmouseleave = mu => {
					C_MAIN.onmousemove = null
					C_MAIN.onmouseup = null
					C_MAIN.onmouseleave = null
					EQ( MouseXY( mu ), mdXY ) || MoveJob( oldXYs )
				}
			} else {
				md.shiftKey || (
					sels = []
				,	DrawMain()
				)
				C_MAIN.onmousemove = mv => DrawMain( [ mdXY, MouseXY( mv ) ] )
				C_MAIN.onmouseup = C_MAIN.onmouseleave = mu => {
					C_MAIN.onmousemove = null
					C_MAIN.onmouseup = null
					C_MAIN.onmouseleave = null
					const
					bbox = BBox( mdXY, MouseXY( mu ) )
					const tmps = []
					PathForAll( _ => BBoxContains( bbox, Project( _ ) ) && tmps.push( _ ) )
					sels = [
						...sels.filter( _ => !tmps.includes( _ ) )
					,	...tmps.filter( _ => !sels.includes( _ ) )
					]
					DrawMain()
				}
			}
		}
		break
	case EraserB:
		sels = Hits()
		Delete()
		break
	case RectB:
		C_MAIN.onmousemove = mv => {
			DrawMain()
			cMain.strokeStyle = ToolC.value
			cMain.strokeRect( ...MouseRectWH( mv ) )
		}
		C_MAIN.onmouseup = C_MAIN.onmouseleave = mu => {
			C_MAIN.onmousemove = null
			C_MAIN.onmouseup = null
			C_MAIN.onmouseleave = null
			const muXY = MouseXY( mu )
			if ( EQ( muXY, mdXY ) ) return

			const [ x, y, X, Y ] = [ ...Invert( mdXY ), ...Invert( muXY ) ]
			NewFigureJob(
				'rect'
			,	[	null
				,	[	[ [ x, y ] ]
					,	[ [ X, y ] ]
					,	[ [ X, Y ] ]
					,	[ [ x, Y ] ]
					]
				]
			)
		}
		break
	case OvalB:
		C_MAIN.onmousemove = mv => {
			DrawMain()
			const [ x, y, w, h ] = MouseRectWH( mv )
			cMain.beginPath()
			cMain.ellipse(
				x + w / 2
			,	y + h / 2
			,	Math.abs( w / 2 )
			,	Math.abs( h / 2 )
			,	0, 0, 2 * Math.PI
			)
			cMain.strokeStyle = ToolC.value
			cMain.stroke()
		}
		C_MAIN.onmouseup = C_MAIN.onmouseleave = mu => {
			C_MAIN.onmousemove = null
			C_MAIN.onmouseup = null
			C_MAIN.onmouseleave = null
			const muXY = MouseXY( mu )
			if ( EQ( muXY, mdXY ) ) return

			const [ x, y, X, Y ] = [ ...Invert( mdXY ), ...Invert( muXY ) ]
			const midX = ( x + X ) / 2
			const midY = ( y + Y ) / 2
			const halfW_CF = ( X - x ) / 2 * CF
			const halfH_CF = ( Y - y ) / 2 * CF
			NewFigureJob(
				'ellipse'
			,	[	null
				,	[	[ [ x, midY ], [ x, midY + halfH_CF ], [ midX - halfW_CF, Y ] ]
					,	[ [ midX, Y ], [ midX + halfW_CF, Y ], [ X, midY + halfH_CF ] ]
					,	[ [ X, midY ], [ X, midY - halfH_CF ], [ midX + halfW_CF, y ] ]
					,	[ [ midX, y ], [ midX - halfW_CF, y ], [ x, midY - halfH_CF ] ]
					]	
				]
			)
		}
		break
	case LineB:
		C_MAIN.onmousemove = mv => {
			DrawMain()
			cMain.beginPath()
			cMain.moveTo( ...mdXY )
			cMain.lineTo( mv.offsetX, mv.offsetY )
			cMain.strokeStyle = ToolC.value
			cMain.stroke()
		}
		C_MAIN.onmouseup = C_MAIN.onmouseleave = mu => {
			C_MAIN.onmousemove = null
			C_MAIN.onmouseup = null
			C_MAIN.onmouseleave = null
			const muXY = MouseXY( mu )
			if ( EQ( muXY, mdXY ) ) return

			NewFigureJob(
				'line'
			,	[	Invert( mdXY )
				,	[ [ Invert( muXY ) ] ]
				]
			)
		}
		break
	case CurveB:
		{	const
			mouse = []
			let
			prev = mdXY
			C_MAIN.onmousemove = mv => {
				const mvXY = [ mv.offsetX, mv.offsetY ]
				if ( EQ( prev, mvXY ) ) return
				mouse.push( mvXY )
				cMain.beginPath()
				cMain.moveTo( ...prev )
				cMain.lineTo( ...mvXY )
				cMain.strokeStyle = ToolC.value
				cMain.stroke()
				prev = mvXY
			}
			C_MAIN.onmouseup = C_MAIN.onmouseleave = mu => {
if ( mu.movementX || mu.movementY ) debugger
				C_MAIN.onmousemove = null
				C_MAIN.onmouseup = null
				C_MAIN.onmouseleave = null
				DrawMain()
				const muXY = MouseXY( mu )
				if ( EQ( muXY, mdXY ) ) return

//	Eliminate near to end points
				const
				$ = mouse.filter( _ => Dist2( _, mdXY ) > 18 && Dist2( _, muXY ) > 18 )

				if ( !$.length ) return
//	Eliminate 90deg and same orientations
				while ( true ) {
					const
					toDelete = []
					const
					NinetyOrSameOri = ( p, q ) => (
						(	p[ 0 ] === 0 && Math.abs( p[ 1 ] ) === 1
						&&	Math.abs( q[ 0 ] ) === 1 && q[ 1 ] === 0
						)
					||	(	Math.abs( p[ 0 ] ) === 1 && p[ 1 ] === 0
						&&	q[ 0 ] === 0 && Math.abs( q[ 1 ] ) === 1
						)
					||	p[ 0 ] * q[ 1 ] === q[ 0 ] * p[ 1 ]
					)
					let	next = Vec( $.at( -1 ), muXY )
					let	_ = $.length - 1
					while ( _-- ) {
						const
						prev = Vec( $[ _ ], $[ _ + 1 ] )
						NinetyOrSameOri( prev, next ) && toDelete.push( _ + 1 )
						next = prev
					}
					const
					prev = Vec( mdXY, $[ 0 ] )
					NinetyOrSameOri( prev, next ) && toDelete.push( 0 )
					if ( !toDelete.length ) break
					toDelete.forEach( _ => $.splice( _, 1 ))
					if ( !$.length ) break
				}

				const
				Vectorize = ( start, Ps, end ) => {

					if ( Ps.length < 3 ) return [ [ end ] ]

					const
					$ = [ ...Ps ]

					const
					angles = Angles( start, $, end )
					const posi = angles.reduce( ( $, _ ) => _ > 0 ? $ + _ : $, 0 )
					const nega = angles.reduce( ( $, _ ) => _ < 0 ? $ - _ : $, 0 )
console.log( posi * 180 / Math.PI, nega * 180 / Math.PI, ( posi - nega ) * 180 / Math.PI )
					if ( posi >= Math.PI || nega >= Math.PI ) {
						const
						Find = () => {
							const
							vecSE = Vec( start, end )
							const
							_ = $.map( ( $, _ ) => [ PerpendicularLength2V( Vec( start, $ ), vecSE ), _ ] )
							const
							v = _.sort( 
								Math.abs( posi - nega ) < Math.PI / 4
								?	( p, q ) => p[ 0 ] - q[ 0 ]
								:	( p, q ) => q[ 0 ] - p[ 0 ]
							)[ 0 ][ 1 ]
							return v === 0 || v === $.length - 1
							?	Math.floor( $.length / 2 )
							:	v
						}
						const found = Find()
console.log( found, $.length )
						//	NEEDS 3 OR MORE POINTS
						const prev = Vectorize( start, $.slice( 0, found - 1 ), $[ found ] )
						const next = Vectorize( $[ found ], $.slice( found + 1 ), end )
						return next.concat( prev )
					}
					return [ [ end, ...FitCubeBezier( [ start, ...$, end ] ).reverse() ] ]
				}

				NewFigureJob(
					'path'
				,	[	Invert( mdXY )
					,	Vectorize( mdXY, $, muXY ).map( S => S.map( P => Invert( P ) ) )
					]
				)
			}
		}
		break
	case PenB:
		{	const $ = GridHit( svg )

			if ( $ ) {
				const
				[ d2, iF, iS, grid, cp ] = $
				const
				newSVG = CloneJSONable( svg )

				PathForAll( () => {} )
				const
				[ MT, LC ] = FindF( cp, newSVG )
				const
				S = LC[ iS ]
				switch ( S.length ) {
				case 1:
					LC.splice( iS + 1, 0, [ grid ] )
					break
				case 2:
					{	const _ = DivideQuadBezier(
							[ cp, S[ 1 ], S[ 0 ] ]
						,	FindQuadBezierT( grid, [ cp, S[ 1 ], S[ 0 ] ] )
						)
						LC.splice(
							iS
						,	1
						,	[ S[ 0 ], _[ 2 ] ]
						,	[ _[ 1 ], _[ 0 ] ]
						)
					}
					break
				case 3:
					{	const _ = DivideCubeBezier(
							[ cp, S[ 2 ], S[ 1 ], S[ 0 ] ]
						,	FindCubeBezierT( grid, [ cp, S[ 2 ], S[ 1 ], S[ 0 ] ] )
						)
						LC.splice(
							iS
						,	1
						,	[ S[ 0 ], _[ 4 ], _[ 3 ] ]
						,	[ _[ 2 ], _[ 1 ], _[ 0 ] ]
						)
					}
					break
				}
				SVGJob( newSVG, [ grid ] )
			}
		}
		break
	case ScissorsB:
		{	const
			$ = Hit()

			if ( $ ) {
				if (
					$.iP !== 0	//	MT(void 0), 1, 2
				||	( $.F[ 0 ] !== null && $.iP === 0 && $.iS === 0 )	//	End point
				) {
					alert( 'Cannot split here.' )
					return
				}
				const
				newSVG = CloneJSONable( svg )
				const
				[ T, D, A, G ] = FindE( $, newSVG )
				const
				F = G[ $.iF ]
				const
				[ MT, LC ] = F
				const
				newSels = []
				if ( MT ) {
					const b = [ [ ...$ ], LC.slice( 0, $.iS )	]
					const a = [ MT		, LC.slice( $.iS )		]
					G.splice( $.iF, 1, b, a )
					newSels.push( b[ 0 ], a[ 1 ][ 0 ][ 0 ] )
				} else {
					F[ 0 ] = [ ...$ ]
					F[ 1 ] = [ ...CircluatingSlice( LC, $.iS, $.iS ) ]
					newSels.push( F[ 0 ], F[ 1 ][ 0 ][ 0 ] )
				}
				SVGJob( newSVG, newSels )
				return
			}
		}
		{	const
			$ = GridHit( svg )

			if ( $ ) {
				const
				[ d2, iF, iS, grid, cp ] = $
				const
				newSVG = CloneJSONable( svg )

				PathForAll( () => {} )
				const
				[ T, D, A, G ] = FindE( cp, newSVG )
				const
				F = G[ iF ]
				const
				[ MT, LC ] = F
				const
				S = LC[ iS ]
				const
				newSels = [ [ ...grid ], [ ...grid ] ]
				if ( MT ) {
					switch ( S.length ) {
					case 1:
						G.splice(
							iF, 1
						,	[ MT, [ [ newSels[ 0 ] ], ...LC.slice( iS + 1 ) ] ]
						,	[ newSels[ 1 ], LC.slice( 0, iS + 1 ) ]
						)
						break
					case 2:
						{	const _ = DivideQuadBezier(
								[ cp, S[ 1 ], S[ 0 ] ]
							,	FindQuadBezierT( grid, [ cp, S[ 1 ], S[ 0 ] ] )
							)
							S[ 1 ] = _[ 2 ]
							G.splice(
								iF, 1
							,	[ MT, [ [ newSels[ 0 ], _[ 0 ] ], ...LC.slice( iS + 1 ) ] ]
							,	[ newSels[ 1 ], LC.slice( 0, iS + 1 ) ]
							)
						}
						break
					case 3:
						{	const _ = DivideCubeBezier(
								[ cp, S[ 2 ], S[ 1 ], S[ 0 ] ]
							,	FindCubeBezierT( grid, [ cp, S[ 2 ], S[ 1 ], S[ 0 ] ] )
							)
							S[ 2 ] = _[ 3 ]
							S[ 1 ] = _[ 4 ]
							G.splice(
								iF, 1
							,	[ MT, [ [ newSels[ 0 ], _[ 1 ], _[ 0 ] ], ...LC.slice( iS + 1 ) ] ]
							,	[ newSels[ 1 ], LC.slice( 0, iS + 1 ) ]
							)
						}
						break
					}
				} else {
					switch ( S.length ) {
					case 1:
						F[ 0 ] = newSels[ 0 ]
						F[ 1 ] = [ [ newSels[ 1 ] ], ...CircluatingShift( LC, iS + 1 ) ]
						break
					case 2:
						{	const _ = DivideQuadBezier(
								[ cp, S[ 1 ], S[ 0 ] ]
							,	FindQuadBezierT( grid, [ cp, S[ 1 ], S[ 0 ] ] )
							)
							S[ 1 ] = _[ 2 ]
							F[ 0 ] = newSels[ 0 ]
							F[ 1 ] = [ [ newSels[ 1 ], _[ 0 ] ], ...CircluatingShift( LC, iS + 1 ) ]
						}
						break
					case 3:
						{	const _ = DivideCubeBezier(
								[ cp, S[ 2 ], S[ 1 ], S[ 0 ] ]
							,	FindCubeBezierT( grid, [ cp, S[ 2 ], S[ 1 ], S[ 0 ] ] )
							)
							S[ 2 ] = _[ 3 ]
							S[ 1 ] = _[ 4 ]
							F[ 0 ] = newSels[ 0 ]
							F[ 1 ] = [ [ newSels[ 1 ], _[ 1 ], _[ 0 ] ], ...CircluatingShift( LC, iS + 1 ) ]
						}
						break
					}
				}
				SVGJob( newSVG, newSels )
				return
			}
		}
		break
	}
}

Array.from( document.body.getElementsByClassName( 'redraw' ) ).forEach(
	_ => (
		_.list.addEventListener( 'change', ev => console.log( 'list', _, _.value ) )
	,	_.palette.addEventListener( 'input', ev => console.log( 'palette', _, _.value ) )
	)
)

const
Refresh = () => {
	MarginH	.value	= marginH
	MarginV	.value	= marginV
	Width	.value	= width
	Height	.value	= height
	C_MAIN	.width	= marginH + marginH + width
	C_MAIN	.height	= marginV + marginV + height
	C_PREV	.width	= marginH + marginH + width
	C_PREV	.height	= marginV + marginV + height
	Draw()
}

MarginH	.onchange	= Refresh
MarginV	.onchange	= Refresh
Width	.onchange	= Refresh
Height	.onchange	= Refresh

Refresh()

////////////////////////////////////////////////////////////////	DEBUG

const
cDebug		= C_DEBUG.getContext( '2d' )

const
DrawDebug	= ( _, N ) => {

	const
	[ bitRGBAs, W, H ] = BitRGBAs( _ )
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
	C_DEBUG.width = $.width
	C_DEBUG.height = $.height
	cDebug.putImageData( $, 0, 0 )
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
		Render( glyph )
		DrawDebug( glyph, 2 )
		break
	case 2:
		svg[ 1 ][ 0 ][ 3 ] = ( await fetch( '_.ved' ).then( _ => _.json() ) )[ 0 ][ 0 ][ 3 ].map( _ => _[ 1 ] )
	//	svg[ 1 ][ 0 ][ 3 ] = [ ( await fetch( '_.ved' ).then( _ => _.json() ) )[ 0 ][ 0 ][ 3 ][ 3 ][ 1 ] ]
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
		Render( glyph )
		break
	case 6:
		svg[ 1 ].push( [ 'path', [], { 'stroke': 'purple', 'stroke-width': 4 }, [ [], [] ] ] )
		{	const _ = svg[ 1 ].at( -1 )[ 3 ][ 0 ]
			_.push( null )
			const $ = []
			_.push( $ )
			$.push( [ [ 200, 300 ], [ 100, 300 ] ] )
			$.push( [ [ 100, 400 ], [ 100, 500 ] ] )
			$.push( [ [ 200, 500 ], [ 300, 500 ] ] )
			$.push( [ [ 300, 400 ], [ 300, 300 ] ] )
		}
		{	const _ = svg[ 1 ].at( -1 )[ 3 ][ 1 ]
			_.push( [ 400, 100 ] )
			const $ = []
			_.push( $ )
			$.push( [ [ 600, 300 ], [ 700, 200 ], [ 600, 100 ] ] )
			$.push( [ [ 500, 200 ], [ 400, 300 ], [ 300, 200 ] ] )
		}
		svg[ 1 ].push( [ 'path', [], { 'stroke': 'violet', 'stroke-width': 4 }, [ [], [] ] ] )
		{	const _ = svg[ 1 ].at( -1 )[ 3 ][ 0 ]
			_.push( null )
			const $ = []
			_.push( $ )
			$.push( [ [ 100, 500 ], [ 100, 633 ], [ 300, 633 ] ] )
			$.push( [ [ 300, 500 ], [ 300, 366 ], [ 100, 366 ] ] )
		}
		{	const _ = svg[ 1 ].at( -1 )[ 3 ][ 1 ]
			_.push( [ 400, 400 ] )
			const $ = []
			_.push( $ )
			$.push( [ [ 600, 400 ] ] )
			$.push( [ [ 600, 500 ], [ 600, 600 ] ] )
			$.push( [ [ 500, 600 ], [ 400, 600 ] ] )
			$.push( [ [ 400, 500 ] ] )
			$.push( [ [ 500, 500 ] ] )
			$.push( [ [ 500, 400 ] ] )
		}
		Draw()
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

	//	Render( glyph )
	//	DrawDebug( glyph, 8 )
		break
	}
}

const
Unite = () => {

	const
	Fs = Array.from( new Set( sels.map( _ => _.F ) ) )
	if ( Fs.some( _ => !_[ 0 ] ) ) {
		Toast( 'green', 'Lines only' )
		return
	}
	if ( !Fs.length ) {
		alert( 'No lines' )
		return
	}

	const
	newSVG = CloneJSONable( svg )

	new Set( sels.map( _ => FindF( _, newSVG ) ) ).forEach( F => F[ 0 ] = null )

	SVGJob( newSVG )
}

const
Combine = () => {

	const
	Fs = Array.from( new Set( sels.map( _ => _.F ) ) )
	if ( Fs.some( _ => _[ 0 ] ) ) {
		Toast( 'green', 'Contours only' )
		return
	}
	if ( !Fs.length ) {
		alert( 'No contours' )
		return
	}

//v	DEBUG
//const
//AllContours = () => {
//	const $ = new Set()
//	PathForAll( _ => _.F[ 0 ] === null && $.add( _.F[ 1 ] ) )
//	return Array.from( $ )
//}
//	const
//	Cs = AllContours()
//^	DEBUG

	const
	Cs = Fs.map( _ => _[ 1 ] )

	const	//	Rounded
	RSCs = Cs.map(
		C => C.map(
			S => S.map(
				_ => {
					const $ = Round( _ )
					$.org = _
					return $
				}
			)
		)
	)

	const
	[ $, W, H, X, Y, POIs ] = BitRGBAs( RSCs )
console.log( 'POIs', POIs )

	RSCs.forEach( C => C.forEach( S => S.forEach( P => ( P[ 0 ] -= X, P[ 1 ] -= Y ) ) ) )

	const
	B = ( x, y ) => $[ y * W + x ] & 1

	const
	Trace = () => {
		const
		pathes = []

		const
		TryTrace = ( sx, sy, RorD ) => {	//	true: R else: D
			const	xys	= []
			const	dirs = []
			let		x = sx
			let		y = sy
			let		d
			const	R = () => { xys.push( [ x++, y ] ), dirs.push( d = 'R' ) }
			const	L = () => { xys.push( [ x--, y ] ), dirs.push( d = 'L' ) }
			const	D = () => { xys.push( [ x, y++ ] ), dirs.push( d = 'D' ) }
			const	U = () => { xys.push( [ x, y-- ] ), dirs.push( d = 'U' ); if ( y < sy || ( y === sy && x < sx ) ) throw [ x, y ] }
			RorD ? R() : D()
			while ( x != sx || y != sy ) {
				switch ( d ) {
				case 'R': B( x		, y - 1	) ? U() : B( x		, y		) ? R() : D(); break
				case 'D': B( x		, y		) ? R() : B( x - 1	, y		) ? D() : L(); break
				case 'L': B( x - 1	, y		) ? D() : B( x - 1	, y - 1	) ? L() : U(); break
				case 'U': B( x - 1	, y - 1	) ? L() : B( x		, y - 1	) ? U() : R(); break
				}
			}
			pathes.push( [ xys, dirs ] )
		}

		for ( let sy = 0; sy < H; sy++ ) {
			for ( let sx = 0; sx < W; sx++ ) {
				try {
					B( sx, sy )
					?	B( sx - 1, sy - 1 ) ||	B( sx - 1, sy ) || B( sx, sy - 1 ) || TryTrace( sx, sy, true )
					:							B( sx - 1, sy ) && B( sx, sy - 1 ) && TryTrace( sx, sy, false )
				} catch ( [ x, y ] ) {
				//	console.log( sx, sy, x, y )
				}
			}
		}
		return pathes
	}
	const newCs = Trace().filter( ( [ xys, dirs ] ) => xys.length > 4 ).map(

		( [ xys, dirs ], _ ) => {

			const
			NearestXYIndices = xy => {
				const $ = []
				xys.forEach( ( XY, _ ) => EQ( xy, XY )		&& $.push( _ ) )
				if ( $.length ) return $
				xys.forEach( ( XY, _ ) => Next( xy, XY )	&& $.push( _ ) )
				if ( $.length ) return $
				xys.forEach( ( XY, _ ) => Near( xy, XY )	&& $.push( _ ) )
				return $
			}

			const
			_poiIs = []
			POIs.forEach( _ => _poiIs.push( ...NearestXYIndices( _ ) ) )
			const
			poiIs = Array.from( new Set( _poiIs ) )
			poiIs.sort( ( p, q ) => p - q )
console.log( 'poiIs:', poiIs )

			const
			matched = []

			RSCs.forEach(
				C => {
					let	prev = C[ 0 ][ 0 ]
					let iS = C.length
					while ( iS-- ) {
						const S = C[ iS ]
						if ( S.grids.length > 2 ) {	//	!!!! TRICK EFFECTS !!!!
							const sI = NearestXYIndices( prev ).filter( _ => poiIs.includes( _ ) )[ 0 ]
							const mI = NearestXYIndices( S.grids[ Math.floor( S.grids.length / 2 ) ] )[ 0 ]
							const eI = NearestXYIndices( S[ 0 ] ).filter( _ => poiIs.includes( _ ) )[ 0 ]
							if ( sI != void 0 && eI != void 0 && mI != void 0 ) {
								const Nor = () => matched.push( [ sI, eI, S.map( P => P.org ), prev.org ] )
								const Rev = () => matched.push( [ eI, sI, [ prev.org, ...S.slice( 1 ).reverse().map( P => P.org ) ], S[ 0 ].org ] )
								sI < mI
								?	mI < eI
									?	!poiIs.some( _ => sI < _ && _ < eI ) && Nor()		//	( console.log( 'NOR SME' ), Nor() )
									:	eI < sI
										?	!poiIs.some( _ => sI < _ || _ < eI ) && Nor()	//	( console.log( 'NOR SMZE' ), Nor() )
										:	!poiIs.some( _ => eI < _ || _ < sI ) && Rev()	//	( console.log( 'REV SZME' ), Rev() )
								:	mI > eI
									?	!poiIs.some( _ => eI < _ && _ < sI ) && Rev()		//	( console.log( 'REV SME' ), Rev() )
									:	eI < sI 
										?	!poiIs.some( _ => sI < _ || _ < eI ) && Nor()	//	( console.log( 'NOR SZME' ), Nor() )
										:	!poiIs.some( _ => eI < _ || _ < sI ) && Rev()	//	( console.log( 'REV SMZE' ), Rev() )
							}
						}
						prev = S[ 0 ]
					}
				}
			)
console.log( "#matched:", matched.length, matched )
			xys = xys.map( ( [ x, y ] ) => [ x + X, y + Y ] )
			const
			NewSegments = ( sI, eI, level = 0 ) => {	//	eI inclusive
				if ( ( sI + 1 ) % xys.length === eI ) return []
				{	const _ = sI < eI
					?	poiIs.filter( _ => sI < _ && _ < eI )
					:	poiIs.filter( _ => _ < eI || sI < _ )
					if ( _.length ) return NewSegments( sI, _[ 0 ], level + 1 ).concat( NewSegments( _[ 0 ], eI, level + 1 ) )
				}
				const $ = sI < eI
				?	xys.slice( sI, eI + 1 )
				:	xys.slice( sI ).concat( xys.slice( 0, eI + 1 ) )

//console.log( '$:', $[ 0 ], $.at( -1 ) )
				const lastI = $.length - 1
				if ( $.length < 4 ) return [ $.slice( lastI ) ]

				const pq = Vec( $[ 0 ], $[ lastI ] )
				if ( $.slice( 1, lastI ).every( r => Math.abs( PerpendicularLength2V( pq, Vec( $[ 0 ], r ) ) ) < 2 ) ) return [ $.slice( lastI ) ]

				let [ p, q ] = FitCubeBezier( $ )

//v	Adjust
				Cs.forEach(
					C => {
						const angleC = C.reduce(
							( $, S, _ ) => {
								const prevP = C[ _ + 1 === C.length ? 0 : _ + 1 ][ 0 ]
								const nextP = C[ ( _ ? _ : C.length ) - 1 ][ 0 ]
								const currP = S[ 0 ]
								return $ + Angle( Vec( prevP, currP ), Vec( currP, nextP ) )
							}
						,	0
						)
//console.log( 'angleC:', angleC, angleC < 0 ? '右' : '左' )
						C.forEach(
							( S, _ ) => {
								const prev = C[ _ + 1 === C.length ? 0 : _ + 1 ][ 0 ]
								if ( S.length > 2 ) {
									const bez = [ prev, S[ 2 ], S[ 1 ], S[ 0 ] ]
									if ( Near( prev, $[ 0 ] ) ) {
										const T = FindCubeBezierT( $.at( -1 ), bez )
										if ( T ) {
//console.log( 'S S:', $.at( -1 ), ...bez, T )
											const div = DivideCubeBezier( bez, T )
											p = div[ 0 ]
											q = div[ 1 ]
										}
									}
									if ( Near( S[ 0 ], $.at( -1 ) ) ) {
										const T = FindCubeBezierT( $[ 0 ], bez )
										if ( T ) {
//console.log( 'E E:', $[ 0 ], ...bez, T )
											const div = DivideCubeBezier( bez, T )
											p = div[ 3 ]
											q = div[ 4 ]
										}
									}
									if ( Near( S[ 0 ], $[ 0 ] ) ) {
										const T = FindCubeBezierT( $.at( -1 ), bez )
										if ( T ) {
//console.log( 'E S:', $.at( -1 ), ...bez, T )
											const div = DivideCubeBezier( bez, T )
											p = div[ 4 ]
											q = div[ 3 ]
										}
									}
									if ( Near( prev, $.at( -1 ) ) ) {
										const T = FindCubeBezierT( $[ 0 ], bez )
										if ( T ) {
//console.log( 'S E:', $[ 0 ], ...bez, T )
											const div = DivideCubeBezier( bez, T )
											p = div[ 1 ]
											q = div[ 0 ]
										}
									}
								}
							}
						)
					}
				)
//^	Adjust
				return [ [ $[ lastI ], q, p ] ] 
			}

			if ( matched.length ) {
				matched.sort( ( l, r ) => l[ 0 ] - r[ 0 ] )
				let joint = matched.at( -1 )[ 1 ]
				return matched.reduce(
					( $, [ sI, eI, S, prev ] ) => {
						if ( joint != sI ) {
							const _ = NewSegments( joint, sI )
							$.push( ..._ )
						}
						$.push( S )
						joint = eI 
						return $
					}
				,	[]
				).reverse()
			} else {
				return poiIs.length > 1
				?	NewSegments( poiIs[ 0 ], poiIs[ 1 ] ).concat( NewSegments( poiIs[ 1 ], poiIs[ 0 ] ) ).reverse()
				:	xys.map( _ => [ _ ] ).reverse()
			}
		}
	)
console.log( newCs )


//	JOB
	const
	Reduct = ( [ T, D, A, G ] ) => [
		T
	,	D.map( _ => Reduct( _ ) )
	,	{ ...A }
	,	TagGroup( T ) === 'path'
		?	G.filter( F => !Cs.includes( F[ 1 ] ) )
		:	G
	]

	const
	newSVG = Reduct( svg )

	newSVG[ 1 ].push(
		[	'path'
		,	[]
		,	Template()
		,	newCs.map( C => [ null, C ] )
		]
	)
	SVGJob( newSVG, newCs.flat().flat() )
}

const
Reverse = () => {

	if ( !sels.length ) {
		Toast( 'yellow', 'No contours' )
		return
	}

	const
	newSVG = CloneJSONable( svg )
	new Set( sels.map( _ => FindF( _, newSVG ) ) ).forEach(
		F => {
			const
			[ MT, LC ] = F
			if ( MT ) {	//	Line
			//	const _ = LC.map( ( $, _ ) => [ $[ 0 ], ...LC[ ++_ === LC.length ? 0 : _ ].slice( 1 ).reverse() ] )
			//	F[ 1 ] = [ _[ 0 ], ..._.slice( 1 ).reverse() ]

				F[ 0 ] = LC[ 0 ][ 0 ]
				F[ 1 ] = [ [ MT, ...LC.at( -1 ).slice( 1 ).reverse() ] ]
				let iS = LC.length
				while ( --iS ) F[ 1 ].push( [ LC[ iS ][ 0 ], ...LC[ iS - 1 ].slice( 1 ).reverse() ] )
			} else {	//	Contour
				F[ 1 ] = [ [ LC[ 0 ][ 0 ], ...LC.at( -1 ).slice( 1 ).reverse() ] ]
				let iS = LC.length
				while ( --iS ) F[ 1 ].push( [ LC[ iS ][ 0 ], ...LC[ iS - 1 ].slice( 1 ).reverse() ] )
			}
		}
	)
	SVGJob( newSVG )
}

const
Forward = () => {

	const _ = sels.filter( _ => _.F[ 0 ] === null )
	if ( !_.length ) {
		Toast( 'yellow', 'No contours' )
		return
	}

	const
	newSVG = CloneJSONable( svg )
	new Set( _.map( _ => FindF( _, newSVG )[ 1 ] ) ).forEach( C => C.unshift( C.pop() ) )
	SVGJob( newSVG )
}

const
Backward = () => {

	const _ = sels.filter( _ => _.F[ 0 ] === null )
	if ( !_.length ) {
		Toast( 'yellow', 'No contours' )
		return
	}

	const
	newSVG = CloneJSONable( svg )
	new Set( _.map( _ => FindF( _, newSVG )[ 1 ] ) ).forEach( C => C.push( C.shift( 1 ) ) )
	SVGJob( newSVG )
}

const
Info = () => {

	const
	_ = sels.length ? sels : AllPoints()

	const
	[ [ x, X ], [ y, Y ] ] = BBox( ..._ )

	alert(
		`# of points  : ${_.length}\n`
	+	`# of figures : ${_.reduce( ( $, P ) => $.add( P.F ), new Set() ).size}\n`
	+	`# of elements: ${_.reduce( ( $, P ) => $.add( P.E ), new Set() ).size}\n`
	+	`Bounding box :\n`
	+	`    L: ${x.toFixed( 2 )}\n`
	+	`    T: ${y.toFixed( 2 )}\n`
	+	`    R: ${X.toFixed( 2 )}\n`
	+	`    B: ${Y.toFixed( 2 )}\n`
	)
}

const
XYJob = _ => {
	const
	oldXYs = sels.map( _ => [ ..._ ] )
	_()
	MoveJob( oldXYs )
}

const
Align = ( ax, minmax ) => {
	const
	$ = BBox( ...sels )[ ax ][ minmax ]
	XYJob( _ => sels.forEach( _ => _[ ax ] = $ ) )
}

const
MidXYJob = _ => {
	if ( !sels.length ) {
		Toast( 'yellow', 'No selection' )
		return
	}
	const
	oldXYs = sels.map( _ => [ ..._ ] )
	const [ [ x, X ], [ y, Y ] ] = BBox( ...sels )
	const midX = ( x + X ) / 2
	const midY = ( y + Y ) / 2
	_( midX, midY )
	MoveJob( oldXYs )
}

const
MirrorH = () => sels.length && MidXYJob(
	( midX, midY ) => sels.forEach( _ => _[ 0 ] = midX - ( _[ 0 ] - midX ) )
)
const
MirrorV = () => sels.length && MidXYJob(
	( midX, midY ) => sels.forEach( _ => _[ 1 ] = midY - ( _[ 1 ] - midY ) )
)
const
Rotate90R = () => sels.length && MidXYJob(
	( midX, midY ) => sels.forEach( _ => [ _[ 0 ], _[ 1 ] ] = [ midY - _[ 1 ] + midX, _[ 0 ] - midX + midY ] )
)
const
Rotate90L = () => sels.length && MidXYJob(
	( midX, midY ) => sels.forEach( _ => [ _[ 0 ], _[ 1 ] ] = [ _[ 1 ] - midY + midX, midX - _[ 0 ] + midY ] )
)
const
Rotate = () => sels.length && MidXYJob(
	( midX, midY ) => {
		const theta = RotateAngle.value * Math.PI / 180
		const sinTheta = Math.sin( theta )
		const cosTheta = Math.cos( theta )
		sels.forEach(
			_ => {
				const x = _[ 0 ] - midX
				const y = _[ 1 ] - midY
				_[ 0 ] = x * cosTheta - y * sinTheta + midX
				_[ 1 ] = x * sinTheta + y * cosTheta + midY
			}
		)
	}
)
const
Resize = () => sels.length && MidXYJob(
	( midX, midY ) => sels.forEach(
		_ => [ _[ 0 ], _[ 1 ] ] = [
			midX + ( _[ 0 ] - midX ) * ResizeH.value / 100
		,	midY + ( _[ 1 ] - midY ) * ResizeV.value / 100
		]
	)
)

UndoB		.onclick = () => ( Undo()			, C_MAIN.focus() )
RedoB		.onclick = () => ( Redo()			, C_MAIN.focus() )
CutB		.onclick = () => ( Cut()			, C_MAIN.focus() )
CopyB		.onclick = () => ( Copy()			, C_MAIN.focus() )
PasteB		.onclick = () => ( Paste()			, C_MAIN.focus() )
SelectAllB	.onclick = () => ( SelectAll()		, C_MAIN.focus() )
DeleteB		.onclick = () => ( Delete()			, C_MAIN.focus() )
AlignLB		.onclick = () => ( Align( 0, 0 )	, C_MAIN.focus() )
AlignRB		.onclick = () => ( Align( 0, 1 )	, C_MAIN.focus() )
AlignTB		.onclick = () => ( Align( 1, 0 )	, C_MAIN.focus() )
AlignBB		.onclick = () => ( Align( 1, 1 )	, C_MAIN.focus() )
MirrorHB	.onclick = () => ( MirrorH()		, C_MAIN.focus() )
MirrorVB	.onclick = () => ( MirrorV()		, C_MAIN.focus() )
Rotate90RB	.onclick = () => ( Rotate90R()		, C_MAIN.focus() )
Rotate90LB	.onclick = () => ( Rotate90L()		, C_MAIN.focus() )
RotateB		.onclick = () => ( Rotate()			, C_MAIN.focus() )
ResizeB		.onclick = () => ( Resize()			, C_MAIN.focus() )
ReverseB	.onclick = () => ( Reverse()		, C_MAIN.focus() )
ForwardB	.onclick = () => ( Forward()		, C_MAIN.focus() )
BackwardB	.onclick = () => ( Backward()		, C_MAIN.focus() )
UniteB		.onclick = () => ( Unite()			, C_MAIN.focus() )
CombineB	.onclick = () => ( Combine()		, C_MAIN.focus() )
InfoB		.onclick = () => ( Info()			, C_MAIN.focus() )

DebugB	.onclick = () => (
	DrawDebug( [ sels[ 0 ].F[ 1 ] ], 1 )
,	C_MAIN.focus()
)

