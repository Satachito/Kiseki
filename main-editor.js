import {
	AE
}	from './DomUtils.js'

import {
	Report
,	Selected
,	ApplyPath
,	RemovePath
,	Restack
,	MoveSelection
,	Delete
,	SetSelection
,	ToggleSelection
,	SelectAll
,	Copy
,	Paste
,	NewID
,	STORAGE_KEY
}	from './Application.js'

import {
	Redo
,	Undo
}	from './Jobs.js'

import {
	ContainsTLBR
,	Union
,	XYWH_TLBR
,	TLBR_XYXY
,	DeltaXY
}	from './Geo2D.js'

import {
	BBoxD
}	from './PathData.js'

//	hit-test context: identity transform, so isPointInPath works in model space
const
C2D		= document.createElement( 'canvas' ).getContext( '2d' )

const
GRAB	= 8	//	screen px

const
zoomStorageKey	= () => `${ STORAGE_KEY }.zoom`

const
P2DCache	= new Map()
const
P2D			= d => {
	let	$ = P2DCache.get( d )
	$ || (
		P2DCache.size > 1024 && P2DCache.clear()
	,	P2DCache.set( d, $ = new Path2D( d ) )
	)
	return $
}

const
FillOf		= A => A[ 'fill' ] ?? '#000'	//	SVG default fill is black

const
FillRuleOf	= A => A[ 'fill-rule' ] === 'evenodd' ? 'evenodd' : 'nonzero'

const
DashOf		= A => ( A[ 'stroke-dasharray' ] ?? '' ).trim().split( /[\s,]+/ ).map( Number ).filter( Number.isFinite )

const
DrawPath	= ( c2D, [ , D, A ] ) => {
	const
	path = P2D( D )
	c2D.save()
	A[ 'opacity' ]					&& ( c2D.globalAlpha	= Number( A[ 'opacity' ] ) )
	const
	fill = FillOf( A )
	fill !== 'none' && (
		c2D.fillStyle = fill
	,	c2D.fill( path, FillRuleOf( A ) )
	)
	const
	stroke = A[ 'stroke' ]
	stroke && stroke !== 'none' && (
		c2D.strokeStyle		= stroke
	,	c2D.lineWidth		= Number( A[ 'stroke-width'		] ?? 1 )
	,	A[ 'stroke-linecap'		]	&& ( c2D.lineCap		= A[ 'stroke-linecap'	] )
	,	A[ 'stroke-linejoin'	]	&& ( c2D.lineJoin		= A[ 'stroke-linejoin'	] )
	,	A[ 'stroke-miterlimit'	]	&& ( c2D.miterLimit		= Number( A[ 'stroke-miterlimit' ] ) )
	,	A[ 'stroke-dasharray'	]	&& c2D.setLineDash( DashOf( A ) )
	,	A[ 'stroke-dashoffset'	]	&& ( c2D.lineDashOffset	= Number( A[ 'stroke-dashoffset' ] ) )
	,	c2D.stroke( path )
	)
	c2D.restore()
}

const
copyText	= text => navigator.clipboard.writeText( text ).catch( Report )

const
InText		= () => {
	const
	el = document.activeElement
	return el && ( el.matches?.( 'input, textarea, select' ) || el.isContentEditable )
}

const
Mode		= () => document.querySelector( 'input[name=MODE]:checked' )?.value ?? 'select'

const
ShowHoverLabel = ( ev, text ) => {
	UNDER_HOVER.textContent		= text
	UNDER_HOVER.style.display	= 'block'
	UNDER_HOVER.style.left		= `${ ev.clientX + 12 }px`
	UNDER_HOVER.style.top		= `${ Math.max( 8, ev.clientY - 28 ) }px`
}

