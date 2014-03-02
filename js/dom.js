// DOM utilities

(function(global){
	'use strict';

	var SVG_NS = 'http://www.w3.org/2000/svg';
	
	function html(name, attributes, children){
		return element(document.createElement(name), attributes, children);
	}

	function element(elem, attributes /* optional object */, children /* optional array, node, or string */){
		if (!children && attributes && (Array.isArray(attributes) || 
			               attributes.nodeName || 
			               typeof attributes === 'string')){
    		children = attributes;
	    	attributes = null;
   		}
		if (attributes){
			setAttributes(elem, attributes);
		}
		if (children){
			appendChildren(elem, children);
		}
		return elem;
	}

	function svg(name, attrs, children){
		return element(document.createElementNS(SVG_NS, name), attrs, children);
	}

	function setAttributes(elem, attributes){
		// keys must be strings
		// values can be strings, numbers, booleans, or functions
		if (attributes){
	        Object.keys(attributes).forEach(function(key){
	            if (attributes[key] === null || attributes[key] === undefined) return;
	            if (typeof attributes[key] === 'function'){
	                var val = attributes[key](key, attributes);
	                if (val){
	                    elem.setAttribute(key, val);
	                }
	            }else{
	                elem.setAttribute(key, attributes[key]);
	            } 		      
		    });
	    }
	    return elem; // for chaining
	}

	function appendChildren(elem, children){
		// Children can be a single child or an array
		// Each child can be a string or a node
		if (children){
	       	if (!Array.isArray(children)){
    			children = [children]; // convenience, allow a single argument vs. an array of one
   			}
   			children.forEach(function(child){
          		if (child.nodeName){
              		e.appendChild(child);
          		}else{
               		// assumes child is a string
               		e.appendChild(document.createTextNode(child));
           		}
       		});
   		}
		return elem;
	}

	function remove(elem){
		elem.parentElement.removeChild(elem);
	}

   function closest(elem, selector){
        while(elem){
            if (matches(elem, selector)){
                return elem;
            }
            if (!elem.parentElement){
                throw new Error('Element has no parent, is it in the tree? %o', elem);
                //return null;
            }
            elem = elem.parentElement;
        }
        return null;
    }

    function find(elem, selector){
        if (typeof(elem) === 'string'){
            selector = elem;
            elem = document.body;
        }
        return elem.querySelector(selector);
    }

    function findAll(elem, selector){
        if (typeof(elem) === 'string'){
            selector = elem;
            elem = document.body;
        }
        return [].slice.call(elem.querySelectorAll(selector));
    }

    // Remove namespace for matches
    var matches;
    if (document.body.matches){
        matches = function matches(elem, selector){ return elem.matches(selector); };
    }else if(document.body.mozMatchesSelector){
        matches = function matches(elem, selector){ return elem.mozMatchesSelector(selector); };
    }else if (document.body.webkitMatchesSelector){
        matches = function matches(elem, selector){ return elem.webkitMatchesSelector(selector); };
    }else if (document.body.msMatchesSelector){
        matches = function matches(elem, selector){ return elem.msMatchesSelector(selector); };
    }else if(document.body.oMatchesSelector){
        matches = function matches(elem, selector){ return elem.oMatchesSelector(selector); };
    }

	global.dom = {
		html: html,
		svg: svg,
		remove: remove,
		matches: matches,
		find: find,
		findAll: findAll,
		closest: closest
	};

})(this);
