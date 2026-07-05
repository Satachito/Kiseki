import { LabeledInput, LabeledSelect } from './DomUtils.js'

//	SVG presentation attributes of a <path> — values are stored verbatim in the
//	.ve file, so fields hold attribute strings, not canvas style objects.
export default class
PaintEditor extends HTMLElement {

	//	Build fields on connect, not in the constructor: a custom element whose
	//	constructor adds children can't be created via document.createElement
	//	( "the result must not have children" ), and we nest this via createElement.
	connectedCallback() {
		if	( this.FILL )	return

		this.FILL				= LabeledInput	( this, 'fill'				)
		this.FILL_RULE			= LabeledSelect	( this, 'fill-rule'			, '', 'nonzero', 'evenodd'			)
		this.STROKE				= LabeledInput	( this, 'stroke'			)
		this.STROKE_WIDTH		= LabeledInput	( this, 'stroke-width'		)
		this.LINE_CAP			= LabeledSelect	( this, 'stroke-linecap'	, '', 'butt', 'round', 'square'		)
		this.LINE_JOIN			= LabeledSelect	( this, 'stroke-linejoin'	, '', 'miter', 'round', 'bevel'		)
		this.MITER_LIMIT		= LabeledInput	( this, 'stroke-miterlimit'	)
		this.DASH_ARRAY			= LabeledInput	( this, 'stroke-dasharray'	)
		this.DASH_OFFSET		= LabeledInput	( this, 'stroke-dashoffset'	)
		this.OPACITY			= LabeledInput	( this, 'opacity'			)
	}

	set $( _ ) {
		this.FILL			.value = _[ 'fill'				] ?? ''
		this.FILL_RULE		.value = _[ 'fill-rule'			] ?? ''
		this.STROKE			.value = _[ 'stroke'			] ?? ''
		this.STROKE_WIDTH	.value = _[ 'stroke-width'		] ?? ''
		this.LINE_CAP		.value = _[ 'stroke-linecap'	] ?? ''
		this.LINE_JOIN		.value = _[ 'stroke-linejoin'	] ?? ''
		this.MITER_LIMIT	.value = _[ 'stroke-miterlimit'	] ?? ''
		this.DASH_ARRAY		.value = _[ 'stroke-dasharray'	] ?? ''
		this.DASH_OFFSET	.value = _[ 'stroke-dashoffset'	] ?? ''
		this.OPACITY		.value = _[ 'opacity'			] ?? ''
	}

	get $() {
		const
		$ = {}
		this.FILL			.value && ( $[ 'fill'				] = this.FILL			.value )
		this.FILL_RULE		.value && ( $[ 'fill-rule'			] = this.FILL_RULE		.value )
		this.STROKE			.value && ( $[ 'stroke'				] = this.STROKE			.value )
		this.STROKE_WIDTH	.value && ( $[ 'stroke-width'		] = this.STROKE_WIDTH	.value )
		this.LINE_CAP		.value && ( $[ 'stroke-linecap'		] = this.LINE_CAP		.value )
		this.LINE_JOIN		.value && ( $[ 'stroke-linejoin'	] = this.LINE_JOIN		.value )
		this.MITER_LIMIT	.value && ( $[ 'stroke-miterlimit'	] = this.MITER_LIMIT	.value )
		this.DASH_ARRAY		.value && ( $[ 'stroke-dasharray'	] = this.DASH_ARRAY		.value )
		this.DASH_OFFSET	.value && ( $[ 'stroke-dashoffset'	] = this.DASH_OFFSET	.value )
		this.OPACITY		.value && ( $[ 'opacity'			] = this.OPACITY		.value )
		return $
	}
}

customElements.define( 'paint-editor', PaintEditor )
