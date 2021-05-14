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

/* globals dom file KellyColorPicker undo
            toDataURL canvas GIF
           getAnimationBBox play
           Pen Move Rotate ZoomIn ZoomOut Eraser 
           addFrame deleteFrame cloneFrame _clear
           gotoFirstFrame gotoLastFrame incrementFrame decrementFrame
           key */
import {palettes} from "./palettes.js";
import * as file from "./file.js";
import * as state from "./state.js";
import * as ui from "./ui.js";
import * as tool from "./tool.js";
import SVGCanvas from "./svgcanvas";

const mouse = {};



let aboutShimmyDialog = document.querySelector("#aboutShimmy");
let shortcutsDialog = document.querySelector("#shortcuts");


function showAbout() {
  aboutShimmyDialog.showModal();
}

function showShortcuts() {
  aboutShimmyDialog.close();
  shortcutsDialog.showModal();
}

function getSvgPoint(x, y) {
  let point = document.querySelector("svg").createSVGPoint();
  point.x = x;
  point.y = y;
  return point;
}


const newFile = file.new;

// move to ui.js
// Color picker
const colorpicker = new KellyColorPicker({
  place: document.querySelector(".popup-color"),
  input: ".js-color",
  size: 200,
  color: "#ffffff",
  method: "square",
  input_color: false, // or inputColor (since v1.15)
  input_format: "mixed", // or inputFormat (since v1.15)
  alpha: 1,
  alpha_slider: false, // or alphaSlider (since v1.15)
  colorSaver: false,
  resizeWith: true, // auto redraw canvas on resize window
  popupClass: "popup-color",
  userEvents: {
    change : function(self) {
      // set background color for 'input' to current color of color picker
      if(self.getCurColorHsv().v < 0.5){
      self.getInput().style.color = "#FFF";
    } else {
      self.getInput().style.color = "#000";
    }
    self.getInput().style.background = self.getCurColorHex();
    }
  }
});

function selectToolbarHandler(button){
  ui.toggleToolbar(button.id, button);
}



let choosingBackground = false;

function colorPopup(input) {
  let popup = document.querySelector(".popup-color");
  let colorwell;
  if (input.id === "backgroundcolor") {
    choosingBackground = true;
    colorwell = input;
  } else {
    choosingBackground = false;
    colorwell = document.querySelector(".js-color");
  }
  if (popup.style.display === "none" || popup.style.display === "") {
    colorpicker.setColor(input.value);
    popup.style.display = "block";
  } else {
    let color = colorpicker.getCurColorHex();
    colorButton(colorwell, color);
    colorButton(input, color);
    if (choosingBackground) {
      canvas.style.backgroundColor = color;
    } else {
      currentColor = color;
    }
    popup.style.display = "none";
  }
}

function setBackgroundColor(color) {
  colorButton(document.getElementById("backgroundcolor"), color);
  canvas.style.backgroundColor = color;
}

function colorButton(button, color) {
  button.value = color;
  button.style.backgroundColor = color;
  if (hexToValue(color) < 0.5) {
    button.style.color = "#FFF";
  } else {
    button.style.color = "#000";
  }
}

function hexToValue(hex) {
  return colorpicker.rgbToHsv(colorpicker.hexToRgb(hex)).v;
}

function selectColor(input) {
  let popup = document.querySelector(".popup-color");
  let colorwell = document.querySelector(".js-color");
  if (popup.style.display === "block") {
    let color = colorpicker.getCurColorHex();
    colorButton(colorwell, color);
    colorButton(input, color);
    currentColor = color;
    popup.style.display = "none";
  } else {
    colorButton(colorwell, input.value);
    currentColor = input.value;
  }
}

// Prevent control clicks from passing through to svg
function swallowClicks(evt) {
  evt.stopPropagation();
  // evt.preventDefault();
}
dom.listen(".toolbar, .tabbar", ["mousedown", "touchstart"], swallowClicks);

const toolStart = evt => state.currentTool.start(evt);
const toolMove = evt => state.currentTool.move(evt);
const toolStop = evt => state.currentTool.stop(evt);
const toolCancel = evt => state.currentTool.cancel();
const escCancel = evt => {
  if (evt.code && evt.code === "Escape") {
    state.currentTool.cancel();
  }
};

let body = document.body;

