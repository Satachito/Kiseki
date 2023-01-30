//	https://math.stackexchange.com/questions/1781438/finding-the-center-of-a-circle-given-two-points-and-a-radius-algebraically
//	https://pomax.github.io/bezierinfo/#circles_cubic

const
LSE2 = ( a, b, c, A, B, C ) => {	//	ax * by = c, Ax * By = C
//	if ( NearZero( a ) && NearZero( b ) ) debugger
_/	if ( NearZero( A ) && NearZero( B ) ) debugger
	if ( Math.abs( a ) > Math.abs( b ) ) {
		const y = ( C * a - c * A ) / ( B * a - b * A )
		return [ ( c - b * y ) / a, y ]
	} else {
		const x = ( C * b - c * B ) / ( b * A - B * a )
		return [ x, ( c - a * x ) / b ]
	}
}

const
DrawArc = ( s, e, rx, ry, angle, large, sweep ) => {

	const θ = angle * Math.PI / 180

const r = rx

	const m = Mid( s, e )

	const [ dX, dY ] = Sub( m, s )
	const [ mX, mY ] = m

	const aa = dX * dX + dY * dY
//	const b = Math.sqrt( r * r - aa )
//	const a = Math.sqrt( aa )

	const b_a = Math.sqrt( r * r / aa - 1 )
	const o = [ mX - dY * b_a, mY + dX * b_a ]
	console.log( 'o', o )

	const aS = Atan2( Sub( s, o ) )
	const aE = Atan2( Sub( e, o ) )
console.log( 'Angle', ( aE - aS ) * 180 / Math.PI )
	const points	= ApproxArcByCBs( aE - aS )

	const sinθA = Math.sin( θ )
	const cosθA = Math.cos( θ )
	//v	DESTRUCTIVE
	const _			= points.map(
		( [ x, y ] ) => {
			const
			sinθ = Math.sin( aS )
			const
			cosθ = Math.cos( aS )
		;	[ x, y ] = [
				( cosθ * x - sinθ * y ) * rx
			,	( sinθ * x + cosθ * y ) * ry
			]
			return Add(
				[	( cosθA * x - sinθA * y )
				,	( sinθA * x + cosθA * y )
				]
			,	o
			)
		}
	).flat()
	//^
console.log( _ )

	c2D.save()
	c2D.beginPath()
	c2D.moveTo( _[ 0 ], _[ 1 ] )
	_.splice( 0, 2 )
	while ( _.length ) (
		c2D.bezierCurveTo( ..._.slice( 0, 6 ) )
	,	_.splice( 0, 6 )
	)
	c2D.strokeStyle = 'red'
	c2D.lineWidth = 3
	c2D.stroke()
	c2D.restore()

//
	const b = Math.sqrt( r * r - aa )
	const a = Math.sqrt( aa )
	{	const $ = ( r - b ) / a
		SR( [ mX + dY * $, mY - dX * $ ] )
	//	SR( [ mX - dY * $, mY + dX * $ ] )
	}
//	反対側
//	{	const $ = ( r + b ) / a
//
//		SR( [ mX + dY * $, mY - dX * $ ] )
//	//	SR( [ mX - dY * $, mY + dX * $ ] )
//	}

//	中心点
	{	const $ = b / a

	//	SR( [ mX + dY * $, mY - dX * $ ] )
		SR( [ mX - dY * $, mY + dX * $ ] )

		StrokeEllipse( [ mX + dY * $, mY - dX * $ ], [ rx, ry ], θ )
		StrokeEllipse( [ mX - dY * $, mY + dX * $ ], [ rx, ry ], θ )
	}
}

const
StrokeEllipseCBs = ( [ cX, cY ], [ rX, rY ], θ ) => {
console.log( cX, cY, rX, rY, θ )
	const sinθ = Math.sin( θ )
	const cosθ = Math.cos( θ )
	const _ = [
		[ + rX * CF	, + rY		]
	,	[ + rX		, + rY * CF	]
	,	[ + rX		, 0			]

	,	[ + rX		, - rY * CF	]
	,	[ + rX * CF	, - rY		]
	,	[ 0			, - rY		]
	
	,	[ - rX * CF	, - rY		]
	,	[ - rX		, - rY * CF	]
	,	[ - rX		, 0			]
	
	,	[ - rX		, + rY * CF	]
	,	[ - rX * CF	, + rY		]
	,	[ 0			, + rY		]
	].map( ( [ x, y ] ) => [ cosθ * x - sinθ * y + cX, sinθ * x + cosθ * y + cY ] )
	c2D.beginPath()
	c2D.moveTo( ..._[ 11 ] )
	c2D.bezierCurveTo( ..._[ 0 ], ..._[  1 ], ..._[  2 ] )
	c2D.bezierCurveTo( ..._[ 3 ], ..._[  4 ], ..._[  5 ] )
	c2D.bezierCurveTo( ..._[ 6 ], ..._[  7 ], ..._[  8 ] )
	c2D.bezierCurveTo( ..._[ 9 ], ..._[ 10 ], ..._[ 11 ] )
	c2D.strokeStyle = 'red'
	c2D.stroke()
	c2D.strokeStyle = 'black'
}
