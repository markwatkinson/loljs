"use strict";
var lol = lol || {};
lol.ast = {};

lol.ast.Node = function(location, name) {
    this._location = location;
    this._name = name;
};

lol.ast.Body = function(location) {
    lol.ast.Node.call(this, location, 'Body');
    this.lines = [];
};
lol.ast.Body.prototype = Object.create(lol.ast.Node.prototype);
lol.ast.Body.prototype.push = function(line) {
    this.lines.push(line);
};

lol.ast.Declaration = function(location, name, assignment) {
    lol.ast.Node.call(this, location, 'Declaration');
    this.name = name;
    this.value = assignment || null;
};
lol.ast.Declaration.prototype = Object.create(lol.ast.Node.prototype);

lol.ast.Assignment = function(location, name, value) {
    lol.ast.Node.call(this, location, 'Assignment');
    this.name = name;
    this.value = value;
};
lol.ast.Assignment.prototype = Object.create(lol.ast.Node.prototype);


lol.ast.Identifier = function(location, name) {
    lol.ast.Node.call(this, location, 'Identifier');
    this.name = name;
};
lol.ast.Identifier.prototype = Object.create(lol.ast.Node.prototype);

lol.ast.Literal = function(location, value) {
    lol.ast.Node.call(this, location, 'Literal');
    var self = this;
    this._wrapped = false;
    this._primitive = true;
    if (typeof value === 'string') {
        var delim = value.charAt(0);
        value = value.slice(1, -1);
        // FIXME: we are going to let variable interpolation be the runtime's
        // problem, but that means a dynamically constructed string could end
        // up being interpolated. Which is wrong.
        value = value.replace(/:(\((.*?)\)|.)/g, function($0, $1, $2) {
            var ret;
            if ($1.charAt(0) === '(') {
                ret = String.fromCharCode(parseInt($2, 16));
            }
            else {
                switch($1) {
                    case ')': ret = '\n'; break;
                    case '>': ret = '\t'; break;
                    case '"':
                    case "'":
                    case ':':
                        ret = $1; break;
                    default:
                        ret = $0;
                }
            }
            return ret;
        });
    }
    this.value = value;
};
lol.ast.Literal.prototype = Object.create(lol.ast.Node.prototype);

lol.ast.ArgList = function(location, args) {
    lol.ast.Node.call(this, location, 'ArgList');
    this.values = args || [];
};
lol.ast.ArgList.prototype = Object.create(lol.ast.Node.prototype);
lol.ast.ArgList.prototype.push = function(v) {
    this.values.push(v);
};

lol.ast.FunctionCall = function(location, name, args) {
    lol.ast.Node.call(this, location, 'FunctionCall');
    this.name = name;
    this.args = args;
};
lol.ast.FunctionCall.prototype = Object.create(lol.ast.Node.prototype);

lol.ast.FunctionDefinition = function(location, name, args, body) {
    lol.ast.Node.call(this, location, 'FunctionDefinition');
    this.name = name;
    this.args = args;
    this.body = body;
};
lol.ast.FunctionDefinition.prototype = Object.create(lol.ast.Node.prototype);

lol.ast.If = function(location, body) {
    lol.ast.Node.call(this, location, 'If');
    this.condition = null;
    this.body = body;
    this.elseIfs = [];
    this.elseBody = null;
};
lol.ast.If.prototype = Object.create(lol.ast.Node.prototype);

lol.ast.Return = function(location, expression) {
    lol.ast.Node.call(this, location, 'Return');
    this.expression = expression || null;
};
lol.ast.Return.prototype = Object.create(lol.ast.Node.prototype);


lol.ast.LoopOperation = function(location, command, symbol) {
    lol.ast.Node.call(this, location, 'LoopOperation');
    this.command = command;
    this.symbol = symbol;
};
lol.ast.LoopOperation.prototype = Object.create(lol.ast.Node.prototype);

lol.ast.LoopCondition = function(location, check, expression) {
    lol.ast.Node.call(this, location, 'LoopCondition');
    this.check = check;
    this.expression = expression;
};
lol.ast.LoopCondition.prototype = Object.create(lol.ast.Node.prototype);

lol.ast.Loop = function(location, body, op, condition) {
    lol.ast.Node.call(this, location, 'Loop');
    this.body = body;
    this.op = op || null;
    this.condition = condition || null;
};
lol.ast.Loop.prototype = Object.create(lol.ast.Node.prototype);

lol.ast.NoOp = function(location) {
    lol.ast.Node.call(this, location, 'NoOp');
};
lol.ast.NoOp.prototype = Object.create(lol.ast.Node.prototype);

lol.ast.Visible = function(location, expression) {
    lol.ast.Node.call(this, location, 'Visible');
    this.expression = expression;
};
lol.ast.Visible.prototype = Object.create(lol.ast.Node.prototype);


lol.ast.Cast = function(location, expression, type) {
    lol.ast.Node.call(this, location, 'Cast');
    this.expression = expression;
    this.type = type;
};
lol.ast.Cast.prototype = Object.create(lol.ast.Node.prototype);


if (module) {
    module.exports = lol.ast;
}
/*
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
    },
    Return: function(exp) {
        this._name = 'Return';
        this.exp = exp;
    },

    LoopOp: function(command, symbol) {
        this._name = 'Loop Operation';
        this.command = command;
        this.symbol = symbol;
    },
    LoopCondition: function(check, expression) {
        this._name = 'Loop Condition';
        this.check = check;
        this.exp = expression;
    },

    Loop: function(body, op, condition) {
        this._name = 'Loop';
        this.body = body;
        this.op = op || null;
        this.condition = condition || null;
    },

    Noop: function() {
        this._name = 'Noop';
    },

    Visible: function(exp) {
        this._name = 'Visible';
        this.exp = exp;
    }
    
    
};*/