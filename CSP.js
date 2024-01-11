// following code segments inspired from David Kopec's video about 'Constraint-Satisfaction Problems in Python'
// https://www.youtube.com/watch?v=D1LVbE8nyXs
export class AllDifferentConstraint{
    constructor(variables) {
        this.variables = variables;
    }
    satisfied(assignment) {
        const currNotEqVariable = this.variables[0];
        for (const variable of this.variables) {
            if (variable !== currNotEqVariable && assignment[variable] !== undefined && assignment[currNotEqVariable] === assignment[variable]) {
                return false; // If a value is repeated then we have failed
            }
        }
        return true; // All values are unique within the constraint
    }
}

export class ColumnSumConstraint  {
    constructor(variables) {
        this.variables = variables;
        this.targetVar = variables[variables.length-1]; // The last variable in the list is the targetSum variable(all previous variables should sum to this)
    }
    
    satisfied(assignment) {
        const targetSum = assignment[this.targetVar];
        if(targetSum === undefined) return true; // if the target sum hasn't been defined then we're still satisfied
        let sum = 0;
        let count = 0;
        for(const variable of this.variables) {
            if(variable !== this.targetVar && assignment[variable] !== undefined) {
                sum += assignment[variable];
                count++;
            }
        }
        // if all variables have been assigned and the sum is not equal to the target sum then we're not satisfied 
        if(count === this.variables.length-1 && sum !== targetSum) {
            return false;
        }
        // or if the sum of the current assigned variables is greater than the target sum then we're not satisfied
        if(sum > targetSum) {
            return false;
        }
        // otherwise we're satisfied
        return true;
    }
}
export class CSP {
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
    addConstraint(constraint) {
        for(const variable of constraint.variables) {
            if(!this.variables.includes(variable)) {
                throw new Error('Variable in constraint but not in CSP');
            } else {
                this.constraints[variable].push(constraint);
            }
        }
    }
    consistent(variable, assignment) {
        // assignment is a map of {variable: value}
        // returns true if assignment is consistent by checking all constraints
        this.consistencyChecks++;
        for(const constraint of this.constraints[variable]) {
            if(!constraint.satisfied(assignment)) {
                return false;
            }
        }
        return true;
    }
    backtrackingSearch(assignment = {}) {
        // assignment is a map of {variable: value}
        // returns map of {variable: value}
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

    backtrackingSearchWithMRV(assignment = {}) {
        // assignment is a map of {variable: value}
        // returns map of {variable: value}
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

    mrv(unassigned) {
        // returns the unassigned variable with the least remaining values
        return unassigned.reduce((a, b) => {
            if(this.domains[a].length < this.domains[b].length) {
                return a;
            } else {
                return b;
            }
        });
    }

    forwardChecking(variable, assignment, domains) {
        for(const constraint of this.constraints[variable]) {
            if((constraint instanceof AllDifferentConstraint && constraint.variables[0] === variable) || constraint instanceof ColumnSumConstraint) {
                for(const neighbor of constraint.variables) {
                    if(!(neighbor in assignment)) {
                        for(const val of domains[neighbor]) {
                            assignment[neighbor] = val;
                            if(!this.consistent(neighbor, assignment)) {
                                domains[neighbor] = domains[neighbor].filter(v => v !== val);
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