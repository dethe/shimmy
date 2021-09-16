/* Functions specifically to manipulate the DOM go here */

import * as dom from "./dom.js";
const { $, $$ } = dom;
import { palettes } from "./palettes.js";
import SVGCanvas from "./svgcanvas.js";
import state from "./state.js";
import * as tool from "./tool.js";

// polyfill for dialog
const dialog = $$("dialog").forEach(dialog =>
  dialogPolyfill.registerDialog(dialog)
);

const enablePenSize = flag => {
  $(".feedback.pensize").removeAttribute("hidden");
  $(".feedback.erasersize").setAttribute("hidden", "");
  // This in enablePenSize, but not in enableEraserSize because some tools flip UI to penSize, but it isn't relevant to the tool
  $$(".pensize .stepper > *").forEach(d => (d.disabled = !flag));
};

const enableEraserSize = () => {
  $(".feedback.erasersize").removeAttribute("hidden");
  $(".feedback.pensize").setAttribute("hidden", "");
};

// Initialized palettes
const colorpaletteselect = document.querySelector(".palettechooser");
palettes.forEach((p, i) => {
  colorpaletteselect.append(dom.html("option", { value: p.name }, p.name));
});

// Color picker
const colorpicker = new KellyColorPicker({
  place: $(".popup-color"),
  // input: ".js-color",
  size: 200,
  color: "#ffffff",
  method: "square",
  inputColor: false,
  inputFormat: "mixed",
  alpha: 1,
  alphaSlider: false,
  colorSaver: false,
  resizeWith: true, // auto redraw canvas on resize window
  popupClass: "popup-color",
  userEvents: {
    change: function (self) {
      if (!self.input) {
        // we're initializing but don't have a colorwell yet, ignore
        return;
      }
      state[self.input.id] = self.getCurColorHex();
      if (self.input.id !== "bgcolor") {
        state.color = self.getCurColorHex();
      }
    },
  },
});

function setPaletteHandler(evt) {
  const sel = evt.target || evt.originalTarget;
  let palette = palettes.filter(p => p.name === sel.value)[0];
  let wells = $$(".js-miniwell");
  for (let i = 0; i < 5; i++) {
    colorButton(wells[i], "#" + palette.colors[i]);
  }
  sel.blur();
}
setPaletteHandler({ originalTarget: colorpaletteselect });

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

function selectTool(name) {
  let sel = $("#toolpicker");
  ui.currentTool = tools[name];
  ui.currentTool.select();
  switch (name) {
    case "pen":
      enablePenSize(true);
      sel.selectedIndex = 0;
      break;
    case "move":
      enablePenSize(false);
      sel.selectedIndex = 2;
      break;
    case "rotate":
      enablePenSize(false);
      sel.selectedIndex = 1;
      break;
    case "zoomin":
      enablePenSize(false);
      sel.selectedIndex = 3;
      break;
    case "zoomout":
      enablePenSize(false);
      sel.selectedIndex = 4;
      break;
    case "eraser":
      enableEraserSize();
      sel.selectedIndex = 5;
      break;
    default:
      console.error("unrecognized tool name: %s", name);
  }
}

function displayAsStoryboard() {
  let frames = ui.animationToImages();
  frames.forEach(f => document.body.appendChild(f));
  document.body.classList.add("storyboard");
  ui.canvas.style.display = "none";
}

function displayAsDrawingboard() {
  $$(".storyboard-frame").map(f => f.remove());
  document.body.classList.remove("storyboard");
  ui.canvas.style.display = "block";
}

let aboutShimmyDialog = $("#aboutShimmy");
let shortcutsDialog = $("#shortcutsDialog");
let currentDisplay = "drawingboard";

class ui {
  static canvas = $("#canvas");

  static showAbout(timeout) {
    aboutShimmyDialog.showModal();
    if (timeout && !Number.isNaN(Number(timeout))) {
      setTimeout(aboutShimmyDialog.close, timeout);
    }
  }

  static showShortcuts() {
    aboutShimmyDialog.close();
    shortcutsDialog.showModal();
  }

  static toggleDisplay(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    if (state.display === "drawingboard") {
      state.display = "storyboard";
    } else {
      state.display = "drawingboard";
    }
  }

