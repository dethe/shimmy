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

/* globals dom file KellyColorPicker UndoRedo
           palettes toDataURL canvas GIF
           getAnimationBBox play
           Pen Move Rotate ZoomIn ZoomOut Eraser 
           addFrame deleteFrame cloneFrame
           key */

const mouse = {};

const DEG = 180 / Math.PI;
const degrees = rads => rads * DEG;
const radians = degs => degs / DEG;

let currentColor = "#000000";
let currentFrameDelay = 30; // milliseconds
let currentMatrix = null;
let WIDTH = document.body.clientWidth;
let HEIGHT = document.body.clientHeight;
let currentDisplay = "drawingboard";
let currentTool;
let currentStrokeWidth = 1;
let currentEraserWidth = 5;
let currentDoOnionskin = true;
let undo = null;

let aboutShimmyDialog = document.querySelector("#aboutShimmy");

function showAbout() {
  aboutShimmyDialog.showModal();
}

function getSvgPoint(x, y) {
  let point = document.querySelector("svg").createSVGPoint();
  point.x = x;
  point.y = y;
  return point;
}

function getState() {
  let tabs = document.querySelectorAll(".js-tab");
  let state = {
    tool: currentTool.name,
    strokeWidth: document.getElementById("pensize").value,
    eraserWidth: document.getElementById("erasersize").value,
    doOnionskin: document.getElementById("doonionskin").checked,
    fps: document.getElementById("framerate").value,
    palette: document.getElementById("colorpalette").selectedIndex,
    color: document.getElementById("pencolor").value,
    bgcolor: document.getElementById("backgroundcolor").value,
    color1: document.getElementById("color1").value,
    color2: document.getElementById("color2").value,
    color3: document.getElementById("color3").value,
    color4: document.getElementById("color4").value,
    color5: document.getElementById("color5").value,
    color6: document.getElementById("color6").value,
    color7: document.getElementById("color7").value,
    color8: document.getElementById("color8").value
  };
  tabs.forEach(
    button => (state[`tab_${button.id}`] = button.matches(".active"))
  );
  return state;
}

function setState(state) {
  let currentTabs = document.querySelectorAll(".js-tab.active");
  currentTabs.forEach(selectToolbar); // turn off any active tabs
  ["file", "draw", "frames", "animate"].forEach(tabid => {
    if (state[`tab_${tabid}`] !== "false") {
      selectToolbar(document.getElementById(tabid));
    }
  });
  selectTool({ value: state.tool || "pen" });
  currentStrokeWidth = parseInt(state.strokeWidth || 2);
  currentEraserWidth = parseInt(state.eraserWidth || 5);
  document.getElementById("pensize").value = currentStrokeWidth;
  document.getElementById("erasersize").value = currentEraserWidth;
  currentDoOnionskin = state.doOnionskin !== "false";
  document.getElementById("doonionskin").checked = currentDoOnionskin;
  currentFrameDelay = 1000 / new Number(state.fps || 10);
  document.getElementById("framerate").value = state.fps;
  let palette = document.getElementById("colorpalette");
  palette.selectedIndex = state.palette || 0;
  setPalette({ target: palette.options[state.palette || 0] });
  currentColor = state.color || "#000000";
  colorButton(document.getElementById("pencolor"), currentColor);
  colorButton(
    document.getElementById("backgroundcolor"),
    state.bgcolor || "#FFFFFF"
  );
  colorButton(document.getElementById("color1"), state.color1 || "#000000");
  colorButton(document.getElementById("color2"), state.color2 || "#FFFFFF");
  colorButton(document.getElementById("color3"), state.color3 || "#666666");
  colorButton(document.getElementById("color4"), state.color4 || "#69D2E7");
  colorButton(document.getElementById("color5"), state.color5 || "#A7DBD8");
  colorButton(document.getElementById("color6"), state.color6 || "#E0E4CC");
  colorButton(document.getElementById("color7"), state.color7 || "#F38630");
  colorButton(document.getElementById("color8"), state.color8 || "#FA6900");
  undo = UndoRedo(currentFrame());
  console.log('undo is initialized: %o', undo);
}

function newFile() {
  file.new();
}

// Initialization of canvas happens in file.js
const colorpaletteselect = document.querySelector(".palettechooser");
palettes.forEach((p, i) => {
  colorpaletteselect.append(dom.html("option", { value: i }, p.name));
});
colorpaletteselect.addEventListener("change", setPalette);

