"use strict";


var lol = function(onDone, onPaused) {

    /**
     * Interpreter scope data/stack.
     * Each level of scope consists of a program symbol table and some
     * 'special' symbols, like return value
     *
     * See _push for exact properties.
     */
    this._scope = [];

    /**
     * A stack of actions waiting for attention. An action is (roughly)
     * a set of nodes which need evaluating, and a callback to receive
     * the results of their evaluation.
     *
     * See _waitFor for exact properties.
     */
    this._next = [];

    /**
     * Default IO functions.
     * Use console.log for output, and prompt() for input.
     *
     * These can (and should) be overridden.
     */
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

    this._isPaused = false;

    this._done = onDone || function() {};
    this._paused = onPaused || function() {};

    this._currentNode = null;

    this._errors = [];

};

/**
 * Async deferral function.
 *
 * Defers an action to execute only after a set of nodes has been evaluated.
 * Nodes will be evaluated in the order given.
 */
lol.prototype._waitFor = function(nodes, f, options) {
    options = options || {
        setIt: false,
        breakOnReturn: false
    };
    this._next.push({
        nodes: nodes.slice(0),
        results: [],
        f: f,
        options: options,
        inProgress: false
    });
};

/**
 * Handles an action created with _waitFor.
 */
lol.prototype._current = function(current) {
    var self = this;
    var node = current.nodes.shift();
    if (!node) {
        if (current.inProgress) {
            return;
        }
        else {
            // special case: there were no arguments.
            current.f(current.results);
            self._currentNode = null;
            return;
        }
    }

    current.inProgress = true;

    this._evaluate(node, function(ret) {
        if (current.options.setIt) {
            self._setSymbol('IT', ret);
        }
        current.results.push(ret);
        if (!current.nodes.length || (current.options.breakOnReturn
                && typeof self._getSpecial('return') !== 'undefined'))
        {
            current.f(current.results);
            self._currentNode = null;
        } else {
            self._current(current);
        }
    });
}


lol.prototype.next = function() {
    if (this.errors().length) {
        // nope
        this.pause();
        return;
    }
    this._isPaused = false;
    var current = this._next.pop();
    if (current) {
        this._current(current);
    }
};


lol.prototype.resume = function() {
    this._isPaused = false;
    this.tick.go();
}

lol.prototype.pause = function(keepQuiet) {
    this._isPaused = true;
    if (!keepQuiet) {
        this._paused.call(this);
    }
}

lol.prototype._error = function(err) {
    this._errors.push(err);
    this.tick.cancel();
    this.pause();
}


lol.prototype.errors = function() {
    return this._errors;
}

lol.prototype.pos = function() {
    var c = this._currentNode._location;
    return {
        line: c.first_line - 1,
        col: c.first_column,
        lineEnd: c.last_line - 1,
        colEnd: c.last_column
    };
}

lol.prototype._push = function(s) {
    if (!s.name) { throw new Error('Scope must have name'); }
    s.symbols = s.symbols || {};
    s.symbols.IT = null;
    this._scope.push(s);
};

lol.prototype._pop = function(name) {
    var popped = this._scope.pop();
    if (!popped || popped.name !== name) {
        var msg = "Couldn't pop state " + name + '.\nStack:\n';
        while (popped) {
            msg += popped.name + '\n';
            popped = this._scope.pop();
        }
        throw new Error(msg);
    }
};

