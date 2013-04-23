var fs = require('fs'),
    Parser = require('jison').Parser;

var grammar = fs.readFileSync(__dirname + '/loljs.jison',
    {encoding: 'utf-8'}
);

var parser = new Parser(grammar);
var source = parser.generate();

fs.writeFileSync(__dirname + '/../parser.js', source);