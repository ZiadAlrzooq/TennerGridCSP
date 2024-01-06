// following code segments inspired from David Kopec's video about 'Constraint-Satisfaction Problems in Python'
// https://www.youtube.com/watch?v=D1LVbE8nyXs
class Constraint{
    constructor(variables) {
        this.variables = variables;
    }
    satisfied(assignment) {
        // assignment is a map of {variable: value}
        // returns true if assignment is consistent with the constraint
        for(let i = 0; i < this.variables.length; i++) {
            for(let j = 0; j < this.variables.length; j++) {
                // if two variables in the constraint are assigned the same value, then the assignment is invalid
                if(assignment[this.variables[i]] === assignment[this.variables[j]]) {
                    return false;
                }
            }
        }
        // if we get here then the assignment is consistent
        return true;
    }
}

class CSP {
    constructor(variables, domains) {
        this.variables = variables;
        this.domains = domains;
        this.constraints = {};
        for(const variable in variables) {
            this.constraints[variable] = [];
            if(!(variable in domains)) {
                throw new Error('Every variable should have a domain assigned to it.');
            }
        }
    }
    addConstraint(constraint) {
        for(const variable in constraint.variables) {
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
    
}