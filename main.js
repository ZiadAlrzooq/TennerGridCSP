import * as CSPModule from "./CSP.js";
const COLUMNS = 10;
let rows = 3;
let savedState = null; // used to save the state of the grid when the user clicks the reset button

/**
 * Creates grid cells and target cells in the DOM.
 * @param {number} rows - The number of rows in the grid.
 * @param {number} columns - The number of columns in the grid.
 */
function createCells(rows, columns) {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.setAttribute("data-row", `${i}`);
      cell.setAttribute("data-col", `${j}`);
      cell.contentEditable = true;
      const grid = document.querySelector(".grid");
      grid.appendChild(cell);
    }
  }
  // Create the target cells
  for (let i = 0; i < columns; i++) {
    const targetCell = document.createElement("div");
    targetCell.className = "target-cell";
    targetCell.setAttribute("data-col", `${i}`);
    targetCell.contentEditable = true;
    const grid = document.querySelector(".grid");
    grid.appendChild(targetCell);
  }
}
function clearGrid() {
  const grid = document.querySelector(".grid");
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }
}
createCells(rows, COLUMNS);
/**
 * Creates the variables for the Constraint Satisfaction Problem (CSP).
 * The variables in our CSP will be the grid cells and the target cells.
 * 
 * @returns {string[]} An array of variables representing the grid cells and target cells.
 */
function createVariables() {
  const variables = Array.from(document.querySelectorAll(".cell")).map(
    (cell) => cell.dataset.row + "," + cell.dataset.col
  );
  variables.push(
    ...Array.from(document.querySelectorAll(".target-cell")).map(
      (cell) => "t" + cell.dataset.col
    )
  );
  return variables;
}
/**
 * Creates the domains for the CSP.
 * The domains in our CSP will be the possible values for each grid cell and target cell.
 * @returns {Array<Array<number>>} An array containing the grid cells domain and target cells domain.
 */
function createDomains() {
  const gridCellsDomain = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  // The target cells have a different domain
  const minValue = Math.floor(rows / 2) * 1; // The minimum value for a target cell e.g. 0, 1, 0, 1, 0 = 2
  const maxValue = Math.ceil(rows / 2) * 9 + Math.floor(rows / 2) * 8; // The maximum value for a target cell e.g. 9, 8, 9, 8, 9 = 43
  // a range of possible values for a target cell starting from the minimum value and ending at the maximum value
  const targetCellsDomain = Array.from(
    { length: maxValue - minValue + 1 },
    (_, i) => minValue + i
  );
  return [gridCellsDomain, targetCellsDomain];
}
/**
 * Initializes variables and domains for the Tenner Grid CSP.
 * @returns {Array} An array containing the variables and domains.
 */
function initializeVariablesAndDomains() {
  const variables = createVariables();
  // Adding the domains to the variables
  const [gridCellsDomain, targetCellsDomain] = createDomains();
  const domains = {}; // a map of {variable: domain}
  for (const variable of variables) {
    let cell; // get the corresponding cell for the variable
    if (variable.startsWith("t")) {
      cell = document.querySelector(
        `.target-cell[data-col="${variable.charAt(1)}"]`
      );
    } else {
      cell = document.querySelector(
        `.cell[data-row="${variable.charAt(0)}"][data-col="${variable.charAt(
          2
        )}"], .target`
      );
    }
    if (cell.innerText !== '') {
      // if the cell has a predefined value(by the randomInitialState function or set by the user) then we restrict the domain to that value
      domains[variable] = [parseInt(cell.innerText)];
    }
    // otherwise we use default domains
    else if (!variable.startsWith("t")) {
      domains[variable] = gridCellsDomain; // all possible values for a grid cell
    } else {
      domains[variable] = targetCellsDomain; // all possible values for a target cell
    }
  }
  return [variables, domains];
}

/**
 * Generates column sum constraints for a given set of variables and CSP.
 * @param {Array} variables - The array of variables.
 * @param {CSP} csp - The CSP object.
 */
