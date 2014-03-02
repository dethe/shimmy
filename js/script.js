(function(global){
	'use strict';

	var drawing = false;
	var WIDTH = document.body.clientWidth;
	var HEIGHT = document.body.clientHeight;

	// Prevent control clicks from passing through to svg
	function swallowClicks(evt){
		evt.stopPropagation();
	}
	document.querySelector('.sidebar').addEventListener('mousedown', swallowClicks, false);
	document.querySelector('.footbar').addEventListener('mousedown', swallowClicks, false);

	function inBounds(x,y){
		return !(x < 0 || x > WIDTH || y < 0 || y > HEIGHT);
	}

	document.body.addEventListener('mousedown', function(evt){
		startPath(evt.clientX, evt.clientY);
		drawing = true;
		console.log('down');
	}, false);

	document.body.addEventListener('mousemove', function(evt){
		if (!drawing) return;
		var x = evt.clientX;
		var y = evt.clientY;
		if (inBounds(x,y)){
			appendToPath(x,y);
		}
		console.log('move');
	});

	document.body.addEventListener('mouseup', function(evt){
		console.log('up');
		drawing = false;
	});

	function startPath(x,y){
		document.querySelector('svg').appendChild(dom.svg('path', {
			d: 'M ' + x + ',' + y,
			fill: getFill(),
			stroke: getStroke(),
			'stroke-width': getStrokeWidth()
		}));
	}

	function appendToPath(x,y){
		var path = document.querySelector('path:last-child');
		var seg = path.createSVGPathSegLinetoAbs(x,y);
		path.pathSegList.appendItem(seg);
	}

	function getFill(){
		if (document.querySelector('#pen-fill').checked){
			return getStroke();
		}else{
			return 'none';
		}
	}

	function getStroke(){
		return document.querySelector('#pen-color').value;
	}

	function getStrokeWidth(){
		return document.querySelector('#pen-size').value + 'px';
	}

})(this);