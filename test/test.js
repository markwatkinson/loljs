var parser = require('../parser.js').parser,
    ast = require('../src/ast.js'),
    lol = require('../src/lol.js');

/**
 * This is a set of end to end tests of the system.
 * The tests here start with some lolcode, execute it, and look
 * at the response. They don't, for example, do any granular testing of the parser.
 */

global.ast = ast;

function run(expression) {
    var tree = parser.parse(expression);
    return lol.evaluate(tree);
}


exports.testComments = function(test) {
    test.strictEqual(true, run('WIN BTW this is a comment'));
    test.strictEqual(true, run('BTW this is a comment\nWIN'));
    test.strictEqual(true, run('OBTW this is a comment\nWIN still a comment...\nTLDR WIN'));
    test.strictEqual(true, run('OBTW this is a comment\nWIN still a comment...\nTLDR\nWIN'));
    test.done();
}

exports.testPrimitives = function(test) {
    test.strictEqual(true, run('WIN'));
    test.strictEqual(false, run('FAIL'));
    test.strictEqual(null, run('NOOB'));
    test.strictEqual(5, run('5'));
    test.strictEqual("HELLO", run('"HELLO"'));
    test.strictEqual("HELLO", run("'HELLO'"));
    test.done();
};

exports.testEscapeSequences = function(test) {
    test.equal('I said "hello" to him', run('"I said :"hello:" to him"'));
    // unicode
    test.equal('I like π', run('"I like :(03C0)"'));
    test.done();
}

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

    test.equal('S1', run('SMOOSH "S1" MKAY'));
    test.equal('S1S2', run('SMOOSH "S1" AN "S2" MKAY'));
    test.equal('S1 S2', run('SMOOSH "S1" AN " " AN "S2" MKAY'));

    // non string primitives should get rewritten nicely.
    test.equal('WIN', run('SMOOSH WIN MKAY'));
    test.equal('FAIL', run('SMOOSH FAIL MKAY'));
    test.equal('NOOB', run('SMOOSH NOOB MKAY'));

    test.equal(true, run('1 SMALLR THAN 2'));
    test.equal(false, run('2 SMALLR THAN 1'));
    test.equal(false, run('1 BIGGR THAN 2'));
    test.equal(true, run('2 BIGGR THAN 1'));


    
    // check the nesting.
    test.equal(3, run('SUM OF DIFF OF 5 AN 4 AN 2'));
    // Brackets don't do anything, but they can make it clearer.
    test.equal(3, run('SUM OF (DIFF OF 5 AN 4) AN 2'));

    test.equal(true, run('ANY OF 6 AN 2 AN 3 AN 4 MKAY'));
    test.done();
};


exports.testMultiLine = function(test) {
    var expr = 'SUM OF 3 AN 4\n' +
        'DIFF OF 7 AN 4\n';
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

exports.testLoops = function(test) {
    var e = [
        'I HAS A COUNTER ITZ 0',
        'IM IN YR LOOP UPPIN YR COUNTER WILE COUNTER SMALLR THAN 10',
        '  O NVM',
        'IM OUTTA YR LOOP',
        'COUNTER',
    ];
    test.equal(10, run(e.join('\n')));
    var e = [
        'I HAS A COUNTER ITZ 5',
        'I HAS A LOOP_COUNTER ITZ 0',
        'IM IN YR LOOP UPPIN YR COUNTER WILE COUNTER SMALLR THAN 10',
        '  LOOP_COUNTER R SUM OF LOOP_COUNTER AN 1',
        'IM OUTTA YR LOOP',
        'LOOP_COUNTER',
    ];
    test.equal(5, run(e.join('\n')));

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

exports.testCast = function(test) {
    var setup = 'I HAS A NUM ITZ 12\n';
    test.strictEqual(12, run(setup + 'NUM'));
    test.strictEqual('12', run(setup + 'NUM2 R MAEK NUM A YARN\nNUM2'));
    test.strictEqual(true, run(setup + 'NUM2 R MAEK NUM A TROOF\nNUM2'));
    test.strictEqual(null, run(setup + 'NUM2 R MAEK NUM A NOOB\nNUM2'));

    test.strictEqual(12, run(setup + 'NUM IS NOW A NUMBAR\nNUM'));
    test.strictEqual(true, run(setup + 'NUM IS NOW A TROOF\nNUM'));
    test.strictEqual(null, run(setup + 'NUM IS NOW A NOOB\nNUM'));
    test.strictEqual('12', run(setup + 'NUM IS NOW A YARN\nNUM'));
    test.done();
}