lol.prototype.getSymbol = function(name) {
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


lol.prototype._findScope = function(name) {
    var scope = this._scope;
    for (var i = scope.length - 1; i >= 0; i--) {
        if (scope[i].name === name) {
            return scope[i];
        }
    }
    return null;
};

lol.prototype._findScopeForSpecial = function(symbol) {
    if (symbol === 'return') {
        return this._findScope('function');
    } else {
        return scope[scope.length - 1];
    }
}

lol.prototype._setSpecial = function(name, value) {
    var s = this._findScopeForSpecial(name);
    if (s) {
        s[name] = value;
    }
};

lol.prototype._getSpecial = function(name) {
    var s = this._findScopeForSpecial(name);
    if (s) {
        return s[name];
    }
};


lol.prototype._index = function(val, index) {
    if (!val || typeof val.length === 'undefined') {
        throw new Error('Not indexable');
    }
    var normalisedIndex = index;
    while (normalisedIndex < 0) {
        normalisedIndex += val.length;
    }

    if (typeof val === 'string') {
        return val.charAt(normalisedIndex);
    }
    else if (Object.prototype.toString.call(val) === '[object Array]') {
        if (normalisedIndex < val.length) {
            return val[normalisedIndex];
        }
        else {
            throw new Error('Index ' + index + ' out of range');
        }
    } else {
        throw new Error('Not indexable');
    }
};

lol.prototype._setIndex = function(obj, val, index) {
    // Note this won't actually work for strings yet because they're immutable
    // We'll get back a different string than we sent in, which makes it
    // pretty much useless to the caller in the context of writing to a variable
    // The answer is probably to switch all internal value representations to
    // objects wrapping JS primitives so we end up with references.

    if (!obj || typeof obj.length === 'undefined') {
        throw new Error('Not indexable');
    }
    if (Object.prototype.toString.call(obj) === '[object Array]' ) {
        while (index > obj.length - 1) {
            obj.push(null);
        }
        obj[index] = val;
        return val;
    } else {
        throw new Error('Not indexable');
    }
};


/*****************************************************************************
 *  NODE EVALUATION FUNCTIONS
 ****************************************************************************/

lol.prototype._evaluateLiteral = function(node, done) {
    if (Object.prototype.toString.call(node.value) === '[object Array]' ) {
        this._waitFor(node.value, function(values) {
            done(values);
        })
    } else {
        done(node.value);
    }
};

lol.prototype._evaluateIndexer = function(node, done) {
    var self = this;
    this._waitFor([node.lhs, node.rhs], function(vals) {
        var lhs = vals[0],
            rhs = vals[1];
        var index = self._index(lhs, rhs);
        done(index);
    });
};

lol.prototype._evaluateFunctionCall = function(node, done) {
    var self = this;
    this._waitFor(node.args.values, function(args) {
        var f;
        try {
            f = self.getSymbol(node.name);
            if (typeof f !== 'function') {
                throw new Error(node.name + ' is not a function' );
            }
        } catch (err) {
            self._error('' + err);
            return;
        }
        self._callFunction(f, args, done);
    });
};

lol.prototype._evaluateBody = function(node, done) {
    this._waitFor(node.lines, function(lines) {
        var ret = lines[lines.length - 1];
        if (typeof ret === 'undefined') { ret = null; }
        done(ret);
    }, {setIt: true, breakOnReturn: true});
};

lol.prototype._evaluateIdentifier = function(node, done) {
    var s;
    try {
        s = this.getSymbol(node.name);
    } catch (err) {
        this._error('' + err);
        return;
    }
    if (typeof s === 'function') {
        // special case - s is a function. We should
        // probably invoke it?
        this._callFunction(s, [], done);
        return;
    }
    done(s);
};

lol.prototype._evaluateAssignmentIndex = function(node, val, done) {
    var self = this;
    var path = [];
    debugger;
    this._waitFor([node.name.lhs, node.name.rhs, node.value], function(vals) {
        var lhs = vals[0],
            rhs = vals[1],
            value = vals[2];
        self._setIndex(lhs, value, rhs);
        done(value);
    });
};

lol.prototype._evaluateAssignmentNormal = function(node, val, done) {
    this._setSymbol(node.name, val);
    done(val);
}

lol.prototype._evaluateAssignment = function(node, done) {

    var self = this;
    this._waitFor([node.value], function(values) {
        var val = values[0];
        if (node.name._name === 'Indexer') {
            self._evaluateAssignmentIndex(node, val, done);
        } else {
            self._evaluateAssignmentNormal(node, val, done);
        }
    });
};

lol.prototype.evaluate = function(node, done) {
    var self = this;
    this._waitFor([node.value], function(values) {
        self._setSymbol(node.name, values[0]);
        done(values[0]);
    });
};

lol.prototype._evaluateDeclaration = function(node, done) {
    var self = this;
    if (node.value) {
        this._waitFor([node.value], function(values) {
            self._setSymbol(node.name, values[0]);
            done(values[0]);
        });
    }
    else {
        self._setSymbol(node.name, null);
        done(null);
    }
};


lol.prototype._evaluateIf = function(node, done) {
    var self = this;
    var c = node.condition;

    var eIfs = node.elseIfs.slice(0);

    var eCondition = function(done) {
        if (c) {
            self._waitFor([c], done);
        } else {
            done(self.getSymbol('IT'));
        }
    }

    var eBody = function(done) {
        self._waitFor([node.body], function() {
            done(null);
        });
    }

    var elseIfs = function(done) {
        var e = eIfs.shift();
        if (!e) {
            done(false);
        } else {
            self._waitFor([e.condition], function(v) {
                if (v[0]) {
                    self._waitFor([e.body], function(v) {
                        done(true);
                    });
                } else {
                    // recurse
                    elseIfs(done);
                }
            });
        }
    }

    eCondition(function(e) {
        if (e) { eBody(done); }
        else {
            elseIfs(function(elseIfMatched) {
                if (!elseIfMatched && node.elseBody) {
                    self._waitFor([node.elseBody], done);
                }
                else {
                    done(null);
                }
            });
        }
    });
};

lol.prototype._evaluateNoOp = function(node, done) {
    // terminal.
    done(null);
};

lol.prototype._evaluateLoopCondition = function(node, done) {
    var self = this;
    // Loops can have an empty condition, which is the equivalent of
    // while(true) {}.
    // It's easier to handle that here than the loop node.
    if (!node) {
        done(true);
    } else {
        this._waitFor([node.expression], function(vals) {
            done( (node.check === 'while') ? vals[0] : !vals[0] );
        });
    }
}

lol.prototype._evaluateLoop = function(node, done) {
    var self = this;
    if (node.op) {
        try {
            var symbol = this.getSymbol(node.op.symbol);
        } catch (err) {
            // initialise the loop symbol to 0 if it's not defined yet.
            this._setSymbol(node.op.symbol, 0);
        }
    }
    self._push({name: 'loop'});

    var evalOp = function() {
        if (node.op) {
            var sym = self.getSymbol(node.op.symbol);
            sym = (node.op.command = 'inc' ? sym + 1 : sym - 1);
            self._setSymbol(node.op.symbol, sym);
        }
    }

    var evalBody = function(done) {
        self._waitFor([node.body], done);
    };

    var loop = function() {
        self._waitFor([node.condition], function(vals) {
            if (vals[0]) {
                evalBody(function() {
                    evalOp();
                    loop();
                });
            } else {
                self._pop('loop');
                done(null);
            }
        });
    }
    loop();
}

lol.prototype._callFunction = function(f, args, done) {
    var self = this;

    this._push({
        name: 'function',
        symbol: f
    });

    if (!f._data || f._data.builtIn) {
        var ret = f.apply(self, args);
        this._pop('function');
        done(ret);

        return;
    }
    for (var i = 0; i < f._data.args.length; i++) {
        this._setSymbol(f._data.args[i],
                        typeof args[i] === 'undefined' ? null : args[i]);
    }

    f.call(self, function(ret) {
        self._pop('function');
        done(ret);
    });
};


lol.prototype._evaluateFunctionDefinition = function(node, done) {
    // terminal

    // we can keep consistency with natively implemented functions
    // by implementing the evaluation of a function as a function.
    // In other words: yo dawg, we heard you liked functions so we
    // put a function in your function so you can _evaluate while you
    // _evaluate.

    // The difference is that user defined functions are non-terminals and
    // therefore are asynchronous, whereas native functions are terminals
    // and return their value. So the caller knows how to handle both, we'll
    // add an async property to the function. This should be ok.

    var f = function(done) {
        // The caller MUST set 'this'. We cannot rely on a 'self' variable in
        // the parent scope, because this introduces horrible, horrible bugs if
        // this object is cloned (i.e. this function will alter the state of a
        // different lol interpreter).
        if (!(this instanceof lol)) {
            debugger;
        }
        // We can use one for the next function though, as long as 'this' is
        // now correct.
        var self = this;
        this._waitFor([node.body], function(lines) {
            var ret = self._getSpecial('return');
            if (typeof ret === 'undefined') {
                ret = self.getSymbol('IT');
            }
            if (typeof ret === 'undefined') {
                ret = null;
            }
            done(ret);
        });
    };
    f._data = {
        builtIn: false,
        args: node.args.slice(0),
        name: node.name
    };


    this._setSymbol(node.name, f, {setIt: true});
    done(null);
}

lol.prototype._evaluateCast = function(node, done) {
    var self = this;
    this._waitFor([node.expression], function(vals) {
        var raw = vals[0];
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
        done(raw);
    });
}

lol.prototype._evaluateVisible = function(node, done) {
    var self = this;
    this._waitFor([node.expression], function(vals) {
        self._io.visible(lol.utils.toYarn(vals[0]));
        done(vals[0]);
    });
};
lol.prototype._evaluateGimmeh = function(node, done) {
    // terminal
    var self = this;
    this._io.prompt('', function(reply) {
        self._setSymbol(node.variable, reply);
        done(reply);
    });
};

lol.prototype._evaluateReturn = function(node, done) {
    var self = this;
    this._waitFor([node.expression], function(vals) {
        self._setSpecial('return', vals[0])
        done(vals[0]);
    });
};

lol.prototype._evaluateBreakpoint = function(node, done) {
    this.pause();
    done();
}

lol.prototype._evaluate = function(node, done) {
    this._currentNode = node;

    var handlers = {
        'Assignment': this._evaluateAssignment,
        'Breakpoint': this._evaluateBreakpoint,
        'Body': this._evaluateBody,
        'Cast': this._evaluateCast,
        'Declaration': this._evaluateDeclaration,
        'FunctionCall': this._evaluateFunctionCall,
        'FunctionDefinition': this._evaluateFunctionDefinition,
        'Gimmeh' : this._evaluateGimmeh,
        'Identifier': this._evaluateIdentifier,
        'If': this._evaluateIf,
        'Indexer': this._evaluateIndexer,
        'Literal': this._evaluateLiteral,
        'Loop' : this._evaluateLoop,
        'LoopCondition' : this._evaluateLoopCondition,
        'NoOp': this._evaluateNoOp,
        'Return': this._evaluateReturn,
        'Visible' : this._evaluateVisible
    };

    var handler = handlers[node._name];
    if (!handler) {
        throw new Error('Not implemented: ' + node._name);
    }
    else {
        handler.call(this, node, done);
    }
}

lol.prototype._pushProgramState = function() {
    // clone built ins, otherwise they're a reference to a static property,
    // i.e. a program could overwrite them and break them for all subsequent
    // executions.
    // I think keeping a reference to the function is fine though, there
    // shouldn't be any potential to escape the interpreter to modify that.
    var symbols = {};
    for (var name in lol.builtIns) {
        if (lol.builtIns.hasOwnProperty(name)) {
            symbols[name] = lol.builtIns[name];
        }
    }
    this._push({name: 'program', symbols: symbols});
}

lol.prototype._reset = function() {
    this._scope.length = 0;
    this._next.length = 0;
    this._pushProgramState();
    this._errors.length = 0;
    this._isPaused = false;
    this._currentNode = null;
};


lol.prototype.evaluateWatchExpression = function(tree, done, error) {
    function cloneObj(s) {
        // The symbol table is a reference copy rather than a clone.
        // This is probably okay, as it means that the watch expressions
        // can change the program's state.
        var s_ = {};
        for (var name in s) {
            if (s.hasOwnProperty(name)) {
                var o = s[name];
                var cloned = o;
                s_[name] = o;
            }
        }
        return s_;
    }

    var l = new lol(done, error);
    l._io = this._io;
    l._scope = this._scope.map(function(s) {
        return cloneObj(s);
    });
    if (!l._scope.length) {
        l._pushProgramState();
    }
    l.evaluate(tree, true);
}



lol.prototype.evaluate = function(tree, dontReset) {
    var self = this;

    if (!dontReset) {
        this._reset();
    }
    var done = false;
    this._evaluate(tree, function(ret) {
        done = true;
        self._done.call(self, ret);
    });

    // We evaluate things asynchronously so we don't crash the browser if the
    // user has entered an infinite loop.
    // We also allow arbitrary breakpoints, which makes things a bit more
    // complicated.

    // To keep things fairly transparent to the caller, we handle here a loop
    // (called the tick), which is responsible for progressing the program
    // in chunks, and scheduling itself to continue.
    // That's what this next bit is all about.

    // if there's already an active ticker, cancel it so it won't do any more,
    // then replace it

    if (this.tick) {
        this.tick.cancel();
    }

    this.tick = {
        _cancel: false,
        _isRunning: false,
        cancel: function() { this._cancel = true; },

        _go: function() {
            var thisTick = this;

            // Let's try not to block for more than 200ms at a time.
            // There is a balance here between keeping a totally responsive UI and not
            // taking all year to execute a simple program because we're forever
            // scheduling execution for the future.
            if (this._cancel || self._isPaused) {
                this._isRunning = false;
                return;
            }

            this._isRunning = true;
            var s = +new Date();
            while (!done && (+new Date() - s < 200) && !self._isPaused) {
                self.next();
            }
            if (!done) {
                lol.utils.nextTick(function() {
                    thisTick._go();
                });
            } else {
                this._isRunning = false;
            }
        },

        go: function() {
            if (!this._isRunning) { this._go(); }
        }
    };
    this.tick.go();
};

lol.prototype.setIo = function(object) {
    if (typeof object.visible === 'function') {
        this._io.visible = object.visible;
    }
    if (typeof object.prompt === 'function') {
        this._io.prompt = object.prompt;
    }
};


/**
 * Static functions
 */
lol.utils = {
    toYarn: function(val) {
        if (val === true) { return 'WIN'; }
        else if (val === false) { return 'FAIL'; }
        else if (val === null) { return 'NOOB'; }
        else if (Object.prototype.toString.call(val) === '[object Array]') {
            var ret = '[';
            for (var i = 0; i < val.length; i++) {
                ret += lol.utils.toYarn(val[i]);
                if (i !== val.length - 1) { ret += ', ' }
            }
            ret += ']';
            return ret;
        }
        else return '' + val;
    }
};

/**
 * Converts an arguments object as a proper array.
 */
lol.utils.argsArray = function(a) {
    return Array.prototype.slice.call(a);
};


/**
 * LOLCODE built in functions.
 */
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
    'SMALLR THAN' : function(a, b) { return a < b; },
    'MOD OF' : function(a, b) {  return a % b;  }
};

(function() {
    var nextTick;
    if (typeof setImmediate === 'function') {
        nextTick = setImmediate;
    } else if (typeof window !== 'undefined') {
        if (window.setImmediate) { nextTick = window.setImmediate; }
        else if (window.setTimeout) {
            nextTick = function(f) { window.setTimeout(f, 0); }
        }
    }
    if (!nextTick) {
        throw new Error("Couldn't find setImmediate, or window.setTimeout");
    }
    lol.utils.nextTick = nextTick;
}());

// Node exports.
if (typeof module !== 'undefined') {
    module.exports = lol;
}
