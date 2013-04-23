module.exports = {
    Body: function() {
        this._name = 'Body';
        this.lines = [];
        this.push = function(line) {
            this.lines.push(line);
        }
    },
    Declaration: function(name, assignment) {
        this._name = 'Declaration';
        this.name = name;
        this.value = assignment || null;
    },

    Assignment: function(variable, value) {
        this._name = 'Assignment';
        this.name = variable;
        this.value = value;
    },

    Identifier: function(name) {
        this._name = 'Identifier';
        this.name = name;
    },

    // literals
    Number: function(num) {
        this._name = 'Number';
        this._primitive = true;
        this.value = Number(num);
    },
    Yarn: function(s) {
        this._name = 'Yarn';
        this._primitive = true;
        this.value = s.slice(1, -1);
    },
    Troof: function(v) {
        this._name = 'Truf';
        this._primitive = true;
        this.value = !!v;
    },
    Noob: function() {
        this._name = 'Noob';
        this._primitive = true;
        this.value = null;
    },




    ArgList: function(optArgs) {
        this._name = 'Arg list';
        this.values = optArgs ? optArgs : [];
        this.push = function(v) {
            this.values.push(v);
        };
        
        
    },

    FunctionCall: function(f, args) {
        this._name = 'Function Call';
        this.name = f;
        this.args = args;
    },
    FunctionDefinition: function(f, args, body) {
        this._name = 'Function Definition';
        this.name = f;
        this.args = args;
        this.body = body;
    },

    If: function (body) {
        this._name = 'If';
        this.condition = null;
        this.body = body;
        this.elseIfs = [];
        this.elseBody = null;
    }
    
};