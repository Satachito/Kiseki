const
TN = $ => document.createTextNode( $ )
const
E = tag => document.createElement( tag )
const
Input = ( value, change ) => {
	const v = E( 'input' )
	v.type = 'text'
	v.value = value
	v.addEventListener( 'change', change )
	return v
}
const
TextArea = ( value, change ) => {
	const v = E( 'textarea' )
	v.value = value
	v.addEventListener( 'change', change )
	return v
}
const
Button = ( text, click ) => {
	const v = E( 'button' )
	v.textContent = text
	v.addEventListener( 'click', click )
	return v
}
const
Select = change => {
	const v = E( 'select' )
	v.addEventListener( 'change', change )
	return v
}
const
Option = ( $, selected ) => {
	const v = E( 'option' )
	v.label = $
	v.value = $
	v.selected = selected
	return v
}
const
A = ( $, cb ) => {
	const v = E( 'a' )
	v.textContent = $
	v.addEventListener( 'click', cb )
	v.style.color = 'blue'
	return v
}
class
VETree extends HTMLElement {
	constructor() {
		super()
		this.attachShadow( { mode: 'open' } )
		const json = this.getAttribute( 'json' )
		if ( json ) {
			const key = this.getAttribute( 'key' ) ?? ''
			const parent = {}
			parent[ key ] = JSON.parse( json )
			setTimeout(
				() => this.props(
					parent
				,	key
				,	this.getAttribute( 'isOpen' ) == 'true'
				,	this.getAttribute( 'edit' ) == 'true'
				,	Number( this.getAttribute( 'depth' ) || '0' )
				)
			,	0
			)
		}
	}
	props(
		parent
	,	key		= ''
	,	isOpen	= false
	,	edit	= false
	,	depth	= 0
	,	cur_dep	= 0
	) {
		const sr = this.shadowRoot
		while ( sr.firstChild ) sr.removeChild( sr.firstChild )
		const root = sr.appendChild( E( 'div' ) )
		if ( cur_dep ) root.style.paddingLeft = `1em`
		const $ = parent[ key ]
		if ( $ === void 0 ) {
			root.innerHTML = `${ key }: <font color=red>undefined</font>`
		} else {	//	Erasable
			edit && root.appendChild(
				Button(
					'×'
				,	ev => {
						delete parent[ key ]
						this.props( parent, key, false, edit, depth, cur_dep )
					}
				)
			)
			if ( $ == null ) {
				root.appendChild( TN( `${ key }: ` ) )
				const _ = E( 'font' )
				_.setAttribute( 'color', 'red' )
				_.textContent = 'null'
				root.appendChild( _ )
			} else {	//	Editable
				switch ( $.constructor ) {
				case Object:
				case Array:
					{	const
						ToggleOpen = ev => this.props( parent, key, !isOpen, edit, depth, cur_dep )
						if ( isOpen && ( depth == 0 || cur_dep < depth ) ) {
							root.appendChild( A( '▼ ', ev => ToggleOpen( ev ) ) )
							root.appendChild( TN( `${ key }: ${ Array.isArray( $ ) ? '[' : '{' }` ) )
							root.appendChild( E( 'br' ) )
							Object.keys( $ ).sort().forEach(
								key => {
									const _ = new VETree()
									_.props( $, key, isOpen, edit, depth, cur_dep + 1 )
									root.appendChild( _ )
								}
							)
							root.appendChild( TN( `${ Array.isArray( $ ) ? ']' : '}' }` ) )
						} else {
							root.appendChild( A( '▶ ', ev => ToggleOpen( ev ) ) )
							root.appendChild( TN( `${ key }: ${ Array.isArray( $ ) ? '[]' : '{}' }(${ Object.keys( $ ).length })` ) )
						}
						if ( edit ) {
							const	inputKey	= Array.isArray( $ ) ? null : root.appendChild( Input( '', ev => {} ) )
							const	inputKind	= root.appendChild( Select( ev => {} ) )
							inputKind.appendChild( Option( 'string'	, true ) )
							inputKind.appendChild( Option( 'number'	, false ) )
							inputKind.appendChild( Option( 'boolean', false ) )
							inputKind.appendChild( Option( 'object'	, false ) )
							inputKind.appendChild( Option( 'array'	, false ) )
							inputKind.appendChild( Option( 'null'	, false ) )
							root.appendChild(
								Button(
									'+'
								,	ev => {
										if ( Array.isArray( $ ) ) {
											switch ( inputKind.value ) {
											case 'string'	: $.push( '' )		; break
											case 'number'	: $.push( 0 )		; break
											case 'boolean'	: $.push( false )	; break
											case 'object'	: $.push( {} )		; break
											case 'array'	: $.push( [] )		; break
											case 'null'		: $.push( null )	; break
											}
										} else {
											switch ( inputKind.value ) {
											case 'string'	: $[ inputKey.value ] = ''		; break
											case 'number'	: $[ inputKey.value ] = 0		; break
											case 'boolean'	: $[ inputKey.value ] = false	; break
											case 'object'	: $[ inputKey.value ] = {}		; break
											case 'array'	: $[ inputKey.value ] = []		; break
											case 'null'		: $[ inputKey.value ] = null	; break
											}
										}
										this.props( parent, key, isOpen, edit, depth, cur_dep )
									}
								)
							)
						}
					}
					break
				case String:
					root.appendChild( TN( key + ': ' ) )
					if ( edit ) {
						root.appendChild( TN( '"' ) )
						const ta = TextArea( $, ev => parent[ key ] = ev.target.value )
						root.appendChild( ta )
						ta.focus()
						root.appendChild( TN( '"' ) )
						root.appendChild( Button( 'end', ev => ta.blur() ) )
					} else {
						root.appendChild( TN( `"${ $ }"` ) )
					}
					break
				case Number:
					root.appendChild( TN( key + ': ' ) )
					if ( edit ) {
						root.appendChild( Input( $, ev => ev.target.value = parent[ key ] = Number( ev.target.value ) ) )
					} else {
						root.appendChild( TN( `${ $ }` ) )
					}
					break
				case Boolean:
					root.appendChild( TN( key + ': ' ) )
					if ( edit ) {
						const select = root.appendChild( Select( ev => parent[ key ] = eval( ev.target.value ) ) )
						select.appendChild( Option( "true", $ ) )
						select.appendChild( Option( "false", !$ ) )
					} else {
						root.appendChild( TN( `${ $ }` ) )
					}
					break
				}
			}
		}
	}
}
customElements.define( 've-tree', VETree )

export default VETree
