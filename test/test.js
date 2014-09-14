var async = require('async'),
    parser = require('../parser.js').parser,
    ast = require('../src/ast.js'),
    lol = require('../src/lol.js');

/**
 * This is a set of end to end tests of the system.
 * The tests here start with some lolcode, execute it, and look
 * at the response. They don't, for example, do any granular testing of the parser.
 */

global.ast = ast;

function t_(expected, expression, test, done, eqFunc) {
    var tree = parser.parse(expression);
    eqFunc = eqFunc || test.strictEqual.bind(test);
    var l = new lol(function(response) {
        eqFunc(response, expected);
        done();
    });
    l.evaluate(tree);
}

function t(expected, expression, test, eqFunc) {
    var args = Array.prototype.slice.call(arguments);

    return function(cb) {
        t_(expected, expression, test, cb, eqFunc);
    }
}

exports.testComments = function(test) {
    async.series([
        t(true, 'WIN BTW this is a comment', test),
        t(true, 'BTW this is a comment\nWIN', test),
        t(true, 'OBTW this is a comment\nWIN still a comment...\nTLDR WIN', test),
        t(true, 'OBTW this is a comment\nWIN still a comment...\nTLDR\nWIN', test)
    ], function() {
        test.done();
    });
}

exports.testPrimitives = function(test) {
    async.series([
        t(true, 'WIN', test),
        t(false, 'FAIL', test),
        t(null, 'NOOB', test),
        t(5, '5', test),
        t("HELLO", '"HELLO"', test),
        t("HELLO", "'HELLO'", test),
    ], function() {
        test.done();
    });
};

exports.testEscapeSequences = function(test) {
    async.series([
        t('I said "hello" to him', '"I said :"hello:" to him"', test),
        // unicode
        t('I like π', '"I like :(03C0)"', test),

        // simple var interpolation
        t('var is 12', [
          'I HAS A var ITZ 12',
          '"var is :{var}"'].join("\n"),
          test),
        // interpolation should not work on dynamically created strings -
        // only literals.
        t('var is :{var}', [
          'I HAS A var ITZ 12',
          'SMOOSH "var is :{" AN "var}" MKAY'].join("\n"),
          test),
        t('var is :{var}',
          '"var is :{var}"',
          test)
    ], function() {
        test.done();
    });
}

exports.testOperators = function(test) {
    async.series([
        t(3, 'SUM OF 1 AN 2', test),
        t('12', 'SUM OF "1" AN 2', test),

        t(4, 'DIFF OF 8 AN 4', test),
        t(true, 'BOTH SAEM 1 AN 1', test),
        t(true, 'BOTH SAEM "1" AN "1"', test),
        t(true, 'BOTH SAEM WIN AN WIN', test),
        t(false, 'BOTH SAEM 1 AN 2', test),
        t(false, 'BOTH SAEM "1" AN 1', test),
        t(false, 'BOTH SAEM WIN AN FAIL', test),

        t('S1', 'SMOOSH "S1" MKAY', test),
        t('S1S2', 'SMOOSH "S1" AN "S2" MKAY', test),
        t('S1 S2', 'SMOOSH "S1" AN " " AN "S2" MKAY', test),

        // non string primitives should get rewritten nicely.
        t('WIN', 'SMOOSH WIN MKAY', test),
        t('FAIL', 'SMOOSH FAIL MKAY', test),
        t('NOOB', 'SMOOSH NOOB MKAY', test),

        t(true, '1 SMALLR THAN 2', test),
        t(false, '2 SMALLR THAN 1', test),
        t(false, '1 BIGGR THAN 2', test),
        t(true, '2 BIGGR THAN 1', test),

        // check the nesting.
        t(3, 'SUM OF DIFF OF 5 AN 4 AN 2', test),
        // Brackets don't do anything, but they can make it clearer.
        t(3, 'SUM OF (DIFF OF 5 AN 4) AN 2', test),

        t(true, 'ANY OF 6 AN 2 AN 3 AN 4 MKAY', test),
    ], function() {
        test.done();
    });
};


exports.testMultiLine = function(test) {
    async.series([
        t(3,  'SUM OF 3 AN 4\n' + 'DIFF OF 7 AN 4\n', test)
    ], function() {
        test.done();
    });
}

exports.testAssignment = function(test) {
    async.series([
        t(15, 'I HAS A x ITZ 15\nx', test),
        t(15, 'I HAS A x ITZ SUM OF 5 AN 10\nx', test),
        t(15, 'I HAS A x\nx R 15\nx', test)
    ], function() {
        test.done();
    });
}


exports.testConditional = function(test) {
    async.series([
        t(15, [
            'I HAS A x ITZ WIN',
            'I HAS A y',
            'x, O RLY?',
            '  YA RLY',
            '    y R 15',
            '  NO WAI',
            '    y R 20',
            'OIC',
            'y'
            ].join('\n'), test),
        t(20, [
            'I HAS A x ITZ FAIL',
            'I HAS A y',
            'x, O RLY?',
            '  YA RLY',
            '    y R 15',
            '  NO WAI',
            '    y R 20',
            'OIC',
            'y'
        ].join('\n'), test),
        t(17, [
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
        ].join('\n'), test),
        t(28,
        // let's check it nests properly. We should hit the NO WAI of the
        // MEBBE.
            [
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
        ].join('\n'), test)
    ], function() {
        test.done();
    });
}

