//	window.VE — programmatic API for agents and scripts.
//	One operation = one undo step ( via Application.js ).

import {
	FindPath
,	ApplyPath
,	EditPath
,	RemovePath
,	Restack
,	SetViewBox
,	SetModel
,	VEText
}	from './Application.js'

import { ParseD } from './PathData.js'

export	const
validateModel	= model => {
	const
	$ = []
	if	( !model || typeof model !== 'object' )	return [ 'model must be an object' ]

	const
	vb = model.viewBox
	;(	Array.isArray( vb )
	&&	vb.length === 4
	&&	vb.every( Number.isFinite )
	&&	vb[ 2 ] > 0
	&&	vb[ 3 ] > 0
	) || $.push( `viewBox must be [ x, y, w, h ] with w, h > 0: ${ JSON.stringify( vb ) }` )

	if	( !Array.isArray( model.paths ) ) {
		$.push( 'model.paths must be an array' )
		return $
	}

	const
	seen = new Set()
	model.paths.forEach( ( _, i ) => {
		if	( !Array.isArray( _ ) || _.length < 2 ) return $.push( `paths[${ i }] must be [ ID, d, attrs ]` )
		const
		[ ID, D, A ] = _
		typeof ID === 'string' && ID.length || $.push( `paths[${ i }]: ID must be a non-empty string` )
		seen.has( ID ) && $.push( `paths[${ i }]: duplicate ID "${ ID }"` )
		seen.add( ID )
		try {
			ParseD( D )
		} catch ( er ) {
			$.push( `paths[${ i }] "${ ID }": ${ er.message }` )
		}
		A === undefined || ( A && typeof A === 'object' && !Array.isArray( A ) ) || $.push( `paths[${ i }] "${ ID }": attrs must be an object` )
	} )
	return $
}

const
apply	= async ops => {
	if	( !Array.isArray( ops ) ) throw new Error( 'apply expects an array of ops' )
	for ( const op of ops ) {
		switch ( op.op ) {
		case 'addPath':
			if	( FindPath( op.id ) ) throw new Error( `addPath: ID already exists: ${ op.id }` )
			await ApplyPath( [ op.id, op.d, op.attrs ?? {} ] )
			break
		case 'updatePath': {
			const
			path = FindPath( op.id )
			if	( !path ) throw new Error( `updatePath: no such path: ${ op.id }` )
			await EditPath( op.id, [
				op.newId ?? op.id
			,	op.d ?? path[ 1 ]
			,	op.attrs ?? path[ 2 ]
			] )
			break
		}
		case 'removePath':
			await RemovePath( op.id )
			break
		case 'restack':
			await Restack( op.id, op.toFront ?? true )
			break
		case 'setViewBox':
			await SetViewBox( op.viewBox )
			break
		default:
			throw new Error( `Unknown op: ${ op.op }` )
		}
	}
	return { ok: true, applied: ops.length }
}

window.VE	= {
	getModel	: () => structuredClone( app.model )
,	getText		: () => VEText()
,	validate	: model => validateModel( model ?? app.model )
,	apply
,	setModel	: async model => {
		const
		issues = validateModel( model )
		if	( issues.length ) throw new Error( issues.join( '\n' ) )
		await SetModel( model )
	}
}
