//	AI-facing command surface for the live, in-browser model.
//
//	Everything here mutates window.app through Application.js. A single apply()
//	batch is one undo step and rolls back entirely on any op failure. Exposed as
//	window.VE so the in-app AI panels, the WebSocket bridge, and external agents
//	can read, validate and edit the document directly.

import {
	FindPath
,	ApplyPath
,	EditPath
,	RemovePath
,	Restack
,	SetViewBox
,	SetModel
,	VEText
,	DoTypical
,	withoutHistory
}	from './Application.js'

import {
	ParseD
,	TranslateD
}	from './PathData.js'

//	pure: returns an array of human-readable problems ( empty = valid )
export	const
validateModel	= ( model = app.model ) => {
	const
	issues = []
	if	( !model || typeof model !== 'object' )	return [ 'model must be an object' ]

	const
	vb = model.viewBox
	;(	Array.isArray( vb )
	&&	vb.length === 4
	&&	vb.every( Number.isFinite )
	&&	vb[ 2 ] > 0
	&&	vb[ 3 ] > 0
	) || issues.push( `viewBox must be [ x, y, w, h ] with w, h > 0: ${ JSON.stringify( vb ) }` )

	if	( !Array.isArray( model.paths ) ) {
		issues.push( 'model.paths must be an array' )
		return issues
	}

	const
	ids = new Set
	model.paths.forEach( ( _, i ) => {
		if	( !Array.isArray( _ ) || _.length < 2 ) return issues.push( `paths[${ i }] must be [ ID, d, attrs ]` )
		const
		[ ID, D, A ] = _
		typeof ID === 'string' && ID.length || issues.push( `paths[${ i }] has an empty / non-string ID` )
		ids.has( ID ) && issues.push( `duplicate path ID "${ ID }"` )
		ids.add( ID )
		try {
			ParseD( D )
		} catch ( er ) {
			issues.push( `path "${ ID }": ${ er.message }` )
		}
		A === undefined || ( A && typeof A === 'object' && !Array.isArray( A ) ) || issues.push( `path "${ ID }": attrs must be an object` )
	} )
	return issues
}

const
getModel		= () => structuredClone( app.model )

const
setModel		= model => {
	const
	issues = validateModel( model )
	if	( issues.length ) throw new Error( issues.join( '\n' ) )
	return SetModel( structuredClone( model ) )
}

const
mustFind		= id => {
	const
	path = FindPath( id )
	if	( !path ) throw new Error( `no such path: ${ id }` )
	return path
}

//	single op → Application mutator ( own undo step when called alone )
const
OPS				= {
	addPath			: a => {
		if	( FindPath( a.id ) ) throw new Error( `addPath: ID already exists: ${ a.id }` )
		return ApplyPath( [ a.id, a.d, a.attrs ?? {} ] )
	}
,	updatePath		: a => {
		const
		path = mustFind( a.id )
		return EditPath( a.id, [ a.newId ?? a.id, a.d ?? path[ 1 ], a.attrs ?? path[ 2 ] ] )
	}
,	translatePath	: a => {
		const
		path = mustFind( a.id )
		return EditPath( a.id, [ a.id, TranslateD( path[ 1 ], a.dx ?? 0, a.dy ?? 0 ), path[ 2 ] ] )
	}
,	removePath		: a => RemovePath( a.id )
,	restack			: a => Restack( a.id, a.toFront ?? true )
,	setViewBox		: a => SetViewBox( a.viewBox )
}

//	One apply() = one undo step. Any op failure rolls the whole batch back.
const
apply			= async ops => {
	if	( !Array.isArray( ops ) ) throw new Error( 'apply expects an array of ops' )
	if	( !ops.length ) throw new Error( 'apply expects a non-empty ops array' )
	await DoTypical(
		'AI'
	,	() => withoutHistory(
			async () => {
				for	( const o of ops ) {
					const	fn = OPS[ o.op ]
					if	( !fn )	throw new Error( `unknown op "${ o.op }"` )
					await fn( o )
				}
			}
		)
	)
	return	validateModel()
}

window.VE = {
	getModel
,	setModel
,	getText		: () => VEText()
,	validate	: validateModel
,	apply
,	...OPS
,	draw		: () => MAIN_EDITOR.Draw()
}
