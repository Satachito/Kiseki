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

const
Dist2 = ( p, q ) => {
	const _ = Sub( p, q )
	return Dot( _, _ )
}

////////

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

let
mode		= SelectB

let
glyph		= []

let
selection	= []

const
PointsForAll = ( $, _ = glyph ) => _.forEach( C => C.forEach( S => S.forEach( P => $( P ) ) ) )

const
MouseXY = _ => [ _.offsetX, _.offsetY ]

let
marginX = 100
let
marginY = 100

MarginX.value = marginX
MarginY.value = marginY

const
Invert		= ( [ x, y ] ) => [ x - marginX, y - marginY ]

const
ProjectX	= _ => _ + marginX
const
ProjectY	= _ => _ + marginY
const
Project		= ( [ x, y ] ) => [ ProjectX( x ), ProjectY( y ) ]

const
cMain	= C_MAIN.getContext( '2d' )

const
Draw = ( _ = glyph ) => {
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

	cMain.clearRect( 0, 0, C_MAIN.width, C_MAIN.height )
	cMain.putImageData( $, X + marginX - 3, Y + marginY - 3 )
}

const
controlSize	= 4

const
nearSize2	= controlSize * controlSize * 2

const
gripSize	= controlSize * 2

C_MAIN.onmousedown = md => {

	const mdXY = MouseXY( md )

	const
	MouseRectWH = _ => [ ...mdXY, ...Sub( MouseXY( _ ), mdXY ) ]

	const
	ClickedPoint = () => {
		let $
		PointsForAll(
			P => {
				const d2 = Dist2( Project( P ), mdXY )
				d2 < nearSize2 && ( $ === null || d2 < $[ 0 ] ) && ( $ = [ d2, P ] )
			}
		)
		return $ ? $[ 1 ] : $
	}

	const
	ClickedPoints = () => {
		let $ = []
		PointsForAll( P => Dist2( Project( P ), mdXY ) < nearSize2 && $.push( P ) )
		return $
	}

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
		N( ClickedPoint(), _ => Change( _ ) )
		break
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
	case SelectB:
		{
			let hMover
			let vMover

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
			$ = ClickedPoints()
			if ( $.length ) {
				switch ( md.detail ) {
				case 1:
					selection = md.shiftKey
					?	XOR( selection, $ )
					:	md.altKey ? $.slice( 0, 1 ) : $
					break
				case 2:
					selection = md.shiftKey
					?	XOR( selection, $ )
					:	md.altKey ? $.slice( 0, 1 ) : $

					selection = [
						...selection.reduce(
							( $, P ) => $.add( P.segment.figure )
						,	new Set()
						)
					].map( F => F[ 1 ] ).flat().flat()
					break
				default:
					selection = Points()
					break
				}
				Draw()

				//	Selection clicked
				$.some( $ => selection.includes( $ ) ) && (
					hMover = defaultHMover
				,	vMover = defaultVMover
				)
			} else if ( selection.length > 1 ) {
				const [ minX, minY, maxX, maxY ] = BBox( selection )
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

			if ( md.button ) {
				const _ = []
console.log( SelectedFigures() )
				selection.length
				?	(	SelectedFigures().length && _.push( 'Copy', 'Cut' )
					,	_.push(
							[ 'Delete selected point', 'Delete' ]
						,	[ 'Change Attribute', 'Change' ]
						)
					)
				:	_.push( 'Paste' )
				ipcRenderer.send( 'contextMenu', _ )
			} else {
				if ( hMover && vMover ) {
					const $ = [ ...selection ]
					const oldXYs = $.map( $ => [ ...$ ] )
					C_MAIN.onmousemove = mv => {
						$.forEach(
							( $, _ ) => [ $[ 0 ], $[ 1 ] ] = [ hMover( mv, oldXYs[ _ ][ 0 ] ), vMover( mv, oldXYs[ _ ][ 1 ] ) ]
						)
						Draw()
					}
					C_MAIN.onmouseup = C_MAIN.onmouseleave = mu => {
	//console.log( 'up/leave', mu )
						C_MAIN.onmousemove = null
						C_MAIN.onmouseup = null
						C_MAIN.onmouseleave = null
						if ( mu.offsetX - md.offsetX || mu.offsetY - md.offsetY ) {
							const newXYs = $.map( $ => [ ...$ ] )
							Job(
								() => $.forEach( ( $, _ ) => [ $[ 0 ], $[ 1 ] ] = [ ...oldXYs[ _ ] ] )
							,	() => $.forEach( ( $, _ ) => [ $[ 0 ], $[ 1 ] ] = [ ...newXYs[ _ ] ] )
							)
						}
					}
				} else {
					md.shiftKey || (
						selection = []
					,	Draw()
					)
					C_MAIN.onmousemove = mv => {
						cMain.clearRect( 0, 0, C_MAIN.width, C_MAIN.height )
						cMain.strokeStyle = ToolColor.value
						cMain.setLineDash( [ 3 ] )
						cMain.strokeRect( ...MouseRectWH( mv ) )
						cMain.setLineDash( [] )
					}
					C_MAIN.onmouseup = C_MAIN.onmouseleave = mu => {
	//console.log( 'up/leave', mu )
						cMain.clearRect( 0, 0, C_MAIN.width, C_MAIN.height )
						C_MAIN.onmousemove = null
						C_MAIN.onmouseup = null
						C_MAIN.onmouseleave = null
						const [ minX, maxX ] = md.offsetX < mu.offsetX ? [ md.offsetX, mu.offsetX ] : [ mu.offsetX, md.offsetX ]
						const [ minY, maxY ] = md.offsetY < mu.offsetY ? [ md.offsetY, mu.offsetY ] : [ mu.offsetY, md.offsetY ]
						const draft = []
						PointsForAll(
							P => {
								const [ x, y ] = Project( P )
								minX < x && x < maxX && minY < y && y < maxY && draft.push( P )
							}
						)
						selection = XOR( draft, selection )
						Draw()
					}
				}
			}
		}
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


Array.from( document.body.getElementsByTagName( 'jp-color-picker' ) ).forEach(
	_ => _.list.addEventListener( 'change', ev => console.log( _, _.value ) )
)

const
cPreview	= C_PREVIEW	.getContext( '2d' )

const
Preview		= _ => {
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
		break
	case 6:
		MoveTo( [ 200, 100 ] )
		QuadTo( [ 300, 100 ], [ 300, 200 ] )
		QuadTo( [ 300, 300 ], [ 200, 300 ] )
		QuadTo( [ 100, 300 ], [ 100, 200 ] )
		QuadTo( [ 100, 100 ], [ 200, 100 ] )
		ClosePath()
//		Preview( glyph )
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
		break
	}
	Draw()
}

switch ( navigator.languages[ 0 ] ) {
case 'ja'	:
default		:
	NavB						.setAttribute( 'title', '左ドロワ' )
	SelectB						.setAttribute( 'title', '選択モード' )
	RectB						.setAttribute( 'title', '四角の描画モード' )
	OvalB						.setAttribute( 'title', '円、楕円の描画モード' )
	LineB						.setAttribute( 'title', '線の描画モード' )
	CurveB						.setAttribute( 'title', '曲線の描画モード' )
	EraserB						.setAttribute( 'title', '点の消去モード' )
	PenB						.setAttribute( 'title', '点の追加モード' )
	DivideB						.setAttribute( 'title', '線の切断モード' )
	ChangeB						.setAttribute( 'title', '点の属性変更モード' )
	HandB						.setAttribute( 'title', '画面移動モード' )
	AlignLB						.setAttribute( 'title', '左揃え' )
	AlignTB						.setAttribute( 'title', '上揃え' )
	AlignRB						.setAttribute( 'title', '右揃え' )
	AlignBB						.setAttribute( 'title', '下揃え' )
	UniteB						.setAttribute( 'title', '接続' )
	GatherB						.setAttribute( 'title', '合成' )
	AsideB						.setAttribute( 'title', '右ドロワ' )
	DisplayParametersT			.setAttribute( 'title', '表示パラメータ' )
	SkipFillC.parentNode		.setAttribute( 'title', '塗りをスキップ' )
	ForceStrokeC.parentNode		.setAttribute( 'title', '線を強制描画' )
	ForceStrokeColor			.setAttribute( 'title', '線を強制描画の色' )
	ControlC.parentNode			.setAttribute( 'title', 'コントロールポイントの描画' )
	ControlColor				.setAttribute( 'title', 'コントロールポイントの描画の色' )
	SelectionColor.parentNode	.setAttribute( 'title', '選択点の色' )
	ToolColor.parentNode		.setAttribute( 'title', 'ツールの色' )
	ViewportT					.setAttribute( 'title', 'ビューポート' )
	MarginX.parentNode			.setAttribute( 'title', '左マージン' )
	MarginY.parentNode			.setAttribute( 'title', '上マージン' )
	CanvasSizeT					.setAttribute( 'title', 'キャンバスサイズ' )
	Width.parentNode			.setAttribute( 'title', 'キャンバス幅' )
	Height.parentNode			.setAttribute( 'title', 'キャンバス高さ' )

	TempFillC.parentNode		.setAttribute( 'title', '塗り' )
	TempFillStyle				.setAttribute( 'title', '塗りの色' )

	TempFillRuleC.parentNode	.setAttribute( 'title', '塗りルール' )
	TempFillRuleValue			.setAttribute( 'title', '塗りルールの値' )
	
	TempStrokeC.parentNode		.setAttribute( 'title', '線' )
	TempStrokeStyle				.setAttribute( 'title', '線の色' )

	TempOpacityC.parentNode		.setAttribute( 'title', '非透明' )
	TempOpacityValue			.setAttribute( 'title', '非透明の値' )

	TempStrokeWidthC.parentNode	.setAttribute( 'title', '線の幅' )
	TempStrokeWidthValue		.setAttribute( 'title', '線の幅の値' )

	TempLineCapC.parentNode		.setAttribute( 'title', '線の端の処理' )
	TempLineCapValue			.setAttribute( 'title', '線の端の処理の値' )

	TempLineJoinC.parentNode	.setAttribute( 'title', '線の接続部の処理' )
	TempLineJoinValue			.setAttribute( 'title', '線の接続部の処理の値' )

	TempMiterLimitC.parentNode	.setAttribute( 'title', '線の接続部の長さ' )
	TempMiterLimitValue			.setAttribute( 'title', '線の接続部の長さの値' )

	TempDashOffsetC.parentNode	.setAttribute( 'title', 'ダッシュの始まり' )
	TempDashOffsetValue			.setAttribute( 'title', 'ダッシュの始まりの値' )
	TempDashArrayC.parentNode	.setAttribute( 'title', 'ダッシュ' )
	TempDashArrayValue			.setAttribute( 'title', 'ダッシュの値' )

	PropFillC.parentNode		.setAttribute( 'title', '塗り' )
	PropFillStyle				.setAttribute( 'title', '塗りの色' )

	PropFillRuleC.parentNode	.setAttribute( 'title', '塗りルール' )
	PropFillRuleValue			.setAttribute( 'title', '塗りルールの値' )
	
	PropStrokeC.parentNode		.setAttribute( 'title', '線' )
	PropStrokeStyle				.setAttribute( 'title', '線の色' )

	PropOpacityC.parentNode		.setAttribute( 'title', '非透明' )
	PropOpacityValue			.setAttribute( 'title', '非透明の値' )

	PropStrokeWidthC.parentNode	.setAttribute( 'title', '線の幅' )
	PropStrokeWidthValue		.setAttribute( 'title', '線の幅の値' )

	PropLineCapC.parentNode		.setAttribute( 'title', '線の端の処理' )
	PropLineCapValue			.setAttribute( 'title', '線の端の処理の値' )

	PropLineJoinC.parentNode	.setAttribute( 'title', '線の接続部の処理' )
	PropLineJoinValue			.setAttribute( 'title', '線の接続部の処理の値' )

	PropMiterLimitC.parentNode	.setAttribute( 'title', '線の接続部の長さ' )
	PropMiterLimitValue			.setAttribute( 'title', '線の接続部の長さの値' )

	PropDashOffsetC.parentNode	.setAttribute( 'title', 'ダッシュの始まり' )
	PropDashOffsetValue			.setAttribute( 'title', 'ダッシュの始まりの値' )
	PropDashArrayC.parentNode	.setAttribute( 'title', 'ダッシュ' )
	PropDashArrayValue			.setAttribute( 'title', 'ダッシュの値' )

	break
}

