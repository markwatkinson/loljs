"use strict";
var lol = function(options) {
    var self = this;
    var scope = [];

    function pushScope(s) {
        if (!s.name) { throw new Error('Scope must have a name'); }
        if (!s.symbols) {
            s.symbols = {};
        }
        s.symbols.IT = null;
        scope.push(s);
    }
    function popScope(name) {
        // we should never be able to pop the root scope
        var popped;
        do {
            if (scope.length === 1) {
                throw new Error('Oops');
            }
            popped = scope.pop();
        } while(name && popped && popped.name !== name);
    }


    function getSymbol(name) {
        for (var i = scope.length - 1; i >= 0; i--) {
            if (scope[i].symbols.hasOwnProperty(name)) {
                return scope[i].symbols[name];
            }
        }
        throw new Error('No such symbol: ' + name);
    }
    
    function setSymbol(name, value) {
        for (var i = scope.length - 1; i >= 0; i--) {
            if (scope[i].symbols.hasOwnProperty(name)) {
                scope[i].symbols[name] = value;
                return;
            }
        }
        scope[scope.length - 1].symbols[name] = value;
    }
    function setSpecial(name, value) {
        scope[scope.length - 1][name] = value;
    }
    function getSpecial(name) {
        return scope[scope.length - 1][name];
    }
    

    this.toYarn = function(val) {
        if (val === true) { return 'WIN'; }
        else if (val === false) { return 'FAIL'; }
        else if (val === null) { return 'NOOB'; }
        else return '' + val;
    }

    this.io = {
        visible : function(args) {
            console.log(args);
        }
    };

    this.builtIns =  {
        'NOT' : function(a) {
            return !a;
        },
        'ANY OF' : function(var_args) {
            var args = Array.prototype.slice.call(arguments);
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
            var args = Array.prototype.slice.call(arguments);
            return self.toYarn(args.reduce(function(a, b) {
                return self.toYarn(a) + self.toYarn(b);
            }));
        },
        'BIGGR THAN' : function(a, b) { return a > b; },
        'SMALLR THAN' : function(a, b) { return a < b; }
    };

    function init() {
        pushScope({name: 'program', symbols: self.builtIns});
    }

    function primitive(node) {
        return node.value;
    }


    function evaluate(node, setIT) {
        var marshaller = {
            'FunctionCall' : function(node) {
                var f = getSymbol(node.name);
                if (typeof f !== 'function') {
                    throw new Error(node.name + ' is not a function' );
                }
                var args = node.args.values.map(function(a) {
                    return evaluate(a);
                });
                return f.apply(null, args);
            },
            'FunctionDefinition' : function(node) {
                // we can keep consistency with natively implemented functions
                // by implementing the evaluation of a function as a function.
                // In other words: yo dawg, we heard you liked functions so we
                // put a function in your function so you can evaluate while you
                // evaluate.
                setSymbol(node.name, function(var_args) {
                    var symbols = {}, args = arguments;
                    node.args.forEach(function(a, i) {
                        symbols[a] = typeof args[i] === 'undefined' ? null : args[i];
                    });
                    pushScope({name: 'function', symbols: symbols});
                    var ret = evaluate(node.body);
                    if (typeof ret === 'undefined') {
                        ret = getSpecial('return');
                    }
                    popScope('function');
                    return ret;
                });
            },
            'Return' : function(node) {
                setSpecial('return', evaluate(node.expression));
            },
            'Literal' : function(node) {
                var val = node.value;
                if (typeof val === 'string') {
                    val = val.replace(/:(\{([^}]*)\})/g, function($0, $1) {
                        if ($1.charAt(0) === '{') {
                            return getSymbol(arguments[2]);
                        }
                        return $0;
                    });
                }
                return val;
            },
            'Declaration' : function(node) {
                setSymbol(node.name, node.value ? evaluate(node.value) : null);
            },
            'Assignment' : function(node) {
                setSymbol(node.name, evaluate(node.value));
            },
            'Identifier' : function(node) {
                var s = getSymbol(node.name);
                if (typeof s === 'function') {
                    // special case - s is a function. We should
                    // probably invoke it?
                    return s();
                }
                else { return s; }
            },
            'If' : function(node) {
                var c = node.condition;
                if (c) { c = evaluate(c); }
                else { c = getSymbol('IT'); }

                if (c) {
                    evaluate(node.body);
                } else {
                    var elseMatched = false;
                    for (var i = 0; i < node.elseIfs.length; i++) {
                        var elseIf = node.elseIfs[i];
                        if (evaluate(elseIf.condition)) {
                            elseMatched = true;
                            evaluate(elseIf.body);
                            break;
                        }
                    }
                    if (!elseMatched && node.elseBody) {
                        evaluate(node.elseBody);
                    }
                }
            },
            'Visible' : function(node) {
                self.io.visible(evaluate(node.expression));
            },
            'Body' : function(node) {
                node.lines.forEach(function(l) {
                    ret = evaluate(l, true);
                });
                return ret;
            },
            'NoOp' : function(node) {},
            'LoopCondition': function(node) {
                var ret = evaluate(node.expression);
                return (node.check === 'while') ? ret : !ret;
            },
            'LoopOperation' : function(node) {
                var sym = getSymbol(node.symbol);
                sym = (node.command = 'inc' ? sym + 1 : sym - 1);
                setSymbol(node.symbol, sym);
            },
            'Loop' : function(node) {
                if (node.op) {
                    var symbol = getSymbol(node.op.symbol);
                    // initialise the loop symbol to 0 if it's not defined yet.
                    if (typeof symbol === 'undefined') {
                        setSymbol(node.op.symbol, 0);
                    }
                }
                var evalBody = !node.condition || evaluate(node.condition);
                pushScope({name: 'loop'});
                while (evalBody) {
                    evaluate(node.body);
                    if (node.op) {
                        evaluate(node.op);
                    }
                    evalBody = !node.condition || evaluate(node.condition);
                }
                popScope();
            },
            'Cast': function(node) {
                var raw = evaluate(node.expression);
                var type = node.type.toUpperCase();
                if (type === 'TROOF') { raw = !!raw; }
                else if (type === 'NOOB') { raw = null; }
                else if (type === 'YARN') { raw = self.toYarn(raw); }
                else if (type === 'NUMBR' || type === 'NUMBAR') {
                    raw = Number(raw);
                }
                else {
                    throw new Error('Unrecognised type: ' + type);
                }
                return raw;
            },
            'Gimmeh': function(node) {
                setSymbol(node.variable, prompt());
            }
        };

        var handler = marshaller[node._name];
        
        if (!handler) {
            throw new Error('Not implemented: ' + node._name);
        }
        else {
            var ret = handler(node);
            if (setIT) {
                setSymbol('IT', ret);
            }
            return ret;
        }
    }

    this.evaluate = function(tree) {
        init();
        return evaluate(tree);
    }
};

(function() {
    var l = new lol();
    lol.evaluate = function(tree) {
        return l.evaluate(tree);
    }
    lol.toLol = function(value) {
        var containers = [];
        var recurse = function(value) {
            var type = typeof value;
            var primitive = type === 'string' || type === 'boolean' || type ===
                'number' || value === null;
            if (primitive) {
                return l.toYarn(value);
            } else if (Array.isArray(value)) {
                if (containers.indexOf(value) > 0) { return '..' }
                containers.push(value);
                var s = value.map(recurse).join(', ');
                return '[' + s + ']';
            }
        }
        return recurse(value);
    }
    lol.setIo = function(io) {
        if (io.visible) {
            l.builtIns.visible = io.visible;
        }
    }
}());


if (typeof module !== 'undefined') {
    module.exports = lol;
}
