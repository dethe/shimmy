// Copyright (C) 2020 Richmond Public Library

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

/* globals ajax updateFrameCount dom listenCanvas canvas getState setState setName setMoatUI dialogPolyfill QRCode timeago*/

(function(global) {
  "use strict";

  // CONFIGURATION
  let params = new URLSearchParams(new URL(window.location).search);

  const USE_MOAT = params.has("moat");

  const MOAT_URL = window.location.host.includes("glitch")
    ? "https://sd-moat.glitch.me/"
    : "https://launchpad.yourlibrary.ca/moat/";
  console.log(MOAT_URL);

  var defaultCanvas = `<svg id="canvas" width="2560px" height="1116px" data-name="untitled" data-tool="pen" data-stroke-width="2" data-do-onionskin="true" data-fps="10" data-palette="0" data-color="#000000" data-bgcolor="#FFFFFF" data-color1="#FF0000" data-color2="#FFFF00" data-color3="#00FF00" data-color4="#00FFFF" data-color5="#0000FF" data-color6="#666666" data-color7="#000000" data-color8="#FFFFFF" data-tab_file="false" data-tab_draw="true" data-tab_frames="true" data-tab_animate="false"><g class="frame selected"></g></svg>`;

  // polyfill for dialog
  const dialog = document.querySelector("dialog");
  dialogPolyfill.registerDialog(dialog);

  function saveLocal() {
    localStorage._currentWork = saveFormat();
  }

  function updateSavedState() {
    let state = getState();
    for (let key in state) {
      canvas.dataset[key] = state[key];
    }
  }

  function restoreSavedState() {
    let state = {};
    for (let key in canvas.dataset) {
      state[key] = canvas.dataset[key];
    }
    setState(state);
  }

  function saveFormat() {
    if (canvas) {
      updateSavedState();
      return canvas.outerHTML;
    } else {
      return "";
    }
  }

  window.canvas = null;

  function restoreFormat(savetext) {
    window.canvas = document.querySelector("#canvas");
    if (!canvas) {
      canvas = dom.svg("svg");
      document.body.prepend(canvas);
    }
    if (!savetext) {
      savetext = defaultCanvas;
    }
    canvas.outerHTML = savetext;
    canvas = document.querySelector("#canvas");
    updateFrameCount();
    canvas.setAttribute("width", document.body.clientWidth + "px");
    canvas.setAttribute("height", document.body.clientHeight + "px");
    listenCanvas();
    restoreSavedState();
  }

  function restore() {
    var path = location.href.split("?");
    var query = location.search;
    if (query) {
      var queryparts = query.slice(1).split("=");
      if (queryparts[0] === "gist") {
        loadScriptsFromGistId(queryparts[1]);
        return;
      }
    }
    restoreLocal();
  }

  function restoreLocal() {
    restoreFormat(localStorage._currentWork || defaultCanvas);
  }

  function clear() {
    restoreFormat(defaultCanvas);
  }

  function saveFile(evt) {
    if (evt) {
      evt.preventDefault();
    }
    var title = prompt("Save SVG file as: ", name);
    setName(title);
    if (!title) {
      return;
    }
    saveAs(saveFormat(), `${title}.svg`);
  }

  const filetypes = {
    svg: "image/svg+xml",
    png: "image/png",
    gif: "image/gif"
  };

  function saveToCallback(data, filename, cb) {
    // Callback is shaped cb(blob, filename);
    console.log("saveToCallback(%s)", filename);
    let ext = filename.split(".").pop();
    let filetype = filetypes[ext];
    if (data.toBlob) {
      // ex: canvas.toBlob()
      data.toBlob(blob => cb(blob, filename), filetype);
    } else {
      cb(new Blob([data], { type: filetype }), filename);
    }
  }

  function sendToMoat(progid) {
    console.log("sendToMoat(%s)", progid);
    saveToCallback(saveFormat(), "shimmy.svg", (blob, filename) =>
      sendToMoatCB(blob, filename, progid)
    );
  }

  function sendToMoatCB(blob, filename, progid) {
    console.log("sendToMoatCB(%s)", filename);
    let formData = new FormData();
    formData.append("program", progid);
    formData.append("file", blob, filename);
    let request = new XMLHttpRequest();
    request.open("POST", MOAT_URL + "file/create");
    request.setRequestHeader("X-Requested-With", "XMLHTTPRequest");
    request.send(formData);
    request.onload = () => showFilePage(request.response);
    request.onerror = () => handleError("send file");
    request.ontimeout = () => handleTimeout("send file");
  }

  function handleError(step) {
    alert(
      "Error uploading to Moat during " + step + " step, please try again."
    );
  }

  function handleTimeout(step) {
    alert("Timeout uploading to Moat during " + step + ", please try again.");
  }

  function showQRCode() {
    if (document.querySelector("#qrcode")) {
      let qrcode = new QRCode("qrcode", {
        text: "{{urlbase}}/file/{{id}}",
        width: 128,
        height: 128,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  }

  function updateExpires() {
    let expires = document.querySelectorAll(".expires");
    if (expires.length) {
      expires.forEach(
        e => (e.innerText = timeago.format(e.getAttribute("timestamp")))
      );
      setTimeout(updateExpires, 1000);
    }
  }

  function updateDialog() {
    showQRCode();
    updateExpires();
  }

  function showFilePage(res) {
    dialog.innerHTML = res;
    dialog.append(
      dom.html("button", { onClick: "this.parentElement.close()" }, "OK")
    );
    updateDialog();
    dialog.showModal();
  }

  function saveAs(data, filename) {
    saveToCallback(data, filename, saveBlob);
  }

  function saveBlob(blob, filename) {
    var reader = new FileReader();
    reader.onloadend = function() {
      var a = dom.html("a", {
        href: reader.result,
        download: filename,
        target: "_blank"
      });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    reader.readAsDataURL(blob);
  }

  function readFile(file) {
    var fileName = file.name;
    if (fileName.indexOf(".svg", fileName.length - 5) === -1) {
      return alert("Not an SVG file");
    }
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function(evt) {
      restoreFormat(evt.target.result);
    };
  }

  function loadFile() {
    var input = dom.html("input", { type: "file", accept: "image/svg+xml" });
    if (!input) {
      return;
    }
    input.addEventListener("change", function(evt) {
      readFile(input.files[0]);
    });
    input.click();
  }

  // Save script to gist;
  function saveCurrentScriptsToGist(event) {
    event.preventDefault();
    // console.log("Saving to Gist");
    ajax.post(
      "https://api.github.com/gists",
      function(data) {
        //var raw_url = JSON.parse(data).files["script.json"].raw_url;
        gistID = JSON.parse(data)
          .url.split("/")
          .pop();
        var path = location.href.split("?")[0];
        path += "?gist=" + gistID;
        window.location = path;
      },
      JSON.stringify({
        description: "saved drawingboard file",
        public: true,
        files: {
          "animation.svg": {
            content: saveFormat()
          }
        }
      }),
      function(statusCode, x) {
        alert(
          "Can't save to Gist:\n" + statusCode + " (" + x.statusText + ") "
        );
      }
    );
  }

  var gistID = null;

  function loadScriptsFromGistId(id) {
    //we may get an event passed to this function so make sure we have a valid id or ask for one
    gistID = isNaN(parseInt(id))
      ? prompt(
          "What Gist would you like to load? Please enter the ID of the Gist: "
        )
      : id;
    if (!gistID) return;
    ajax.get(
      "https://api.github.com/gists/" + gistID,
      function(gist) {
        restoreFormat(JSON.parse(gist).files["animation.svg"].content);
      },
      function(statusCode, x) {
        alert(
          "Can't load from Gist:\n" + statusCode + " (" + x.statusText + ") "
        );
      }
    );
  }

  function newFile() {
    let forSure = confirm('This will delete your current document, be sure to save first. Delete and start a new document?');
    if (forSure){
      clear();
      onChange();
    }
  }

  function onChange() {
    if (gistID) {
      gistID = null;
      var path = location.href.split("?")[0];
      history.replaceState(null, null, path);
    }
  }

  function queryMoat(cb) {
    fetch(MOAT_URL + "programs/?integration=shimmy").then(response =>
      response.json().then(cb)
    );
  }
  if (USE_MOAT) {
    window.addEventListener("load", e => queryMoat(setMoatUI), true);
  } else {
    document.getElementById("moat-container").remove();
  }

  window.file = {
    onChange: onChange,
    new: newFile,
    clear: clear,
    loadFile,
    saveFile,
    saveBlob,
    saveLocal,
    saveAs,
    sendToMoat
  };

  window.addEventListener("unload", saveLocal, false);
  window.addEventListener("load", restore, false);
})(window);
