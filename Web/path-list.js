import {
	SetSelection
,	ToggleSelection
}	from './Application.js'

//	Draw-order list — front-most path on top. Click selects, ⇧click toggles.
export default class
PathList extends HTMLElement {

	Sync() {
		this.replaceChildren()
		for ( const [ ID, , A ] of [ ...app.model.paths ].reverse() ) {
			const
			row = this.appendChild( document.createElement( 'div' ) )
			row.className = app.selection.includes( ID ) ? 'path-row selected' : 'path-row'

			const
			chip = row.appendChild( document.createElement( 'span' ) )
			chip.className = 'path-chip'
			const
			fill = A[ 'fill' ] ?? '#000'
			fill !== 'none' && ( chip.style.background = fill )
			A[ 'stroke' ] && A[ 'stroke' ] !== 'none' && ( chip.style.borderColor = A[ 'stroke' ] )

			row.appendChild( document.createElement( 'span' ) ).textContent = ID

			row.onclick = ev => {
				ev.shiftKey ? ToggleSelection( ID ) : SetSelection( [ ID ] )
				window.SyncPathEditor?.()
			}
		}
	}
}

customElements.define( 'path-list', PathList )
