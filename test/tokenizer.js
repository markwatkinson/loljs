var async = require('async'),
    parser = require('../parser.js').parser,
    ast = require('../src/ast.js'),
    lol = require('../src/lol.js');

global.ast = ast;

exports.testBTW = function(test) {
    var p = [
        '1',
        '1 BTW 2',
        '2'
    ].join('\n');
    var tree = parser.parse(p);
    test.ok(tree);
    test.ok(tree instanceof ast.Body);
    test.strictEqual(tree.lines.length, 3, 'Correct number of lines');

    p = [
        '1',
        'BTW 2',
        '2'
    ].join('\n');
    tree = parser.parse(p);
    test.ok(tree);
    test.ok(tree instanceof ast.Body);
    test.strictEqual(tree.lines.length, 2, 'Correct number of lines');

    p = [
        '1',
        'OBTW HELLO TLDR',
        '2'
    ].join('\n');
    tree = parser.parse(p);
    test.ok(tree);
    test.ok(tree instanceof ast.Body);
    test.strictEqual(tree.lines.length, 2, 'Correct number of lines');
    test.done();
}