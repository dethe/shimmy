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
`;

function addCSS(){
  let style = document.createElement('style');
  style.innerText = css_rules;
  document.head.append(style);
}
addCSS();

document.head.append(
  dom.element('style', {}, css_rules));

function upgrade(input){
  
  input.outerHTML = `<div class="field">
  `;
}

Array.from(document.querySelectorAll('input[type=number]')).forEach(upgrade);