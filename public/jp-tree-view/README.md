# jp-tree-view

A JSON based object browser Web Component.

* No external resources.
* Very fast. There is no data conversion inside.
* Ultra small. Easy to understand and modify.


## Install

```
npm install @satachito/jp-tree-view --save
```

## Demo

See
https://satachito.github.io/jp-tree-view/.

We are testing on Chrome only.


## Write HTML and JavaScript

### index.html
```
<!doctype html>
<html lang=zxx>
	<title>jp-tree-view demo</title>
<style>
.jp-tree-view-null, .jp-tree-view-undefined {
;	color			: red
}
.jp-tree-view-Boolean {
;	color			: green
}
jp-tree-view {
;	vertical-align	: top
}
.jp-tree-view-key::after {
;	content			: ': '
}
jp-tree-view a {
;	color			: blue
}
.jp-tree-view-String::before, .jp-tree-view-String::after {
;	content			: '"'
}
</style>
<body>
	<jp-tree-view></jp-tree-view>
	<br>
	<jp-tree-view json=null></jp-tree-view>
	<br>
	<jp-tree-view json=true></jp-tree-view>
	<br>
	<jp-tree-view json=false></jp-tree-view>
	<br>
	<jp-tree-view json=0></jp-tree-view>
	<br>
	<jp-tree-view json=123></jp-tree-view>
	<br>
	<jp-tree-view json='""'></jp-tree-view>
	<br>
	<jp-tree-view json='"ABC"'></jp-tree-view>
	<br>
	STATIC:
	<jp-tree-view
		json='{
			"jockeys": {
				"05339": {
					"name": "Christophe Patrice Lemaire"
				,	"birthday": 19790520
				}
			,	"05212": {
					"name": "Mirco Demuro"
				,	"birthday": 19790111
				}
			}
		,	"races": [
				{	"date":	20181125
				,	"name": "Japan Cup"
				,	"grade": "G1"
				,	"horses": [ "Almond Eye" ]
				}
			,	{	"date":	20181125
				,	"name": "Keihan Hai"
				,	"grade": "G3"
				,	"horses": [ "Danon Smash" ]
				}
			,	{	"date":	20190120
				,	"name": "Tokai S."
				,	"grade": "G2"
				,	"horses": [ "Inti" ]
				}
			,	{	"date":	20190120
				,	"name": "American Jockey Club Cup"
				,	"grade": "G2"
				,	"horses": [ "Sciacchetra" ]
				}
			]
		}'
		open
	></jp-tree-view>
	<br>
	DYNAMIC:
	<script type=module>	
		const
		container = {
			"jockeys": {
				"05339": {
					"name": "Christophe Patrice Lemaire"
				,	"birthday": 19790520
				}
			,	"05212": {
					"name": "Mirco Demuro"
				,	"birthday": 19790111
				}
			}
		,	"races": [
				{	"date":	20181125
				,	"name": "Japan Cup"
				,	"grade": "G1"
				,	"horses": [ "Almond Eye" ]
				}
			,	{	"date":	20181125
				,	"name": "Keihan Hai"
				,	"grade": "G3"
				,	"horses": [ "Danon Smash" ]
				}
			,	{	"date":	20190120
				,	"name": "Tokai S."
				,	"grade": "G2"
				,	"horses": [ "Inti" ]
				}
			,	{	"date":	20190120
				,	"name": "American Jockey Club Cup"
				,	"grade": "G2"
				,	"horses": [ "Sciacchetra" ]
				}
			]
		}
		document.body.appendChild( new JPTreeView( container, true ) )
	</script>
	<script src=./jp-tree-view.js></script>

```

## Props

* json - The JSON to be displayed. Expects a valid JSON string.
* open - Open child elements. Default: false.
* depth - The maximum level of the JSON Tree to be expanded. Specify 0 to Infinity.

## Constructor

JPTreeView( data, open = false, depth = 0 )

* data - Data to display.
* open - Open child elements. Default: false.
* depth - The maximum level of the JSON Tree to be expanded. Specify 0 to Infinity.

## Tag name

* jp-tree-view

## Classes

* .jp-tree-view-key
* .jp-tree-view-null
* .jp-tree-view-undefined
* .jp-tree-view-Boolean
* .jp-tree-view-String
* .jp-tree-view-Number