export default class
MainEditor extends HTMLElement {

	constructor() {
		super()

		this.drawer					= AE( this, 'canvas' )
		this.reformer				= AE( this, 'canvas' )
		this.drawer.style.position	= this.reformer.style.position	= 'absolute'
		//	stop the browser from claiming the drag as a scroll / gesture ( which
		//	would fire pointercancel and abort the move before pointerup commits )
		this.reformer.style.touchAction	= 'none'

		this.zoom			= Number( localStorage.getItem( zoomStorageKey() ) ) || 1
		this.gesture		= null	//	{ pan } | { move } | { band } | { create } — one at a time
		this.pen			= null	//	{ points: [ [ x, y ], … ], hover: [ x, y ] | null }
		this.spaceDown		= false
		this.menuTarget		= null

		PATH_MENU_EDIT.onclick		= ev => {
			ev.stopPropagation()
			const
			_ = this.menuTarget
			this.hideContextMenu()
			_ && ( SetSelection( [ _[ 0 ] ] ), window.SyncPathEditor?.() )
		}
		PATH_MENU_FRONT.onclick		= async ev => (
			ev.stopPropagation()
		,	this.menuTarget && await Restack( this.menuTarget[ 0 ], true ).catch( Report )
		,	this.hideContextMenu()
		)
		PATH_MENU_BACK.onclick		= async ev => (
			ev.stopPropagation()
		,	this.menuTarget && await Restack( this.menuTarget[ 0 ], false ).catch( Report )
		,	this.hideContextMenu()
		)
		PATH_MENU_COPY_D.onclick	= ev => (
			ev.stopPropagation()
		,	this.menuTarget && copyText( this.menuTarget[ 1 ] )
		,	this.hideContextMenu()
		)
		PATH_MENU_DELETE.onclick	= async ev => (
			ev.stopPropagation()
		,	this.menuTarget && await RemovePath( this.menuTarget[ 0 ] ).catch( Report )
		,	this.hideContextMenu()
		)

		//	window-level: catches clicks outside main-editor too
		addEventListener( 'pointerdown', ev => {
			if	( PATH_MENU.style.display === 'none' || PATH_MENU.contains( ev.target ) ) return
			this.hideContextMenu()
		}, true )

		this.reformer.oncontextmenu	= ev => this.onContextMenu( ev )
		this.reformer.onpointerdown	= ev => this.onPointerDown( ev )
		this.reformer.onpointermove	= ev => this.onPointerMove( ev )
		this.reformer.onpointerup	= ev => this.onPointerUp( ev )
		this.reformer.ondblclick	= ev => this.onDblClick( ev )
		this.reformer.onpointerleave= () => ( UNDER_HOVER.style.display = 'none' )

		addEventListener( 'keydown',	ev => this.onKeyDown( ev ) )
		addEventListener( 'keyup',		ev => ev.key === ' ' && ( this.spaceDown = false ) )

		document.addEventListener( 'copy',	ev => InText() || !app.selection.length || ( Copy( ev.clipboardData ), ev.preventDefault() ) )
		document.addEventListener( 'cut',	ev => InText() || !app.selection.length || (
			Copy( ev.clipboardData )
		,	ev.preventDefault()
		,	Delete().catch( Report )
		) )
		document.addEventListener( 'paste',	ev => InText() || (
			ev.preventDefault()
		,	Paste( ev.clipboardData ).catch( Report )
		) )
	}

	clearInteraction() {
		this.gesture	= null
		this.pen		= null
	}

	setZoom( _ ) {
		this.zoom = _
		localStorage.setItem( zoomStorageKey(), String( _ ) )
		this.Draw()
	}

	//	model space ↔ screen
	XY_EV( ev ) {
		const
		[ vX, vY ] = app.model.viewBox
		return [ ev.offsetX / this.zoom + vX, ev.offsetY / this.zoom + vY ]
	}

	SetTransform( c2D ) {
		const
		[ vX, vY ] = app.model.viewBox
		c2D.setTransform( this.zoom, 0, 0, this.zoom, -vX * this.zoom, -vY * this.zoom )
	}

	SyncCanvasSize() {
		const
		[ , , W, H ] = app.model.viewBox
		const
		w = Math.max( 1, Math.round( W * this.zoom ) )
	,	h = Math.max( 1, Math.round( H * this.zoom ) )
		this.drawer.width  === w || ( this.drawer.width  = this.reformer.width  = w )
		this.drawer.height === h || ( this.drawer.height = this.reformer.height = h )
	}

	Draw() {
		window.EMPTY_HINT && ( window.EMPTY_HINT.style.display = app.model.paths.length ? 'none' : '' )
		window.PATH_LIST?.Sync?.()
		try {
			this.SyncCanvasSize()
			this.DrawModel()
			this.DrawOverlay()
		} catch ( er ) {
			Report( er )
		}
		return Promise.resolve()
	}

	DrawModel() {
		const
		c2D = this.drawer.getContext( '2d' )
		c2D.setTransform( 1, 0, 0, 1, 0, 0 )
		c2D.clearRect( 0, 0, this.drawer.width, this.drawer.height )
		this.SetTransform( c2D )

		for ( const _ of app.model.paths ) {
			try {
				DrawPath( c2D, _ )
			} catch ( er ) {
				console.error( 'DrawModel failed:', _[ 0 ], er )
			}
		}
	}

	DrawOverlay() {
		const
		c2D = this.reformer.getContext( '2d' )
		c2D.setTransform( 1, 0, 0, 1, 0, 0 )
		c2D.clearRect( 0, 0, this.reformer.width, this.reformer.height )
		this.SetTransform( c2D )

		const
		z = this.zoom
	,	move = this.gesture?.move

		const
		selected = Selected()
		if	( selected.length ) {
			c2D.save()
			const
			[ dX, dY ] = move ? DeltaXY( move.from, move.to ) : [ 0, 0 ]
			c2D.translate( dX, dY )

			//	moving: ghost the selection at the destination
			move && ( c2D.globalAlpha = .5, selected.forEach( _ => DrawPath( c2D, _ ) ), c2D.globalAlpha = 1 )

			const
			boxes = selected.map( _ => BBoxD( _[ 1 ] ) )
			c2D.strokeStyle	= '#00ffff'
			c2D.lineWidth	= 2 / z
			for ( const _ of boxes ) c2D.strokeRect( ...XYWH_TLBR( _ ) )
			c2D.strokeStyle	= '#ff0000'
			c2D.lineWidth	= 1.5 / z
			c2D.strokeRect( ...XYWH_TLBR( Union( boxes ) ) )
			c2D.restore()
		}

		const
		band = this.gesture?.band ?? null
		band && (
			c2D.save()
		,	c2D.strokeStyle	= '#00aaff'
		,	c2D.lineWidth	= 1 / z
		,	c2D.setLineDash( [ 4 / z, 4 / z ] )
		,	c2D.strokeRect( ...XYWH_TLBR( TLBR_XYXY( [ band.from, band.to ] ) ) )
		,	c2D.restore()
		)

		const
		create = this.gesture?.create ?? null
		create && (
			c2D.save()
		,	c2D.strokeStyle	= '#00aaff'
		,	c2D.lineWidth	= 1.5 / z
		,	c2D.stroke( new Path2D( this.CreateD( create ) ) )
		,	c2D.restore()
		)

		this.pen?.points.length && (
			c2D.save()
		,	c2D.strokeStyle	= '#00aaff'
		,	c2D.lineWidth	= 1.5 / z
		,	c2D.stroke( new Path2D(
				this.pen.points.map( ( [ x, y ], i ) => `${ i ? 'L' : 'M' }${ x } ${ y }` ).join( '' )
			+	( this.pen.hover ? `L${ this.pen.hover[ 0 ] } ${ this.pen.hover[ 1 ] }` : '' )
			) )
		,	c2D.fillStyle	= '#00aaff'
		,	this.pen.points.forEach( ( [ x, y ] ) => c2D.fillRect( x - 3 / z, y - 3 / z, 6 / z, 6 / z ) )
		,	c2D.restore()
		)
	}

	//	topmost hit first ( draw order = z-order )
	HitPath( [ x, y ] ) {
		for ( const _ of [ ...app.model.paths ].reverse() ) {
			const
			[ , D, A ] = _
			let	path
			try {
				path = P2D( D )
			} catch {
				continue
			}
			if	( FillOf( A ) !== 'none' && C2D.isPointInPath( path, x, y, FillRuleOf( A ) ) ) return _
			const
			stroke = A[ 'stroke' ]
			if	( stroke && stroke !== 'none' ) {
				C2D.save()
				C2D.lineWidth = Math.max( Number( A[ 'stroke-width' ] ?? 1 ), GRAB / this.zoom )
				const
				hit = C2D.isPointInStroke( path, x, y )
				C2D.restore()
				if	( hit ) return _
			}
		}
		return null
	}

	//	d of the shape being dragged out in rect / ellipse / line mode
	CreateD( { mode, from, to } ) {
		const
		[ T, L, B, R ] = TLBR_XYXY( [ from, to ] )
		switch ( mode ) {
		case 'rect':
			return `M${ L } ${ T }L${ R } ${ T }L${ R } ${ B }L${ L } ${ B }Z`
		case 'ellipse': {
			const
			cX = ( L + R ) / 2, cY = ( T + B ) / 2, rX = ( R - L ) / 2, rY = ( B - T ) / 2
			return `M${ L } ${ cY }A${ rX } ${ rY } 0 1 0 ${ R } ${ cY }A${ rX } ${ rY } 0 1 0 ${ L } ${ cY }Z`
		}
		case 'line':
			return `M${ from[ 0 ] } ${ from[ 1 ] }L${ to[ 0 ] } ${ to[ 1 ] }`
		}
		return ''
	}

	//	attributes for a new path, from the paint editor — default to a visible
	//	stroke when everything is left empty
	CreateAttrs( mode ) {
		const
		[ , A ] = PATH_EDITOR.$
		void mode
		A[ 'fill' ] || A[ 'stroke' ] || (
			A[ 'fill' ]		= 'none'
		,	A[ 'stroke' ]	= currentColor()
		)
		return A
	}

	async CommitPen( close ) {
		const
		pen = this.pen
		this.pen = null
		if	( !pen || pen.points.length < 2 ) return this.Draw()
		const
		d = pen.points.map( ( [ x, y ], i ) => `${ i ? 'L' : 'M' }${ x } ${ y }` ).join( '' ) + ( close ? 'Z' : '' )
		await ApplyPath( [ NewID(), d, this.CreateAttrs( 'pen' ) ] ).catch( Report )
		window.SyncPathEditor?.()
	}

	onPointerDown( ev ) {
		if	( ev.button === 1 || this.spaceDown ) {	//	middle button / space: pan
			this.gesture = { pan: {
				x: ev.clientX, y: ev.clientY
			,	left: this.scrollLeft, top: this.scrollTop
			} }
			this.reformer.setPointerCapture( ev.pointerId )
			return
		}
		if	( ev.button !== 0 ) return

		const
		xy		= this.XY_EV( ev )
	,	mode	= Mode()

		if	( mode === 'pen' ) {
			this.pen || ( this.pen = { points: [], hover: null } )
			const
			[ x0, y0 ] = this.pen.points[ 0 ] ?? []
			//	clicking back on the first point closes the contour
			if	( this.pen.points.length > 1 && Math.hypot( xy[ 0 ] - x0, xy[ 1 ] - y0 ) < GRAB / this.zoom )
				return this.CommitPen( true )
			this.pen.points.push( xy )
			return this.Draw()
		}

		if	( mode !== 'select' ) {
			this.gesture = { create: { mode, from: xy, to: xy } }
			this.reformer.setPointerCapture( ev.pointerId )
			return
		}

		const
		hit = this.HitPath( xy )
		if	( hit ) {
			ev.shiftKey
			?	ToggleSelection( hit[ 0 ] )
			:	app.selection.includes( hit[ 0 ] ) || SetSelection( [ hit[ 0 ] ] )
			window.SyncPathEditor?.()
			app.selection.includes( hit[ 0 ] ) && (
				this.gesture = { move: { from: xy, to: xy } }
			,	this.reformer.setPointerCapture( ev.pointerId )
			)
			return
		}
		this.gesture = { band: { from: xy, to: xy, shift: ev.shiftKey } }
		this.reformer.setPointerCapture( ev.pointerId )
	}

	onPointerMove( ev ) {
		const
		g = this.gesture

		if	( g?.pan ) {
			this.scrollLeft	= g.pan.left - ( ev.clientX - g.pan.x )
			this.scrollTop	= g.pan.top  - ( ev.clientY - g.pan.y )
			return
		}

		const
		xy = this.XY_EV( ev )

		if	( g?.move		) return ( g.move.to	= xy, this.DrawOverlay() )
		if	( g?.band		) return ( g.band.to	= xy, this.DrawOverlay() )
		if	( g?.create		) return ( g.create.to	= xy, this.DrawOverlay() )
		if	( this.pen		) return ( this.pen.hover = xy, this.DrawOverlay() )

		//	idle hover: cursor + id label
		const
		mode = Mode()
		if	( mode !== 'select' ) {
			this.reformer.style.cursor = 'crosshair'
			UNDER_HOVER.style.display = 'none'
			return
		}
		const
		hit = this.HitPath( xy )
		this.reformer.style.cursor = hit
		?	( app.selection.includes( hit[ 0 ] ) ? 'move' : 'pointer' )
		:	'default'
		hit
		?	ShowHoverLabel( ev, hit[ 0 ] )
		:	( UNDER_HOVER.style.display = 'none' )
	}

	async onPointerUp( ev ) {
		const
		g = this.gesture
		this.gesture = null
		if	( !g || g.pan ) return

		const
		xy = this.XY_EV( ev )

		if	( g.move ) {
			const
			[ dX, dY ] = DeltaXY( g.move.from, xy )
			dX || dY
			?	await MoveSelection( dX, dY ).catch( Report )
			:	this.DrawOverlay()
			return
		}

		if	( g.band ) {
			const
			tlbr = TLBR_XYXY( [ g.band.from, xy ] )
			const
			IDs = app.model.paths
			.	filter( _ => ContainsTLBR( tlbr, BBoxD( _[ 1 ] ) ) )
			.	map( _ => _[ 0 ] )
			SetSelection( g.band.shift ? [ ...new Set( [ ...app.selection, ...IDs ] ) ] : IDs )
			window.SyncPathEditor?.()
			return
		}

		if	( g.create ) {
			g.create.to = xy
			const
			[ T, L, B, R ] = TLBR_XYXY( [ g.create.from, xy ] )
			if	( g.create.mode !== 'line' && ( B - T < 2 || R - L < 2 ) ) return this.DrawOverlay()
			if	( g.create.mode === 'line' && Math.hypot( R - L, B - T ) < 2 ) return this.DrawOverlay()
			await ApplyPath( [ NewID(), this.CreateD( g.create ), this.CreateAttrs( g.create.mode ) ] ).catch( Report )
			window.SyncPathEditor?.()
		}
	}

	onDblClick( ev ) {
		if	( Mode() === 'pen' ) return this.CommitPen( false )
		const
		hit = this.HitPath( this.XY_EV( ev ) )
		hit && ( SetSelection( [ hit[ 0 ] ] ), window.SyncPathEditor?.() )
	}

	onContextMenu( ev ) {
		ev.preventDefault()
		const
		hit = this.HitPath( this.XY_EV( ev ) )
		if	( !hit ) return this.hideContextMenu()
		this.menuTarget = hit
		PATH_MENU.style.display	= 'block'
		PATH_MENU.style.left	= `${ Math.min( ev.clientX, innerWidth - PATH_MENU.offsetWidth - 8 ) }px`
		PATH_MENU.style.top		= `${ Math.min( ev.clientY, innerHeight - PATH_MENU.offsetHeight - 8 ) }px`
	}

	hideContextMenu() {
		PATH_MENU.style.display	= 'none'
		this.menuTarget = null
	}

	onKeyDown( ev ) {
		if	( ev.key === ' ' && !InText() ) this.spaceDown = true

		if	( ( ev.metaKey || ev.ctrlKey ) && ev.key.toLowerCase() === 'z' )
			return ( ev.preventDefault(), ( ev.shiftKey ? Redo() : Undo() ).catch( Report ) )

		if	( InText() ) return

		switch ( ev.key ) {
		case 'a':
			if	( ev.metaKey || ev.ctrlKey ) ( ev.preventDefault(), SelectAll() )
			break
		case 'Backspace':
		case 'Delete':
			ev.preventDefault()
			this.pen
			?	( this.pen.points.pop(), this.pen.points.length || ( this.pen = null ), this.Draw() )
			:	app.selection.length && Delete().catch( Report )
			break
		case 'Enter':
			this.pen && this.CommitPen( false )
			break
		case 'Escape':
			this.pen
			?	( this.pen = null, this.Draw() )
			:	SetSelection( [] )
			break
		case 'ArrowLeft':
		case 'ArrowRight':
		case 'ArrowUp':
		case 'ArrowDown': {
			if	( !Selected().length ) break
			ev.preventDefault()
			const
			step = ev.shiftKey ? 10 : 1
			MoveSelection(
				( ev.key === 'ArrowLeft' ? -step : ev.key === 'ArrowRight' ? step : 0 )
			,	( ev.key === 'ArrowUp'	 ? -step : ev.key === 'ArrowDown'  ? step : 0 )
			).catch( Report )
			break
		}
		}
	}
}

const
currentColor	= () => matchMedia( '(prefers-color-scheme: dark)' ).matches ? '#fff' : '#000'

customElements.define( 'main-editor', MainEditor )
