// Intended to enhance UI without being required. Will find any <input type="number" and replace them with this control to provide better visibility and larger targets for the stepper.
// Based on the Stepper component in Form Design Patterns, by Adam Silver (starts on p. 181)

// CSS 

const css_rules = `
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button{
  -webkit-appearace: none;
  appearance: none;
  margin: 0;
}
input[type="number"] {
    -moz-appearance: textfield;
}
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
`;

function addCSS(){
  let style = document.createElement('style');
  style.innerText = css_rules;
  document.head.append(style);
}
addCSS();

function upgrade(input){
  let id = input.id;
  let name = input.getAttribute('name') || input.id;
  let value = input.value;
  let min = input.getAttribute('min');
  let max = input.getAttribute('max');
  let step = input.getAttribute('step');
  let label = document.querySelector(`label[for=${id}]`);
  let labelText = label ? label.innerText : `${id} input`;
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
  let newInput = input.querySelector('input');
  if (min){
    newInput.setAttribute('min', min);
  }
  if (max){
    newInput.setAttribute('max', max);
  }
  if (step){
    newInput.setAttribute('step', step);
  }
}

Array.from(document.querySelectorAll('input[type=number]')).forEach(upgrade);