/* Maintenance of state, file formats, etc. go here */
/* All state functions that directly read from or modify the DOM should be split, we can keep all state in JS data,
   and sync the DOM to that */
/* All state functions that are event handlers should likewise be split. Event handling can go in script.js or if needed we can create an event.js. State functions should only update the JS state */

let dirty = false; // flag to know when to redraw

let values = {
  color: "#000000",
  frameDelay: 30, // milliseconds
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

  static get dirty(){
    return dirty;
  }

  static set dirty(val){
    dirty = !!val;
  }

  static getState(){
    return values; // FIXME, should be read-only or cloned
  }

  static setState(vals){
    values = vals;
  }

  static get name() {
    return values.name;
  }

  static set name(val) {
    values.name = val;
    dirty = true;
  }

  static set tool(val) {
    values.tool = val;
    dirty = true;
  }

  static get strokeWidth() {
    return values.strokeWidth;
  }

  static set strokeWidth(val) {
    values.strokeWidth = parseInt(val || 2, 10);
    dirty = true;
  }

  static get eraserWidth() {
    return values.eraserWidth;
  }

  static set eraserWidth(val) {
    values.eraserWidth = parseInt(val || 5, 10);
    dirty = true;
  }

  static get doOnionskin() {
    return values.doOnionskin;
  }

  static set doOnionskin(val) {
    values.doOnionskin = !!val;
    dirty = true;
  }

  static get frameDelay(){
    return values.frameDelay;
  }

  static set fps(val) {
    values.fps = new Number(val || 10);
    values.frameDelay = 1000 / values.fps;
    dirty = true;
  }

  static set palette(val) {
    values.palette = val;
    dirty = true;
  }

  static get color() {
    return values.color;
  }

  static set color(val) {
    values.color = val;
    dirty = true;
  }

  static get bgcolor() {
    return values.bgcolor;
  }

  static set bgcolor(val) {
    values.bgcolor = val;
    dirty = true;
  }

  static set color1(val) {
    values.color1 = val;
    dirty = true;
  }

  static set color2(val) {
    values.color2 = val;
    dirty = true;
  }

  static set color3(val) {
    values.color3 = val;
    dirty = true;
  }

  static set color4(val) {
    values.color4 = val;
    dirty = true;
  }

  static set color5(val) {
    values.color5 = val;
    dirty = true;
  }

  static set color6(val) {
    values.color6 = val;
    dirty = true;
  }

  static set color7(val) {
    values.color7 = val;
    dirty = true;
  }

  static set color8(val) {
    values.color8 = val;
    dirty = true;
  }

  static set fileTab(val) {
    values.fileTab = !!val;
    dirty = true;
  }

  static set drawTab(val) {
    values.drawTab = !!val;
    dirty = true;
  }

  static set framesTab(val) {
    values.framesTab = !!val;
    dirty = true;
  }

  static set animateTab(val) {
    values.animateTab = !!val;
    dirty = true;
  }
}

export {state};