function genColSumConstraint(variables, csp) {
  for (let i = 0; i < COLUMNS; i++) {
    const colVariables = [];
    for (let j = 0; j < rows + 1; j++) {
      colVariables.push(variables[j * COLUMNS + i]); // j * COLUMNS + i is the index of the current cell in the variables array
    }
    csp.addConstraint(new CSPModule.ColumnSumConstraint(colVariables));
  }
}

/**
 * Generates an AllDifferent constraint for the given variables and adds it to the CSP.
 * The AllDifferent constraint ensures that all variables in the constraint have distinct values.
 *
 * @param {Array} variables - The variables to include in the AllDifferent constraint.
 * @param {CSP} csp - The CSP (Constraint Satisfaction Problem) to add the constraint to.
 */
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
/**
 * Updates the user interface with the CSP solution result.
 *
 * @param {object} result - The result of the CSP solution.
 * @param {number} [consistencyChecks] - The number of consistency checks performed.
 * @param {number} [time] - The time taken for the CSP solution in milliseconds.
 */
function updateUIWithCSPResult(result, consistencyChecks, time) {
  if (result === null) {
    console.log("No solution found!");
    return;
  }
  //clear and reset the grid
  clearGrid();
  createCells(rows, COLUMNS);
  // update the consistency checks and time elements if they are provided
  updateConsistencyAndTime(consistencyChecks, time);
  // update the grid and target cells with the values from the result
  for (const variable in result) {
    const value = result[variable];
    if (variable.startsWith("t")) {
      updateTargetCell(variable, value);
    } else {
      updateGridCell(variable, value);
    }
  }
}

/**
 * Updates the consistency checks and time elements in the UI.
 *
 * @param {number} [consistencyChecks] - The number of consistency checks performed.
 * @param {number} [time] - The time taken for the CSP solution in milliseconds.
 */
function updateConsistencyAndTime(consistencyChecks, time) {
  if (consistencyChecks !== undefined && time !== undefined) {
    const consistencyChecksEl = document.getElementById("consistency-checks");
    const timeEl = document.getElementById("time-taken");

    consistencyChecksEl.innerText = "Consistency checks: " + consistencyChecks;
    timeEl.innerText = "Time taken: " + time.toFixed(2) + "ms";
  }
}

/**
 * Updates the target cell in the UI.
 *
 * @param {string} variable - The variable representing the target cell.
 * @param {number} value - The value to be displayed in the target cell.
 */
function updateTargetCell(variable, value) {
  const col = variable[1];
  const targetCell = document.querySelector(
    `.target-cell[data-col="${col}"]`
  );
  targetCell.innerText = value;
}

/**
 * Updates the grid cell in the UI.
 *
 * @param {string} variable - The variable representing the grid cell.
 * @param {number} value - The value to be displayed in the grid cell.
 */
function updateGridCell(variable, value) {
  const [row, col] = variable.split(",");
  const cell = document.querySelector(
    `.cell[data-row="${row}"][data-col="${col}"]`
  );
  cell.innerText = value;
}
/**
 * Creates a CSP (Constraint Satisfaction Problem) instance.
 * 
 * This function initializes the variables and domains for the CSP, and adds the necessary constraints.
 * 
 * @returns {CSP} The created CSP instance.
 */
function createCSP() {
  const [variables, domains] = initializeVariablesAndDomains();
  const csp = new CSPModule.CSP(variables, domains);
  genColSumConstraint(variables, csp);
  genAllDiffConstraint(variables, csp);
  return csp;
}

// Add event listener to the grid to prevent the user from entering invalid values
const grid = document.querySelector(".grid");
grid.addEventListener('input', (event) => {
  const cell = event.target;
  const inputValue = cell.textContent.trim();
  let digit = parseInt(inputValue);

  if (!isNaN(digit)) {
      // Update the content if it's a valid digit
      if(digit > 9) {
        digit = digit % 10;
      }
      cell.textContent = digit;
      // the following code is used to move the cursor to the end of the cell after the user enters a value
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(cell);
      range.collapse(false); // Collapse the range to the end
      selection.removeAllRanges();
      selection.addRange(range);
  } else {
      // Clear the content if it's not a valid digit
      cell.textContent = '';
  }
});

