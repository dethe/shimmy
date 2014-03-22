(function(global){
    'use strict';

    var defaultCanvas = '<svg id="main-canvas" width="100%" height="100%"><g class="frame selected"></g></svg>';

    function saveLocal(){ 
        localStorage._currentWork = saveFormat(); 
    }

    function saveFormat(){
        return document.getElementById('main-canvas').outerHTML;
    }

    function restoreFormat(savetext){
        document.getElementById('main-canvas').outerHTML = savetext;
        app.updateFrameCount();
    }

    function restoreLocal(){ 
        restoreFormat(localStorage._currentWork || defaultCanvas); 
    }

    function clear(){
        restoreFormat(defaultCanvas);
    }

    function saveFile(evt){
        evt.preventDefault();
        var title = prompt("Save file as: ");
        if (!title){ return; }
        var file = new Blob([saveFormat()], {type: 'image/svg+xml'});
        var reader = new FileReader();
        reader.onloadend = function(){
            var a = dom.html('a', {'href': reader.result, 'download': title + '.svg', target: '_blank'});
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
        reader.readAsDataURL(file);
    }

    function readFile(file){
        var fileName = file.name;
        if (fileName.indexOf('.svg', fileName.length - 5) === -1) {
            return alert('Not an SVG file');
        }
        var reader = new FileReader();
        reader.readAsText( file );
        reader.onload = function (evt){ restoreFormat(evt.target.result); };
    }

    function loadFile(){
        var input = dom.html('input', {'type': 'file', 'accept': 'image/svg+xml'});
        if (!input){ return; }
        input.addEventListener('change', function(evt){ readFile(input.files[0]); });
        input.click();
    }

    document.querySelector('#clear').addEventListener('click', clear, false);
    document.querySelector('#save').addEventListener('click', saveFile, false);
    document.querySelector('#open').addEventListener('click', loadFile, false);
    window.addEventListener('unload', saveLocal, false);
    window.addEventListener('load', restoreLocal, false);

})(window);