class
VETree extends HTMLElement {
	props( _, depth = 0, cur_dep = 0 ) {
		while ( this.firstChild ) this.removeChild( this.firstChild )
		this.style.paddingLeft = cur_dep + 'em'
		this.appendChild( document.createTextNode( _[ 0 ] + ': ' ) )
		this.appendChild( document.createElement( 'br' ) )
		_[ 1 ].length && _[ 1 ].forEach( _ => this.appendChild( new VETree() ).props( _, depth, cur_dep + 1 ) )
	}
}
customElements.define( 've-tree', VETree )

export default VETree
