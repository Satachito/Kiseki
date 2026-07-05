export	const
Report = _ => ( console.error( _ ), alert( _ ) )

window.app		= {
	model	: {
		viewBox	: [ 0, 0, 1024, 1024 ]
	,	paths	: []	//	[ ID, D, A ]	(D): path data, (A): SVG presentation attributes
	}
,	selection	: []	//	IDs, not persisted into .ve
}

export	const
STORAGE_KEY	= 'tokyo.828.ve'

import {
	ParseVE
,	ImportSVG
,	VEString
}	from './VE.js'

import {
	ParseD
,	DString
,	TranslateD
,	TransformSegs
,	ReverseSegs
,	SubpathsSegs
,	Translation
,	MulM
,	BBoxD
}	from './PathData.js'

import { Union } from './Geo2D.js'

export	const
VEText		= () => VEString( app.model )

export	const
FindPath	= ID => app.model.paths.find( _ => _[ 0 ] === ID )

export	const
Selected	= () => app.selection.map( FindPath ).filter( _ => _ )

import Do from './Jobs.js'

const
RestoreApp	= _ => async () => (
	app = structuredClone( _ )
,	app.selection = app.selection.filter( ID => FindPath( ID ) )
,	MAIN_EDITOR.clearInteraction()
,	await MAIN_EDITOR.Draw()
,	localStorage.setItem( STORAGE_KEY, VEText() )
)

const
DoTypical	= async ( label, mutate ) => {
	const
	before = structuredClone( app )
	try {
		await mutate()
	} catch ( er ) {
		await RestoreApp( before )()
		throw er
	}
	const
	after = structuredClone( app )
	await Do( label, RestoreApp( after ), RestoreApp( before ) )
}

const
TakenIDs	= () => new Set( app.model.paths.map( _ => _[ 0 ] ) )

const
NextID		= taken => {
	let	n = 1
	while	( taken.has( `p${ n }` ) ) ++n
	const
	$ = `p${ n }`
	taken.add( $ )
	return $
}

export	const
NewID		= () => NextID( TakenIDs() )

//	update when ID exists, create otherwise — the Apply/Create Path button
export	const
ApplyPath	= ( [ ID, D, A ] ) => (
	ParseD( D )	//	reject malformed d before it enters the model
,	DoTypical(
		'ApplyPath'
	,	() => {
			const
			path = FindPath( ID )
			path
			?	( path[ 1 ] = D, path[ 2 ] = A )
			:	app.model.paths.push( [ ID, D, A ] )
			app.selection = [ ID ]
		}
	)
)

//	rename and restyle an existing path in a single history step
export	const
EditPath	= ( oldID, [ ID, D, A ] ) => (
	ParseD( D )
,	DoTypical(
		'EditPath'
	,	() => {
			const
			path = FindPath( oldID )
			if	( !path ) return
			path[ 0 ] = ID
			path[ 1 ] = D
			path[ 2 ] = A
			app.selection = [ ID ]
		}
	)
)

export	const
RemovePath	= ID => DoTypical(
	'RemovePath'
,	() => {
		app.model.paths = app.model.paths.filter( _ => _[ 0 ] !== ID )
		app.selection = app.selection.filter( _ => _ !== ID )
	}
)

//	move a path to the front ( drawn last → on top ) or back of the z-order
export	const
Restack	= ( ID, toFront ) => DoTypical(
	toFront ? 'BringToFront' : 'BringToBack'
,	() => {
		const
		path = FindPath( ID )
		if	( !path ) return
		app.model.paths = app.model.paths.filter( _ => _ !== path )
		toFront ? app.model.paths.push( path ) : app.model.paths.unshift( path )
	}
)

export	const
MoveSelection	= ( dX, dY ) => DoTypical(
	'Move'
,	() => Selected().forEach( _ => _[ 1 ] = TranslateD( _[ 1 ], dX, dY ) )
)

export	const
Delete		= () => DoTypical(
	'Delete'
,	() => (
		app.model.paths = app.model.paths.filter( _ => !app.selection.includes( _[ 0 ] ) )
	,	app.selection = []
	)
)

//	selection is view state: no history step, just redraw
export	const
SetSelection	= IDs => (
	app.selection = IDs.filter( ID => FindPath( ID ) )
,	MAIN_EDITOR.Draw()
)

export	const
ToggleSelection	= ID => SetSelection(
	app.selection.includes( ID )
	?	app.selection.filter( _ => _ !== ID )
	:	[ ...app.selection, ID ]
)

