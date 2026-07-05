//	Node-level editing of a parsed d ( the old Change / point tools, rebuilt ).
//	A node addresses one editable coordinate pair inside a segment:
//		{ si, pi, kind }	si: segment index, pi: offset of x in the segment
//							kind: 'anchor' ( on-curve ) | 'ctrl' ( off-curve )
//	Pure — segs in, segs out. The canvas side lives in main-editor.js.

import {
	SegStarts
,	NearestOnSeg
,	SplitSegAt
}	from './PathData.js'

export	const
BuildNodes	= segs => {
	const
	$ = []
	segs.forEach( ( [ C ], si ) => {
		switch ( C ) {
		case 'M':
		case 'L':
		case 'T':
			$.push( { si, pi: 1, kind: 'anchor' } )
			break
		case 'C':
			$.push( { si, pi: 1, kind: 'ctrl' } )
			$.push( { si, pi: 3, kind: 'ctrl' } )
			$.push( { si, pi: 5, kind: 'anchor' } )
			break
		case 'S':
		case 'Q':
			$.push( { si, pi: 1, kind: 'ctrl' } )
			$.push( { si, pi: 3, kind: 'anchor' } )
			break
		case 'A':
			$.push( { si, pi: 6, kind: 'anchor' } )
			break
		}
	} )
	return $
}

export	const
NodeXY		= ( segs, { si, pi } ) => [ segs[ si ][ pi ], segs[ si ][ pi + 1 ] ]

//	control points that ride along when their anchor moves: the incoming curve's
//	trailing control and the outgoing curve's leading control
const
AttachedCtrls	= ( segs, { si, pi, kind } ) => {
	if	( kind !== 'anchor' ) return []
	const
	$ = []
	const
	C = segs[ si ][ 0 ]
	C === 'C' && pi === 5 && $.push( [ si, 3 ] )
	C === 'S' && pi === 3 && $.push( [ si, 1 ] )
	const
	next = segs[ si + 1 ]
	next && ( next[ 0 ] === 'C' || next[ 0 ] === 'Q' ) && $.push( [ si + 1, 1 ] )
	return $
}

//	move one node by ( dX, dY ) — anchors carry their attached controls
export	const
MoveNode	= ( segs, node, dX, dY ) => {
	const
	$ = segs.map( _ => [ ..._ ] )
	for ( const [ si, pi ] of [ [ node.si, node.pi ], ...AttachedCtrls( $, node ) ] ) {
		$[ si ][ pi ]		+= dX
		$[ si ][ pi + 1 ]	+= dY
	}
	return $
}

//	delete the segment holding an anchor. Deleting an M promotes the next
//	segment's endpoint to the new subpath start; a lone M vanishes with its Z.
export	const
DeleteNode	= ( segs, node ) => {
	if	( node.kind !== 'anchor' ) return null
	const
	$ = segs.map( _ => [ ..._ ] )
	const
	[ C ] = $[ node.si ]
	if	( C !== 'M' ) {
		$.splice( node.si, 1 )
		return $
	}
	const
	next = $[ node.si + 1 ]
	if	( !next || next[ 0 ] === 'M' || next[ 0 ] === 'Z' ) {
		//	empty subpath: drop the M and any Z right behind it
		$.splice( node.si, next && next[ 0 ] === 'Z' ? 2 : 1 )
		return $
	}
	$.splice( node.si, 2, [ 'M', next[ next.length - 2 ], next[ next.length - 1 ] ] )
	return $
}

//	nearest point on the outline ( L / C / Q segments ) within maxDist → split
//	target, or null
export	const
NearestInsertion	= ( segs, xy, maxDist ) => {
	const
	starts = SegStarts( segs )
	let	$ = null
	segs.forEach( ( seg, si ) => {
		const
		_ = NearestOnSeg( seg, starts[ si ], xy )
		_ && _.dist <= maxDist && ( !$ || _.dist < $.dist ) && ( $ = { si, t: _.t, dist: _.dist } )
	} )
	return $
}

//	insert a node by splitting the segment at t ( from NearestInsertion )
export	const
InsertNode	= ( segs, { si, t } ) => {
	const
	starts = SegStarts( segs )
	const
	split = SplitSegAt( segs[ si ], starts[ si ], t )
	if	( !split ) return null
	const
	$ = segs.map( _ => [ ..._ ] )
	$.splice( si, 1, ...split )
	return $
}
