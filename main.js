import * as CSPModule from "./CSP.js";
const COLUMNS = 10;
const rows = 3;
// Create the grid cells
function createCells(rows, columns) {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < COLUMNS; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.innerText = "\u2003";
      cell.setAttribute("data-row", `${i}`);
      cell.setAttribute("data-col", `${j}`);
      const grid = document.querySelector(".grid");
      grid.appendChild(cell);
    }
  }
  // Create the target cells
  for (let i = 0; i < COLUMNS; i++) {
    const targetCell = document.createElement("div");
    targetCell.className = "target-cell";
    targetCell.innerText = "\u2003";
    targetCell.setAttribute("data-col", `${i}`);
    const grid = document.querySelector(".grid");
    grid.appendChild(targetCell);
  }
}
createCells(rows, COLUMNS);
function createCSPVariablesAndDomains() {
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
  const domains = {};
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
    if (!variable.startsWith("t")) {
      domains[variable] = gridCellsDomain; // all possible values for a grid cell
    } else {
      domains[variable] = targetCellsDomain; // all possible values for a target cell
    }
  }
  return [variables, domains];
}
// Create the CSP
const [variables, domains] = createCSPVariablesAndDomains();
const csp = new CSPModule.CSP(variables, domains);
// Add the constraints to the CSP
function genColSumConstraint(variables, csp) {
  for (let i = 0; i < COLUMNS; i++) {
    const colVariables = [];
    for (let j = 0; j < rows + 1; j++) {
      colVariables.push(variables[j * COLUMNS + i]); // j * COLUMNS + i is the index of the current cell in the variables array
    }
    csp.addConstraint(new CSPModule.ColumnSumConstraint(colVariables));
  }
}

function genAllDiffConstraint(variables, csp) {
  // for each cell in the grid we need to add all the cells that are adjacent to it and in the same row to the allDiff constraint
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < COLUMNS; j++) {
      const currAllDiffVariables = [];
      // add the current cell
      currAllDiffVariables.push(variables[i * COLUMNS + j]);
      // the cell above
      if (i > 0) {
        currAllDiffVariables.push(variables[(i - 1) * COLUMNS + j]);
      }
      // the cell below
      if (i < rows - 1) {
        currAllDiffVariables.push(variables[(i + 1) * COLUMNS + j]);
      }
      // the cell to the left
      if (j > 0) {
        currAllDiffVariables.push(variables[i * COLUMNS + j - 1]);
      }
      // the cell to the right
      if (j < COLUMNS - 1) {
        currAllDiffVariables.push(variables[i * COLUMNS + j + 1]);
      }
      // the cell top left
      if (i > 0 && j > 0) {
        currAllDiffVariables.push(variables[(i - 1) * COLUMNS + j - 1]);
      }
      // the cell top right
      if (i > 0 && j < COLUMNS - 1) {
        currAllDiffVariables.push(variables[(i - 1) * COLUMNS + j + 1]);
      }
      // the cell bottom left
      if (i < rows - 1 && j > 0) {
        currAllDiffVariables.push(variables[(i + 1) * COLUMNS + j - 1]);
      }
      // the cell bottom right
      if (i < rows - 1 && j < COLUMNS - 1) {
        currAllDiffVariables.push(variables[(i + 1) * COLUMNS + j + 1]);
      }
      // add all cells in the same row
      for (let k = 0; k < COLUMNS; k++) {
        if (k !== j) {
          currAllDiffVariables.push(variables[i * COLUMNS + k]);
        }
      }
      csp.addConstraint(
        new CSPModule.AllDifferentConstraint(currAllDiffVariables)
      );
    }
  }
}
// add the column sum constraints
genColSumConstraint(variables, csp);
// add the allDiff constraints
genAllDiffConstraint(variables, csp);
const result = csp.backtrackingSearch();
function outputResult(result) {
  if (result === null) {
    console.log("No solution found!");
  } else {
    console.log(result);
    for (const variable in result) {
      if (variable.startsWith("t")) {
        const col = variable[1];
        const targetCell = document.querySelector(
          `.target-cell[data-col="${col}"]`
        );
        targetCell.innerText = result[variable];
      } else {
        const [row, col] = variable.split(",");
        const cell = document.querySelector(
          `.cell[data-row="${row}"][data-col="${col}"]`
        );
        cell.innerText = result[variable];
      }
    }
  }
}
outputResult(result);