exports.testLoops = function(test) {
    var e1 = [
        'I HAS A COUNTER ITZ 0',
        'IM IN YR LOOP UPPIN YR COUNTER WILE COUNTER SMALLR THAN 10',
        '  O NVM',
        'IM OUTTA YR LOOP',
        'COUNTER',
    ].join('\n');
    var e2 = [
        'I HAS A COUNTER ITZ 5',
        'I HAS A LOOP_COUNTER ITZ 0',
        'IM IN YR LOOP UPPIN YR COUNTER WILE COUNTER SMALLR THAN 10',
        '  LOOP_COUNTER R SUM OF LOOP_COUNTER AN 1',
        'IM OUTTA YR LOOP',
        'LOOP_COUNTER',
    ].join('\n');
    var e3 = [
        'I HAS A COUNTER ITZ 0',
        'IM IN YR LOOP UPPIN YR COUNTER WILE COUNTER SMALLR THAN 10',
        '  GTFO',
        'IM OUTTA YR LOOP',
        'COUNTER',
    ].join('\n');

    var e4 = [
        'I HAS A COUNTER ITS 0',
        'IM IN YR LOOP',
        '       COUNTER R SUM OF 1 AN COUNTER',
        '       BOTH SAEM COUNTER AN 10, O RLY?',
        '               YA RLY, GTFO',
        '       OIC',
        'IM OUTTA YR LOOP',
        'COUNTER'
    ].join('\n');


    async.series([
        t(10, e1, test),
        t(5, e2, test),
        t(0, e3, test),
        t(10, e4, test),

        // This loop is equivalent to:
        // var counter = 0; while(counter <= "1234".length) { counter++ }
        t(5, [
                'I HAS A COUNTER ITZ 0',
                'I HAS A PROGRAM ITZ "1234"',
                'IM IN YR LOOP UPPIN YR COUNTER WILE BOTH SAEM COUNTER AN SMALLR OF COUNTER AN LEN OF PROGRAM',
                '       O NVM',
                'IM OUTTA YR LOOP',
                'COUNTER'
            ].join('\n'), test)

    ], function() {
        test.done();
    });
}

exports.testFuncDefs = function(test) {
    var e1 = [
        'HOW DUZ I ADD YR NUM1 AN YR NUM2',
        '  SUM OF NUM1 AN NUM2',
        'IF U SAY SO',
        '',
        '',
        'ADD 5 AN 3 MKAY'
    ].join('\n');
    var e2 = [
        'HOW DUZ I PI',
        '  3.14159',
        'IF U SAY SO',
        '',
        '',
        'PI'
    ].join('\n')

    async.series([
        t(8, e1, test),
        t(3.14159, e2, test)
    ], function() {
        test.done()
    });
}

exports.testCast = function(test) {
    var setup = 'I HAS A NUM ITZ 12\n';
    async.series([
        t(12, setup + 'NUM', test),
        t('12', setup + 'NUM2 R MAEK NUM A YARN\nNUM2', test),
        t(true, setup + 'NUM2 R MAEK NUM A TROOF\nNUM2', test),
        t(null, setup + 'NUM2 R MAEK NUM A NOOB\nNUM2', test),

        t(12, setup + 'NUM IS NOW A NUMBAR\nNUM', test),
        t(true, setup + 'NUM IS NOW A TROOF\nNUM', test),
        t(null, setup + 'NUM IS NOW A NOOB\nNUM', test),
        t('12', setup + 'NUM IS NOW A YARN\nNUM', test)
    ], function() {
        test.done();
    });
}

exports.testArray = function(test) {
    var setup = '';
    var f = test.deepEqual.bind(test);

    async.series([
        t([], 'I HAS A array ITS GOT NOTHING\narray', test, f),
        t([1, 2, 3], 'I HAS A array ITS GOT 1 AN 2 AN 3\narray', test, f),
        t([1, 2, 3], 'I HAS A array ITS GOT 1 AN SUM OF 1 AN 1 AN 3\narray', test, f),
        t([3, 2, 1], 'I HAS A array ITS GOT NOTHING\narray R GOT 3 AN 2 AN 1\narray', test, f),
        t([3, 2, 1], 'I HAS A array\narray R GOT 3 AN 2 AN 1\narray', test, f),

        t([null, 1, 5, [2, 4, 8]],
                    'I HAS A array ITS GOT NOTHING\n' +
                     'array!1 R 1\n' +
                     'array!2 R 5\n' +
                     'array!3 R GOT 2 AN 4 AN 8\n' +
                     'array\n',
        test, f),

        // index lookup
        t(3,'I HAS A array ITS GOT 3 AN 2 AN 1\narray!0', test, f),
        t(2,'I HAS A array ITS GOT 3 AN 2 AN 1\narray!1', test, f),
        t(1,'I HAS A array ITS GOT 3 AN 2 AN 1\narray!2', test, f),

        t([2, 4, 8],
                    'I HAS A array ITS GOT NOTHING\n' +
                     'array!1 R 1\n' +
                     'array!2 R 5\n' +
                     'array!3 R GOT 2 AN 4 AN 8\n' +
                     'array!3\n',
        test, f),
    ], function() {
        test.done();
    });
}

exports.testSwitch = function(test) {
    var template = [
        'I HAS A output',
        'I HAS A COLOR ITS "{0}"',
        'COLOR, WTF?',
        '   OMG "RED"',
        '       output R "R"',
        '       {1}',
        '   OMG "GREEN"',
        '       output R "G"',
        '       GTFO',
        '   OMGWTF',
        '       output R "NOTHING"',
        'OIC',
        'output'].join('\n');

    function make(color, fallthrough) {
        var ret = template.replace('{0}', color)
            .replace('{1}', !fallthrough ? 'GTFO' : '');
        return ret;
    }

    async.series([
        // green => g
        t('G', make('GREEN', false), test),
        // red => r
        t('R', make('RED', false), test),
        // red with fallthrough => g
        t('G', make('RED', true), test),
        // no match
        t('NOTHING', make('BLUE'), test)
    ], function() { test.done(); });

}
