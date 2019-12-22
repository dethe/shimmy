/* globals ajax app dom listenCanvas canvas getState setState setMoatUI*/

(function(global){
    'use strict';
  
    // CONFIGURATION
    const USE_MOAT = true;
    const MOAT_URL = 'https://sketchdance-moat.glitch.me/';
  
    var defaultCanvas = `<svg id="canvas" width="2560px" height="1116px" data-tool="pen" data-stroke-width="2" data-do-onionskin="true" data-fps="10" data-palette="0" data-color="#000000" data-bgcolor="#FFFFFF" data-color1="#000000" data-color2="#FFFFFF" data-color3="#666666" data-color4="#69D2E7" data-color5="#A7DBD8" data-color6="#E0E4CC" data-color7="#F38630" data-color8="#FA6900" data-tab_file="false" data-tab_draw="true" data-tab_animate="true"><g class="frame selected"></g></svg>`;

    function saveLocal(){ 
        localStorage._currentWork = saveFormat(); 
    }
  
    function updateSavedState(){
      let state = getState();
      for (let key in state){
        canvas.dataset[key] = state[key];
      }
    }
  
  function restoreSavedState(){
    let state = {};
    for (let key in canvas.dataset){
      state[key] = canvas.dataset[key];
    }
    setState(state);
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
      listenCanvas();
      restoreSavedState();
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
        saveAs(saveFormat(), `${title}.svg`);
    }
  
    const filetypes = {
      'svg': 'image/svg+xml',
      'png': 'image/png',
      'gif': 'image/gif'
    }
  
    function saveAs(data, filename){
      let ext = filename.split('.').pop();
      let filetype = filetypes[ext];
      var file = new Blob([data], {type: filetype});
      saveBlob(file, filename);
    }
  
  function saveBlob(blob, filename){
      var reader = new FileReader();
      reader.onloadend = function(){
          var a = dom.html('a', {'href': reader.result, 'download': filename, target: '_blank'});
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      };
      reader.readAsDataURL(blob);
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
  
  function queryMoat(cb){
    fetch(MOAT_URL + 'programs').then(response => response.body.json().then(cb));
  }
  if (USE_MOAT){
    window.addEventListener('onload', e => queryMoat(setMoatUI), true);
  }

    window.file = {
        onChange: onChange,
        'new': newFile,
        clear: clear,
        loadFile,
        saveFile,
        saveBlob,
        saveLocal,
        saveAs
    };

    window.addEventListener('unload', saveLocal, false);
    window.addEventListener('load', restore, false);

})(window);