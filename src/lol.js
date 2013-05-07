"use strict";

var lol = function(options) {
    this._scope = [];
    this._next = null;
    this._ret;

    this._io = {
        visible: function(var_args) {
            if (!console || typeof console.log !== 'function') {
                throw new Error('console.log() not available');
            }
            console.log.apply(console, lol.utils.argsArray(arguments));
        },
        prompt: function(message, reply) {
            var response;
            if (typeof prompt === 'function') {
                response = prompt(message);
            } else {
                throw new Error('prompt() not available');
            }
            reply(response);
        }
    };
};

lol.prototype.resume = function() {
    this._next();
};

lol.prototype._push = function(s) {
    if (!s.name) { throw new Error('Scope must have name'); }
    s.symbols = s.symbols || {};
    s.symbols.IT = null;
    this._scope.push(s);
};

lol.prototype._pop = function(name) {
    var popped;
    do {
        // we should never be able to pop the root scope
        if (this._scope.length === 1) {
            throw new Error('Oops');
        }
        popped = this._scope.pop();
    } while(name && popped && popped.name !== name);
};

lol.prototype._getSymbol = function(name) {
    var scope = this._scope;
    for (var i = scope.length - 1; i >= 0; i--) {
        if (scope[i].symbols.hasOwnProperty(name)) {
            return scope[i].symbols[name];
        }
    }
    throw new Error('No such symbol: ' + name);
};
lol.prototype._setSymbol = function(name, value) {
    var scope = this._scope;
    for (var i = scope.length - 1; i >= 0; i--) {
        if (scope[i].symbols.hasOwnProperty(name)) {
            scope[i].symbols[name] = value;
            return;
        }
    }
    scope[scope.length - 1].symbols[name] = value;
}

lol.prototype._setSpecial = function(name, value) {
    this._scope[this._scope.length - 1][name] = value;
};

lol.prototype._getSpecial = function(name) {
    return this._scope[this._scope.length - 1][name];
};



lol.prototype._evaluate = function(node, setIT) {
    var self = this;
    var handlers = {
        'FunctionCall' : function(node) {
            var f = self._getSymbol(node.name);
            if (typeof f !== 'function') {
                throw new Error(node.name + ' is not a function' );
            }
            var args = node.args.values.map(function(a) {
                return self._evaluate(a);
            });
            return f.apply(null, args);
        },
        'FunctionDefinition' : function(node) {
            // we can keep consistency with natively implemented functions
            // by implementing the evaluation of a function as a function.
            // In other words: yo dawg, we heard you liked functions so we
            // put a function in your function so you can _evaluate while you
            // _evaluate.
            self._setSymbol(node.name, function(var_args) {
                var symbols = {}, args = arguments;
                node.args.forEach(function(a, i) {
                    symbols[a] = typeof args[i] === 'undefined' ? null : args[i];
                });
                self._push({name: 'function', symbols: symbols});
                var ret = self._evaluate(node.body);
                if (typeof ret === 'undefined') {
                    ret = self._getSpecial('return');
                }
                self._pop('function');
                return ret;
            });
        },
        'Return' : function(node) {
            self._setSpecial('return', self._evaluate(node.expression));
        },
        'Literal' : function(node) {
            var val = node.value;
            if (typeof val === 'string') {
                val = val.replace(/:(\{([^}]*)\})/g, function($0, $1) {
                    if ($1.charAt(0) === '{') {
                        return self._getSymbol(arguments[2]);
                    }
                    return $0;
                });
            }
            return val;
        },
        'Declaration' : function(node) {
            self._setSymbol(node.name, node.value ? self._evaluate(node.value) : null);
        },
        'Assignment' : function(node) {
            self._setSymbol(node.name, self._evaluate(node.value));
        },
        'Identifier' : function(node) {
            var s = self._getSymbol(node.name);
            if (typeof s === 'function') {
                // special case - s is a function. We should
                // probably invoke it?
                return s();
            }
            else { return s; }
        },
        'If' : function(node) {
            var c = node.condition;
            if (c) { c = self._evaluate(c); }
            else { c = self._getSymbol('IT'); }

            if (c) {
                self._evaluate(node.body);
            } else {
                var elseMatched = false;
                for (var i = 0; i < node.elseIfs.length; i++) {
                    var elseIf = node.elseIfs[i];
                    if (self._evaluate(elseIf.condition)) {
                        elseMatched = true;
                        self._evaluate(elseIf.body);
                        break;
                    }
                }
                if (!elseMatched && node.elseBody) {
                    self._evaluate(node.elseBody);
                }
            }
        },
        'Visible' : function(node) {
            self.io.visible(self._evaluate(node.expression));
        },
        'Body' : function(node) {
            node.lines.forEach(function(l) {
                ret = self._evaluate(l, true);
            });
            return ret;
        },
        'NoOp' : function(node) {},
        'LoopCondition': function(node) {
            var ret = self._evaluate(node.expression);
            return (node.check === 'while') ? ret : !ret;
        },
        'LoopOperation' : function(node) {
            var sym = self._getSymbol(node.symbol);
            sym = (node.command = 'inc' ? sym + 1 : sym - 1);
            self._setSymbol(node.symbol, sym);
        },
        'Loop' : function(node) {
            if (node.op) {
                var symbol = self._getSymbol(node.op.symbol);
                // initialise the loop symbol to 0 if it's not defined yet.
                if (typeof symbol === 'undefined') {
                    self._setSymbol(node.op.symbol, 0);
                }
            }
            var evalBody = !node.condition || self._evaluate(node.condition);
            self._push({name: 'loop'});
            while (evalBody) {
                self._evaluate(node.body);
                if (node.op) {
                    self._evaluate(node.op);
                }
                evalBody = !node.condition || self._evaluate(node.condition);
            }
            self._pop();
        },
        'Cast': function(node) {
            var raw = self._evaluate(node.expression);
            var type = node.type.toUpperCase();
            if (type === 'TROOF') { raw = !!raw; }
            else if (type === 'NOOB') { raw = null; }
            else if (type === 'YARN') { raw = lol.utils.toYarn(raw); }
            else if (type === 'NUMBR' || type === 'NUMBAR') {
                raw = Number(raw);
            }
            else {
                throw new Error('Unrecognised type: ' + type);
            }
            return raw;
        },
        'Gimmeh': function(node) {
            self._setSymbol(node.variable, prompt());
        }
    };

    var handler = handlers[node._name];

    if (!handler) {
        throw new Error('Not implemented: ' + node._name);
    }
    else {
        var ret = handler(node);
        if (setIT) {
            self._setSymbol('IT', ret);
        }
        return ret;
    }
};

