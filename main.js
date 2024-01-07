import * as CSPModule from './CSP.js';
const columns = 10;
const rows = 3;
// Create the grid cells
for(let i = 0; i < rows; i++) {
    for(let j = 0; j < columns; j++) {
        let cell = document.createElement("div");
        cell.className = "cell";
        cell.innerText = '\u2003';
        cell.setAttribute('data-row', `${i}`);
        cell.setAttribute('data-col', `${j}`);
        let grid = document.querySelector(".grid");
        grid.appendChild(cell);
    }
}
// Create the target cells
for(let i = 0; i < columns; i++) {
    let targetCell = document.createElement("div");
    targetCell.className = "target-cell";
    targetCell.innerText = '\u2003';
    targetCell.setAttribute('data-col', `${i}`);
    let grid = document.querySelector(".grid");
    grid.appendChild(targetCell);
}

// The variables in our CSP will be the grid cells which we can get using the following code
const variables = Array.from(document.querySelectorAll('.cell')).map(cell => cell.dataset.row + ',' + cell.dataset.col);
console.log(variables);