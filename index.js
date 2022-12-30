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
	XOR
,	ArrayPermutations
,	Product
,	CloneJSONable
} from './JP/JS/JP.js'

const
On = ( $, _ ) => $ && _( $ )

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

////////

const
undos	= []

const
redos	= []

const
Job		= ( Undo, Redo ) => {
	const $ = { Undo, Redo }
	undos.push( $ )
	redos.length = 0
	return $
}

const
Undo	= () => {
	if ( !undos.length ) return
	const _ = undos.pop()
	redos.push( _ )
	_.Undo()
	Draw()
}

const
Redo	= () => {
	if ( !redos.length ) return
	const _ = redos.pop()
	undos.push( _ )
	_.Redo()
	Draw()
}

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
	F: Figure ( contours and lines )
		Line [ moveTo, path ]
		Contour [ null, path ]
	S: Section
	P: Point
*/
const
BitRGBAs = _ => {	//	Contours
	const bbox = BBox( ..._.flat().flat() )
	const X = Math.floor( bbox[ 0 ][ 0 ] )
	const Y = Math.floor( bbox[ 1 ][ 0 ] )
	const W = Math.ceil( bbox[ 0 ][ 1 ] ) - X + 4
	const H = Math.ceil( bbox[ 1 ][ 1 ] ) - Y + 4
	const $ = new Int8Array( W * H )
	$.fill( 0 )
	
//	!!!! TRICKS !!!!	ATTACHING GRIDS TO SEGMENT IN INNER LOOP
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
,	mode === SelectB || ( sels = [] )
,	Draw()
)

;[ SelectB, RectB, OvalB, LineB, CurveB, EraserB, PenB, DivideB, ChangeB, HandB ].forEach( _ => _.onclick = () => SetMode( _ ) )


let
svg				= [
	'svg'
,	[]
,	{}
,	null
]

