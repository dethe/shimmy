/* globals ajax app dom */

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
        app.play();
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
        onChange: onChange
    };

    // document.querySelector('#new').addEventListener('click', newFile, false);
    // document.querySelector('#upload').addEventListener('click', saveCurrentScriptsToGist, false);
    // document.querySelector('#download').addEventListener('click', loadScriptsFromGistId, false);
    // document.querySelector('#clear').addEventListener('click', clear, false);
    // document.querySelector('#save').addEventListener('click', saveFile, false);
    // document.querySelector('#open').addEventListener('click', loadFile, false);
    // window.addEventListener('unload', saveLocal, false);
    // window.addEventListener('load', restore, false);

})(window);