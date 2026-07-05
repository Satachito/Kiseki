#!/usr/bin/env node
//	svg2ve — flatten a plain .svg into path-only .ve
//
//		node svg2ve.mjs input.svg [ output.ve ]
//
//	Groups / transforms / basic shapes are baked into <path> elements, the same
//	flattening the app applies when importing an .svg ( Web/VE.js ). This is a
//	regex-level XML reader for well-formed, machine-written SVG — it does not
//	decode entities and ignores CSS <style> blocks.

import { readFileSync, writeFileSync } from 'node:fs'

import {
	PRESENTATION_ATTRS
,	ParseD
,	DString
,	TransformSegs
,	ParseTransform
,	MulM
,	Identity
,	ShapeD
}	from '../Web/PathData.js'

import { VEString } from '../Web/VE.js'

const
SKIP	= new Set( [ 'defs', 'title', 'desc', 'metadata', 'style', 'script', 'symbol', 'clipPath', 'mask', 'pattern', 'marker', 'text' ] )

const
ParseAttrs	= text => Object.fromEntries(
	[ ...text.matchAll( /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g ) ].map(
		( [ , k, v1, v2 ] ) => [ k, v1 ?? v2 ]
	)
)

const
Flatten	= xml => {
	xml = xml
	.	replace( /<!--[\s\S]*?-->/g, '' )
	.	replace( /<\?[\s\S]*?\?>/g, '' )
	.	replace( /<!DOCTYPE[^>]*>/i, '' )

	const
	paths = []
	let	viewBox = null

	const
	stack = []	//	{ m, attrs }
	let	skip = 0

	for ( const [ , close, name, attrText, selfClose ] of xml.matchAll(
		/<\s*(\/?)([\w:-]+)((?:"[^"]*"|'[^']*'|[^>])*?)(\/?)\s*>/g
	) ) {
		if	( close ) {
			skip ? --skip : stack.pop()
			continue
		}
		if	( skip ) {
			selfClose || ++skip
			continue
		}
		if	( SKIP.has( name ) ) {
			selfClose || ++skip
			continue
		}

		const
		attrs = ParseAttrs( attrText )

		if	( name === 'svg' && !viewBox ) {
			const
			_ = ( attrs.viewBox ?? '' ).trim().split( /[\s,]+/ ).map( Number )
			viewBox = _.length === 4 && _.every( Number.isFinite ) && _[ 2 ] > 0 && _[ 3 ] > 0
			?	_
			:	[ 0, 0, Number.parseFloat( attrs.width ) || 1024, Number.parseFloat( attrs.height ) || 1024 ]
		}

		const
		parent = stack.at( -1 ) ?? { m: Identity(), attrs: {} }
		const
		m = attrs.transform ? MulM( parent.m, ParseTransform( attrs.transform ) ) : parent.m
		const
		inherited = {
			...parent.attrs
		,	...Object.fromEntries( PRESENTATION_ATTRS.filter( _ => attrs[ _ ] !== undefined ).map( _ => [ _, attrs[ _ ] ] ) )
		}

		const
		d = name === 'path' ? attrs.d : ShapeD( name, attrs )
		d && paths.push( [ attrs.id ?? '', DString( TransformSegs( ParseD( d ), m ) ), inherited ] )

		selfClose || stack.push( { m, attrs: inherited } )
	}

	if	( !paths.length ) throw new Error( 'No drawable content found' )

	//	fill in missing / duplicate IDs
	const
	taken = new Set()
	let	n = 1
	const
	NextID = () => {
		while	( taken.has( `p${ n }` ) ) ++n
		return `p${ n }`
	}
	return {
		viewBox: viewBox ?? [ 0, 0, 1024, 1024 ]
	,	paths: paths.map( ( [ ID, D, A ] ) => {
			( !ID || taken.has( ID ) ) && ( ID = NextID() )
			taken.add( ID )
			return [ ID, D, A ]
		} )
	}
}

const
[ , , input, output ] = process.argv
if	( !input ) {
	console.error( 'usage: node svg2ve.mjs input.svg [ output.ve ]' )
	process.exit( 1 )
}

const
model = Flatten( readFileSync( input, 'utf8' ) )
const
out = output ?? input.replace( /\.svg$/i, '.ve' )
writeFileSync( out, VEString( model ) )
console.log( `${ out }: ${ model.paths.length } paths, viewBox ${ model.viewBox.join( ' ' ) }` )
