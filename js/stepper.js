// Intended to enhance UI without being required. Will find any <input type="number" and replace them with this control to provide better visibility and larger targets for the stepper.

// CSS 

const rules = `
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button{
  -webkit-appearace: none;
  appearance: none;
  margin: 0;
}
`;