const
SVGJob = ( oldSVG, newSelection = selection ) => {
//^
	AttachAnscestorSVG( oldSVG[ 0 ] )
	const oldSelection = selection.map( P => FindPoint( P, oldSVG[ 0 ] ) )
	selection = newSelection
	AttachAnscestorSVG()
	const newSVG = svg
	Job(
		() => [ svg, selection ] = [ oldSVG, oldSelection ]
	,	() => [ svg, selection ] = [ newSVG, newSelection ]
	)
	Draw()
}
const
TagGroup		= _ => {
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
PointsForAll	= ( $, L = [ svg ] ) => {
	const E = L[ 0 ]
	TagGroup( E[ 0 ] ) === 'path' && E[ 3 ].forEach(
		( F, iF ) => (
			F[ 0 ] && $( [ F[ 0 ], -1, null, -1, F, iF, ...L ] )
		,	F[ 1 ].forEach( ( S, iS ) => S.forEach( ( P, iP ) => $( [ P, iP, S, iS, F, iF, ...L ] ) ) )
		)
	)
,	E[ 1 ].forEach( _ => PointsForAll( $, [ _, ...L  ] ) )
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
Invert			= ( [ x, y ] ) => [ x - marginH, y - marginV ]

const
ProjectX		= _ => _ + marginH
const
ProjectY		= _ => _ + marginV
const
Project			= ( [ x, y ] ) => [ ProjectX( x ), ProjectY( y ) ]

const
cMain			= C_MAIN.getContext( '2d' )

const
DrawMain		= mdmv => {

	const
	start = performance.now()

	const
	Skelton = _ => _[ 1 ].reduce(
		( $, _ ) => $.concat( Skelton( _ ) )
	,	TagGroup( _[ 0 ] ) === 'path' ? _[ 3 ] : []
	)
	const
	G = Skelton( svg )
	
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
	Stroke = ( [ x, y ], rgb ) => {
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
	StrokeEndP = _ => (
		Stroke( _, 2 )
	,	Stroke( _, 3 )
	)
	const
	StrokeControlP = _ => (
		Stroke( _, 0 )
	,	Stroke( _, 3 )
	)
	const
	EyeEndP = _ => (
		Eye( _, 2 )
	,	Eye( _, 3 )
	)
	const
	EyeControlP = _ => (
		Eye( _, 0 )
	,	Eye( _, 3 )
	)
	G.forEach( 
		( [ moveTo, lc ] ) => {
			let cp = moveTo ?? lc[ 0 ][ 0 ]
			moveTo && StrokeEndP( Round( moveTo ) )
			let iS = lc.length
			while ( iS-- ) {
				const S = lc[ iS ]
				Grids( cp, S ).forEach( _ => Plot( _ ) )
				StrokeEndP( Round( S[ 0 ] ) )
				S.length > 1 && StrokeControlP( Round( S[ 1 ] ) )
				S.length > 2 && StrokeControlP( Round( S[ 2 ] ) )
				cp = S[ 0 ]
			}
		}
	)
	sels.forEach(
		( [ P, iP, S ] ) => {
			iP > 0
			?	S.length === 2
				?	EyeControlP( Round( P ) )
				:	EyeControlP( Round( P ) )
			:	EyeEndP( Round( P ) )	//	-1 for moveTo
		}
	)
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

	if ( sels.length > 1 ) {
		const bbox = BBox( ...sels.map( _ => _[ 0 ] ) )
		const x = Math.floor( bbox[ 0 ][ 0 ] )
		const y = Math.floor( bbox[ 1 ][ 0 ] )
		const X = Math.ceil( bbox[ 0 ][ 1 ] )
		const Y = Math.ceil( bbox[ 1 ][ 1 ] )
		const w = X - x - 1
		const h = Y - y - 1
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
	elappsed > 10 && console.log( elappsed )
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
				( [ moveTo, lc ] ) => {
					path.moveTo( ...( moveTo ?? lc[ 0 ][ 0 ] ) )
					let iS = lc.length
					while ( iS-- ) AddSegment( lc[ iS ] )
					moveTo || path.closePath()
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

PreviewR.oninput = ev => C_PREV.style.opacity = ev.target.value
SkeltonR.oninput = ev => C_MAIN.style.opacity = ev.target.value

const
Draw = () => (
	cPrev.clearRect( 0, 0, C_PREV.width, C_PREV.height )
,	cPrev.translate( marginH, marginV )
,	DrawPreview()
,	cPrev.translate( -marginH, -marginV )
,	DrawMain()
)

const
Change = ( [ P, iP, S, iS, [ moveTo, lc ], iF ] ) => {

	const oldSVG = CopyJSONable( svg )

	switch ( iP ) {
	case -1:
		Toast( 'red', "Can't change here." )
		return
	case 0:
		if ( moveTo && iS === 0 ) {
			Toast( 'red', "Can't change here." )
			return
		} else {
			const
			nextS = lc[ ( iS === 0 ? lc.length : iS ) - 1 ]
			if ( S.length + nextS.length > 3 ) {
				Toast( 'red', "Can't change here." )
				return
			}
			lc.splice( iS, 1 )
			nextS.push( ...S )
		}
		break
	default:
		lc.splice(
			iS, 1
		,	S.slice( 0, iP )
		,	S.slice( iP )
		)
		break
	}
//	SVGJob( oldSVG )
Draw()
}

const
MouseXY			= _ => [ _.offsetX, _.offsetY ]

C_MAIN.onmousedown = md => {

	if ( md.button ) {
//	CONTEXT MENU
/*
		const _ = []
		sels.length
		?	(	SelectedFigures().length && _.push( 'Copy', 'Cut' )
			,	_.push(
					[ 'Delete selected point', 'Delete' ]
				,	[ 'Change Attribute', 'Change' ]
				)
			)
		:	_.push( 'Paste' )
		ipcRenderer.send( 'contextMenu', _ )
*/
		return
	}

	const
	mdXY = MouseXY( md )

	const
	MouseRectWH = _ => [ ...mdXY, ...Sub( MouseXY( _ ), mdXY ) ]

	const
	Hits = () => {
		let $ = []
		PointsForAll(
			_ => {
				const D = Dist2( Project( _[ 0 ] ), mdXY )
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
		On( Hit(), _ => Change( _ ) )
		break
	case SelectB:
		{	let
			hMover
			let
			vMover

			const
			defaultHMover = ( mv, x ) => {
				const biasX = mv.offsetX - md.offsetX
				return mv.shiftKey && Math.abs( biasX ) < Math.abs( mv.offsetY - md.offsetY )
				?	x
				:	x + biasX
			}
			const
			defaultVMover = ( mv, y ) => {
				const biasY = mv.offsetY - md.offsetY
				return mv.shiftKey && Math.abs( biasY ) < Math.abs( mv.offsetX - md.offsetX )
				?	y
				:	y + biasY
			}

			const
			hits = Hits()
			if ( hits.length ) {
				const
				hitPs = hits.map( _ => _[ 0 ] )
				{	const
					selPs = sels.map( _ => _[ 0 ] )
					sels = md.shiftKey
					?	[	...sels.filter( _ => !hitPs.includes( _[ 0 ] ) )
						,	...hits.filter( _ => !selPs.includes( _[ 0 ] ) )
						]
					:	md.altKey ? hits.slice( 0, 1 ) : hits
				}
				
				switch ( md.detail ) {
				case 1:
					break
				case 2:
					{	const
						figures = []
						sels.forEach( $ => figures.every( _ => _[ 0 ] !== $[ 4 ] ) && figures.push( $.slice( 4 ) ) )
						sels = []
						figures.forEach(
							_ => {
								const [ moveTo, lc ] = _[ 0 ]
								moveTo && sels.push( [ moveTo, -1, null, -1, ..._ ] )
								lc.forEach( ( S, iS ) => S.forEach( ( P, iP ) => sels.push( [ P, iP, S, iS, ..._ ] ) ) )
							}
						)
					}
					break
				case 3:
					sels = []
					PointsForAll( _ => sels.push( _ ) )
					break
				default:
					break
				}
				DrawMain()

				//	Selection clicked
				sels.map( _ => _[ 0 ] ).some( _ => hitPs.includes( _ ) ) && (
					hMover = defaultHMover
				,	vMover = defaultVMover
				)
			} else if ( sels.length > 1 ) {
				const [ [ minX, maxX ], [ minY, maxY ] ] = BBox( ...sels.map( _ => _[ 0 ] ) )
				const Index = ( $, _1, _2, size ) => {
					if ( $ < _1 - size ) return null
					if ( $ < _1 ) return -1
					if ( $ <= _2 ) return 0
					if ( $ <= _2 + size ) return 1
					return null
				}
				let hIndex = Index( md.offsetX, ProjectX( minX ), ProjectX( maxX ), gripSize )
				hIndex !== null && minX === maxX && ( hIndex = 0 )

				let vIndex = Index( md.offsetY, ProjectY( minY ), ProjectY( maxY ), gripSize )
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
					*	( maxX + mv.offsetX - md.offsetX - minX )
					/	( maxX - minX )
					break
				case -1:
					hMover = ( mv, x ) => maxX
					+	( x - maxX )
					*	( minX + mv.offsetX - md.offsetX - maxX )
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
					*	( maxY + mv.offsetY - md.offsetY - minY )
					/	( maxY - minY )
					break
				case -1:
					vMover = ( mv, y ) => maxY
					+	( y - maxY )
					*	( minY + mv.offsetY - md.offsetY - maxY )
					/	( minY - maxY )
					break
				}
			}

			if ( hMover && vMover ) {
				const $ = [ ...sels.map( _ => _[ 0 ] ) ]
				const oldXYs = $.map( $ => [ ...$ ] )
				C_MAIN.onmousemove = mv => {
					$.forEach(
						( $, _ ) => [ $[ 0 ], $[ 1 ] ] = [ hMover( mv, oldXYs[ _ ][ 0 ] ), vMover( mv, oldXYs[ _ ][ 1 ] ) ]
					)
					DrawMain()
				}
				C_MAIN.onmouseup = C_MAIN.onmouseleave = mu => {
					C_MAIN.onmousemove = null
					C_MAIN.onmouseup = null
					C_MAIN.onmouseleave = null
					if ( mu.offsetX - md.offsetX || mu.offsetY - md.offsetY ) {
						const newXYs = $.map( $ => [ ...$ ] )
						Job(
							() => $.forEach( ( $, _ ) => [ $[ 0 ], $[ 1 ] ] = [ ...oldXYs[ _ ] ] )
						,	() => $.forEach( ( $, _ ) => [ $[ 0 ], $[ 1 ] ] = [ ...newXYs[ _ ] ] )
						).Redo()
						Draw()
					}
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
					const draft = []
					PointsForAll( _ => BBoxContains( bbox, Project( _[ 0 ] ) ) && draft.push( _ ) )
					sels = XOR( draft, sels )
					DrawMain()
				}
			}
		}
		break
	}
}
/*
{
	const
	FindHit = Es => {			//	Elements

		let	$ = null			//	[ d2, S, pix, joint ]

		Es.forEach(
			E => {
				const _ = FindHit( E[ 1 ] )
				_ && ( $ === null || _[ 0 ] < $[ 0 ] ) && ( $ = _ )

				E[ 3 ].forEach(
					( [ closed, path ] ) => {
						let joint = path[ 0 ][ 0 ]
						;(	closed
						?	[ ...path.slice( 1 ), path[ 0 ] ]
						:	path.slice( 1 )
						).forEach(
							S => {
								[	() => LinePixels( [ joint, S[ 0 ] ] )
								,	() => ConicPixels( [ joint, S[ 1 ], S[ 0 ] ] )
								,	() => BezierPixels( [ joint, S[ 2 ], S[ 1 ], S[ 0 ] ] )
								][ S.length - 1 ]().forEach(
									pix => {
										const d2 = Dist2( mdXY, Project( pix ) )
//d2 <= 32 && console.log( pix, d2 )
										d2 <= 32 && ( $ === null || d2 < $[ 0 ] ) && ( $ = [ d2, S, pix, joint ] )
									}
								)
								joint = S[ 0 ]
							}
						)
					}
				)
			}
		)
		return $
	}

	{
	case DivideB:
		(	() => {

				const
				$ = ClickedPoint()

				if ( $ ) {
					if ( $.index ) {
						alert( 'Please select joint point.' )
						return
					}

					const S					= $.segment
					const F					= S.figure
					const [ closed, path ]	= F
					const n					= S.index + 1 === path.length ? 0 : S.index + 1
					const E					= F.element

					if ( !closed && ( S.index === 0 || S.index + 1 === path.length ) ) {
						alert( "Can't divide end point." )
						return
					}

					const oldSVG = CopySVG()
					closed
					?	(	F[ 0 ] = false
						,	F[ 1 ] = [ [ [ ...$ ] ], ...Slice( path, n, n ) ]
						)
					:	E[ 3 ].splice(
							F.index, 1
						,	[ false, path.slice( 0, n ) ]
						,	[ false, [ [ [ ...$ ] ], ...path.slice( n ) ] ]
						)
					SVGJob( oldSVG )
					return
				}

				const
				hit = FindHit( glyph )

				if ( hit ) {

					const [ d2, S, pix, joint ]	= hit
					const F						= S.figure
					const [ closed, path ]		= F
					const E						= F.element

					const oldSVG = CopySVG()
					if ( closed ) {
						const n = S.index + 1 === path.length ? 0 : S.index + 1
						switch ( S.length ) {
						case 1:
							{	const PixS = () => [ [ ...pix ] ]
								F[ 0 ] = false
								F[ 1 ] = [ PixS(), ...Slice( path, S.index, S.index ), PixS() ]
							}
							break
						case 2:
							{	const _ = DivideConic(
									[ joint, S[ 1 ], S[ 0 ] ]
								,	FindConicT( pix, [ joint, S[ 1 ], S[ 0 ] ] )
								)
								const C = () => [ ..._[ 1 ] ]
								F[ 0 ] = false
								F[ 1 ] = [
									[ C() ]
								,	[ S[ 0 ], _[ 2 ] ]
								,	...Slice( path, n, S.index )
								,	[ C(), _[ 0 ] ]
								]
							}
							break
						case 3:
							{	const _ = DivideBezier(
									[ joint, S[ 2 ], S[ 1 ], S[ 0 ] ]
								,	FindBezierT( pix, [ joint, S[ 2 ], S[ 1 ], S[ 0 ] ] )
								)
								const C = () => [ ..._[ 2 ] ]
								F[ 0 ] = false
								F[ 1 ] = [
									[ C() ]
								,	[ S[ 0 ], _[ 4 ], _[ 3 ] ]
								,	...Slice( path, n, S.index )
								,	[ C(), _[ 1 ], _[ 0 ] ]
								]
							}
							break
						}
					} else {
						switch ( S.length ) {
						case 1:
							{	const PixS = () => [ [ ...pix ] ]
								E[ 3 ].splice(
									F.index, 1
								,	[ false, [ ...path.slice( 0, S.index ), PixS() ] ]
								,	[ false, [ PixS(), ...path.slice( S.index ) ] ]
								)
							}
							break
						case 2:
							{	const _ = DivideConic(
									[ joint, S[ 1 ], S[ 0 ] ]
								,	FindConicT( pix, [ joint, S[ 1 ], S[ 0 ] ] )
								)
								const C = () => [ ..._[ 1 ] ]
								E[ 3 ].splice(
									F.index, 1
								,	[ false, [ ...path.slice( 0, S.index ), [ C(), _[ 0 ] ] ] ]
								,	[ false, [ [ C() ], [ S[ 0 ], _[ 2 ] ], ...path.slice( S.index + 1 ) ] ]
								)
							}
							break
						case 3:
							{	const _ = DivideBezier(
									[ joint, S[ 2 ], S[ 1 ], S[ 0 ] ]
								,	FindBezierT( pix, [ joint, S[ 2 ], S[ 1 ], S[ 0 ] ] )
								)
								const C = () => [ ..._[ 2 ] ]
								E[ 3 ].splice(
									F.index, 1
								,	[ false, [ ...path.slice( 0, S.index ), [ C(), _[ 1 ], _[ 0 ] ] ] ]
								,	[ false, [ [ C() ], [ S[ 0 ], _[ 4 ], _[ 3 ] ], ...path.slice( S.index + 1 ) ] ]
								)
							}
							break
						}
					}
					SVGJob( oldSVG )
					return
				}
			}
		)()
		break
	case PenB:
		{	const hit = FindHit( glyph )

			if ( hit ) {
				
				const [ d2, S, pix, joint ]	= hit
				const [ closed, path ]		= S.figure

				let	inserted

				const oldSVG = CopySVG()
				switch ( S.length ) {
				case 1:
					inserted = pix
					path.splice( S.index, 0, [ inserted ] )
					break
				case 2:
					{	const _ = DivideConic(
							[ joint, S[ 1 ], S[ 0 ] ]
						,	FindConicT( pix, [ joint, S[ 1 ], S[ 0 ] ] )
						)
						inserted = _[ 1 ]
						path.splice(
							S.index
						,	1
						,	[ _[ 1 ], _[ 0 ] ]
						,	[ S[ 0 ], _[ 2 ] ]
						)
					}
					break
				case 3:
					{	const _ = DivideBezier(
							[ joint, S[ 2 ], S[ 1 ], S[ 0 ] ]
						,	FindBezierT( pix, [ joint, S[ 2 ], S[ 1 ], S[ 0 ] ] )
						)
						inserted = _[ 2 ]
						path.splice(
							S.index
						,	1
						,	[ _[ 2 ], _[ 1 ], _[ 0 ] ]
						,	[ S[ 0 ], _[ 4 ], _[ 3 ] ]
						)
					}
					break
				}
				SVGJob( oldSVG, [ inserted ] )
			}
		}
		break
	case EraserB:
		_Delete( ClickedPoints() )
		break
	case RectB:
		C_MAIN.onmousemove = mv => {
			cMain.clearRect( 0, 0, C_MAIN.width, C_MAIN.height )
			cMain.strokeStyle = ToolColor.value
			cMain.strokeRect( ...MouseRectWH( mv ) )
		}
		C_MAIN.onmouseup = C_MAIN.onmouseleave = mu => {
//console.log( 'up/leave', mu )
			cMain.clearRect( 0, 0, C_MAIN.width, C_MAIN.height )
			C_MAIN.onmousemove = null
			C_MAIN.onmouseup = null
			C_MAIN.onmouseleave = null
			if ( mu.offsetX - md.offsetX || mu.offsetY - md.offsetY ) {
				const [ x, y, X, Y ] = [ ...Invert( mdXY ), ...Invert( [ mu.offsetX, mu.offsetY ] ) ]
				NewFigureJob(
					'rect'
				,	[	true
					,	[	[ [ x, y ] ]
						,	[ [ X, y ] ]
						,	[ [ X, Y ] ]
						,	[ [ x, Y ] ]
						]
					]
				)
			}
		}
		break
	case OvalB:
		C_MAIN.onmousemove = mv => {
			cMain.clearRect( 0, 0, C_MAIN.width, C_MAIN.height )
			cMain.strokeStyle = ToolColor.value
			const [ x, y, w, h ] = MouseRectWH( mv )
			cMain.beginPath()
			cMain.ellipse(
				x + w / 2
			,	y + h / 2
			,	Math.abs( w / 2 )
			,	Math.abs( h / 2 )
			,	0, 0, 2 * Math.PI
			)
			cMain.stroke()
		}
		C_MAIN.onmouseup = C_MAIN.onmouseleave = mu => {
//console.log( 'up/leave', mu )
			cMain.clearRect( 0, 0, C_MAIN.width, C_MAIN.height )
			C_MAIN.onmousemove = null
			C_MAIN.onmouseup = null
			C_MAIN.onmouseleave = null
			if ( mu.offsetX - md.offsetX || mu.offsetY - md.offsetY ) {
				const [ x, y, X, Y ] = [ ...Invert( mdXY ), ...Invert( [ mu.offsetX, mu.offsetY ] ) ]
				const midX = ( x + X ) / 2
				const midY = ( y + Y ) / 2
				const halfW_CF = ( X - x ) / 2 * CF
				const halfH_CF = ( Y - y ) / 2 * CF
				NewFigureJob(
					'ellipse'
				,	[	true
					,	[	[ [ midX, y ], [ midX - halfW_CF, y ], [ x, midY - halfH_CF ] ]
						,	[ [ X, midY ], [ X, midY - halfH_CF ], [ midX + halfW_CF, y ] ]
						,	[ [ midX, Y ], [ midX + halfW_CF, Y ], [ X, midY + halfH_CF ] ]
						,	[ [ x, midY ], [ x, midY + halfH_CF ], [ midX - halfW_CF, Y ] ]
						]	
					]
				)
			}
		}
		break
	case LineB:
		C_MAIN.onmousemove = mv => {
			cMain.clearRect( 0, 0, C_MAIN.width, C_MAIN.height )
			cMain.beginPath()
			cMain.moveTo( md.offsetX, md.offsetY )
			cMain.lineTo( mv.offsetX, mv.offsetY )
			cMain.strokeStyle = ToolColor.value
			cMain.stroke()
		}
		C_MAIN.onmouseup = C_MAIN.onmouseleave = mu => {
//console.log( 'up/leave', mu )
			cMain.clearRect( 0, 0, C_MAIN.width, C_MAIN.height )
			C_MAIN.onmousemove = null
			C_MAIN.onmouseup = null
			C_MAIN.onmouseleave = null
			if ( mu.offsetX - md.offsetX || mu.offsetY - md.offsetY ) {
				const [ x, y, X, Y ] = [ ...Invert( mdXY ), ...Invert( [ mu.offsetX, mu.offsetY ] ) ]
				NewFigureJob(
					'line'
				,	[	false
					,	[	[ [ x, y ] ]
						,	[ [ X, Y ] ]
						]
					]
				)
			}
		}
		break
	case CurveB:
		cMain.clearRect( 0, 0, C_MAIN.width, C_MAIN.height )
		const
		curveDrafts = [ [ md.offsetX, md.offsetY ] ]
		C_MAIN.onmousemove = mv => {
			const _ = [ mv.offsetX, mv.offsetY ]
			const L = Last( curveDrafts )
			Near( _, L ) || (
				curveDrafts.push( _ )
			,	cMain.beginPath()
			,	cMain.moveTo( ...L )
			,	cMain.lineTo( ..._ )
			,	cMain.strokeStyle = ToolColor.value
			,	cMain.stroke()
			)
		}
		C_MAIN.onmouseup = C_MAIN.onmouseleave = mu => {
//console.log( 'up/leave', mu )
			const _ = [ mu.offsetX, mu.offsetY ]
			const L = Last( curveDrafts )
			Near( _, L ) && curveDrafts.pop()
			curveDrafts.push( _ )

			cMain.clearRect( 0, 0, C_MAIN.width, C_MAIN.height )
			C_MAIN.onmousemove = null
			C_MAIN.onmouseup = null
			C_MAIN.onmouseleave = null

			const
			Vectorize = points => {
				const angles = new Array( points.length )
				angles[ 0 ] = 0
				const L = angles.length - 1
				angles[ L ] = 0
				{	const inRange = Array.from( { length: points.length - 2 }, ( __, _ ) => _ + 1 )
					inRange.forEach( _ => angles[ _ ] = Angle( Vec( points[ _ - 1 ], points[ _ ] ), Vec( points[ _ ], points[ _ + 1 ] ) ) )
					inRange.filter(
						_ => angles[ _ ] === 0
						||	Dist2( points[ _ ], points[ 0 ] ) <= 32
						||	Dist2( points[ _ ], points[ L ] ) <= 32
					).reverse().forEach( _ => angles.splice( _, 1 ), points.splice( _, 1 ) )
				}


				if ( points.length >= 4 ) {

					const inRange = Array.from( { length: points.length - 4 }, ( __, _ ) => _ + 2 )
					const Sign = _ => _ < 0 ? -1 : 1
					let	found = 0
					for ( let _ = 2; _ < angles.length - 1; _++ ) {
						const signPrev = Sign( angles[ _ - 1 ] )
						const signNext = Sign( angles[ _ ] )
						if ( signPrev === Sign( angles[ _ - 2 ] ) && signNext === Sign( angles[ _ + 1 ] ) && signPrev != signNext ) {
							found = _
							break
						}
					}
					if ( found ) {
						const pointNew = Mid( points[ found - 1 ], points[ found ] )
//cMain.fillStyle = 'red'
//cMain.fillRect( ...Sub( pointNew, [ 2, 2 ] ), 4, 4 )
						return Vectorize( points.slice( 0, found ).concat( [ pointNew ] ) ).concat( Vectorize( [ pointNew ].concat( points.slice( found ) ) ) )
					}

					const posi = angles.reduce( ( $, _ ) => _ > 0 ? $ + _ : $, 0 )
					const nega = angles.reduce( ( $, _ ) => _ < 0 ? $ + _ : $, 0 )
					if ( Math.abs( posi + nega ) >= Math.PI ) {
						const pos = Math.floor( angles.length / 2 )
//console.log( angles.length, PI * 180, ( posi + nega ) / Math.PI * 180 )
						return Vectorize( points.slice( 0, pos ) ).concat( Vectorize( points.slice( pos ) ) )
					}

					const [ p, q ] = FitBezier( points )
					return [ [ Last( points ), q, p ] ]
				}
				return [ [ Last( points ) ] ]
			}

			curveDrafts.length > 3 && NewFigureJob(
				'path'
			,	[	false
				,	[ [ Invert( curveDrafts[ 0 ] ) ] ].concat( Vectorize( curveDrafts ).map( S => S.map( P => Invert( P ) ) ) )
				]
			)
		}
		break
	}
}
*/

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
	C_DEBUG.width = $.width
	C_DEBUG.height = $.height
	cDebug.putImageData( $, X, Y )
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
			$.push( [ [ 200, 100 ], [ 100, 100 ] ] )
			$.push( [ [ 100, 200 ], [ 100, 300 ] ] )
			$.push( [ [ 200, 300 ], [ 300, 300 ] ] )
			$.push( [ [ 300, 200 ], [ 300, 100 ] ] )
		}
		{	const _ = svg[ 1 ].at( -1 )[ 3 ][ 1 ]
			_.push( [ 400, 300 ] )
			const $ = []
			_.push( $ )
			$.push( [ [ 300, 400 ] ] )
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

