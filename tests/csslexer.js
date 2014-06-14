var homunculus = require('../');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Token = homunculus.getClass('token');
var Lexer = homunculus.getClass('lexer', 'css');

function join(tokens) {
  var arr = tokens.map(function(token) {
    return token.content();
  });
  return arr;
}
function type(tokens) {
  var arr = tokens.map(function(token) {
    return token.type();
  });
  return arr;
}

describe('csslexer', function() {
  describe('simple test', function () {
    describe('@media', function() {
      it('normal', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@media screen and(width:800px)');
        expect(join(tokens)).to.eql(['@media', ' ', 'screen', ' ', 'and', '(', 'width', ':', '800', 'px', ')']);
        expect(type(tokens)).to.eql([Token.HEAD, Token.BLANK, Token.PROPERTY, Token.BLANK, Token.PROPERTY, Token.SIGN, Token.KEYWORD, Token.SIGN, Token.NUMBER, Token.UNITS, Token.SIGN]);
      });
    });
  });
  describe('index test', function() {
    var lexer = homunculus.getLexer('css');
    var tokens = lexer.parse('body{color:#FFF}');
    it('tokens length', function() {
      expect(tokens.length).to.eql(6);
    });
    it('tokens sIndex 1', function() {
      expect(tokens[0].sIndex()).to.eql(0);
    });
    it('tokens sIndex 2', function() {
      expect(tokens[1].sIndex()).to.eql(4);
    });
    it('tokens sIndex 3', function() {
      expect(tokens[2].sIndex()).to.eql(5);
    });
    it('tokens sIndex 4', function() {
      expect(tokens[3].sIndex()).to.eql(10);
    });
  });
});