function changeColor(picker) {
  let color = picker.getCurColorHex();
  let hsv = picker.getCurColorHsv();
}
// Color picker
const colorpicker = new KellyColorPicker({
  place: document.querySelector(".popup-color"),
  input: ".js-color",
  size: 200,
  color: "#ffffff",
  method: "square",
  input_color: false, // or inputColor (sice v1.15)
  input_format: "mixed", // or inputFormat (since v1.15)
  alpha: 1,
  alpha_slider: false, // or alphaSlider (since v1.15)
  colorSaver: false,
  resizeWith: true, // auto redraw canvas on resize window
  popupClass: "popup-color",
  userEvents: {
    change: changeColor
    // change : function(self) {
    //   // set background color for 'input' to current color of color picker
    //   if(self.getCurColorHsv().v < 0.5){
    //   self.getInput().style.color = "#FFF";
    // } else {
    //   self.getInput().style.color = "#000";
    // }
    // self.getInput().style.background = self.getCurColorHex();
    // }
  }
});

function setPalette(evt) {
  let palette = palettes[parseInt(evt.target.value)];
  let wells = document.querySelectorAll(".js-miniwell");
  for (let i = 0; i < 5; i++) {
    colorButton(wells[i], "#" + palette.colors[i]);
  }
}
setPalette({ target: colorpaletteselect });

function selectToolbar(button) {
  let name;
  if (typeof button === "string") {
    name = button;
    button = document.getElementById(name);
  } else {
    name = button.id;
  }
  let toolbar = document.querySelector(`#${name}-toolbar`);
  if (button.classList.contains("active")) {
    button.classList.remove("active");
    toolbar.classList.remove("active");
  } else {
    button.classList.add("active");
    toolbar.classList.add("active");
  }
}

function enablePenSize(flag) {
  document.querySelector(".feedback.pensize").removeAttribute("hidden");
  document.querySelector(".feedback.erasersize").setAttribute("hidden", "");
  document
    .querySelectorAll(".pensize .stepper > *")
    .forEach(d => (d.disabled = !flag));
}

function enableEraserSize() {
  document.querySelector(".feedback.erasersize").removeAttribute("hidden");
  document.querySelector(".feedback.pensize").setAttribute("hidden", "");
}

let tools = {
  pen: new Pen(canvas),
  move: new Move(canvas),
  rotate: new Rotate(canvas),
  zoomin: new ZoomIn(canvas),
  zoomout: new ZoomOut(canvas),
  eraser: new Eraser(canvas)
};
currentTool = tools.pen;

function selectTool(sel) {
  let name = sel.value;
  switch (name) {
    case "pen":
      currentTool = tools.pen;
      enablePenSize(true);
      break;
    case "move":
      currentTool = tools.move;
      enablePenSize(false);
      break;
    case "rotate":
      currentTool = tools.rotate;
      enablePenSize(false);
      break;
    case "zoomin":
      currentTool = tools.zoomin;
      enablePenSize(false);
      break;
    case "zoomout":
      currentTool = tools.zoomout;
      enablePenSize(false);
      break;
    case "eraser":
      currentTool = tools.eraser;
      enableEraserSize();
      break;
    default:
      console.error("unrecognized tool name: %s", name);
  }
  currentTool.select();
}

