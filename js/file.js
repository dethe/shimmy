// Copyright (C) 2020 Dethe Elza

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

/* globals QRCode timeago*/

// TODO: Separate out Moat and file-format specifics, other non-file functions

import * as dom from "./dom.js";
const {$, $$} = dom;

// CONFIGURATION
let params = new URLSearchParams(new URL(window.location).search);
const USE_MOAT = params.has("moat");

const MOAT_URL = window.location.host.includes("glitch")
  ? "https://sd-moat.glitch.me/"
  : "https://launchpad.yourlibrary.ca/moat/";


function save(data, title){
  if (!title) {
    return;
  }
  saveAs(data, `${title}.svg`);
}

const filetypes = {
  svg: "image/svg+xml",
  png: "image/png",
  gif: "image/gif",
};

function saveToCallback(data, filename, cb) {
  // Callback is shaped cb(blob, filename);
  let ext = filename.split(".").pop();
  let filetype = filetypes[ext];
  if (data.toBlob) {
    // ex: canvas.toBlob()
    data.toBlob(blob => cb(blob, filename), filetype);
  } else {
    cb(new Blob([data], { type: filetype }), filename);
  }
}

function sendToMoat(data, filename, progid) {
  saveToCallback(data, filename, (blob, filename) =>
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
  alert("Error uploading to Moat during " + step + " step, please try again.");
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
      correctLevel: QRCode.CorrectLevel.H,
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
  reader.onloadend = function () {
    var a = dom.html("a", {
      href: reader.result,
      download: filename,
      target: "_blank",
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  reader.readAsDataURL(blob);
}

function read(file, cb) {
  var fileName = file.name;
  if (fileName.indexOf(".svg", fileName.length - 5) === -1) {
    return alert("Not an SVG file");
  }
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function (evt) {
    cb(evt.target.result);
  };
}

function load(cb) {
  let forSure = confirm(
    "This will overwrite your current document, be sure to save first. Delete and open another document?"
  );
  if (!forSure) {
    return;
  }

  var input = dom.html("input", { type: "file", accept: "image/svg+xml" });
  if (!input) {
    return;
  }
  dom.listen(input, "change", evt => read(input.files[0], cb));
  input.click();
}

function setMoatUI(list) {
  let moat = $("#moat");
  if (list.length) {
    if (list.length > 1) {
      moat.append(dom.html("option", { value: "" }, "Choose a Program"));
    }
    list.forEach(item =>
      moat.append(dom.html("option", { value: item.id }, item.name))
    );
  } else {
    moat.appendChild(
      dom.html("option", { value: "" }, "No Moat Programs Found")
    );
    moat.disabled = true;
    $("#save-moat").disabled = true;
  }
}

function clearMoatUI() {
  $("#moat-container").remove();
}


function queryMoat(cb) {
  fetch(MOAT_URL + "programs/?integration=shimmy").then(response =>
    response.json().then(cb)
  );
}
if (USE_MOAT) {
  dom.listen(window, "load", e => queryMoat(setMoatUI));
} else {
  $("#moat-container").remove();
}

export {
  load,
  save,
  saveAs,
  sendToMoat,
};
