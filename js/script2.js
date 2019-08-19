/* globals atrament LC KellyColorPicker palettes */

// Initialize
const canvas = document.querySelector('#canvas');
canvas.setAttribute('width', document.body.clientWidth + 'px');
canvas.setAttribute('height', document.body.clientHeight + 'px');
// const sketcher = atrament(canvas, {width: canvas.offsetWidth, height: canvas.offsetHeight, color: '#000000', weight: 2, mode: 'draw'});
var lc = LC.init(canvas);
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

function setPalette(evt){
  let palette = palettes[parseInt(evt.target.value)];
  let wells = document.querySelectorAll('.js-miniwell');
  for (let i = 0; i < 5; i++){
    colorButton(wells[i], '#' + palette.colors[i]);
  }
}

let tools = {
  pen: new LC.tools.Pencil(lc),
  eraser: new LC.tools.Eraser(lc),
  pan: new LC.tools.Pan(lc),
  eyedropper: new LC.tools.Eyedropper(lc),
}

function selectTool(button){
  let name = button.getAttribute('title').toLowerCase();
  document.querySelector('.js-tool.active').classList.remove('active');
  button.classList.add('active');
  switch(name){
    case 'pen': lc.setTool(tools.pen); break;
    case 'eraser': lc.setTool(tools.eraser); break;
    case 'pan': lc.setTool(tools.pan); break;
    case 'rotate': sketcher.mode = 'rotate'; break;
    case 'zoom in':  sketcher.mode = 'zoom in'; break;
    case 'zoom out': sketcher.mode = 'zoom out'; break;
    default: console.error('unrecognized tool name: %s', name);
  }
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
    sketcher.color = color;
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
    sketcher.color = color;
    popup.style.display = 'none';
  }else{
    colorButton(colorwell, input.value);
    sketcher.color = input.value;
  }
}