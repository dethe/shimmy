(function(global){
	'use strict';

	var px, py, drawing;
	var WIDTH = document.body.clientWidth;
	var HEIGHT = document.body.clientHeight;

	function inBounds(x,y){
		return !(x < 0 || x > WIDTH || y < 0 || y > HEIGHT);
	}

	document.body.addEventListener('mousedown', function(evt){
		console.log(evt);
	}, false);

})(this);