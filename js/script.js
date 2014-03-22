(function(global){
    'use strict';

    /***************************************
     *
     *  BASIC DRAWING
     *
     ***************************************/

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
    }, false);

    document.body.addEventListener('mousemove', function(evt){
        if (!drawing) return;
        var x = evt.clientX;
        var y = evt.clientY;
        if (inBounds(x,y)){
            appendToPath(x,y);
        }
    });

    document.body.addEventListener('mouseup', function(evt){
        drawing = false;
    });

    function currentFrame(){
        return document.querySelector('.frame.selected');
    }

    function playingFrame(){
        return document.querySelector('.frame.play-frame');        
    }

    function startPath(x,y){
        currentFrame().appendChild(dom.svg('path', {
            d: 'M ' + x + ',' + y,
            fill: getFill(),
            stroke: getStroke(),
            'stroke-width': getStrokeWidth()
        }));
    }

    function appendToPath(x,y){
        var path = document.querySelector('.selected path:last-child');
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

    /***************************************
     *
     *  MANAGE FRAMES
     *
     ***************************************/

    function isOnionskinOn(){
        return document.querySelector('#canvas-onionskin').checked;
    }

    function currentOnionskinFrame(){
        return document.querySelector('.frame.onionskin');
    }

    function nextOnionskinFrame(){
        // if there is no current onionskin frame, assume we're at the start of the document */
        return dom.nextSibling(currentOnionskinFrame()) || document.querySelector('.frame');
    }

    function prevOnionskinFrame(){
        return dom.preSibling(currentOnionskinFrame());
    }

    function incrementOnionskin(){
        if (!isOnionskinOn()) return;
        dom.toggleClass([currentOnionskinFrame(), nextOnionskinFrame()], 'onionskin');
    }

    function decrementOnionskin(){
        if (!isOnionskinOn()) return;
        dom.toggleClass([currentOnionskinFrame(), nextOnionskinFrame()], 'onionskin');
    }  

    function addFrame(){
        dom.insertAfter(dom.svg('g', {'class': 'frame selected'}), currentFrame());
        currentFrame().classList.remove('selected');
        incrementOnionskin();
        updateFrameCount();
    }

     function cloneFrame(){
        dom.insertAfter(currentFrame().clone(true), currentFrame());
        currentFrame().classList.remove('selected');
        incrementOnionskin();
        updateFrameCount();
     }

     function toggleOnionskin(){
        if (isOnionskinOn()){
            dom.addClass(currentFrame().previousElementSibling, 'onionskin');
        }else{
            dom.removeClass(currentOnionskinFrame(), 'onionskin');
        }
     }

     function incrementFrame(){
        var curr = currentFrame();
        if (curr.nextElementSibling){
            curr.classList.remove('selected');
            curr.nextElementSibling.classList.add('selected');
        }
        incrementOnionskin();
        updateFrameCount();
     }

     function decrementFrame(){
        var curr = currentFrame();
        if (curr.previousElementSibling){
            curr.classList.remove('selected');
            curr.previousElementSibling.classList.add('selected');
        }
        decrementOnionskin();
        updateFrameCount();
     }

     function gotoFirstFrame(){
        currentFrame().classList.remove('selected');
        document.querySelector('.frame').classList.add('selected');
        dom.removeClass(currentOnionskinFrame(), 'onionskin');
        updateFrameCount();
     }

     function gotoLastFrame(){
        currentFrame().classList.remove('selected');
        document.querySelector('.frame:last-child').classList.add('selected');
        dom.removeClass(currentOnionskinFrame(), 'onionskin');
        dom.addClass(currentFrame().previousElementSibling, 'onionskin');
        updateFrameCount();
     }

     function play(){
        document.body.classList.add('playing');
        // turn play button into stop button
        // disable all other controls
        // temporarily turn off onionskin (remember state)
        // start at beginning of document (remember state)
        document.querySelector('.frame').classList.add('play-frame');
        // add SVG SMIL animation
        // Unless looping, call stop() when animation is finished
        // How much of this can I do by adding "playing" class to body?
        requestAnimationFrame(playNextFrame);
     }

     function stop(){
        // remove SMIL animation
        // re-enable all controls
        // return to the frame we were on
        // re-enable onionskin if needed
        // turn stop button into play button
        document.body.classList.remove('playing');
     }

     function playNextFrame(){
        var currFrame = playingFrame();
        if (currFrame.nextElementSibling){
            currFrame.classList.remove('play-frame');
            currFrame.nextElementSibling.classList.add('play-frame');
            requestAnimationFrame(playNextFrame);
        }else{
            stop();
        }
     }

     function updateFrameCount(){
        var frames = currentFrame().parentElement.children.length;
        var index = dom.indexOf(currentFrame());
        document.querySelector('#frame-count').textContent = 'Frame ' + (index+1) + ' of ' + frames;
     }

     function undoLine(){
        dom.remove(currentFrame().lastElement);
     }

     document.querySelector('#canvas-undo').addEventListener('click', undoLine, false);
     document.querySelector('#canvas-onionskin').addEventListener('change', toggleOnionskin, false);
     document.querySelector('#first-frame').addEventListener('click', gotoFirstFrame, false);
     document.querySelector('#previous-frame').addEventListener('click', decrementFrame, false);
     document.querySelector('#play').addEventListener('click', play, false);
     document.querySelector('#next-frame').addEventListener('click', incrementFrame, false);
     document.querySelector('#last-frame').addEventListener('click', gotoLastFrame, false);
     document.querySelector('#new-frame').addEventListener('click', addFrame, false);
     document.querySelector('#duplicate-frame').addEventListener('click', cloneFrame, false);

})(this);