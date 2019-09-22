/* globals ajax app dom listenCanvas canvas currentTool currentStrokeWidth currentDoOnionSkin currentColor currentFrameDelay */

(function(global){
    'use strict';

    var defaultStyle = '<style>path{stroke-linecap: round; stroke-linejoin: round; pointer-events: none; fill: none;}</style>';
    var defaultCanvas = '<svg id="canvas"><g class="frame selected"></g></svg>';

    function saveLocal(){ 
        localStorage._currentWork = saveFormat(); 
    }
  
    // This function utterly breaks the generality of file.js
    // because it is intimately tied to drawingboard
    function updateSavedState(){
      canvas.dataset.tool = currentTool;
      canvas.dataset.strokeWidth = currentStrokeWidth;
      canvas.dataset.doOnionSkin = currentDoOnionSkin;
      canvas.dataset.color = currentColor;
      canvas.dataset.frameDelay = currentFrameDelay;
      canvas.dataset.bgcolor = canvas.style.backgroundColor;
      // TODO:
      // palette
      // toolbar
      // palette colors
      // NOT options: those can be stored directly in localStorage
      // restoring all of this in UI
    }

    function saveFormat(){
      if (canvas){
        updateSavedState();
        return canvas.outerHTML;
      }else{
        return '';
      }
    }
  
    window.canvas = null;

    function restoreFormat(savetext){
      canvas = document.querySelector('#canvas');
      if (!canvas){
        canvas = dom.svg('svg');
        document.body.prepend(canvas);
      }
      if (!savetext){
        savetext = defaultCanvas;
      }
      canvas.outerHTML = savetext;
      canvas = document.querySelector('#canvas');
      app.updateFrameCount();
      canvas.setAttribute('width', document.body.clientWidth + 'px');
      canvas.setAttribute('height', document.body.clientHeight + 'px');
      // let style = canvas.querySelector('style');
      // if (!style){
      //   canvas.prepend(defaultStyle);
      // }
      listenCanvas();
    }

    function restore(){
        var path = location.href.split('?');
        var query = location.search;
        if (query){
            var queryparts = query.slice(1).split('=');
            if (queryparts[0] === 'gist'){
                loadScriptsFromGistId(queryparts[1]);
                return;
            }
        }
        restoreLocal();
    }

    function restoreLocal(){ 
      restoreFormat(localStorage._currentWork || defaultCanvas); 
    }

    function clear(){
        restoreFormat(defaultCanvas);
    }

    function saveFile(evt){
        if (evt){
          evt.preventDefault();
        }
        var title = prompt("Save file as: ");
        if (!title){ return; }
        var file = new Blob([saveFormat()], {type: 'image/svg+xml'}); // change for non-svg
        var reader = new FileReader();
        reader.onloadend = function(){
            var a = dom.html('a', {'href': reader.result, 'download': title + '.svg', target: '_blank'}); // change for non-svg
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

    // Save script to gist;
    function saveCurrentScriptsToGist(event){
        event.preventDefault();
        // console.log("Saving to Gist");
        ajax.post("https://api.github.com/gists", function(data){
            //var raw_url = JSON.parse(data).files["script.json"].raw_url;
            gistID = JSON.parse(data).url.split("/").pop();
            var path = location.href.split('?')[0];
            path += "?gist=" + gistID;
            window.location = path;
        }, JSON.stringify({
            "description": "saved drawingboard file",
            "public": true,
            "files": {
                "animation.svg": {
                    "content": saveFormat()
                },
            }
        }), function(statusCode, x){
            alert("Can't save to Gist:\n" + statusCode + " (" + x.statusText + ") ");
        });
    }

    var gistID = null;

    function loadScriptsFromGistId(id){
        //we may get an event passed to this function so make sure we have a valid id or ask for one
        gistID = isNaN(parseInt(id)) ? prompt("What Gist would you like to load? Please enter the ID of the Gist: ")  : id;
        // console.log("Loading gist " + id);
        if( !gistID ) return;
        ajax.get("https://api.github.com/gists/"+gistID, function(gist){
            restoreFormat(JSON.parse(gist).files['animation.svg'].content);
        }, function(statusCode, x){
            alert("Can't load from Gist:\n" + statusCode + " (" + x.statusText + ") ");
        });
    }

    function newFile(){
        clear();
        onChange();
    }

    function onChange(){
        if (gistID){
            gistID = null;
            var path = location.href.split('?')[0];
            history.replaceState(null,null,path);
        }
    }

    window.file = {
        onChange: onChange,
        'new': newFile,
        clear: clear,
        loadFile,
        saveFile
    };

    // document.querySelector('#new').addEventListener('click', newFile, false);
    // document.querySelector('#upload').addEventListener('click', saveCurrentScriptsToGist, false);
    // document.querySelector('#download').addEventListener('click', loadScriptsFromGistId, false);
    // document.querySelector('#clear').addEventListener('click', clear, false);
    // document.querySelector('#save').addEventListener('click', saveFile, false);
    // document.querySelector('#open').addEventListener('click', loadFile, false);
    window.addEventListener('unload', saveLocal, false);
    window.addEventListener('load', restore, false);

})(window);