// following code segments inspired from David Kopec's video about 'Constraint-Satisfaction Problems in Python'
// https://www.youtube.com/watch?v=D1LVbE8nyXs
export class AllDifferentConstraint{
    constructor(variables) {
        this.variables = variables;
    }
    /**
     * Check if the given assignment satisfies the all-different constraint.
     *
     * @param {object} assignment - The assignment of variables and their values.
     * @returns {boolean} - True if all values are unique within the constraint, false otherwise.
     */
    satisfied(assignment) {
        const currNotEqVariable = this.variables[0];
        for (const variable of this.variables) {
            if (variable !== currNotEqVariable && assignment[variable] !== undefined && assignment[currNotEqVariable] === assignment[variable]) {
                return false; // If a value is repeated then the constraint is not satisfied
            }
        }
        return true; // All values are unique within the constraint; constraint is satisfied
    }
}

export class ColumnSumConstraint  {
    constructor(variables) {
        this.variables = variables;
        this.targetVar = variables[variables.length-1]; // The last variable in the list is the targetSum variable(all previous variables should sum to this)
    }
    
    /**
     * Check if the given assignment satisfies the column sum constraint.
     *
     * @param {object} assignment - The assignment of variables and their values.
     * @returns {boolean} - True if the assignment satisfies the constraint, false otherwise.
     */
    satisfied(assignment) {
        const targetSum = assignment[this.targetVar];
        if(targetSum === undefined) return true; // if the target sum hasn't been defined yet then the constraint is satisfied
        let sum = 0;
        let count = 0;
        for(const variable of this.variables) {
            if(variable !== this.targetVar && assignment[variable] !== undefined) {
                sum += assignment[variable];
                count++;
            }
        }
        // if all variables have been assigned and the sum is not equal to the target sum then the constraint is not satisfied
        if(count === this.variables.length-1 && sum !== targetSum) {
            return false;
        }
        // or if the sum of the current assigned variables is greater than the target sum then the constraint is not satisfied
        if(sum > targetSum) {
            return false;
        }
        // otherwise the constraint is satisfied
        return true;
    }
}
export class CSP {
    /**
     * Creates a new Constraint Satisfaction Problem (CSP).
     *
     * @param {array} variables - An array of variables for the CSP.
     * @param {object} domains - An object where the keys are variables and the values are arrays of possible values for those variables.
     */
    constructor(variables, domains) {
        this.variables = variables;
        this.domains = domains;
        this.constraints = {};
        this.consistencyChecks = 0;
        for(const variable of variables) {
            this.constraints[variable] = [];
            if(!(variable in domains)) {
                throw new Error('Every variable should have a domain assigned to it.');
            }
        }
    }
    /**
     * Adds a constraint to the CSP.
     *
     * @param {object} constraint - The constraint to be added.
     * @throws {Error} - If a variable in the constraint is not present in the CSP.
     */
    addConstraint(constraint) {
        for(const variable of constraint.variables) {
            if(!this.variables.includes(variable)) {
                throw new Error('Variable in constraint but not in CSP');
            } else {
                this.constraints[variable].push(constraint);
            }
        }
    }
    /**
    * Checks if an assignment is consistent by checking all constraints.
    *
    * @param {string} variable - The variable to check consistency for.
    * @param {object} assignment - The assignment of variables and their values.
    * @returns {boolean} - True if the assignment is consistent, false otherwise.
    */
    consistent(variable, assignment) {
        this.consistencyChecks++;
        for(const constraint of this.constraints[variable]) {
            if(!constraint.satisfied(assignment)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Performs a backtracking search to find a solution to the Constraint Satisfaction Problem (CSP).
     *
     * @param {object} assignment - The current assignment of variables and their values.
     * @returns {object|null} - The complete assignment if a solution is found, or null if no solution exists.
     */
    backtrackingSearch(assignment = {}) {
        if(Object.keys(assignment).length === this.variables.length) {
            // assignment is complete
            return assignment;
        }
        // get all variables in CSP but not in assignment
        const unassigned = this.variables.filter(v => !(v in assignment));
        // get every possible domain value of the first unassigned variable
        const first = unassigned[0];
        for(const value of this.domains[first]) {
            const localAssignment = {...assignment};
            localAssignment[first] = value;
            // if we're still consistent, we recurse (continue)
            if(this.consistent(first, localAssignment)) {
                const result = this.backtrackingSearch(localAssignment);
                if(result !== null) {
                    return result;
                }
            }
        }
        return null;
    }
    /**
     * Performs a backtracking search to find a solution to the Constraint Satisfaction Problem (CSP) using the Minimum Remaining Values (MRV) heuristic.
     *
     * @param {object} assignment - The current assignment of variables and their values.
     * @returns {object|null} - The complete assignment if a solution is found, or null if no solution exists.
     */
    backtrackingSearchWithMRV(assignment = {}) {
        if(Object.keys(assignment).length === this.variables.length) {
            // assignment is complete
            return assignment;
        }
        // use mrv to get the unassigned variable with the least remaining values
        const unassigned = this.variables.filter(v => !(v in assignment));
        const first = this.mrv(unassigned);
        for(const value of this.domains[first]) {
            const localAssignment = {...assignment};
            localAssignment[first] = value;
            // if we're still consistent, we recurse (continue)
            if(this.consistent(first, localAssignment)) {
                const result = this.backtrackingSearchWithMRV(localAssignment);
                if(result !== null) {
                    return result;
                }
            }
        }
        return null;
    }
    /**
     * Performs a forward checking search to find a solution to the Constraint Satisfaction Problem (CSP).
     *
     * @param {object} assignment - The current assignment of variables and their values.
     * @param {object} domains - The current domains of variables and their possible values.
     * @returns {object|null} - The complete assignment if a solution is found, or null if no solution exists.
     */
    forwardCheckingSearch(assignment = {}, domains = this.domains) {
        if(Object.keys(assignment).length === this.variables.length) {
            // assignment is complete
            return assignment;
        }
        // get all variables in CSP but not in assignment
        const unassigned = this.variables.filter(v => !(v in assignment));
        const first = unassigned[0];
        for(const value of domains[first]) {
            const localAssignment = {...assignment};
            localAssignment[first] = value;
            // if we're still consistent, we recurse (continue)
            if(this.consistent(first, localAssignment)) {
                const localDomain = {...domains};
                if(this.forwardChecking(first, localAssignment, localDomain)) {
                    const result = this.forwardCheckingSearch(localAssignment, localDomain);
                    if(result !== null) {
                        return result;
                    }
                }
            }
        }
        return null;
    }
    /**
     * Performs a forward checking search to find a solution to the Constraint Satisfaction Problem (CSP) using the Minimum Remaining Values (MRV) heuristic.
     *
     * @param {object} assignment - The current assignment of variables and their values.
     * @param {object} domains - The current domains of variables and their possible values.
     * @returns {object|null} - The complete assignment if a solution is found, or null if no solution exists.
     */
    forwardCheckingSearchWithMRV(assignment = {}, domains = this.domains) {
        if(Object.keys(assignment).length === this.variables.length) {
            // assignment is complete
            return assignment;
        }
        // get all variables in CSP but not in assignment
        const unassigned = this.variables.filter(v => !(v in assignment));
        const first = this.mrv(unassigned);
        for(const value of domains[first]) {
            const localAssignment = {...assignment};
            localAssignment[first] = value;
            // if we're still consistent, we recurse (continue)
            if(this.consistent(first, localAssignment)) {
                const localDomain = {...domains};
                if(this.forwardChecking(first, localAssignment, localDomain)) {
                    const result = this.forwardCheckingSearchWithMRV(localAssignment, localDomain);
                    if(result !== null) {
                        return result;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Returns the unassigned variable with the least remaining values.
     *
     * @param {array} unassigned - The list of unassigned variables.
     * @returns {string} - The unassigned variable with the least remaining values.
     */
    mrv(unassigned) {
        return unassigned.reduce((a, b) => {
            if(this.domains[a].length < this.domains[b].length) {
                return a;
            } else {
                return b;
            }
        });
    }

    /**
     * Performs forward checking by looping over all neighbours(variables of the same constraint) of the given variable
     * and removes inconsistent values from their domains.
     * 
     * @param {string} variable - The variable to perform forward checking on.
     * @param {object} assignment - The current assignment of variables and their values.
     * @param {object} domains - The current domains of variables and their possible values.
     * @returns {boolean} - True if forward checking is successful, false otherwise.
     */
    forwardChecking(variable, assignment, domains) {
        for(const constraint of this.constraints[variable]) {
            if((constraint instanceof AllDifferentConstraint && constraint.variables[0] === variable) || constraint instanceof ColumnSumConstraint) {
                for(const neighbor of constraint.variables) {
                    if(!(neighbor in assignment)) {
                        for(const val of domains[neighbor]) {
                            assignment[neighbor] = val;
                            if(!this.consistent(neighbor, assignment)) {
                                // if the value is inconsistent then remove it from the domain of the neighbor
                                domains[neighbor] = domains[neighbor].filter(v => v !== val);
                                // if the domain of any neighbor is empty then the assignment is not consistent
                                if(domains[neighbor].length === 0) {
                                    delete assignment[neighbor];
                                    return false;
                                }
                            }
                            delete assignment[neighbor];
                        }
                    }
                }
            }
        }
        return true;
    }
    
}