import * as CSPModule from "./CSP.js";
const COLUMNS = 10;
let rows = 3;
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


function randomInitialState(csp, gridCellsDomain, targetCellsDomain) {
  const assignment = {};
  // assign random values to the grid variables with a 50% chance of assigning a value to a variable
  for (const gridVariable of csp.variables.filter(
    (variable) => !variable.startsWith("t")
  )) {
    if (Math.random() < 0.5) {
      const shuffledDomain = gridCellsDomain.sort(() => 0.5 - Math.random());
      for (const value of shuffledDomain) {
        if (
          csp.consistent(gridVariable, { ...assignment, [gridVariable]: value })
        ) {
          assignment[gridVariable] = value;
          break;
        }
      }
    }
  }
  const savedDomains = {...csp.domains}; // save the domains incase we need to retry
  // restrict the domains of the grid variables to the values in the assignment
  for (const variable of csp.variables) {
    if (variable in assignment) {
      csp.domains[variable] = [assignment[variable]];
    } 
  }
  const result = csp.forwardCheckingSearchWithMRV(assignment);
  if (result === null) {
    console.log("No solution found! retrying...");
    csp.domains = savedDomains; // reset the domains
    return randomInitialState(csp, gridCellsDomain, targetCellsDomain);
  }
  // add the target cells from result to the assignment
  for (const variable in result) {
    if (variable.startsWith("t")) {
      assignment[variable] = result[variable];
    }
  }
  return assignment;
}

self.addEventListener("message", (e) => {
  const { type, variables, domains, gridCellsDomain, targetCellsDomain} = e.data;
  const csp = new CSPModule.CSP(variables, domains);
  rows = Math.floor(variables.length / COLUMNS) - 1; // -1 because we don't want to count the target cells row
  genColSumConstraint(variables, csp);
  genAllDiffConstraint(variables, csp);
  const startTime = performance.now();
  let result;
  switch (type) {
    case "backtracking":
      result = csp.backtrackingSearch();
      break;
    case "backtracking-mrv":
      result = csp.backtrackingSearchWithMRV();
      break;
    case "forwardchecking":
      result = csp.forwardCheckingSearch();
      break;
    case "forwardchecking-mrv":
      result = csp.forwardCheckingSearchWithMRV();
      break;
    case "randomize":
      result = randomInitialState(csp, gridCellsDomain, targetCellsDomain);
      break;
    default:
      break;
  }
  const endTime = performance.now();
  const timeTaken = endTime - startTime;
  if (type === "randomize") {
    self.postMessage({ result });
  }
  else {
    self.postMessage({ result, consistencyChecks: csp.consistencyChecks, time: timeTaken});
  } 
});
