/* Functions specifically to manipulate the DOM go here */

import { $, $$, byId, html, svg, addClass, removeClass } from "./dom.js";
import { currentFrame, currentOnionskinFrame } from "./frames.js";
import {palettes} from "./palettes.js";

const defaultCanvas = `<svg id="canvas" width="2560px" height="1116px" data-name="untitled" data-tool="pen" data-stroke-width="2" data-do-onionskin="true" data-fps="10" data-palette="0" data-color="#000000" data-bgcolor="#FFFFFF" data-color1="#FF0000" data-color2="#FFFF00" data-color3="#00FF00" data-color4="#00FFFF" data-color5="#0000FF" data-color6="#666666" data-color7="#000000" data-color8="#FFFFFF" data-tab_file="false" data-tab_draw="true" data-tab_frames="true" data-tab_animate="false"><g class="frame selected"></g></svg>`;

// polyfill for dialog
const dialog = $$("dialog").forEach(dialog => dialogPolyfill.registerDialog(dialog));

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

const resize = () => {
  window.WIDTH = document.body.clientWidth;
  window.HEIGHT = document.body.clientHeight;
  canvas.setAttribute("width", window.WIDTH + "px");
  canvas.setAttribute("height", window.HEIGHT + "px");
};

// Initialized palettes
const colorpaletteselect = document.querySelector(".palettechooser");
palettes.forEach((p, i) => {
  colorpaletteselect.append(html("option", { value: p.name }, p.name));
});

// FIXME: Move event handling to script.js
colorpaletteselect.addEventListener("change", setPalette);


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
    change : function(self) {
      if (!self.getInput()){
        // we're initializing but don't have a colorwell yet, ignore
        return;
      }
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

function setPalette(evt) {
  let palette = palettes.filter(p => p.name === evt.target.value)[0];
  let wells = document.querySelectorAll(".js-miniwell");
  for (let i = 0; i < 5; i++) {
    colorButton(wells[i], "#" + palette.colors[i]);
  }
}
setPalette({ target: colorpaletteselect });


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


class ui {
  static toggleToolbar(name) {
    byId(`${name}-toolbar`).classList.toggle("active");
  }

  static updateFrameCount() {
    try {
      let frames = $$(".frame");
      let index = frames.indexOf(currentFrame()) + 1;
      $(".framecount output").textContent = index + " of " + frames.length;
    } catch (e) {
      // wait for the file to load, probably
    }
  }

  static canvas = document.querySelector("#canvas");

  // Render state as needed
  static set name(val) {
    document.title = "Shimmy: " + val;
  }

  static set tool(val) {
    selectTool(val);
  }

  static set strokeWidth(val) {
    byId("pensize").value = val;
  }

  static set errorWidth(val) {
    byId("erasersize").value = val;
  }

  static set doOnionSkin(val) {
    byId("doonionskin").checked = val;
    if (val) {
      addClass(currentFrame().previousElementSibling, "onionskin");
    } else {
      removeClass(currentOnionskinFrame(), "onionskin");
    }
  }

  static set fps(val) {
    byId("framerate").value = val;
  }

  static set palette(val){
    byId('colorpalette').select
  }
}

//   let currentTabs = document.querySelectorAll(".js-tab.active");
//   currentTabs.forEach(selectToolbar); // turn off any active tabs
//   ["file", "draw", "frames", "animate"].forEach(tabid => {
//     if (state[`tab_${tabid}`] !== "false") {
//       selectToolbar(document.getElementById(tabid));
//     }
//   });
//   selectTool({ value: state.tool || "pen" });
//   let palette = document.getElementById("colorpalette");
//   palette.selectedIndex = state.palette || 0;
//   setPalette({ target: palette.options[state.palette || 0] });
//   currentColor = state.color || "#000000";
//   colorButton(document.getElementById("pencolor"), currentColor);
//   colorButton(
//     document.getElementById("backgroundcolor"),
//     state.bgcolor || "#FFFFFF"
//   );
//   colorButton(document.getElementById("color1"), state.color1 || "#000000");
//   colorButton(document.getElementById("color2"), state.color2 || "#FFFFFF");
//   colorButton(document.getElementById("color3"), state.color3 || "#666666");
//   colorButton(document.getElementById("color4"), state.color4 || "#69D2E7");
//   colorButton(document.getElementById("color5"), state.color5 || "#A7DBD8");
//   colorButton(document.getElementById("color6"), state.color6 || "#E0E4CC");
//   colorButton(document.getElementById("color7"), state.color7 || "#F38630");
//   colorButton(document.getElementById("color8"), state.color8 || "#FA6900");
//   undo.clear();
// }

if (!ui.canvas) {
  ui.canvas = svg("svg");
  document.body.prepend(ui.canvas);
}

// FIXME: use proper event handling
window.onresize = ui.resize;

// Render state as needed

function selectTool(name) {
  let sel = byId("toolpicker");
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
  currentTool.select();
}

export {ui};