function listenCanvas() {
  dom.listen(canvas, ["mousedown", "touchstart"], toolStart);
  dom.listen(canvas, ["mousemove", "touchmove"], toolMove);
  dom.listen(canvas, "touchend", toolStop);
  dom.listen(canvas, "touchcancel", toolCancel);
}

dom.listen(body, "mouseup", toolStop);
dom.listen(body, "keydown", escCancel);

function currentFrame() {
  let frame = document.querySelector(".frame.selected");
  if (!frame) {
    frame = dom.svg("g", { class: "frame selected" });
    canvas.insertBefore(frame, canvas.firstElementChild);
  }
  return frame;
}


function undoLine() {
  dom.remove(currentFrame().lastElementChild);
  file.onChange();
}

function newAnimation(evt) {
  file.new();
  updateFrameCount();
  // FIXME: Reset undo/redo stacks
}

/* FILE Functions */

function setMoatUI(list) {
  let moat = document.getElementById("moat");
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
    document.getElementById("save-moat").disabled = true;
  }
}

function clearMoatUI() {
  document.getElementById("moat-container").remove();
}

function saveToMoat() {
  let moat = document.getElementById("moat");
  if (!moat.value) {
    alert("You have to choose a Moat program first");
    return;
  }
  file.sendToMoat(moat.value);
}

function saveAsSvg(evt) {
  file.saveFile();
}

function saveFrameAsPng(evt) {
  let { x, y, width, height } = getAnimationBBox();
  let img = frameToImage(currentFrame(), x, y, width, height);
  // FIXME: save the image
}

function saveAsGif(evt) {
  let title = prompt("Save GIF file as: ", name);
  if (!title) {
    return;
  }
  let gif = new GIF({
    workers: 2,
    quality: 10,
    workerScript: "lib/gif.worker.js",
    background: document.getElementById("backgroundcolor").value
  });
  let images = animationToImages();
  images.forEach(img => gif.addFrame(img, { delay: currentFrameDelay }));
  gif.on("finished", function(blob) {
    console.info("gif completed");
    file.saveBlob(blob, `${title}.gif`);
    window.open(URL.createObjectURL(blob));
  });
  gif.render();
}

function openSvg(evt) {
  file.loadFile();
}


function frameToImage(frame, x, y, width, height, callback) {
  let c = new SVGCanvas(frame, x, y, width, height);
  return c.canvas;
}

function toggleDisplay(evt) {
  evt.preventDefault();
  evt.stopPropagation();
  if (currentDisplay === "drawingboard") {
    currentDisplay = "storyboard";
    displayAsStoryboard();
  } else {
    currentDisplay = "drawingboard";
    displayAsDrawingboard();
  }
}

function animationToImages() {
  let { x, y, width, height } = getAnimationBBox();
  return Array.from(document.querySelectorAll(".frame")).map(frame =>
    frameToImage(frame, x, y, width, height)
  );
}

function saveAsSpritesheet() {
  var title = prompt("Save PNG file as: ", name);
  if (!title) {
    return;
  }
  let { x, y, width, height } = getAnimationBBox();
  let frames = document.querySelectorAll(".frame");
  let canvas = dom.html("canvas", {
    width: width,
    height: height * frames.length
  });
  let ctx = canvas.getContext("2d");
  frames.forEach((frame, idx) => {
    ctx.drawImage(frameToImage(frame, x, y, width, height), 0, height * idx);
  });
  file.saveAs(canvas, `${title}.png`);
}

function displayAsStoryboard() {
  let frames = animationToImages();
  frames.forEach(f => document.body.appendChild(f));
  document.body.classList.add("storyboard");
  canvas.style.display = "none";
}

function displayAsDrawingboard() {
  Array.from(document.querySelectorAll(".storyboard-frame")).map(f =>
    f.remove()
  );
  document.body.classList.remove("storyboard");
  canvas.style.display = "block";
}

function hideUI(button) {
  if (button.matches(".active")) {
    button.classList.remove("active");
    document
      .querySelectorAll(".toolbar")
      .forEach(tb => (tb.style.display = "flex"));
  } else {
    button.classList.add("active");
    document
      .querySelectorAll(".toolbar")
      .forEach(tb => (tb.style.display = "none"));
  }
}

function keydownHandler(evt) {
  if ((evt.key || evt.keyIdentifier) === "Control") {
    document.body.classList.add("usefiles");
  }
}

