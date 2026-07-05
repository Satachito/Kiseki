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
,	TranslateD
}	from './PathData.js'

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
		//	pasted SVG markup ( from this app, an editor, Figma, … ): flatten it
		const
		text = _.getData( 'image/svg+xml' ) || _.getData( 'text/plain' )
		if	( text && /<svg[\s>]/.test( text ) ) try {
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
