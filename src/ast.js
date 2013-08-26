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


lol.ast.Indexer = function(location, lhs, rhs) {
    lol.ast.Node.call(this, location, 'Indexer');
    this.lhs = lhs;
    this.rhs = rhs;
}
lol.ast.Indexer.prototype = Object.create(lol.ast.Node.prototype);


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

lol.ast.Gimmeh = function(location, variable) {
    lol.ast.Node.call(this, location, 'Gimmeh');
    this.variable = variable;
};
lol.ast.Gimmeh.prototype = Object.create(lol.ast.Node.prototype);


lol.ast.Cast = function(location, expression, type) {
    lol.ast.Node.call(this, location, 'Cast');
    this.expression = expression;
    this.type = type;
};
lol.ast.Cast.prototype = Object.create(lol.ast.Node.prototype);


lol.ast.Breakpoint = function(location) {
    lol.ast.Node.call(this, location, 'Breakpoint');
};
lol.ast.Breakpoint.prototype = Object.create(lol.ast.Node.prototype);


if (typeof module !== 'undefined') {
    module.exports = lol.ast;
}