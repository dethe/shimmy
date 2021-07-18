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
    change: function (self) {
      if (!self.getInput()) {
        // we're initializing but don't have a colorwell yet, ignore
        return;
      }
      // set background color for 'input' to current color of color picker
      if (self.getCurColorHsv().v < 0.5) {
        self.getInput().style.color = "#FFF";
      } else {
        self.getInput().style.color = "#000";
      }
      self.getInput().style.background = self.getCurColorHex();
    },
  },
});

function setPaletteHandler(evt) {
  let palette = palettes.filter(p => p.name === evt.originalTarget.value)[0];
  let wells = $$(".js-miniwell");
  for (let i = 0; i < 5; i++) {
    colorButton(wells[i], "#" + palette.colors[i]);
  }
}
setPaletteHandler({ originalTarget: colorpaletteselect });

let choosingBackground = false;

function colorPopup(input) {
  let popup = $(".popup-color");
  let colorwell;
  if (input.id === "backgroundcolor") {
    choosingBackground = true;
    colorwell = input;
  } else {
    choosingBackground = false;
    colorwell = $(".js-color");
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
      // FIXME: this has to set the state, but don't want a circular import dependency
      currentColor = color;
    }
    popup.style.display = "none";
  }
}

function setBackgroundColor(color) {
  colorButton($("#backgroundcolor"), color);
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
      sel.selectedIndex = 3;
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
    if (timeout) {
      setTimeout(() => aboutShimmyDialog.close(), timeout);
    }
  }

  static showShortcuts() {
    aboutShimmyDialog.close();
    shortcutsDialog.showModal();
  }

  static toggleDisplay(evt) {
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

  static toggleUI() {
    $("body").classList.toggle("noui");
  }

  static toggleToolbar(name) {
    console.log("looking for %s-toolbar", name);
    $(`#${name}-toolbar`).classList.toggle("active");
  }

  static frameToImage(frame, x, y, width, height, callback) {
    let c = new SVGCanvas(frame, x, y, width, height);
    return c.canvas;
  }

  static animationToImages() {
    let { x, y, width, height } = this.getAnimationBBox();
    return $$(".frame").map(frame =>
      this.frameToImage(frame, x, y, width, height)
    );
  }

  static getAnimationBBox(show) {
    let frames = $$(".frame");
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
      insertAfter(
        dom.svg("rect", {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          stroke: "red",
          fill: "none"
        }),
        ui.currentFrame()
      );
    }
    return box;
  }

  static selectColor(input) {
    let popup = $(".popup-color");
    let colorwell = $(".js-color");
    if (popup.style.display === "block") {
      let color = colorpicker.getCurColorHex();
      colorButton(colorwell, color);
      colorButton(input, color);
      state.color = color;
      popup.style.display = "none";
    } else {
      colorButton(colorwell, input.value);
      state.color = input.value;
    }
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
    console.log('ui set doOnionskin');
    $("#doonionskin").checked = val;
    if (val) {
      dom.addClass(dom.previous(ui.currentFrame(), ".frame"), "onionskin");
    } else {
      $$('.frame.onionskin').forEach(frame => frame.classList.remove('onionskin'));
    }
  }

  static set fps(val) {
    $("#framerate").value = val;
  }

  static set palette(val) {
    $("#colorpalette").select;
  }

  static set color(val) {

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
