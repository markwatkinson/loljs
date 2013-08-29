var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    parser = require('../parser.js').parser,
    ast = require('../src/ast.js'),
    lol = require('../src/lol.js');

global.ast = ast;

var programRoot = path.join(__dirname, 'programs');

function newLol(f) {
    var lines = [];
    var l = new lol(function(response) {
        f(response, lines);
    });
    l.setIo({
        visible: function(x) {
            lines.push(x);
        }
    });
    return l;
}

exports.testBf = function(test) {
    var code = fs.readFileSync(path.join(programRoot, 'bf.lol'), 'utf-8');
    var l = newLol(function(r, s) {
        var expected = 'Hello World!\n'.split('');
        test.deepEqual(s, expected);
        test.done();
    });
    l.evaluate(parser.parse(code));
}