export	const
SelectAll	= () => SetSelection( app.model.paths.map( _ => _[ 0 ] ) )

const
MIME	= 'application/x-ve-828-tokyo'

export	const
Copy		= _ => {	//	ClipboardData
	const
	paths = Selected()
	if	( !paths.length ) return
	_.setData( MIME, JSON.stringify( paths ) )
	//	interop: the selection is itself a valid path-only SVG
	_.setData( 'text/plain', VEString( { viewBox: app.model.viewBox, paths } ) )
}

//	keep original IDs when free; on conflict use orig + "-copy" ( then "-copy2", … )
const
IDFor	= ( taken, orig ) => {
	if	( orig && !taken.has( orig ) ) {
		taken.add( orig )
		return orig
	}
	if	( !orig ) return NextID( taken )
	let
	id = `${ orig }-copy`
,	n = 2
	while	( taken.has( id ) ) id = `${ orig }-copy${ n++ }`
	taken.add( id )
	return id
}

export	const
Paste		= async _ => {	//	ClipboardData

	const
	paths = []

	{	const
		json = _.getData( MIME )
		if	( json ) try {
			//	nudge the copies so they do not sit exactly on the originals
			paths.push( ...JSON.parse( json ).map(
				( [ ID, D, A ] ) => [ ID, TranslateD( D, 16, 16 ), A ]
			) )
		} catch ( er ) {
			console.error( er )
		}
	}

	if	( !paths.length ) {
		//	pasted SVG markup, flattened to paths: a whole document ( this app,
		//	Figma, … ) or a bare element fragment ( EzuSVG's ⌘C, hand-written )
		const
		raw = ( _.getData( 'image/svg+xml' ) || _.getData( 'text/plain' ) || '' ).trim()
		const
		text = /<svg[\s>]/.test( raw )
		?	raw
		:	/^<[a-zA-Z]/.test( raw )
			?	`<svg xmlns="http://www.w3.org/2000/svg">${ raw }</svg>`
			:	null
		if	( text ) try {
			paths.push( ...ImportSVG( text ).paths )
		} catch ( er ) {
			console.error( er )
		}
	}

	if	( !paths.length ) return

	const
	taken = TakenIDs()
,	$ = paths.map( ( [ ID, D, A ] ) => [ IDFor( taken, ID ), D, A ] )

	await DoTypical(
		'Paste'
	,	() => (
			app.model.paths.push( ...$ )
		,	app.selection = $.map( _ => _[ 0 ] )
		)
	)
}

export	const
SetViewBox	= viewBox => DoTypical(
	'SetViewBox'
,	() => {
		if	( !(
			Array.isArray( viewBox )
		&&	viewBox.length === 4
		&&	viewBox.every( Number.isFinite )
		&&	viewBox[ 2 ] > 0
		&&	viewBox[ 3 ] > 0
		) ) throw new Error( `Invalid viewBox: ${ viewBox }` )
		app.model.viewBox = [ ...viewBox ]
	}
)

//	replace the whole model in one history step
export	const
SetModel	= model => DoTypical(
	'SetModel'
,	() => {
		app.model		= { viewBox: model.viewBox ?? [ 0, 0, 1024, 1024 ], paths: model.paths ?? [] }
		app.selection	= []
	}
)

//	—— manual-editing operations ( the old Edit toolbox, selection-based ) ——

//	bake an affine matrix into every selected path
export	const
TransformSelection	= ( m, label = 'Transform' ) => DoTypical(
	label
,	() => Selected().forEach( _ => _[ 1 ] = DString( TransformSegs( ParseD( _[ 1 ] ), m ) ) )
)

//	mirror / rotate / scale act about the selection's bounding-box centre
const
AboutCenter	= ( linear, label ) => {
	const
	paths = Selected()
	if	( !paths.length ) return Promise.resolve()
	const
	[ T, L, B, R ] = Union( paths.map( _ => BBoxD( _[ 1 ] ) ) )
	const
	cX = ( L + R ) / 2
,	cY = ( T + B ) / 2
	return TransformSelection(
		MulM( MulM( Translation( cX, cY ), linear ), Translation( -cX, -cY ) )
	,	label
	)
}

export	const
MirrorSelection	= horizontal => AboutCenter(
	horizontal
	?	{ a: -1, b: 0, c: 0, d: 1, e: 0, f: 0 }
	:	{ a: 1, b: 0, c: 0, d: -1, e: 0, f: 0 }
,	'Mirror'
)