  static set display(name) {
    if (name === "storyboard") {
      displayAsStoryboard();
    } else {
      displayAsDrawingboard();
    }
  }

  static frameToThumbnail(frame) {
    return this.frameToImage(frame, 0, 0, WIDTH, HEIGHT, 64);
  }

  static thumbnailForFrame(frame) {
    if (!frame) {
      console.error("error: no frame in thumbnailForFrame");
      return null;
    }
    let thumb = $(`#${frame.id}-canvas`);
    return thumb;
  }

  static frameForThumbnail(thumb) {
    return $(`#${thumb.id.split("-")[0]}`);
  }

  static makeThumbnails() {
    const tl = $(".timeline-frames");
    tl.innerHTML = ""; // remove any existing children
    $$(".frame").forEach(frame => {
      const thumb = this.frameToThumbnail(frame);
      tl.appendChild(thumb);
    });
    tl.firstElementChild.classList.add("selected");
  }

  static updateThumbnail(frame) {
    const oldThumb = this.thumbnailForFrame(frame);
    const newThumb = this.frameToThumbnail(frame);
    oldThumb.replaceWith(newThumb);
  }

  static addThumbnail(frame) {
    const oldThumb = this.thumbnailForFrame(frame.nextElementSibling);
    const newThumb = this.frameToThumbnail(frame);
    $(".timeline-frames").insertBefore(newThumb, oldThumb);
  }

  static removeThumbnail(frame) {
    this.thumbnailForFrame(frame).remove();
  }

  static toggleUI() {
    $("body").classList.toggle("noui");
  }

  static toggleToolbar(name) {
    state[`${name}Tab`] = !state[`${name}Tab`];
  }

  static frameToImage(frame, x, y, width, height, maxHeight) {
    return new SVGCanvas(frame, x, y, width, height, maxHeight).canvas;
  }

  static animationToImages() {
    let { x, y, width, height } = this.getAnimationBBox();
    return $$(".frame").map(frame =>
      ui.frameToImage(frame, x, y, width, height)
    );
  }

  static getBBox(frame) {
    if (frame.classList.contains("selected")) {
      return frame.getBoundingClientRect();
    } else {
      frame.classList.add("selected");
      let box = frame.getBoundingClientRect();
      frame.classList.remove("selected");
      return box;
    }
  }

  static showBBoxes() {
    $$(".frame").forEach(frame =>
      frame.appendChild(ui.rectForBox(ui.paddedBox(ui.getBBox(frame))))
    );
  }

  static hideBBoxes() {
    let boxes = $$(".guidebox");
    boxes.forEach(box => box.remove());
  }

  // get a red SVG rect for a frame
  static rectForBox(box) {
    return dom.svg("rect", {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      stroke: "red",
      fill: "none",
      class: "guidebox",
    });
  }

  // return an x,y,right,bottom,width,height with a bit of room around (10px)
  static paddedBox(bbox) {
    let box = {
      x: Math.max(bbox.x - 10, 0),
      y: Math.max(bbox.y - 10, 0),
      right: Math.min(bbox.right + 10, document.body.clientWidth),
      bottom: Math.min(bbox.bottom + 10, document.body.clientHeight),
    };
    box.width = box.right - box.x;
    box.height = box.bottom - box.y;
    return box;
  }

  static unionBoxes(boxes) {
    return {
      x: Math.floor(Math.min(...boxes.map(b => b.x))),
      y: Math.floor(Math.min(...boxes.map(b => b.y))),
      right: Math.floor(Math.max(...boxes.map(b => b.right))),
      bottom: Math.floor(Math.max(...boxes.map(b => b.bottom))),
    };
  }

  static getAnimationBBox(show) {
    let frames = $$(".frame");
    let boxes = frames.map(ui.getBBox);
    let box = ui.paddedBox(ui.unionBoxes(boxes));
    if (show) {
      insertAfter(ui.rectForBox(box), ui.currentFrame());
    }
    return box;
  }

  static updateFrameCount() {
    try {
      let frames = $$(".frame");
      let index = frames.indexOf(this.currentFrame()) + 1;
      $(".framecount output").textContent = index + " of " + frames.length;
    } catch (e) {
      // wait for the file to load, probably
    }
  }

