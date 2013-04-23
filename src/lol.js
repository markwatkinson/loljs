var lol = function() {

    var scope = [];

    function pushScope(s) {
        if (!s.symbols) {
            s.symbols = {};
        }
        s.symbols.IT = null;
        scope.push(s);
    }
    function popScope() {
        // we should never be able to pop the root scope
        if (scope.length === 1) {
            throw new Error('Oops');
        }
        scope.pop();
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



    function init() {
        var builtIns = {
            'ANY OF' : function(var_args) {
                var args = Array.prototype.slice.call(arguments);
                for (var i = 0; i < args.length; i++) {
                    if (args[i]) { return true; }
                }
                return false;
            },
            'SUM OF' : function(var_args) {
                var args = Array.prototype.slice.call(arguments);
                return args.reduce(function(a, b) {
                    return a + b;
                });
            },
            'DIFF OF' : function(var_args) {
                var args = Array.prototype.slice.call(arguments);
                return args.reduce(function(a, b) {
                    return a - b;
                });
            },
            'BOTH SAEM' : function(a, b) {
                return a === b;
            }
        };
        pushScope({symbols: builtIns});
    }

    function primitive(node) {
        return node.value;
    }


    function evaluate(node, setIT) {
        var marshaller = {
            'Function Call' : function(node) {
                var f = getSymbol(node.name);
                var args = node.args.values.map(function(a) {
                    return evaluate(a);
                });
                return f.apply(null, args);
            },
            'Function Definition' : function(node) {
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
                    pushScope({symbols: symbols});
                    var ret = evaluate(node.body);
                    popScope();
                    return ret;
                });
            },
            'Literal' : function(node) {
                return node.value;
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
                    if (!elseMatched) {
                        evaluate(node.elseBody);
                    }
                }
            },
            'Body' : function(node) {
                node.lines.forEach(function(l) {
                    ret = evaluate(l, true);
                });
                return ret;
            }
        };

        var handler = node._primitive ? marshaller.Literal : marshaller[node._name];
        
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

lol.evaluate = function(tree) {
    var e = new lol();
    return e.evaluate(tree);
}


if (module) {
    module.exports = lol;
}
