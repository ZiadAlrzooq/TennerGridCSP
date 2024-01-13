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
    if (cell.innerText !== "") {
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
  const targetCell = document.querySelector(`.target-cell[data-col="${col}"]`);
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
  cell.contentEditable = false;
}

// Add event listener to the grid to prevent the user from entering invalid values
const grid = document.querySelector(".grid");
grid.addEventListener("input", (event) => {
  const cell = event.target;
  const inputValue = cell.textContent.trim();
  let digit = parseInt(inputValue);

  if (!isNaN(digit)) {
    // Update the content if it's a valid digit
    if (digit > 9) {
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
    cell.textContent = "";
  }
});

const worker = new Worker("worker.js", { type: "module" });
const backtrackingBtn = document.getElementById("backtracking");
worker.onmessage = (e) => {
  const { result, consistencyChecks, time } = e.data;
  updateUIWithCSPResult(result, consistencyChecks, time);
};
backtrackingBtn.addEventListener("click", (e) => {
  const [variables, domains] = initializeVariablesAndDomains();
  worker.postMessage({
    type: "backtracking",
    variables,
    domains,
  });
});

const backtrackingMRVBtn = document.getElementById("backtracking-mrv");
backtrackingMRVBtn.addEventListener("click", (e) => {
  const [variables, domains] = initializeVariablesAndDomains();
  worker.postMessage({
    type: "backtracking-mrv",
    variables,
    domains,
  });
});

const forwardCheckingBtn = document.getElementById("forwardchecking");
forwardCheckingBtn.addEventListener("click", (e) => {
  const [variables, domains] = initializeVariablesAndDomains();
  worker.postMessage({
    type: "forwardchecking",
    variables,
    domains,
  });
});

const forwardCheckingMRVBtn = document.getElementById("forwardchecking-mrv");
forwardCheckingMRVBtn.addEventListener("click", (e) => {
  const [variables, domains] = initializeVariablesAndDomains();
  worker.postMessage({
    type: "forwardchecking-mrv",
    variables,
    domains,
  });
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

const randomize = document.getElementById("randomize");
randomize.addEventListener("click", (e) => {
  clearGrid();
  createCells(rows, COLUMNS);
  const [variables, domains] = initializeVariablesAndDomains();
  const [gridCellsDomain, targetCellsDomain] = createDomains();
  worker.postMessage({
    type: "randomize",
    variables,
    domains,
    gridCellsDomain,
    targetCellsDomain,
  });
});
document.addEventListener("DOMContentLoaded", function () {
  const slider = document.getElementById("row-size-slider");
  slider.addEventListener("input", function () {
    rows = parseInt(this.value);
    slider.nextElementSibling.innerText = "Row Size: " + rows;
    clearGrid();
    createCells(rows, COLUMNS);
  });
});