  static resize() {
    window.WIDTH = document.body.clientWidth;
    window.HEIGHT = document.body.clientHeight;
    this.canvas.setAttribute("width", window.WIDTH + "px");
    this.canvas.setAttribute("height", window.HEIGHT + "px");
  }

  // Render state as needed
  static set name(val) {
    document.title = "Shimmy: " + val;
  }

  static _oldtool;

  static set tool(val) {
    if (val !== this._oldtool) {
      this._oldtool = val;
      selectTool(val);
    }
  }

  static set strokeWidth(val) {
    $("#pensize").value = val;
  }

  static set eraserWidth(val) {
    $("#erasersize").value = val;
  }

  static set doOnionskin(val) {
    $("#doonionskin").checked = val;
    if (val) {
      dom.addClass(dom.previous(ui.currentFrame(), ".frame"), "onionskin");
    } else {
      $$(".frame.onionskin").forEach(frame =>
        frame.classList.remove("onionskin")
      );
    }
  }

  static set fps(val) {
    $("#framerate").value = val;
  }

  static set palette(val) {
    // FIXME
    $("#colorpalette").select;
  }

  static isColorPopupVisible = false;

  static hideColorPopup() {
    this.isColorPopupVisible = false;
    $(".popup-color").style.display = "none";
  }

  static showColorPopup(input) {
    this.isColorPopupVisible = true;
    colorpicker.input = input;
    colorpicker.setColor(input.value);
    $(".popup-color").style.display = "block";
  }

  static selectColor(input) {
    if (this.isColorPopupVisible) {
      colorpicker.input = input;
      colorpicker.setColor(input.value);
    }
    state.color = input.value;
  }

  static set color(color) {
    colorButton($("#color"), color);
  }

  static set bgcolor(color) {
    colorButton($("#bgcolor"), color);
    this.canvas.style.backgroundColor = color;
  }

  static set color1(color) {
    colorButton($("#color1"), color);
  }
  static set color2(color) {
    colorButton($("#color2"), color);
  }
  static set color3(color) {
    colorButton($("#color3"), color);
  }
  static set color4(color) {
    colorButton($("#color4"), color);
  }
  static set color5(color) {
    colorButton($("#color5"), color);
  }
  static set color6(color) {
    colorButton($("#color6"), color);
  }
  static set color7(color) {
    colorButton($("#color7"), color);
  }
  static set color8(color) {
    colorButton($("#color8"), color);
  }

  static set fileTab(flag) {
    if (flag) {
      $("#file-toolbar").classList.add("active");
    } else {
      $("#file-toolbar").classList.remove("active");
    }
  }

  static set drawTab(flag) {
    if (flag) {
      $("#draw-toolbar").classList.add("active");
    } else {
      $("#draw-toolbar").classList.remove("active");
    }
  }

  static set framesTab(flag) {
    if (flag) {
      $("#frames-toolbar").classList.add("active");
    } else {
      $("#frames-toolbar").classList.remove("active");
    }
  }
  static set animateTab(flag) {
    if (flag) {
      $("#animate-toolbar").classList.add("active");
    } else {
      $("#animate-toolbar").classList.remove("active");
    }
  }
  static currentFrame() {
    let frame = $(".frame.selected");
    if (!frame) {
      frame = dom.svg("g", { class: "frame selected" });
      canvas.insertBefore(frame, canvas.firstElementChild);
    }
    return frame;
  }

  static currentOnionskinFrame() {
    return $(".frame.onionskin");
  }

  static setPaletteHandler = setPaletteHandler;
  static currentTool = null;
}
if (!ui.canvas) {
  ui.canvas = dom.svg("svg");
  ui.canvas.id = "canvas";
  document.body.prepend(ui.canvas);
}

let tools = {
  pen: new tool.Pen(ui.canvas),
  move: new tool.Move(ui.canvas),
  rotate: new tool.Rotate(ui.canvas),
  zoomin: new tool.ZoomIn(ui.canvas),
  zoomout: new tool.ZoomOut(ui.canvas),
  eraser: new tool.Eraser(ui.canvas),
};
ui.tool = "pen";

// FIXME: use proper event handling
window.onresize = ui.resize;

export default ui;