function keyupHandler(evt) {
  if ((evt.key || evt.keyIdentifier) === "Control") {
    document.body.classList.remove("usefiles");
  }
}

window.app = {
  updateFrameCount: updateFrameCount,
  play: play
};

document.addEventListener("keydown", keydownHandler, false);
document.addEventListener("keyup", keyupHandler, false);

// Attempt to disable default Safari iOS pinch to zoom (failed)

// document.body.addEventListener('touchmove', function (event) {
//   if (event.scale !== 1) { event.preventDefault();  event.stopPropagation();}
//   if (event.changedTouches.length > 1){
//     event.preventDefault(); event.stopPropagation();
//   }
// }, false);

// Attempt again to disable default Safari iOS pinch to zoom and replace with our own zoom
function gestureStart(event) {}

function gestureChange(event) {
  // Disable browser zoom
  event.preventDefault();
  // need centre point between fingers to zoom from and amount to zoom
}

function gestureEnd(event) {}

document.documentElement.addEventListener("gesturestart", gestureStart, false);
document.documentElement.addEventListener(
  "gesturechange",
  gestureChange,
  false
);
document.documentElement.addEventListener("gestureend", gestureEnd, false);

// Disable default Safari iOS double-tap to zoom
var lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  function(event) {
    var now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  false
);

/* Initialize Undo UI */
const undoButtons = {
  frameUndo: document.querySelector("#frameundo"),
  frameRedo: document.querySelector("#frameredo")
};

/* Show current undo options on buttons */
function updateUndo(evt) {
  ["frameUndo", "frameRedo"].forEach(key => {
    if (evt.detail[key]) {
      undoButtons[key].disabled = false;
      undoButtons[key].innerText =
        (key.endsWith("Undo") ? "Undo " : "Redo ") + evt.detail[key];
    } else {
      undoButtons[key].innerText = key.endsWith("Undo") ? "Undo" : "Redo";
      undoButtons[key].disabled = true;
    }
  });
  const frameCount = document.querySelectorAll(".frame").length;
  if (frameCount > 1) {
    document.querySelector("#framedelete").removeAttribute("disabled");
  } else {
    document.querySelector("#framedelete").setAttribute("disabled", "disabled");
  }
}
document.addEventListener("shimmy-undo-change", updateUndo, false);

// Show About dialogue the first time someone visits.
if (!localStorage.hasSeenAbout) {
  localStorage.hasSeenAbout = true;
  aboutShimmyDialog.showModal();
  setTimeout(() => aboutShimmyDialog.close(), 3000);
}

// If we don't explicitly request moat integration, hide it

// Show/Hide Timeline

function toggleVisible(element){
  element.hasAttribute('hidden') ? element.removeAttribute('hidden') : element.setAttribute('hidden', 'hidden');
}

function toggleTimeline(){
  document.querySelectorAll('.timeline > div').forEach(toggleVisible);
}

//////////////////////////////////////////////////////////
//
// keyboard shortcuts
//
//////////////////////////////////////////////////////////

var isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

function addShortcuts(shortcuts, fn, uxid, macHint, pcHint) {
  key(shortcuts, (evt, handler) => {
    fn(evt, handler);
    return false;
  });
  if (!uxid) {
    return;
  }
  let elems = document.querySelectorAll(uxid);
  elems.forEach(
    elem => (elem.title = elem.title + " (" + (isMac ? macHint : pcHint) + ")")
  );
}

function changePenOrEraserSize(evt, handler) {
  let ui = null;
  if (currentTool === tools.pen) {
    ui = document.querySelector("#pensize");
  } else if (currentTool === tools.eraser) {
    ui = document.querySelector("#erasersize");
  } else {
    return;
  }
  if (handler.shortcut.endsWith("-")) {
    ui.stepDown();
  } else {
    ui.stepUp();
  }
  ui.oninput(); // this is messed up, but whatever works, if I replace how Steppers work this will have to change
  // ui.dispatchEvent(new Event('change', {bubbles: true})); // notify listeners that the value has changed
}

// Key shortcuts: Command: ⌘
//                Control: ⌃
//                Shift:   ⇧
//              Backspace: ⌫
//                Delete:  ⌦
//                Arrows: ← →

