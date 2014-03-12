var homunculus = require('../homunculus');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');
var os = require('os');
var isWin = /win/i.test(os.type());

var Lexer = require('../src/lexer/Lexer');
var Token = require('../src/lexer/Token');

describe('jsparser', function() {
  describe('js lib test', function() {
    it('jquery 1.11.0', function() {
      var parser = homunculus.getParser('js');
      var code = fs.readFileSync(path.join(__dirname, './jquery-1.11.0.js'), { encoding: 'utf-8' });
      parser.parse(code);
    });
  });
});