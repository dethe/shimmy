/* globals dom file KellyColorPicker palettes */

// Initialize
const canvas = document.querySelector('#canvas');
canvas.setAttribute('width', document.body.clientWidth + 'px');
canvas.setAttribute('height', document.body.clientHeight + 'px');
const colorpaletteselect = document.querySelector('.colorpalette');
palettes.forEach((p,i) => {
  let opt = document.createElement('option');
  opt.setAttribute('value', i);
  opt.innerText = p.name;
  colorpaletteselect.append(opt);
});
colorpaletteselect.addEventListener('change', setPalette);
// Color picker 
const colorpicker = new KellyColorPicker(
  {
    place : document.querySelector('.popup-colour'),    
    input : '.js-colour',  
    size : 200, 
    color : '#ffffff',
    method : 'square',
    input_color : false, // or inputColor (sice v1.15)
    input_format : 'mixed', // or inputFormat (since v1.15)
    alpha : 1,
    alpha_slider : false, // or alphaSlider (since v1.15)
    colorSaver : false,
    resizeWith : true, // auto redraw canvas on resize window
    popupClass: 'popup-colour',
    userEvents : { 
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
setPalette({target: colorpaletteselect});

const mouse = {};

function setPalette(evt){
  let palette = palettes[parseInt(evt.target.value)];
  let wells = document.querySelectorAll('.js-miniwell');
  for (let i = 0; i < 5; i++){
    colorButton(wells[i], '#' + palette.colors[i]);
  }
}

class Pen{
  constructor(){
    this.drawing = false;
  }
  start(evt){
    let {x,y, err} = getXY(evt);
    if (err){ return };
    startPath(x,y);
    this.drawing = true;
  }

  move(evt){
    if (!this.drawing) return;
    let {x,y,err} = getXY(evt);
    if (err){ return; }
    if (inBounds(x,y)){
        appendToPath(x,y);
    }
  }

  stop(evt){
    if (!this.drawing) return;
    let {x,y,err} = getXY(evt);
    if (err){ return; }
    // FIXME: draw a dot if we haven't moved
    if (currentPath){
      //dom.simplifyPath(currentPath);
      currentPath = null;
    }
    this.drawing = false;
  }
  
  cancel(){
    // remove the path in progress
  }
  
}

class Pan{
  constructor(){
    this.dragging = false; 
    this.px = 0;
    this.py = 0;
  }
  
  start(evt){
    let {x,y,err} = getXY(evt);
    if (err){ return; }
    this.px = x;
    this.py = y;
    this.dragging = true;
  }
  
  move(evt){
    let {x,y,err} = getXY(evt);
    if (err){ return; }
    let frame = currentFrame();
    let transform = frame.getAttribute('transform');
    let dx = x - this.px;
    let dy = y - this.py;
    this.px = x;
    this.py = y;
    frame.setAttribute('transform', `${transform} translate(${dx} ${dy})`);
  }
  
  stop(evt){
    this.px = 9;
    this.py = 0;
    this.dragging = false;
  }
  
  cancel(){
    // FIXME: cancel in-progress panning
  }
  
}

class Rotate{
  constructor(){
    
  }
  
  start(evt){
    
  }
  
  move(evt){
    
  }
  
  stop(evt){
    
  }
  
  cancel(evt){
    
  }
}

class ZoomIn{
  constructor(){
    
  }
  
  start(evt){
    
  }
  
  move(evt){
    
  }
  
  stop(evt){
    
  }
  
  cancel(evt){
    
  }  
}

class ZoomOut{
  constructor(){
    
  }
  
  start(evt){
    
  }
  
  move(evt){
    
  }
  
  stop(evt){
    
  }
  
  cancel(evt){
    
  }    
}

let tools = {
  pen: new Pen(canvas),
  pan: new Pan(canvas),
  rotate: new Rotate(canvas),
  zoomin: new ZoomIn(canvas),
  zoomout: new ZoomOut(canvas)
}

let currentTool = tools.pen;
let currentStrokeWidth = 1;
let currentDoOnionskin = true;

function selectTool(button){
  let name = button.getAttribute('title').toLowerCase();
  document.querySelector('.js-tool.active').classList.remove('active');
  button.classList.add('active');
  switch(name){
    case 'pen': currentTool = tools.pen; break;
    case 'pan': currentTool = tools.pan; break;
    case 'rotate': currentTool = tools.rotate; break;
    case 'zoom in':  currentTool = tools.zoomin; break;
    case 'zoom out': currentTool = tools.zoomout; break;
    default: console.error('unrecognized tool name: %s', name);
  }
}

let currentColor = '#000000';
let currentFrameDelay = 30; // milliseconds

function setFrameRate(input){
  currentFrameDelay = Math.floor(1000 / Number(input.value));
}

function colorPopup(input){
  let popup = document.querySelector('.popup-colour');
  let colorwell = document.querySelector('.colourwell');
  if (popup.style.display === 'none'){
    colorpicker.setColor(input.value);
    popup.style.display = 'block';    
  }else{
    let color = colorpicker.getCurColorHex();
    colorButton(colorwell, color);
    colorButton(input, color);
    currentColor = color;
    popup.style.display = 'none';
  }
}

function colorButton(button, color){
  button.value = color;
  button.style.backgroundColor = color;
  if (hexToValue(color) < 0.5){
    button.style.color = '#FFF';
  }else{
    button.style.color = '#000';
  }
}

function hexToValue(hex){
  return colorpicker.rgbToHsv(colorpicker.hexToRgb(hex)).v;
}

function selectColor(input){
  let popup = document.querySelector('.popup-colour');
  let colorwell = document.querySelector('.colourwell');
  if (popup.style.display === 'block'){
    let color = colorpicker.getCurColorHex();
    colorButton(colorwell, color);
    colorButton(input, color);
    currentColor = color;
    popup.style.display = 'none';
  }else{
    colorButton(colorwell, input.value);
    currentColor = input.value;
  }
}


var drawing = false;
var WIDTH = document.body.clientWidth;
var HEIGHT = document.body.clientHeight;

// Prevent control clicks from passing through to svg
function swallowClicks(evt){
  evt.stopPropagation();
  // evt.preventDefault();
}
document.querySelector('.buttonbar.animation').addEventListener('mousedown', swallowClicks, true);
document.querySelector('.buttonbar.tools').addEventListener('mousedown', swallowClicks, true);
document.querySelector('.buttonbar.animation').addEventListener('touchstart', swallowClicks, true);
document.querySelector('.buttonbar.tools').addEventListener('touchstart', swallowClicks, true);

function inBounds(x,y){
  return !(x < 0 || x > WIDTH || y < 0 || y > HEIGHT);
}

function getXY(evt){
   if (evt.button){
     // left button is 0, for touch events button will be undefined
     return {x: 0, y: 0, err: true};
   }
   if (evt.changedTouches && evt.changedTouches.length > 1){
     // don't interfere with multi-touch
     return {x: 0, y: 0, err: true};
   }
   if (evt.cancelable) {
      evt.preventDefault();
    }

    const rect = this.canvas.getBoundingClientRect();
    const position = evt.changedTouches && evt.changedTouches[0] || evt;
    let x = position.offsetX;
    let y = position.offsetY;

    if (typeof x === 'undefined') {
      x = position.clientX - rect.left;
    }
    if (typeof y === 'undefined') {
      y = position.clientY - rect.top;
    }
    return {x, y, err:false};
}

const toolStart = evt => currentTool.start(evt);
const toolMove = evt => currentTool.move(evt);
const toolStop = evt => currentTool.stop(evt);
const toolCancel = evt => currentTool.cancel();
const escCancel = evt => {
  if (evt.code && evt.code === 'Escape'){
    currentTool.cancel();
  }
}

let body = document.body;
let svg = body.querySelector('svg');
svg.addEventListener('mousedown', toolStart);
svg.addEventListener('touchstart', toolStart);
svg.addEventListener('mousemove', toolMove);
svg.addEventListener('touchmove', toolMove);
svg.addEventListener('touchend', toolStop);
body.addEventListener('mouseup', toolStop);
svg.addEventListener('touchcancel', toolCancel);
body.addEventListener('keydown', escCancel);

function currentFrame(){
  return document.querySelector('.frame.selected');
}

function playingFrame(){
  return document.querySelector('.frame.play-frame');        
}

var currentPath = null;

function startPath(x,y){

  currentPath = currentFrame().appendChild(dom.svg('path', {
      d: 'M ' + x + ',' + y,
      stroke: currentColor,
      'stroke-width': currentStrokeWidth
  }));
  file.onChange();
}

function appendToPath(x,y){
  var path = document.querySelector('.selected path:last-child');
  var d = path.getAttribute('d');
  path.setAttribute('d', `${d} L${x} ${y}`);
}

/***************************************
*
*  MANAGE FRAMES
*
***************************************/

function isOnionskinOn(){
  return currentDoOnionskin;
}

function currentOnionskinFrame(){
  return document.querySelector('.frame.onionskin');
}

function updateOnionskin(){
  if (!isOnionskinOn()) return;
  dom.removeClass(currentOnionskinFrame(), 'onionskin');
  dom.addClass(currentFrame().previousElementSibling, 'onionskin');
}

function addFrame(){
  dom.insertAfter(dom.svg('g', {'class': 'frame selected'}), currentFrame());
  currentFrame().classList.remove('selected');
  updateOnionskin();
  updateFrameCount();
  file.onChange();
}

function cloneFrame(){
  dom.insertAfter(currentFrame().cloneNode(true), currentFrame());
  currentFrame().classList.remove('selected');
  updateOnionskin();
  updateFrameCount();
  file.onChange();
}

function deleteFrame(){
  var frameToDelete = currentFrame();
  if (frameToDelete.nextElementSibling){
      incrementFrame();
  }else if (frameToDelete.previousElementSibling){
      decrementFrame();
  }
  if (frameToDelete.parentNode.children.length > 1){
    dom.remove(frameToDelete);
  }else{
    _clear(); // don't delete the last frame, just its children
  }
  updateOnionskin();
  updateFrameCount();
  file.onChange();
}

function _clear(){
  dom.clear(currentFrame());
}

function toggleOnionskin(){
  if (isOnionskinOn()){
      dom.addClass(currentFrame().previousElementSibling, 'onionskin');
  }else{
      dom.removeClass(currentOnionskinFrame(), 'onionskin');
  }
}

function incrementFrame(){
  var curr = currentFrame();
  if (curr.nextElementSibling){
      curr.classList.remove('selected');
      curr.nextElementSibling.classList.add('selected');
  }
  updateOnionskin();
  updateFrameCount();
}

function decrementFrame(){
  var curr = currentFrame();
  if (curr.previousElementSibling){
      curr.classList.remove('selected');
      curr.previousElementSibling.classList.add('selected');
  }
  updateOnionskin();
  updateFrameCount();
}

function gotoFirstFrame(){
  currentFrame().classList.remove('selected');
  document.querySelector('.frame').classList.add('selected');
  dom.removeClass(currentOnionskinFrame(), 'onionskin');
  updateFrameCount();
}

function gotoLastFrame(){
  currentFrame().classList.remove('selected');
  document.querySelector('.frame:last-child').classList.add('selected');
  dom.removeClass(currentOnionskinFrame(), 'onionskin');
  dom.addClass(currentFrame().previousElementSibling, 'onionskin');
  updateFrameCount();
}

var _lastFrameTime = 0;
var _frameDelay = 0;

function play(){
  document.body.classList.add('playing');
  // turn play button into stop button
  // disable all other controls
  // temporarily turn off onionskin (remember state)
  // start at beginning of document (remember state)
  document.querySelector('.frame').classList.add('play-frame');
  // add SVG SMIL animation
  // Unless looping, call stop() when animation is finished
  // How much of this can I do by adding "playing" class to body?
  setTimeout(function(){
      _frameDelay = currentFrameDelay;
      _lastFrameTime = Date.now();
      requestAnimationFrame(playNextFrame);
  }, 500);
}

function stop(){
  // remove SMIL animation
  // re-enable all controls
  // return to the frame we were on
  // re-enable onionskin if needed
  // turn stop button into play button
  dom.removeClass(playingFrame(), 'play-frame');
  document.body.classList.remove('playing');
}


function playNextFrame(){
  var time = Date.now();
  if ((time - _lastFrameTime) < _frameDelay){
      requestAnimationFrame(playNextFrame);
      return;            
  }
  var currFrame = playingFrame();
  _lastFrameTime = time;
  if (currFrame.nextElementSibling){
      currFrame.classList.remove('play-frame');
      currFrame.nextElementSibling.classList.add('play-frame');
      requestAnimationFrame(playNextFrame);
  }else{
      stop();
  }
}

function updateFrameCount(){
  try{
      var frames = currentFrame().parentElement.children.length;
      var index = dom.indexOf(currentFrame());
      document.querySelector('.framecount').textContent = 'Frame ' + (index+1) + ' of ' + frames;
  }catch(e){
      // wait for the file to load, probably
  }
}

function undoLine(){
  dom.remove(currentFrame().lastElementChild);
  file.onChange();
}

function keydownHandler(evt){
  if ((evt.key || evt.keyIdentifier) === 'Control'){
      document.body.classList.add('usefiles');
  }
}

function keyupHandler(evt){
  if ((evt.key || evt.keyIdentifier) === 'Control'){
      document.body.classList.remove('usefiles');
  }
}

window.app = {
  updateFrameCount: updateFrameCount,
  play: play
};

// document.querySelector('#canvas-undo').addEventListener('click', undoLine, false);
// document.querySelector('#canvas-onionskin').addEventListener('change', toggleOnionskin, false);
document.addEventListener('keydown', keydownHandler, false);
document.addEventListener('keyup', keyupHandler, false);

