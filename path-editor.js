import { LabeledTextArea, E, AC } from './DomUtils.js'
import './paint-editor.js'

//	d + presentation attributes of one path. $ is [ D, A ] — the shape/paint
//	pair of a model entry minus its ID ( the ID field lives in index.html ).
export default class
PathEditor extends HTMLElement {

	connectedCallback() {
		if	( this.D )	return

		this.D		= LabeledTextArea( this, 'd' )
		this.D.spellcheck = false
		this.PAINT	= AC( this, E( 'paint-editor' ) )
	}

	set $( [ D, A ] ) {
		this.D.value	= D ?? ''
		this.PAINT.$	= A ?? {}
	}

	get $() {
		return [ this.D.value.trim(), this.PAINT.$ ]
	}
}

customElements.define( 'path-editor', PathEditor )
