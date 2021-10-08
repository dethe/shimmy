// File support for use with Moat filesharing
// See moat server: https://glitch.com/~sd-moat

import { $ } from "./dom.js";
import timeago from "../lib/timeago.js";

// CONFIGURATION
let params = new URLSearchParams(new URL(window.location).search);
const USE_MOAT = params.has("moat");

const MOAT_URL = window.location.host.includes("glitch")
  ? "https://sd-moat.glitch.me/"
  : "https://launchpad.yourlibrary.ca/moat/";

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

export { sendToMoat };