const backtrackingBtn = document.getElementById("backtracking");
backtrackingBtn.addEventListener("click", (e) => {
  const csp = createCSP();
  const startTime = performance.now();
  const result = csp.backtrackingSearch();
  const endTime = performance.now();
  updateUIWithCSPResult(result, csp.consistencyChecks, endTime - startTime);
});

const backtrackingMRVBtn = document.getElementById("backtracking-mrv");
backtrackingMRVBtn.addEventListener("click", (e) => {
  const csp = createCSP();
  const startTime = performance.now();
  const result = csp.backtrackingSearchWithMRV();
  const endTime = performance.now();
  updateUIWithCSPResult(result, csp.consistencyChecks, endTime - startTime);
});

const forwardCheckingBtn = document.getElementById("forwardchecking");
forwardCheckingBtn.addEventListener("click", (e) => {
  const csp = createCSP();
  const startTime = performance.now();
  const result = csp.forwardCheckingSearch();
  const endTime = performance.now();
  updateUIWithCSPResult(result, csp.consistencyChecks, endTime - startTime);
});

const forwardCheckingMRVBtn = document.getElementById("forwardchecking-mrv");
forwardCheckingMRVBtn.addEventListener("click", (e) => {
  const csp = createCSP();
  const startTime = performance.now();
  const result = csp.forwardCheckingSearchWithMRV();
  const endTime = performance.now();
  updateUIWithCSPResult(result, csp.consistencyChecks, endTime - startTime);
});

const resetBtn = document.getElementById("reset");
resetBtn.addEventListener("click", (e) => {
  if (savedState === null) {
    console.log("No saved state!");
    return;
  }
  console.log("Resetting to saved state...");
  updateUIWithCSPResult(savedState);
});

document.addEventListener("DOMContentLoaded", function () {
  const slider = document.getElementById("row-size-slider");
  slider.addEventListener("input", function () {
    rows = parseInt(this.value);
    slider.nextElementSibling.innerText = "Row Size: " + rows;
    clearGrid();
    createCells(rows, COLUMNS);
    randomInitialState();
  });
});
const randomize = document.getElementById("randomize");
randomize.addEventListener("click", randomInitialState);

/**
 * Generates a random initial state for the Constraint Satisfaction Problem (CSP).
 * Clears the grid, creates cells, and assigns random values to grid variables with a 50% chance of assignment.
 * Uses the backtracking search algorithm to find a solution, restricting domains based on the assigned values.
 * If no solution is found(rarely), retries the process.
 * Updates the user interface with the CSP solution result.
 */
function randomInitialState() {
  clearGrid();
  createCells(rows, COLUMNS);
  const [gridCellsDomain, targetCellsDomain] = createDomains();
  const csp = createCSP();
  const assignment = {};
  // assign random values to the grid variables with a 50% chance of assigning a value to a variable
  for (const gridVariable of csp.variables.filter(
    (variable) => !variable.startsWith("t")
  )) {
    if (Math.random() < 0.5) {
      const shuffledDomain = gridCellsDomain.sort(() => 0.5 - Math.random());
      for (const value of shuffledDomain) {
        if (csp.consistent(gridVariable, {...assignment ,[gridVariable]: value })) { 
          assignment[gridVariable] = value;
          break;
        }
      }
    }
  }
    // restrict the domains of the grid variables to the values in the assignment otherwise use default domains for the grid variables and target variables
    for (const variable of csp.variables) {
      if (variable in assignment) {
        csp.domains[variable] = [assignment[variable]];
      } else if(variable.startsWith("t")) {
        csp.domains[variable] = targetCellsDomain;
      }
      else {
        csp.domains[variable] = gridCellsDomain;
      }
    }
    const result = csp.forwardCheckingSearchWithMRV(assignment);
    if (result === null) {
      console.log("No solution found! retrying...");
      randomInitialState();
      return;
    }
    // add the target cells from result to the assignment
    for (const variable in result) {
      if (variable.startsWith("t")) {
        assignment[variable] = result[variable];
      }
    }
    savedState = assignment;
    updateUIWithCSPResult(assignment);
}
randomInitialState();