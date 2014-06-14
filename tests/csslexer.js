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
function type(tokens, tag) {
  var arr = tokens.map(function(token) {
    return tag ? Token.type(token.type()) : token.type();
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
        expect(type(tokens)).to.eql([ 12, 1, 15, 1, 15, 8, 10, 8, 4, 20, 8 ]);
      });
      it('multi', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@media screen,print and(width:0)');
        expect(join(tokens)).to.eql(['@media', ' ', 'screen', ',', 'print', ' ', 'and', '(', 'width', ':', '0', ')']);
        expect(type(tokens)).to.eql([ 12, 1, 15, 8, 15, 1, 15, 8, 10, 8, 4, 8 ]);
      });
    });
    describe('@import', function() {
      it('normal', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@import url(xxx)');
        expect(join(tokens)).to.eql([ '@import', ' ', 'url', '(', 'xxx', ')' ]);
        expect(type(tokens)).to.eql([ 12, 1, 15, 8, 7, 8 ]);
      });
      it('with quote', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@import url("xxx")');
        console.log(join(tokens));
        console.log(type(tokens, true));
        console.log(type(tokens));
        expect(join(tokens)).to.eql([ '@import', ' ', 'url', '(', '"xxx"', ')' ]);
        expect(type(tokens)).to.eql([ 12, 1, 15, 8, 7, 8 ]);
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