export	const
RotateSelection	= deg => {
	const
	r = deg * Math.PI / 180
	return AboutCenter(
		{ a: Math.cos( r ), b: Math.sin( r ), c: -Math.sin( r ), d: Math.cos( r ), e: 0, f: 0 }
	,	'Rotate'
	)
}

export	const
ScaleSelection	= ( sX, sY ) => {
	if	( !( sX > 0 && sY > 0 ) ) throw new Error( `Invalid scale: ${ sX } × ${ sY }` )
	return AboutCenter( { a: sX, b: 0, c: 0, d: sY, e: 0, f: 0 }, 'Scale' )
}

//	L C R T M B — multiple paths align to their union box, a single path to the viewBox
export	const
AlignSelection	= which => {
	const
	paths = Selected()
	if	( !paths.length ) return Promise.resolve()
	const
	boxes = paths.map( _ => BBoxD( _[ 1 ] ) )
	const
	[ vX, vY, vW, vH ] = app.model.viewBox
	const
	[ T, L, B, R ] = paths.length > 1 ? Union( boxes ) : [ vY, vX, vY + vH, vX + vW ]
	return DoTypical(
		'Align'
	,	() => paths.forEach( ( path, i ) => {
			const
			[ t, l, b, r ] = boxes[ i ]
			let	dX = 0, dY = 0
			switch ( which ) {
			case 'L':	dX = L - l;								break
			case 'C':	dX = ( L + R ) / 2 - ( l + r ) / 2;		break
			case 'R':	dX = R - r;								break
			case 'T':	dY = T - t;								break
			case 'M':	dY = ( T + B ) / 2 - ( t + b ) / 2;		break
			case 'B':	dY = B - b;								break
			}
			( dX || dY ) && ( path[ 1 ] = TranslateD( path[ 1 ], dX, dY ) )
		} )
	)
}

export	const
ReverseSelection	= () => DoTypical(
	'Reverse'
,	() => Selected().forEach( _ => _[ 1 ] = DString( ReverseSegs( ParseD( _[ 1 ] ) ) ) )
)

//	merge the selected paths ( in z-order ) into the bottom one as subpaths —
//	with fill-rule evenodd this is how you cut holes
export	const
CombineSelection	= () => DoTypical(
	'Combine'
,	() => {
		const
		sel = app.model.paths.filter( _ => app.selection.includes( _[ 0 ] ) )
		if	( sel.length < 2 ) throw new Error( 'Select two or more paths to combine.' )
		const
		[ first, ...rest ] = sel
		first[ 1 ] = DString( sel.flatMap( _ => ParseD( _[ 1 ] ) ) )
		app.model.paths = app.model.paths.filter( _ => !rest.includes( _ ) )
		app.selection = [ first[ 0 ] ]
	}
)

//	the inverse: one path per subpath, keeping z-position and paint
export	const
BreakApartSelection	= () => DoTypical(
	'BreakApart'
,	() => {
		const
		taken = TakenIDs()
		const
		paths = []
	,	selection = []
		for ( const path of app.model.paths ) {
			if	( !app.selection.includes( path[ 0 ] ) ) {
				paths.push( path )
				continue
			}
			const
			subs = SubpathsSegs( ParseD( path[ 1 ] ) )
			if	( subs.length < 2 ) {
				paths.push( path )
				selection.push( path[ 0 ] )
				continue
			}
			subs.forEach( ( sub, i ) => {
				const
				ID = i ? IDFor( taken, `${ path[ 0 ] }-${ i + 1 }` ) : path[ 0 ]
				paths.push( [ ID, DString( sub ), structuredClone( path[ 2 ] ) ] )
				selection.push( ID )
			} )
		}
		app.model.paths = paths
		app.selection = selection
	}
)

//	.ve text ( strict ) — or any .svg, flattened to paths on the way in
export	const
Load		= text => DoTypical(
	'Load'
,	() => {
		let	_
		try {
			_ = ParseVE( text )
		} catch ( er ) {
			_ = ImportSVG( text )
		}
		const
		taken = new Set()
		app.model	= {
			viewBox	: _.viewBox
		,	paths	: _.paths.map( ( [ ID, D, A ] ) => [
				!ID || taken.has( ID ) ? NextID( taken ) : ( taken.add( ID ), ID )
			,	D
			,	A
			] )
		}
		app.selection	= []
	}
)