function setFrameRate(input) {
  currentFrameDelay = Math.floor(1000 / Number(input.value));
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

const toolStart = evt => currentTool.start(evt);
const toolMove = evt => currentTool.move(evt);
const toolStop = evt => currentTool.stop(evt);
const toolCancel = evt => currentTool.cancel();
const escCancel = evt => {
  if (evt.code && evt.code === "Escape") {
    currentTool.cancel();
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

function updateFrameCount() {
  try {
    let frames = Array.from(document.querySelectorAll(".frame"));
    let index = frames.indexOf(currentFrame()) + 1;
    document.querySelector(".framecount output").textContent =
      index + " of " + frames.length;
  } catch (e) {
    // wait for the file to load, probably
  }
}

function undoLine() {
  dom.remove(currentFrame().lastElementChild);
  file.onChange();
}

function newAnimation(evt) {
  file.new();
  updateFrameCount();
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
  var gif = new GIF({
    workers: 2,
    quality: 10,
    workerScript: "lib/gif.worker.js",
    background: document.getElementById("backgroundcolor").value
  });
  let images = animationToImages();
  images.forEach(img => gif.addFrame(img, { delay: currentFrameDelay }));
  gif.on("finished", function(blob) {
    console.log("gif completed");
    file.saveBlob(blob, "animation.gif");
    window.open(URL.createObjectURL(blob));
  });
  gif.render();
}

function saveAsMovie(evt) {
  console.log("save as movie");
}

function openSvg(evt) {
  file.loadFile();
}

class SVGCanvas {
  constructor(frame, x, y, width, height) {
    this.canvas = dom.html("canvas", {
      width: width,
      height: height,
      class: "storyboard-frame"
    });
    this.ctx = this.canvas.getContext("2d");
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.svg = frame;
    this.offset = { x, y };
    this.draw();
  }

  draw() {
    this.setTransforms();
    let lines = this.svg.querySelectorAll("path");
    lines.forEach(line => this.drawLine(line));
  }

  setTransforms() {
    let { a, b, c, d, e, f } = this.svg.getCTM();
    this.ctx.setTransform(a, b, c, d, e - this.offset.x, f - this.offset.y);
  }

  translate(x, y) {
    this.ctx.translate(x, y);
  }

  scale(x) {
    this.ctx.scale(x, x);
  }

  rotate(angle, cx, cy) {
    this.ctx.translate(cx, cy);
    this.ctx.rotate(radians(angle));
    this.ctx.translate(-cx, -cy);
  }

  drawLine(line) {
    this.ctx.beginPath();
    this.ctx.lineWidth = Number(line.getAttribute("stroke-width"));
    this.ctx.strokeStyle = line.getAttribute("stroke");
    let points = Array.from(line.points);
    let start = points.shift();
    this.ctx.moveTo(start.x, start.y);
    points.forEach(p => {
      this.ctx.lineTo(p.x, p.y);
    });
    this.ctx.stroke();
  }
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
  file.saveAs(canvas, "image.png");
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

function hotkeys(evt) {
  if (evt.altKey) return;
  if (evt.shiftKey) return;
  if (evt.ctrlKey) return;
  switch (evt.key) {
    case "n":
      newAnimation(evt);
      break;
    case "s":
      saveAsSvg(evt);
      break;
    // case "f":
    //   saveFrameAsPNG(evt); // not implemented
    //   break;
    case "g":
      saveAsGif(evt);
      break;
    case "m":
      saveAsMovie(evt);
      break;
    case "o":
      openSvg(evt);
      break;
    case "d":
      toggleDisplay(evt);
      break;
  }
}
console.log(
  "n new | s save | f save frame | g gif | m movie | o open | d toggle display"
);

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
document.addEventListener("keydown", hotkeys, false);

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

/* Initialize Undo */
const undoButtons = {
  frameUndo: document.querySelector("#frameundo"),
  frameRedo: document.querySelector("#frameredo")
};

function updateUndo(evt) {
  // console.log("updateUndo(%o)", evt.detail);
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
  const frameCount = document.querySelectorAll('.frame').length;
  if (frameCount > 1){
    document.querySelector('#deleteFrame').removeAttribute('disabled');
  }else{
    document.querySelector('#deleteFrame').setAttribute('disabled', 'disabled');
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

// keyboard shortcuts

var isMac = navigator.platform.toUpperCase().indexOf('MAC')>=0;

addShortcuts(shortcuts, fn, uxid, macHint, pcHint){
  key(shortcuts, ()=>{fn(), return false;});
  let elem = document.querySelector(uxid);
  elem.title = elem.title + ' (' + (isMac ? macHint : pcHint) + ')'; 
}

// Undo/Redo
key('⌘+z, ctrl+z', ()=>{undo.frameUndo(); return false;});
key('shift+⌘+z, ctrl+y', ()=>{undo.frameRedo(); return false;});
// Switch tools
key('⌘+1, ctrl+1', ()=>{selectTool({value:"pen"}); return false;});
key('⌘+2, ctrl+2', ()=>{selectTool({value:"rotate"}); return false;});
key('⌘+3, ctrl+3', ()=>{selectTool({value:"move"}); return false;});
key('⌘+4, ctrl+4', ()=>{selectTool({value:"zoomin"}); return false;});
key('⌘+5, ctrl+5', ()=>{selectTool({value:"zoomout"}); return false;});
key('⌘+6, ctrl+6', ()=>{selectTool({value:"eraser"}); return false;});
// Files
key('⌘+n, ctrl+n', ()=>{file.new(); return false;});
key('⌘+s, ctrl+s', ()=>{saveAsSvg(); return false;});
key('⌘+o, ctrl+o', ()=>{openSvg(); return false;});
key('shift+⌘+s, shift+ctrl+', ()=>{saveAsGif(); return false;});
key('shift+⌘+n, shift+ctrl+n', ()=>{saveAsSpritesheet(); return false;});
// Frames
key('shift+⌘+n, shift+ctrl+n', ()=>{addFrame(); return false;});
key('shift+⌘+backspace, shift+ctrl+backspace, shift+ctrl+delete', ()=>{deleteFrame(); return false;});
key('shift+⌘+c, shift+ctrl+c', ()=>{cloneFrame(); return false;});
key('shift+⌘+x, shift+ctrl+x', ()=>{_clear(); return false;});
key('')
