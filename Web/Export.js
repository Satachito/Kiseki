import { VEText } from './Application.js'

export	const
baseName = filename => ( filename ?? 'Untitled' ).replace( /\.[^.]+$/, '' ) || 'Untitled'

export	const
downloadBlob = ( blob, filename ) => {
	const
	a = document.createElement( 'a' )
	a.href = URL.createObjectURL( blob )
	a.download = filename
	a.click()
	a.remove()
	URL.revokeObjectURL( a.href )
}

//	a .ve file IS an SVG — saving and exporting differ only in extension / prolog

export	const
saveVE	= filename => downloadBlob(
	new Blob( [ VEText() ], { type: 'image/svg+xml' } )
,	`${ baseName( filename ) }.ve`
)

export	const
saveSVG	= filename => downloadBlob(
	new Blob( [ `<?xml version="1.0" encoding="UTF-8"?>\n${ VEText() }` ], { type: 'image/svg+xml' } )
,	`${ baseName( filename ) }.svg`
)

//	Copy the document to the clipboard. text/plain carries the markup — vector
//	tools ( Figma / Illustrator / Inkscape ) paste it as editable vectors, editors
//	paste the source. Also offer image/svg+xml where the browser allows it.
export	const
copySVG	= async () => {
	const
	svg = VEText()
	try {
		await navigator.clipboard.write( [
			new ClipboardItem( {
				'image/svg+xml'	: new Blob( [ svg ], { type: 'image/svg+xml'	} )
			,	'text/plain'	: new Blob( [ svg ], { type: 'text/plain'		} )
			} )
		] )
	} catch {
		//	browsers that reject image/svg+xml on the clipboard: fall back to markup
		await navigator.clipboard.writeText( svg )
	}
}
