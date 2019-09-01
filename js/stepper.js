// Intended to enhance UI without being required. Will find any <input type="number" and replace them with this control to provide better visibility and larger targets for the stepper.
// Based on the Stepper component in Form Design Patterns, by Adam Silver (starts on p. 181)

// CSS 

const css_rules = `
.visually-hidden {
 border:0!important;
 clip:rect(0 0 0 0)!important;
 height:1px!important;
 margin:-1px!important;
 overflow:hidden!important;
 padding:0!important;
 position:absolute!important;
 width:1px!important
}
[type=number]{
 width:100%;
 padding:8px;
 font-size:1em;
 line-height:1.25;
 font-family:inherit;
 -webkit-box-sizing:border-box;
 -moz-box-sizing:border-box;
 box-sizing:border-box;
 -webkit-appearance:none;
 appearance:none;
 border:2px solid #222
}
@media (min-width:37.5em) {
 [type=number]{
  font-size:1.125em;
  line-height:1.38889
 }
}
[type=number]:focus {
 outline:0;
 box-shadow:0 0 1px 4px #ffbf47
}
.stepper-add-button,
.stepper-remove-button {
 font:inherit;
 border:none;
 appearance:none;
 -webkit-appearance:none;
 font-size:1em;
 line-height:1.5625;
 padding:10px 20px;
 background-color:#222;
 padding-top:10px;
 padding-bottom:10px;
 line-height:1.17em;
 font-size:1.5em;
 vertical-align:bottom;
 color:#fff
}
@media (min-width:37.5em) {
 .stepper-add-button,
 .stepper-remove-button {
  font-size:1.125em;
  line-height:1.38889
 }
}
.stepper-add-button:hover,
.stepper-remove-button:hover {
 background-color:#000
}
.stepper-add-button:hover,
.stepper-remove-button:hover {
 color:#ffbf47
}
.stepper-remove-button {
 border-radius:10px 0 0 10px;
 padding-right:13px;
 padding-left:15px
}
.stepper-add-button {
 border-radius:0 10px 10px 0;
 padding-left:13px;
 padding-right:15px
}
.stepper input {
 display:inline-block;
 width:4em;
 text-align:center;
 z-index:2;
 position:relative
}
.stepper input[type=number]::-webkit-inner-spin-button,
.stepper input[type=number]::-webkit-outer-spin-button {
 -webkit-appearance:none;
 margin:0
}
.stepper input[type="number"] {
    -moz-appearance: textfield;
}
`;

function addCSS(){
  let style = document.createElement('style');
  style.innerText = css_rules;
  document.head.append(style);
}
addCSS();

function upgrade(input){
  console.log('upgrading %s', input.id);
  let id = input.id;
  let name = input.getAttribute('name') || input.id;
  let value = input.value;
  let min = input.getAttribute('min');
  let max = input.getAttribute('max');
  let step = input.getAttribute('step');
  let klass= input.getAttribute('class');
  let onchange = input.getAttribute('onchange');
  let label = document.querySelector(`label[for=${id}]`);
  if (!label){
    if (input.parentElement.tagName === 'LABEL'){
      label = input.parentElement;
      label.parent.insertBefore(input, label);
    }
    input.parentElement;
  if (label && label.tagName !== 'LABEL'){
    label = null;
    alert('input must have a label!');
  }
  let labelText = label ? label.innerText : `${id} input`;
  if (label){
    label.remove();
  }
  input.outerHTML = `<div class="field">
    <label for="${id}" id="${id}-label">${labelText}</label>
    <div class="stepper">
      <button type="button" class="stepper-remove-button" aria-label="Decrease" aria-describedby="${id}-label">&minus;</button>
      <input type="number" class="stepper-input" id="${id}" name="${name}" value="${value}">
      <button type="button" class="stepper-add-button" aria-label="Increase" aria-describedby="${id}-label">&plus;</button>
      <div class="visually-hidden" role="status" aria-live="polite">${value}</div>
     </div>
   </div>
  `;
  let newInput = document.querySelector(`#${id}`);
  if (min){
    newInput.setAttribute('min', min);
  }
  if (max){
    newInput.setAttribute('max', max);
  }
  if (step){
    newInput.setAttribute('step', step);
  }
  if (klass){
    newInput.setAttribute('class', klass);
  }
  if (onchange){
    newInput.setAttribute('onchange', onchange);
  }
}

Array.from(document.querySelectorAll('input[type=number]')).forEach(upgrade);