lol.prototype._reset = function() {
    this._scope.length = 0;
    // clone built ins, otherwise they're a reference to a static property, i.e.
    // a program could overwrite them and break them for all subsequent executions.
    // I think keeping a reference to the function is fine though, there shouldn't
    // be any potential to escape the interpreter to modify that.
    var symbols = {};
    for (var name in lol.builtIns) {
        if (lol.builtIns.hasOwnProperty(name)) {
            symbols[name] = lol.builtIns[name];
        }
    }
    this._push({name: 'program', symbols: symbols})
}

lol.prototype.evaluate = function(tree) {
    this._reset();
    return this._evaluate(tree);
};


/**
 * Static functions
 */
lol.utils = {
    toYarn: function(val) {
        if (val === true) { return 'WIN'; }
        else if (val === false) { return 'FAIL'; }
        else if (val === null) { return 'NOOB'; }
        else return '' + val;
    }
};

lol.utils.argsArray = function(a) {
    return Array.prototype.slice.call(a);
};

lol.builtIns = {
    'NOT' : function(a) {
        return !a;
    },
    'ANY OF' : function(var_args) {
        var args = lol.utils.argsArray(arguments);
        for (var i = 0; i < args.length; i++) {
            if (args[i]) { return true; }
        }
        return false;
    },
    'SUM OF' : function(a, b) {
        return a + b;
    },
    'DIFF OF' : function(a, b) {
        return a - b;
    },
    'PRODUKT OF': function(a, b) {
        return a * b;
    },
    'QUOSHUNT OF': function(a, b) {
        return a / b;
    },
    'BOTH OF' : function(a, b) {
        return a && b;
    },
    'EITHER OF' : function(a, b) {
        return a || b;
    },
    'BOTH SAEM' : function(a, b) {
        return a === b;
    },
    'SMOOSH' : function(var_args) {
        var args = lol.utils.argsArray(arguments);
        return lol.utils.toYarn(args.reduce(function(a, b) {
            return lol.utils.toYarn(a) + lol.utils.toYarn(b);
        }));
    },
    'BIGGR THAN' : function(a, b) { return a > b; },
    'SMALLR THAN' : function(a, b) { return a < b; }
};


lol.evaluate = function(var_args) {
    var l = new lol();
    return l.evaluate.apply(l, lol.utils.argsArray(arguments));
};

if (typeof module !== 'undefined') {
    module.exports = lol;
}
