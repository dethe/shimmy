/* globals dom file KellyColorPicker palettes toDataURL canvas GIF UndoRedo*/

const mouse = {};

const DEG = 180 / Math.PI;
const degrees = rads => rads * DEG;
const radians = degs => degs / DEG;
const ZOOMIN = 1.2;
const ZOOMOUT = 1 / ZOOMIN;

let currentColor = "#000000";
let currentFrameDelay = 30; // milliseconds
let currentMatrix = null;
let WIDTH = document.body.clientWidth;
let HEIGHT = document.body.clientHeight;
let _lastFrameTime = 0;
let currentDisplay = "drawingboard";
let currentTool;
let currentStrokeWidth = 1;
let currentDoOnionskin = true;
let undo = null;

function getState() {
  let tabs = document.querySelectorAll(".js-tab");
  let state = {
    tool: currentTool.name,
    strokeWidth: document.getElementById("pensize").value,
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
  document.getElementById("pensize").value = state.strokeWidth;
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
}

function newFile(){
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

class Pen {
  constructor() {
    this.name = "pen";
    this.drawing = false;
    this.currentPath = null;
  }

  startPath(x, y) {
    this.currentPath = currentFrame().appendChild(
      dom.svg("path", {
        d: "M " + x + "," + y,
        stroke: currentColor,
        "stroke-width": currentStrokeWidth,
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
        fill: "none"
      })
    );
    // console.log('currentPath: %o', this.currentPath);
    file.onChange();
  }

  appendToPath(x, y) {
    let path = this.currentPath;
    let d = path.getAttribute("d");
    path.setAttribute("d", `${d} L${x}, ${y}`);
  }

  start(evt) {
    saveMatrix();
    let { x, y, err } = getXY(evt);
    if (err) {
      return;
    }
    this.sx = x;
    this.sy = y;
    this.startPath(x, y);
    this.drawing = true;
  }

  move(evt) {
    if (!this.drawing) return;
    let { x, y, wx, wy, err } = getXY(evt);
    if (err) {
      return;
    }
    if (inBounds(wx, wy)) {
      this.appendToPath(x, y);
    }
  }

  stop(evt) {
    if (!this.drawing) return;
    let { x, y, wx, wy, err } = getXY(evt);
    if (err) {
      return;
    }
    let path = this.currentPath;
    let parent = currentFrame();
    if (this.currentPath) {
      if (inBounds(wx, wy) && this.sx === x && this.sy === y) {
        this.appendToPath(x, y);
      }
      //dom.simplifyPath(currentPath);
      this.currentPath = null;
    }
    this.drawing = false;
    currentMatrix = null;
    undo.pushFrameUndo(
      "Draw",
      () => path.remove(),
      () => parent.appendChild(path)
    );
  }

  cancel() {
    this.currentPath.remove();
    this.currentPath = null;
    currentMatrix = null;
  }
}

class Pan {
  constructor() {
    this.name = "pan";
    this.dragging = false;
    this.px = 0;
    this.py = 0;
  }

  start(evt) {
    saveMatrix();
    let { x, y, err } = getXY(evt);
    if (err) {
      return;
    }
    this.px = x;
    this.py = y;
    this.dragging = true;
    this.origTransform = currentFrame().getAttribute("transform") || "";
  }

  move(evt) {
    if (!this.dragging) {
      return;
    }
    let { x, y, err } = getXY(evt);
    if (err) {
      return;
    }
    let dx = x - this.px;
    let dy = y - this.py;
    currentFrame().setAttribute(
      "transform",
      `${this.origTransform} translate(${dx} ${dy})`
    );
  }

  stop(evt) {
    if (!this.dragging) {
      return;
    }
    this.px = 9;
    this.py = 0;
    this.dragging = false;
    let oldTransform = this.origTransform;
    this.origTransform = "";
    currentMatrix = null;
    let curr = currentFrame();
    let newTransform = curr.getAttribute("transform");
    undo.pushFrameUndo(
      "Pan",
      () => curr.setAttribute("transform", oldTransform),
      () => curr.setAttribute("transform", newTransform)
    );
  }

  cancel() {
    currentFrame().setAttribute("transform", this.origTransform);
    this.dragging = false;
    this.origTransform = false;
    currentMatrix = null;
  }
}

function dist(dx, dy) {
  return Math.sqrt(dx * dx + dy * dy);
}

class Rotate {
  constructor() {
    this.name = "rotate";
    this.dragging = false;
    this.px = 0;
    this.py = 0;
    this.originalAngle = null;
  }

  start(evt) {
    saveMatrix();
    let { x, y, err } = getXY(evt);
    if (err) {
      return;
    }
    this.px = x;
    this.py = y;
    this.dragging = true;
    this.origTransform = currentFrame().getAttribute("transform") || "";
  }

  move(evt) {
    if (!this.dragging) {
      return;
    }
    let { x, y, err } = getXY(evt);
    if (err) {
      return;
    }
    let px = this.px;
    let py = this.py;
    let dx = x - px;
    let dy = y - py;
    if (dist(dx, dy) < 20) {
      return;
    } // don't pick starting angle until we've moved a little from the starting point
    if (this.originalAngle !== null) {
      let transform = this.origTransform;
      let angle = degrees(Math.atan2(dy, dx)) - this.originalAngle;
      currentFrame().setAttribute(
        "transform",
        `${transform} rotate(${angle} ${px} ${py})`
      );
    } else {
      this.originalAngle = degrees(Math.atan2(dy, dx));
    }
  }

  stop(evt) {
    if (!this.dragging) {
      return;
    }
    this.px = 9;
    this.py = 0;
    this.dragging = false;
    let oldTransform = this.origTransform;
    this.origTransform = "";
    this.originalAngle = null;
    currentMatrix = null;
    let curr = currentFrame();
    let newTransform = curr.getAttribute("transform");
    undo.pushFrameUndo(
      "Rotate",
      () => curr.setAttribute("transform", oldTransform),
      () => curr.setAttribute("transform", newTransform)
    );
  }

  cancel(evt) {
    currentFrame().setAttribute("transform", this.origTransform);
    this.dragging = false;
    this.origTransform = false;
    currentMatrix = null;
  }
}

class ZoomIn {
  constructor() {
    this.name = "zoomin";
  }

  start(evt) {
    saveMatrix();
    let { x, y, err } = getXY(evt);
    if (err) {
      return;
    }
    let curr = currentFrame();
    let oldTransform = curr.getAttribute("transform") || "";
    let newTransform = `${oldTransform} translate(${x} ${y}) scale(${ZOOMIN}) translate(-${x}, -${y})`;
    currentFrame().setAttribute("transform", newTransform);
    currentMatrix = null;
    undo.pushFrameUndo(
      "Zoom In",
      () => curr.setAttribute("transform", oldTransform),
      () => curr.setAttribute("transform", newTransform)
    );
  }

  move(evt) {
    // do nothing
  }

  stop(evt) {
    // do nothing
  }

  cancel(evt) {
    // do nothing
  }
}

class ZoomOut {
  constructor() {
    this.name = "zoomout";
  }

  start(evt) {
    saveMatrix();
    let { x, y, err } = getXY(evt);
    if (err) {
      return;
    }
    let curr = currentFrame();
    let oldTransform = curr.getAttribute("transform") || "";
    let newTransform = `${oldTransform} translate(${x} ${y}) scale(${ZOOMOUT}) translate(-${x}, -${y})`;
    currentFrame().setAttribute(
      "transform",
      newTransform
    );
    currentMatrix = null;
    undo.pushFrameUndo(
      "Zoom Out",
      () => curr.setAttribute("transform", oldTransform),
      () => curr.setAttribute("transform", newTransform)
    );
  }

  move(evt) {
    // do nothing
  }

  stop(evt) {
    // do nothing
  }

  cancel(evt) {
    // do nothing
  }
}

let tools = {
  pen: new Pen(canvas),
  pan: new Pan(canvas),
  rotate: new Rotate(canvas),
  zoomin: new ZoomIn(canvas),
  zoomout: new ZoomOut(canvas)
};
currentTool = tools.pen;

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
  document
    .querySelectorAll(".pensize .stepper > *")
    .forEach(d => (d.disabled = !flag));
}

function selectTool(sel) {
  let name = sel.value;
  switch (name) {
    case "pen":
      currentTool = tools.pen;
      enablePenSize(true);
      break;
    case "pan":
      currentTool = tools.pan;
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
    default:
      console.error("unrecognized tool name: %s", name);
  }
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

function inBounds(x, y) {
  return !(x < 0 || x > WIDTH || y < 0 || y > HEIGHT);
}

function saveMatrix() {
  let matrix = currentFrame().getCTM();
  if (matrix instanceof SVGMatrix) {
    matrix = new DOMMatrix([
      matrix.a,
      matrix.b,
      matrix.c,
      matrix.d,
      matrix.e,
      matrix.f
    ]);
  }
  currentMatrix = matrix.inverse();
}

function getXY(evt) {
  if (evt.button) {
    // left button is 0, for touch events button will be undefined
    return { x: 0, y: 0, err: true };
  }
  if (evt.changedTouches && evt.changedTouches.length > 1) {
    // don't interfere with multi-touch
    return { x: 0, y: 0, err: true };
  }
  if (evt.cancelable) {
    evt.preventDefault();
  }

  const rect = this.canvas.getBoundingClientRect();
  const position = (evt.changedTouches && evt.changedTouches[0]) || evt;
  let x = position.offsetX;
  let y = position.offsetY;

  if (typeof x === "undefined") {
    x = position.clientX - rect.left;
  }
  if (typeof y === "undefined") {
    y = position.clientY - rect.top;
  }
  // if the frame has been translated, rotated, or scaled, we need to map the point to the current matrix
  let { x: tx, y: ty } = transformPoint(x, y);
  return { x: tx, y: ty, wx: x, wy: y, err: false };
}

function transformPoint(x, y) {
  let frame = currentFrame();
  if (frame.transform.baseVal.length === 0) {
    return { x, y };
  }
  return currentMatrix.transformPoint(new DOMPoint(x, y));
}

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


function playingFrame() {
  return document.querySelector(".frame.play-frame");
}

/***************************************
 *
 *  MANAGE FRAMES
 *
 ***************************************/

function isOnionskinOn() {
  return currentDoOnionskin;
}

function currentOnionskinFrame() {
  return document.querySelector(".frame.onionskin");
}

function updateOnionskin() {
  if (!isOnionskinOn()) return;
  dom.removeClass(currentOnionskinFrame(), "onionskin");
  dom.addClass(dom.previous(currentFrame(), ".frame"), "onionskin");
}

function insertFrame(before, frame) {
  dom.insertAfter(frame, before);
  goToFrame(before, frame);
  file.onChange();
  return frame;
}

function addFrame(suppressUndo) {
  let curr = currentFrame();
  let frame = insertFrame(curr, dom.svg("g", { class: "frame" }));
  if (!suppressUndo) {
    undo.pushDocUndo(
      "New Frame",
      curr,
      frame,
      () => deleteFrame(false),
      () => insertFrame(curr, frame)
    );
  }
}

function cloneFrame(suppressUndo) {
  let curr = currentFrame();
  let frame = insertFrame(curr, curr.cloneNode(true));
  if (!suppressUndo) {
    undo.pushDocUndo(
      "Copy Frame",
      curr,
      frame,
      () => deleteFrame(false),
      () => insertFrame(curr, frame)
    );
  }
}

function removeFrame(frame) {}

function deleteFrame(suppressUndo) {
  let frameToDelete = currentFrame();
  if (frameToDelete.nextElementSibling) {
    incrementFrame(true);
  } else if (frameToDelete.previousElementSibling) {
    decrementFrame(true);
  }
  let curr = currentFrame();
  let prev = frameToDelete.previousElementSibling;
  if (frameToDelete.parentNode.children.length > 1) {
    dom.remove(frameToDelete);
    if (!suppressUndo) {
      undo.pushDocUndo("Delete Frame", curr, frameToDelete, () =>
        insertFrame(prev, curr)
      );
    }
  } else {
    // FIXME: disable the delete button for last frame vs. switching to clear()
    _clear(); // don't delete the last frame, just its children
  }
  file.onChange();
}

function restore(node, children, transform){
  if (transform){
    node.setAttribute('transform', transform);
  }
  children.forEach(child => node.appendChild(child));
  return node;
}

function _clear() {
  let curr = currentFrame();
  let oldTransform = curr.getAttribute('transform') || '';
  let children = [...curr.children];
  dom.clear(curr);
  undo.pushFrameUndo('Clear', () => restore(curr, children, oldTransform), () => dom.clear(curr));
}

function setOnionSkin(input) {
  currentDoOnionskin = input.checked;
  toggleOnionskin();
}

function toggleOnionskin() {
  if (isOnionskinOn()) {
    dom.addClass(currentFrame().previousElementSibling, "onionskin");
  } else {
    dom.removeClass(currentOnionskinFrame(), "onionskin");
  }
}

function goToFrame(prev, next) {
  prev.classList.remove("selected");
  next.classList.add("selected");
  updateOnionskin();
  updateFrameCount();
  undo.switchFrame(next);
}

function incrementFrame(suppressUndo) {
  let curr = currentFrame();
  let next = dom.next(curr, ".frame");
  if (next) {
    goToFrame(curr, next);
    if (!suppressUndo) {
      undo.pushDocUndo(
        "Switch Frame",
        curr,
        next,
        () => goToFrame(next, curr),
        () => goToFrame(curr, next)
      );
    }
  }
}

function decrementFrame(suppressUndo) {
  let curr = currentFrame();
  let prev = dom.previous(curr, ".frame");
  if (prev) {
    curr.classList.remove("selected");
    prev.classList.add("selected");
    updateOnionskin();
    updateFrameCount();
    goToFrame(curr, prev);
    if (!suppressUndo) {
      undo.pushDocUndo(
        "Switch Frame",
        curr,
        prev,
        () => goToFrame(prev, curr),
        () => goToFrame(curr, prev)
      );
    }
  }
}

function gotoFirstFrame(suppressUndo) {
  let curr = currentFrame();
  let first = document.querySelector(".frame");
  goToFrame(curr, first);
  if (!suppressUndo) {
    undo.pushDocUndo(
      "Switch Frame",
      curr,
      first,
      () => goToFrame(first, curr),
      () => goToFrame(curr, first)
    );
  }
}

function gotoLastFrame(suppressUndo) {
  const curr = currentFrame();
  const last = document.querySelector(".frame:last-child");
  goToFrame(curr, last);
  if (!suppressUndo) {
    undo.pushDocUndo(
      "Switch Frame",
      curr,
      last,
      () => goToFrame(last, curr),
      () => goToFrame(curr, last)
    );
  }
}

function getAnimationBBox(show) {
  let frames = Array.from(document.querySelectorAll(".frame"));
  let boxes = frames.map(frame => {
    if (frame.classList.contains("selected")) {
      return frame.getBoundingClientRect();
    } else {
      frame.classList.add("selected");
      let box = frame.getBoundingClientRect();
      frame.classList.remove("selected");
      return box;
    }
  });
  let box = {
    x: Math.max(Math.floor(Math.min(...boxes.map(b => b.x))) - 10, 0),
    y: Math.max(Math.floor(Math.min(...boxes.map(b => b.y))) - 10, 0),
    right: Math.min(
      Math.floor(Math.max(...boxes.map(b => b.right))) + 10,
      document.body.clientWidth
    ),
    bottom: Math.min(
      Math.floor(Math.max(...boxes.map(b => b.bottom))) + 10,
      document.body.clientHeight
    )
  };
  box.width = box.right - box.x;
  box.height = box.bottom - box.y;
  if (show) {
    dom.insertAfter(
      dom.svg("rect", {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        stroke: "red",
        fill: "none"
      }),
      currentFrame()
    );
  }
  return box;
}

function play() {
  // turn play button into stop button
  // disable all other controls
  // temporarily turn off onionskin (remember state)
  // start at beginning of document (remember state)
  let { x, y, width, height } = getAnimationBBox();
  let onion = document.querySelector(".onionskin");
  if (onion) {
    onion.classList.replace("onionskin", "nskin");
  }
  document.body.classList.add("playing");
  document.querySelector(".frame").classList.add("play-frame");
  canvas.setAttribute("width", width + "px");
  canvas.setAttribute("height", height + "px");
  canvas.style.left = (document.body.clientWidth - width) / 2 + "px";
  canvas.style.top = (document.body.clientHeight - height) / 2 + "px";
  canvas.setAttribute("viewBox", [x, y, width, height].join(" "));
  // add SVG SMIL animation
  // Unless looping, call stop() when animation is finished
  // How much of this can I do by adding "playing" class to body?
  setTimeout(function() {
    _lastFrameTime = Date.now();
    requestAnimationFrame(playNextFrame);
  }, 500);
}

function stop() {
  // remove SMIL animation
  // re-enable all controls
  // return to the frame we were on
  // re-enable onionskin if needed
  // turn stop button into play button
  dom.removeClass(playingFrame(), "play-frame");
  document.body.classList.remove("playing");
  let onion = document.querySelector(".nskin");
  if (onion) {
    onion.classList.replace("nskin", "onionskin");
  }
  canvas.removeAttribute("viewBox");
  canvas.removeAttribute("style");
  canvas.setAttribute("width", document.body.clientWidth + "px");
  canvas.setAttribute("height", document.body.clientHeight + "px");
}

function playNextFrame() {
  let time = Date.now();
  if (time - _lastFrameTime < currentFrameDelay) {
    requestAnimationFrame(playNextFrame);
    return;
  }
  let currFrame = playingFrame();
  _lastFrameTime = time;
  let next = dom.next(currFrame, ".frame");
  if (next) {
    currFrame.classList.remove("play-frame");
    next.classList.add("play-frame");
    requestAnimationFrame(playNextFrame);
  } else {
    setTimeout(stop, 500);
  }
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
    let path = line
      .getAttribute("d")
      .slice(1)
      .trim()
      .split(/\s*L\s*/);
    let pairs = path.map(p => p.split(/\s*,\s*/).map(Number));
    let start = pairs.shift();
    this.ctx.moveTo(...start);
    pairs.forEach(p => {
      this.ctx.lineTo(...p);
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

// document.querySelector('#canvas-undo').addEventListener('click', undoLine, false);
// document.querySelector('#canvas-onionskin').addEventListener('change', toggleOnionskin, false);
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
  docUndo: document.querySelector("#docundo"),
  frameRedo: document.querySelector("#frameredo"),
  docRedo: document.querySelector("#docredo")
};

function updateUndo(evt) {
  console.log('updateUndo(%o)', evt.detail);
  ["frameUndo", "docUndo", "frameRedo", "docRedo"].forEach(key => {
    if (evt.detail[key]) {
      undoButtons[key].disabled = false;
      undoButtons[key].innerText =
        (key.endsWith("Undo") ? "Undo " : "Redo ") + evt.detail[key];
    } else {
      undoButtons[key].innerText = "";
      undoButtons[key].disabled = true;
    }
  });
}
document.addEventListener("shimmy-undo-change", updateUndo, false);
