import * as CSPModule from "./CSP.js";
const COLUMNS = 10;
const rows = 3;
// Create the grid cells
for (let i = 0; i < rows; i++) {
  for (let j = 0; j < COLUMNS; j++) {
    let cell = document.createElement("div");
    cell.className = "cell";
    cell.innerText = "\u2003";
    cell.setAttribute("data-row", `${i}`);
    cell.setAttribute("data-col", `${j}`);
    let grid = document.querySelector(".grid");
    grid.appendChild(cell);
  }
}
// Create the target cells
for (let i = 0; i < COLUMNS; i++) {
  let targetCell = document.createElement("div");
  targetCell.className = "target-cell";
  targetCell.innerText = "\u2003";
  targetCell.setAttribute("data-col", `${i}`);
  let grid = document.querySelector(".grid");
  grid.appendChild(targetCell);
}

// The variables in our CSP will be the grid cells and the target cells which we can get using the following code
const variables = Array.from(document.querySelectorAll(".cell")).map(
  (cell) => cell.dataset.row + "," + cell.dataset.col
);
variables.push(
  ...Array.from(document.querySelectorAll(".target-cell")).map(
    (cell) => "t" + cell.dataset.col
  )
);
// Adding the domains to the variables
let domains = {};
const gridCellsDomain = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
// The target cells have a different domain
const minValue = Math.floor(rows / 2) * 1; // The minimum value for a target cell e.g. 0, 1, 0, 1, 0 = 2
const maxValue = Math.ceil(rows / 2) * 9 + Math.floor(rows / 2) * 8; // The maximum value for a target cell e.g. 9, 8, 9, 8, 9 = 43
// a range of possible values for a target cell starting from the minimum value and ending at the maximum value
const targetCellsDomain = Array.from(
  { length: maxValue - minValue + 1 },
  (_, i) => minValue + i
);
for (const variable of variables) {
  if (!variable.startsWith('t')) {
    domains[variable] = gridCellsDomain; // all possible values for a grid cell
  } else {
    domains[variable] = targetCellsDomain; // all possible values for a target cell
  }
}
// Create the CSP
const csp = new CSPModule.CSP(variables, domains);
// Add the constraints to the CSP

function genColSumConstraint(variables) {
  for(let i = 0; i < COLUMNS; i++) {
    const colVariables = [];
    for(let j = 0; j < rows + 1; j++) {
      colVariables.push(variables[j * COLUMNS + i]); // j * COLUMNS + i is the index of the current cell in the variables array
    }
    csp.addConstraint(new CSPModule.ColumnSumConstraint(colVariables));
  }
}
genColSumConstraint(variables);