addShortcuts(
  "esc",
  () => document.querySelector("#shimmy").click(),
  "#shimmy",
  "esc",
  "esc"
);
addShortcuts("d", toggleDisplay, "", "d", "d");
// Undo/Redo
addShortcuts(
  "⌘+z, ctrl+z",
  () => undo.undo(currentFrame()),
  "#frameundo",
  "⌘-z",
  "⌃-z"
);
addShortcuts(
  "shift+⌘+z, ctrl+y",
  () => undo.redo(currentFrame()),
  "#frameredo",
  "⇧+⌘+z",
  "⌃+y"
);
// Files
addShortcuts("n", file.new, "#filenew", "n", "n");
addShortcuts("⌘+s, ctrl+s", saveAsSvg, "#filesave", "⌘+s", "⌃+s");
addShortcuts("⌘+o, ctrl+o", openSvg, "#fileopen", "⌘+o", "⌃+o");
addShortcuts("g", saveAsGif, "#filegif", "g", "g");
addShortcuts("p", saveAsSpritesheet, "#filepng", "p", "p");
// Tools
addShortcuts(
  "shift+1",
  () => selectTool({ value: "pen" }),
  "#toolpen",
  "⇧+1",
  "⇧+1"
);
addShortcuts(
  "shift+2",
  () => selectTool({ value: "rotate" }),
  "#toolrotate",
  "⇧+2",
  "⇧+2"
);
addShortcuts(
  "shift+3",
  () => selectTool({ value: "move" }),
  "#toolmove",
  "⇧+3",
  "⇧+3"
);
addShortcuts(
  "shift+4",
  () => selectTool({ value: "zoomin" }),
  "#toolzoomin",
  "⇧+4",
  "⇧+4"
);
addShortcuts(
  "shift+5",
  () => selectTool({ value: "zoomout" }),
  "#toolzoomput",
  "⇧+5",
  "⇧+5"
);
addShortcuts(
  "shift+6",
  () => selectTool({ value: "eraser" }),
  "#tooleraser",
  "⇧+6",
  "⇧+6"
);
addShortcuts(
  "shift+=, =, -",
  changePenOrEraserSize,
  "#pensize,#erasersize",
  "+/-",
  "+/-"
);
// TODO: Add zoomin in/out without switching tools
// colors
addShortcuts(
  "1",
  () => document.querySelector("#color1").click(),
  "#color1",
  "1",
  "1"
);
addShortcuts(
  "2",
  () => document.querySelector("#color2").click(),
  "#color2",
  "2",
  "2"
);
addShortcuts(
  "3",
  () => document.querySelector("#color3").click(),
  "#color3",
  "3",
  "3"
);
addShortcuts(
  "4",
  () => document.querySelector("#color4").click(),
  "#color4",
  "4",
  "4"
);
addShortcuts(
  "5",
  () => document.querySelector("#color5").click(),
  "#color5",
  "5",
  "5"
);
addShortcuts(
  "6",
  () => document.querySelector("#color6").click(),
  "#color6",
  "6",
  "6"
);
addShortcuts(
  "7",
  () => document.querySelector("#color7").click(),
  "#color7",
  "7",
  "7"
);
addShortcuts(
  "8",
  () => document.querySelector("#color8").click(),
  "#color8",
  "8",
  "8"
);
// Frames
addShortcuts("shift+n", () => addFrame(), "#framenew", "⇧+n", "⇧+n");
addShortcuts(
  "shift+backspace, shift+delete",
  () => deleteFrame(),
  "#framedelete",
  "⇧+⌫",
  "⇧+⌦"
);
addShortcuts("shift+c", () => cloneFrame(), "#framecopy", "⇧+c", "⇧+c");
addShortcuts("shift+x", () => _clear(), "#frameclear", "⇧+x", "⇧+x");
addShortcuts("shift+left", gotoFirstFrame, "#framefirst", "⇧+←", "⇧+←");
addShortcuts("left", decrementFrame, "#frameprev", "←", "←");
addShortcuts("right", incrementFrame, "#framenext", "→", "→");
addShortcuts(
  "shift+right",
  gotoLastFrame,
  "#framelast",
  gotoLastFrame,
  "⇧+→",
  "⇧+→"
);
addShortcuts(
  "k",
  () => document.querySelector("#doonionskin").click(),
  "#doonionskin",
  "k",
  "k"
);
// Animate
addShortcuts("r", play, "animateplay", "r", "r");
