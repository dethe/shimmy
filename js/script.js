  /* globals dom file KellyColorPicker palettes toDataURL canvas */

// Initialization of canvas happens in file.js
const colorpaletteselect = document.querySelector('.palettechooser');
palettes.forEach((p,i) => {
  let opt = document.createElement('option');
  opt.setAttribute('value', i);
  opt.innerText = p.name;
  colorpaletteselect.append(opt);
});
colorpaletteselect.addEventListener('change', setPalette);

function changeColor(picker){
  let color = picker.getCurColorHex();
  let hsv = picker.getCurColorHsv();
}
// Color picker 
const colorpicker = new KellyColorPicker(
  {
    place : document.querySelector('.popup-color'),    
    input : '.js-color',  
    size : 200, 
    color : '#ffffff',
    method : 'square',
    input_color : false, // or inputColor (sice v1.15)
    input_format : 'mixed', // or inputFormat (since v1.15)
    alpha : 1,
    alpha_slider : false, // or alphaSlider (since v1.15)
    colorSaver : false,
    resizeWith : true, // auto redraw canvas on resize window
    popupClass: 'popup-color',
    userEvents : {
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
setPalette({target: colorpaletteselect});

const mouse = {};

const DEG = 180 / Math.PI;
const degrees = rads => rads * DEG;
const radians = degs => degs / DEG;

function setPalette(evt){
  let palette = palettes[parseInt(evt.target.value)];
  let wells = document.querySelectorAll('.js-miniwell');
  for (let i = 0; i < 5; i++){
    colorButton(wells[i], '#' + palette.colors[i]);
  }
}

class Pen{
  constructor(){
    this.name = 'pen';
    this.drawing = false;
    this.currentPath = null;
  }

  startPath(x,y){
    this.currentPath = currentFrame().appendChild(dom.svg('path', {
      d: 'M ' + x + ',' + y,
      stroke: currentColor,
      'stroke-width': currentStrokeWidth,
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
      fill: 'none'
    }));
    file.onChange();
  }
  
  appendToPath(x,y){
    let path = this.currentPath;
    let d = path.getAttribute('d');
    path.setAttribute('d', `${d} L${x}, ${y}`);
  }
  
  start(evt){
    saveMatrix();
    let {x,y, err} = getXY(evt);
    if (err){ return };
    this.sx = x;
    this.sy = y;
    this.startPath(x,y);
    this.drawing = true;
  }

  move(evt){
    if (!this.drawing) return;
    let {x,y,err} = getXY(evt);
    if (err){ return; }
    if (inBounds(x,y)){
      this.appendToPath(x,y);
    }
  }

  stop(evt){
    if (!this.drawing) return;
    let {x,y,err} = getXY(evt);
    if (err){ return; }
    if (this.currentPath){
      if (inBounds(x,y) && this.sx === x && this.sy === y){
        this.appendToPath(x,y);
      }
      //dom.simplifyPath(currentPath);
      this.currentPath = null;
    }
    this.drawing = false;
    currentMatrix = null;
  }
  
  cancel(){
    this.currentPath.remove();
    this.currentPath = null;
    currentMatrix = null;
  }
  
}

class Pan{
  constructor(){
    this.name = 'pan';
    this.dragging = false;
    this.px = 0;
    this.py = 0;
  }
  
  start(evt){
    saveMatrix();
    let {x,y,err} = getXY(evt);
    if (err){ return; }
    this.px = x;
    this.py = y;
    this.dragging = true;
    this.origTransform = currentFrame().getAttribute('transform') || '';
  }
  
  move(evt){
    if (!this.dragging){ return; }
    let {x,y,err} = getXY(evt);
    if (err){ return; }
    let dx = x - this.px;
    let dy = y - this.py;
    let transform = this.origTransform;
    currentFrame().setAttribute('transform', `${transform} translate(${dx} ${dy})`);
  }
  
  stop(evt){
    if (!this.dragging){ return; }
    this.px = 9;
    this.py = 0;
    this.dragging = false;
    this.origTransform = '';
    currentMatrix = null;
  }
  
  cancel(){
    currentFrame().setAttribute('transform', this.origTransform);
    this.dragging = false;
    this.origTransform = false;
    currentMatrix = null;
  }
  
}

function dist(dx, dy){
  return Math.sqrt(dx*dx + dy*dy);
}

class Rotate{
  constructor(){
    this.name = 'rotate';
    this.dragging = false;
    this.px = 0;
    this.py = 0;
    this.originalAngle = null;
  }
  
  start(evt){
    saveMatrix();
    let {x,y,err} = getXY(evt);
    if (err){ return; }
    this.px = x;
    this.py = y;
    this.dragging = true;
    this.origTransform = currentFrame().getAttribute('transform') || '';
  }
  
  move(evt){
    if (!this.dragging){ return; }
    let {x,y,err} = getXY(evt);
    if (err){ return; }
    let px = this.px;
    let py = this.py;
    let dx = x - px;
    let dy = y - py;
    if (dist(dx, dy) < 20){ return; } // don't pick starting angle until we've moved a little from the starting point
    if (this.originalAngle !== null){
      let transform = this.origTransform;
      let angle = degrees(Math.atan2(dy, dx)) - this.originalAngle;
      currentFrame().setAttribute('transform', `${transform} rotate(${angle} ${px} ${py})`);      
    }else{
      this.originalAngle = degrees(Math.atan2(dy, dx));
    }
  }
  
  stop(evt){
    if (!this.dragging){ return; }
    this.px = 9;
    this.py = 0;
    this.dragging = false;
    this.origTransform = '';
    this.originalAngle = null;
    currentMatrix = null;
  }
  
  cancel(evt){
    currentFrame().setAttribute('transform', this.origTransform);
    this.dragging = false;
    this.origTransform = false;
    currentMatrix = null;
  }
}

const ZOOMIN = 1.2;
const ZOOMOUT = 1 / ZOOMIN;

class ZoomIn{
  constructor(){
    this.name = 'zoomin';
  }
  
  start(evt){
    saveMatrix();
    let {x,y,err} = getXY(evt);
    if (err){ return; }
    let transform = currentFrame().getAttribute('transform') || '';
    currentFrame().setAttribute('transform', `${transform} translate(${x} ${y}) scale(${ZOOMIN}) translate(-${x}, -${y})`);
    currentMatrix = null;
  }
  
  move(evt){
    // do nothing
  }
  
  stop(evt){
    // do nothing
  }
  
  cancel(evt){
    // do nothing
  }  
}

class ZoomOut{
  constructor(){
    this.name = 'zoomout';
  }
  
  start(evt){
    saveMatrix();
    let {x,y,err} = getXY(evt);
    if (err){ return; }    
    let transform = currentFrame().getAttribute('transform') || '';
    currentFrame().setAttribute('transform', `${transform} translate(${x} ${y}) scale(${ZOOMOUT}) translate(-${x}, -${y})`);
    currentMatrix = null;
  }
  
  move(evt){
    // do nothing    
  }
  
  stop(evt){
    // do nothing
  }
  
  cancel(evt){
    // do nothing
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

function selectToolbar(button){
  let name = button.getAttribute('title').toLowerCase();
  if (button.classList.contains('active')){
    button.classList.remove('active');
    document.querySelector('.toolbar.active').classList.remove('active');
  }else{
    let activeTab = document.querySelector('.js-tab.active');
    if (activeTab){
      activeTab.classList.remove('active');
    }
    button.classList.add('active');
    let activeToolbar = document.querySelector('.toolbar.active');
    if (activeToolbar){
      activeToolbar.classList.remove('active');
    }
    document.querySelector(`#${name}-toolbar`).classList.add('active');
  }
}

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
let currentMatrix = null;

function setFrameRate(input){
  currentFrameDelay = Math.floor(1000 / Number(input.value));
}

let choosingBackground = false;

function colorPopup(input){
  let popup = document.querySelector('.popup-color');
  let colorwell;
  if (input.id === 'backgroundcolor'){
    choosingBackground = true;
    colorwell = input;
  }else{
    choosingBackground = false;
    colorwell = document.querySelector('.js-color');
  }
  if (popup.style.display === 'none' || popup.style.display === ""){
    colorpicker.setColor(input.value);
    popup.style.display = 'block';    
  }else{
    let color = colorpicker.getCurColorHex();
    colorButton(colorwell, color);
    colorButton(input, color);
    if (choosingBackground){
      canvas.style.backgroundColor = color;
    }else{
      currentColor = color;
    }
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
  let popup = document.querySelector('.popup-color');
  let colorwell = document.querySelector('.js-color');
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
dom.listen('.toolbar, .tabbar', ['mousedown', 'touchstart'], swallowClicks);

function inBounds(x,y){
  return !(x < 0 || x > WIDTH || y < 0 || y > HEIGHT);
}

function saveMatrix(){
  let matrix = currentFrame().getCTM();
  if (matrix instanceof SVGMatrix){
    matrix = new DOMMatrix([matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f]);
  }
  currentMatrix = matrix.inverse();

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
    // if the frame has been translated, rotated, or scaled, we need to map the point to the current matrix
    let {x:tx, y:ty} = transformPoint(x,y);
    return {x: tx, y: ty, err: false};
}

function transformPoint(x,y){
  let frame = currentFrame();
  if (frame.transform.baseVal.length === 0){
    return {x,y};
  }
  return currentMatrix.transformPoint(new DOMPoint(x,y));
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

function listenCanvas(){
  dom.listen(canvas, ['mousedown', 'touchstart'], toolStart);
  dom.listen(canvas, ['mousemove', 'touchmove'], toolMove);
  dom.listen(canvas, 'touchend', toolStop);
  dom.listen(canvas, 'touchcancel', toolCancel);
}

dom.listen(body, 'mouseup', toolStop);
dom.listen(body, 'keydown', escCancel);

function currentFrame(){
  let frame = document.querySelector('.frame.selected');
  if (!frame){
    frame = dom.svg('g', {'class': 'frame selected'});
    canvas.insertBefore(frame, canvas.firstElementChild);
  }
  return frame;
}

function playingFrame(){
  return document.querySelector('.frame.play-frame');        
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
  dom.addClass(dom.previous(currentFrame(), '.frame'), 'onionskin');
}

function addFrame(){
  dom.insertAfter(dom.svg('g', {'class': 'frame selected'}), currentFrame());
  currentFrame().classList.remove('selected');
  updateOnionskin();
  updateFrameCount();
  file.onChange();
}
updateFrameCount();

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

function setOnionSkin(input){
  currentDoOnionskin = input.checked;
  toggleOnionskin();
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
  var next = dom.next(curr, '.frame');
  if (next){
      curr.classList.remove('selected');
      next.classList.add('selected');
      updateOnionskin();
      updateFrameCount();
  }
}

function decrementFrame(){
  var curr = currentFrame();
  var prev = dom.previous(curr, '.frame');
  if (prev){
      curr.classList.remove('selected');
      prev.classList.add('selected');
      updateOnionskin();
      updateFrameCount();
  }
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
  dom.addClass(dom.previous(currentFrame(), '.frame'), 'onionskin');
  updateFrameCount();
}

var _lastFrameTime = 0;
var _frameDelay = 0;

function getAnimationBBox(show){
  let frames = Array.from(document.querySelectorAll('.frame'));
  let boxes = frames.map(frame => {
    if (frame.classList.contains('selected')){
      return frame.getBoundingClientRect();
    }else{
      frame.classList.add('selected');
      let box = frame.getBoundingClientRect();
      frame.classList.remove('selected');
      return box;
    }
  });
  let box = {
    x: Math.max(Math.floor(Math.min(...(boxes.map(b => b.x)))) - 10, 0),
    y: Math.max(Math.floor(Math.min(...boxes.map(b => b.y))) - 10, 0),
    right: Math.min(Math.floor(Math.max(...boxes.map(b => b.right))) + 10, document.body.clientWidth),
    bottom: Math.min(Math.floor(Math.max(...boxes.map(b => b.bottom))) + 10, document.body.clientHeight)
  };
  box.width = box.right - box.x;
  box.height = box.bottom - box.y;
  if (show){
    dom.insertAfter(dom.svg('rect', {x: box.x, y: box.y, width: box.width, height: box.height, stroke: "red", fill: "none"}), currentFrame());
  }
  return box;
}

function play(){
  // turn play button into stop button
  // disable all other controls
  // temporarily turn off onionskin (remember state)
  // start at beginning of document (remember state)
  let {x,y,width,height} = getAnimationBBox();
  document.body.classList.add('playing');
  document.querySelector('.frame').classList.add('play-frame');
  canvas.setAttribute('width', width + 'px')
  canvas.setAttribute('height', height + 'px');
  canvas.style.left = (document.body.clientWidth - width) / 2 + 'px';
  canvas.style.top = (document.body.clientHeight - height) / 2 + 'px';
  canvas.setAttribute('viewBox', [x, y, width, height].join(' '));
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
  canvas.removeAttribute('viewBox');
  canvas.removeAttribute('style');
  canvas.setAttribute('width', document.body.clientWidth + 'px');
  canvas.setAttribute('height', document.body.clientHeight + 'px');
}


function playNextFrame(){
  var time = Date.now();
  if ((time - _lastFrameTime) < _frameDelay){
      requestAnimationFrame(playNextFrame);
      return;            
  }
  var currFrame = playingFrame();
  _lastFrameTime = time;
  let next = dom.next(currFrame, '.frame');
  if (next){
      currFrame.classList.remove('play-frame');
      next.classList.add('play-frame');
      requestAnimationFrame(playNextFrame);
  }else{
      setTimeout(stop, 500);
  }
}

function updateFrameCount(){
  try{
      var frames = Array.from(document.querySelectorAll('.frame'));
      var index = frames.indexOf(currentFrame()) + 1;
      document.querySelector('.framecount').textContent = 'Frame ' + index + ' of ' + frames.length;
  }catch(e){
      // wait for the file to load, probably
  }
}

function undoLine(){
  dom.remove(currentFrame().lastElementChild);
  file.onChange();
}

function newAnimation(evt){
  file.new();
  updateFrameCount();
}

function saveAsSVG(evt){
  file.saveFile();
}

function saveFrameAsPNG(evt){
  let {x, y, width, height} = getAnimationBBox();
  let img = frameToImage(currentFrame(), x, y, width, height);
  // FIXME: save the image
}

function saveAsGIF(evt){
  console.log('save as GIF');
}

function saveAsMovie(evt){
  console.log('save as movie');
}

function openSVG(evt){
  file.loadFile();
}

class SVGCanvas{
  constructor(frame, x, y, width, height){
    this.canvas = dom.html('canvas', {width: width, height: height, 'class': 'storyboard-frame'});
    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.svg = frame;
    this.offset = {x,y};
    this.draw();
  }
  
  draw(){
    this.setTransforms();
    let lines = this.svg.querySelectorAll('path');
    lines.forEach(line => this.drawLine(line));
  }
  
  setTransforms(){
    let {a,b,c,d,e,f} = this.svg.getCTM();
    this.ctx.setTransform(a,b,c,d,e-this.offset.x,f-this.offset.y);
  }
  
  translate(x,y){
    console.log('translate(%s, %s)', x, y);
    this.ctx.translate(x,y);
  }
  
  scale(x){
    this.ctx.scale(x,x);
  }
  
  rotate(angle, cx, cy){
    console.log('rotate(angle=%s, x=%s, y=%s)', angle, cx, cy);
    this.ctx.translate(cx, cy);
    this.ctx.rotate(radians(angle));
    this.ctx.translate(-cx, -cy);
  }
  
  drawLine(line){
    this.ctx.beginPath();
    this.ctx.lineWidth = Number(line.getAttribute('stroke-width'));
    this.ctx.strokeStyle = line.getAttribute('stroke');
    let path = line.getAttribute('d').slice(1).trim().split(/\s*L\s*/);
    let pairs = path.map(p => p.split(/\s*,\s*/).map(Number))
    let start = pairs.shift();
    this.ctx.moveTo(...start);
    pairs.forEach(p => {
      this.ctx.lineTo(...p)
    });
    this.ctx.stroke();
  }
  
}

function frameToImage(frame, x, y, width, height, callback){
    let c = new SVGCanvas(frame, x, y, width, height);
    return c.canvas;
}

let currentDisplay = 'drawingboard';

function toggleDisplay(evt){
  evt.preventDefault();
  evt.stopPropagation();
  if (currentDisplay === 'drawingboard'){
    currentDisplay = 'storyboard';
    displayAsStoryboard();
  }else{
    currentDisplay = 'drawingboard';
    displayAsDrawingboard();
  }
}

function displayAsStoryboard(){
  let {x,y,width,height} = getAnimationBBox();
  let frames = Array.from(document.querySelectorAll('.frame')).map(frame => frameToImage(frame, x, y, width, height));
  frames.forEach(f => document.body.appendChild(f));
  document.body.classList.add('storyboard');
  canvas.style.display = 'none';
}

function displayAsDrawingboard(){
  Array.from(document.querySelectorAll('.storyboard-frame')).map( f => f.remove());
  document.body.classList.remove('storyboard');
  canvas.style.display = 'block';
}

function hotkeys(evt){
  if (evt.altKey) return;
  if (evt.shiftKey) return;
  if (evt.ctrlKey) return;
  switch(evt.key){
    case 'n': newAnimation(evt); break;
    case 's': saveAsSVG(evt); break;
    case 'f': saveFrameAsPNG(evt); break;
    case 'g': saveAsGIF(evt); break;
    case 'm': saveAsMovie(evt); break;
    case 'o': openSVG(evt); break;
    case 'd': toggleDisplay(evt); break;
  }
}
console.log('n new | s save | f save frame | g gif | m movie | o open | d toggle display');

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
document.addEventListener('keydown', hotkeys, false);

