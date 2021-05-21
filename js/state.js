/* Maintenance of state, file formats, etc. go here */
/* All state functions that directly read from or modify the DOM should be split, we can keep all state in JS data,
   and sync the DOM to that */
/* All state functions that are event handlers should likewise be split. Event handling can go in script.js or if needed we can create an event.js. State functions should only update the JS state */

let values = {
  dirty: false,
  color: "#000000",
  fps: 10,
  frameDelay: 100, // milliseconds
  display: "drawingboard",
  tool: null,
  strokeWidth: 1,
  eraserWidth: 5,
  doOnionskin: true,
  name: null,
};

function toggleOnionSkin() {
  state.doOnionskin = !state.doOnionskin;
}

class state {

  static keys = [
    "name",
    "tool",
    "strokeWidth",
    "eraserWidth",
    "doOnionskin",
    "fps",
    "palette",
    "color",
    "bgcolor",
    "color1",
    "color2",
    "color3",
    "color4",
    "color5",
    "color6",
    "color7",
    "color8",
    "fileTab",
    "drawTab",
    "framesTab",
    "animateTab",
  ];

  static get name() {
    return values.name;
  }

  static set name(val) {
    values.name = val;
    values.dirty = true;
  }

  static get tool(){
    return values.tool;
  }

  static set tool(val) {
    values.tool = val;
    values.dirty = true;
  }

  static get strokeWidth() {
    return values.strokeWidth;
  }

  static set strokeWidth(val) {
    values.strokeWidth = parseInt(val || 2, 10);
    values.dirty = true;
  }

  static get eraserWidth() {
    return values.eraserWidth;
  }

  static set eraserWidth(val) {
    values.eraserWidth = parseInt(val || 5, 10);
    values.dirty = true;
  }

  static get doOnionskin() {
    return values.doOnionskin;
  }

  static set doOnionskin(val) {
    values.doOnionskin = !!val;
    values.dirty = true;
  }

  static get fps(){
    return values.fps;
  }

  static set fps(val) {
    values.fps = new Number(val || 10);
    values.frameDelay = 1000 / values.fps;
    values.dirty = true;
  }

  static get palette(){
    return values.palette;
  }

  static set palette(val) {
    values.palette = val;
    values.dirty = true;
  }

  static get color() {
    return values.color;
  }

  static set color(val) {
    values.color = val;
    values.dirty = true;
  }

  static get bgcolor() {
    return values.bgcolor;
  }

  static set bgcolor(val) {
    values.bgcolor = val;
    values.dirty = true;
  }

  static get color1(){
    return values.color1;
  }

  static set color1(val) {
    values.color1 = val;
    values.dirty = true;
  }

  static get color2(){
    return values.color2;
  }

  static set color2(val) {
    values.color2 = val;
    values.dirty = true;
  }

  static get color3(){
    return values.color3;
  }

  static set color3(val) {
    values.color3 = val;
    values.dirty = true;
  }

  static get color4(){
    return values.color1;
  }

  static set color4(val) {
    values.color4 = val;
    values.dirty = true;
  }

  static get color5(){
    return values.color5;
  }

  static set color5(val) {
    values.color5 = val;
    values.dirty = true;
  }

  static get color6(){
    return values.color6;
  }

  static set color6(val) {
    values.color6 = val;
    values.dirty = true;
  }

  static get color7(){
    return values.color7;
  }

  static set color7(val) {
    values.color7 = val;
    values.dirty = true;
  }

  static get color8(){
    return values.color8;
  }

  static set color8(val) {
    values.color8 = val;
    values.dirty = true;
  }

  static get fileTab(){
    return values.fileTab;
  }

  static set fileTab(val) {
    values.fileTab = !!val;
    values.dirty = true;
  }

  static get drawTab(){
    return values.drawTab;
  }

  static set drawTab(val) {
    values.drawTab = !!val;
    values.dirty = true;
  }

  static get framesTab(){
    return values.framesTab;
  }

  static set framesTab(val) {
    values.framesTab = !!val;
    values.dirty = true;
  }

  static get animateTab(){
    return values.animateTab;
  }

  static set animateTab(val) {
    values.animateTab = !!val;
    values.dirty = true;
  }
}

// Getter-only and not persisted or enumerable
Object.defineProperty(state, "frameDelay", {
  get(){
    return values.frameDelay;
  },
  enumerable: false,
  configurable: false
});

Object.defineProperty(state, "dirty", {
  get(){
    return values.dirty;
  },
  set(val){
    values.dirty = !!val;
  },
  enumerable: false,
  configurable: false
});

export default state;
