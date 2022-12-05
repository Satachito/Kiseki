const
Toast = ( severity, ..._ ) => {
	switch ( severity ) {
	case 'red'		: console.error( ..._ )	; break
	case 'yellow'	: console.warn( ..._ )	; break
	case 'green'	: console.info( ..._ )	; break
	default			: console.log( ..._ )	; break
	}
}

//	document.execCommand() は非推奨になる

const
svg = `<?xml version='1.0'?><!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.0//EN''http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd'><svg xmlns="http://www.w3.org/2000/svg" style='fill-opacity:1; color-rendering:auto; color-interpolation:auto; text-rendering:auto; stroke:black; stroke-linecap:square; stroke-miterlimit:10; shape-rendering:auto; stroke-opacity:1; fill:black; stroke-dasharray:none; font-weight:normal; stroke-width:1; font-family:Arial; font-style:normal; stroke-linejoin:miter; font-size:12px; stroke-dashoffset:0; image-rendering:auto;' width='1120' height='760' xmlns='http://www.w3.org/2000/svg'><!--Generated--><defs id='genericDefs'/><g style='stroke-linecap:round; stroke-width:4; fill:none'><line x1='200.0' y1='680.0' x2='200.0' y2='80.0'/><line x1='200.0' y1='680.0' x2='880.0' y2='680.0'/><line x1='200.0' y1='80.0' x2='190.0' y2='100.0'/><line x1='200.0' y1='80.0' x2='210.0' y2='100.0'/><line x1='880.0' y1='680.0' x2='860.0' y2='670.0'/><line x1='880.0' y1='680.0' x2='860.0' y2='690.0'/></g><g style='stroke-linecap:round; stroke-width:4; fill:none'><line x1='200.0' y1='180.0' x2='800.0' y2='680.0'/><line x1='200.0' y1='180.0' x2='500.0' y2='680.0'/><path d='M 250.0 480.0 Q350.0 680.0, 580.0 130.0'/><path d='M 380.0 180.0 Q480.0 410.0, 680.0 200.0'/></g><g style='stroke-width:0;' fill = 'black' font-size = '20' font-family='Arial' alignment-baseline='hanging'></g></svg>`


CANVAS.onmousedown = console.log

const
ShowClipboard = () => navigator.clipboard.read().then(
	items => items.forEach(
		item => (
			console.log( item, 'item.types.length', item.types.length )
		,	item.types.forEach(
				type => item.getType( type ).then(
					async _ => console.log( type, _, type.startsWith( 'text' ) ? await _.text() : '' )
				)
			)
		)
	)
)

const
Redo = () => console.log( 'Redo' )
const
Undo = () => console.log( 'Undo' )
const
Cut = () => console.log( 'Cut' )
const
Copy = () => console.log( 'Copy' )
const
Paste = () => console.log( 'Paste' )

CANVAS.oncut = _ => console.log( 'CANVAS cut' )
CANVAS.oncopy = _ => console.log( 'CANVAS copy' )
CANVAS.onpaste = _ => console.log( 'CANVAS paste' )

CANVAS.onkeydown = kd => {
	if ( kd.metaKey ) {
		kd.preventDefault()
		switch ( kd.code ) {
		case 'KeyZ':
			kd.shiftKey ? Redo() : Undo()
			break
		case 'KeyX':
			Cut()		
			break
		case 'KeyC':
			Copy()		
			break
		case 'KeyV':
			Paste()	
			break
		}
	} else {
		switch ( kd.key ) {
		case '=': ShowClipboard()
			break
		case '+': navigator.clipboard.writeText( 'DUMMY TEXT' ).then( () => Toast( 'green', 'copied' ), er => Toast( 'red', er ) )
			break
		}
	}
}
CANVAS.focus()

document.body.onundo = _ => console.log( 'body undo' )
document.body.onredo = _ => console.log( 'body redo' )
document.body.oncut = _ => console.log( 'body cut' )
document.body.oncopy = _ => console.log( 'body copy' )
document.body.onpaste = _ => console.log( 'body paste' )


		/*
		const plain = 'text/plain'
		const html = 'text/html'
		const svg = 'image/svg+xml'

		navigator.clipboard.write(
			[	new ClipboardItem(
					{	[ plain ]: new Blob( [ INPUT.value ], { type: plain } )
					,	[ html ]: new Blob( [ INPUT.value ], { type: html } )
					,	[ svg ]: new Blob( [ svg ], { type: svg } )
					}
				)
			]
		).then( () => Toast( 'copied' ), er => Toast( er, 'red' ) )
		*/

