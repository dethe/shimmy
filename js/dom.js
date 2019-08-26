// DOM utilities

/* globals simplify */

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
                    elem.appendChild(child);
                }else{
                    // assumes child is a string
                    elem.appendChild(document.createTextNode(child));
                }
            });
        }
        return elem;
    }

    function remove(elem){
        // conditionally remove element if it exists
        if (elem){
            elem.parentElement.removeChild(elem);
        }
    }
  
    function clear(elem){
      while(elem.firstChild){
        elem.firstChild.remove();
      }
      elem.removeAttribute('transform');
    }

    function insertAfter(newElement, sibling){
        sibling.parentElement.insertBefore(newElement, sibling.nextElementSibling);
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

    function addClass(elem, klass){
        /* Conditionally add class if element exists */
        if (elem){
            elem.classList.add(klass);
        }
    }
  
    function previous(elem, selector){
      let node = elem.previousElementSibling;
      while(node){
        if (node.matches(selector)){
            return node;
        }else{
          node = elem.previousElementSibling;
        }
      }
      return null;
    }
  
    function next(elem, selector){
      let node = elem.nextElementSibling;
      while(node){
        if (node.matches(selector)){
            return node;
        }else{
          node = elem.nextElementSibling;
        }
      }
      return null;
    }

    function removeClass(elem, klass){
        /* Conditionall remove class if element exists */
        if (elem){
            elem.classList.remove(klass);
        }
    }

    function nextSibling(elem){
        /* conditionally returns next sibling if element exists */
        return elem ? elem.nextElementSibling : null;
    }

    function prevSibling(elem){
        /* conditionally returns previous sibling if element exists */
        return elem ? elem.previousElementSibling : null;
    }

    function toggleClass(elements, klass){
        if (!elements) return;
        if (Array.isArray(elements)){
            elements.forEach(function(elem){
                toggleClass(elem, klass);
            });
        }else{
            elements.classList.toggle(klass);
        }
    }

    function indexOf(child){
        var allChildren = [].slice.call(child.parentElement.children);
        return allChildren.indexOf(child);
    }

    function pathToArray(pathElem){
        return [].slice.call(pathElem.pathSegList).map(function(seg){
            return {x: seg.x, y: seg.y};
        });
    }

    function arrayToPath(arr){
        return arr.map(function(point, index){
            if (index){
                return 'L' + point.x + ',' + point.y;
            }else{
                return 'M' + point.x + ',' + point.y;
            }
        }).join(' ');
    }

    function simplifyPath(pathElem){
        // console.log('before: %s', pathElem.pathSegList.length);
        pathElem.setAttribute('d', arrayToPath(simplify(pathToArray(pathElem),2)));
        // console.log('after: %s', pathElem.pathSegList.length);        
    }

    window.requestAnimationFrame = window.requestAnimationFrame ||
                                   window.mozRequestAnimationFrame || 
                                   window.msRequestAnimationFrame || 
                                   window.webkitRequestAnimationFrame || 
                                   function(fn){ setTimeout(fn, 20); };

    global.dom = {
        element: element,
        html: html,
        svg: svg,
        remove: remove,
        clear: clear,
        insertAfter: insertAfter,
        previous: previous,
        next: next,
        matches: matches,
        find: find,
        findAll: findAll,
        closest: closest,
        addClass: addClass,
        removeClass: removeClass,
        prevSibling: prevSibling,
        nextSibling: nextSibling,
        toggleClass: toggleClass,
        indexOf: indexOf,
        simplifyPath: simplifyPath
    };

})(this);
