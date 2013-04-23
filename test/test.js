var parser = require('../parser.js').parser,
    ast = require('../src/ast.js'),
    lol = require('../src/lol.js');

global.ast = ast;

function run(expression) {
    var tree = parser.parse(expression);
    return lol.evaluate(tree);
}


exports.testPrimitives = function(test) {
    test.equal(true, run('WIN'));
    test.equal(false, run('FAIL'));
    test.equal(null, run('NOOB'));
    test.equal(5, run('5'));
    test.equal("HELLO", run('"HELLO"'));
    test.equal("HELLO", run("'HELLO'"));
    test.done();
};

exports.testOperators = function(test) {
    test.equal(3, run('SUM OF 1 AN 2'));
    test.equal('12', run('SUM OF "1" AN 2'));

    test.equal(4, run('DIFF OF 8 AN 4'));
    test.equal(true, run('BOTH SAEM 1 AN 1'));
    test.equal(true, run('BOTH SAEM "1" AN "1"'));
    test.equal(true, run('BOTH SAEM WIN AN WIN'));
    test.equal(false, run('BOTH SAEM 1 AN 2'));
    test.equal(false, run('BOTH SAEM "1" AN 1'));
    test.equal(false, run('BOTH SAEM WIN AN FAIL'));

    
    // check the nesting.
    test.equal(3, run('SUM OF DIFF OF 5 AN 4 AN 2'));
    // Brackets don't do anything, but they can make it clearer.
    test.equal(3, run('SUM OF (DIFF OF 5 AN 4) AN 2'));

    test.equal(true, run('ANY OF 6 AN 2 AN 3 AN 4 MKAY'));
    test.done();
};


exports.testMultiLine = function(test) {
    var expr = 'SUM OF 3 AN 4\n' +
        'DIFF OF 7 AN 4';
    test.equal(3, run(expr));
    test.done();
}

exports.testAssignment = function(test) {
    test.doesNotThrow(function() {
        run("I HAS A x");
    });
    test.equal(15, run('I HAS A x ITZ 15\nx'));
    test.equal(15, run('I HAS A x ITZ SUM OF 5 AN 10\nx'));
    test.equal(15, run('I HAS A x\nx R 15\nx'));
    test.done();
}


exports.testConditional = function(test) {
    var e = [
        'I HAS A x ITZ WIN',
        'I HAS A y',
        'x, O RLY?',
        '  YA RLY',
        '    y R 15',
        '  NO WAI',
        '    y R 20',
        'OIC',
        'y'
    ];
    test.equal(15, run(e.join('\n')));

    e = [
        'I HAS A x ITZ FAIL',
        'I HAS A y',
        'x, O RLY?',
        '  YA RLY',
        '    y R 15',
        '  NO WAI',
        '    y R 20',
        'OIC',
        'y'
    ];
    test.equal(20, run(e.join('\n')));

    e = [
        'I HAS A x ITZ FAIL',
        'I HAS A y',
        'x, O RLY?',
        '  YA RLY',
        '    y R 15',
        '  MEBBE BOTH SAEM FAIL AN x',
        '    y R 17',
        '  NO WAI',
        '    y R 20',
        'OIC',
        'y'
    ];
    test.equal(17, run(e.join('\n')));

    // let's check it nests properly. We should hit the NO WAI of the
    // MEBBE.
    e = [
        'I HAS A x ITZ FAIL',
        'I HAS A y',
        'x, O RLY?',
        '  YA RLY',
        '    y R 15',
        '  MEBBE BOTH SAEM FAIL AN x',
        '      x, O RLY?, YA RLY',
        '         y R 25',
        '      NO WAI',
        '         y R 28',
        '      OIC',
        '  NO WAI',
        '    y R 20',
        'OIC',
        'y'
    ];
    test.equal(28, run(e.join('\n')));
    test.done();
}



exports.testFuncDefs = function(test) {
    var e = [
        'HOW DUZ I ADD YR NUM1 AN YR NUM2',
        '  SUM OF NUM1 AN NUM2',
        'IF U SAY SO',
        '',
        '',
        'ADD 5 AN 3 MKAY'
    ]
    test.equal(8, run(e.join('\n')));
    var e = [
        'HOW DUZ I PI',
        '  3.14159',
        'IF U SAY SO',
        '',
        '',
        'PI'
    ]
    test.equal(3.14159, run(e.join('\n')));
    test.done();
}