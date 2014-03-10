var homunculus = require('../homunculus');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Lexer = require('../src/lexer/Lexer');
var Token = require('../src/lexer/Token');

describe('jslexer', function() {
  it('#parse tokens a', function() {
    var lexer = homunculus.getLexer('js');
    var code = fs.readFileSync(path.join(__dirname, './resource/a.js'), { encoding: 'utf-8' });
    var tokens = lexer.parse(code);
    var arr = tokens.map(function(token) {
      return token.content();
    });
    var res = fs.readFileSync(path.join(__dirname, './resource/a.txt'), { encoding: 'utf-8' });
    res = JSON.parse(res);
    expect(arr).to.eql(res);
  });
  it('#parse tokens b', function() {
    var lexer = homunculus.getLexer('js');
    var code = fs.readFileSync(path.join(__dirname, './resource/b.js'), { encoding: 'utf-8' });
    var tokens = lexer.parse(code);
    var arr = tokens.map(function(token) {
      return token.content();
    });
    var res = fs.readFileSync(path.join(__dirname, './resource/b.txt'), { encoding: 'utf-8' });
    res = JSON.parse(res);
    expect(arr).to.eql(res);
  });
  it('#parse tokens c', function() {
    var lexer = homunculus.getLexer('js');
    var code = fs.readFileSync(path.join(__dirname, './resource/c.js'), { encoding: 'utf-8' });
    var tokens = lexer.parse(code);
    var arr = tokens.map(function(token) {
      return token.content();
    });
    var res = fs.readFileSync(path.join(__dirname, './resource/c.txt'), { encoding: 'utf-8' });
    res = JSON.parse(res);
    expect(arr).to.eql(res);
  });
});