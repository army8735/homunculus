var homunculus = require('../');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Token = homunculus.getClass('token', 'jsx');
var Lexer = homunculus.getClass('lexer', 'jsx');

function join(tokens) {
  var arr = tokens.map(function(token) {
    return token.content();
  });
  return arr;
}

describe('jsxlexer2', function() {
  describe('simple test', function() {
    it('single close', function() {
      var lexer = homunculus.getLexer('jsx');
      var tokens = lexer.parse('<a/>');
      expect(join(tokens)).to.eql(['<', 'a', '/>']);
    });
    it('with one attr', function() {
      var lexer = homunculus.getLexer('jsx');
      var tokens = lexer.parse('<a href="#"/>');
      expect(join(tokens)).to.eql(['<', 'a', ' ', 'href', '=', '"#"', '/>']);
    });
    it('with servel attr', function() {
      var lexer = homunculus.getLexer('jsx');
      var tokens = lexer.parse('<a href="#" name="test" data-num=123/>');
      expect(join(tokens)).to.eql(['<', 'a', ' ', 'href', '=', '"#"', ' ', 'name', '=', '"test"', ' ', 'data-num', '=', '123', '/>']);
    });
    it('with spread attr', function() {
      var lexer = homunculus.getLexer('jsx');
      var tokens = lexer.parse('<a href="#" {...somedata}/>');
      expect(join(tokens)).to.eql(['<', 'a', ' ', 'href', '=', '"#"', ' ', '{', '...', 'somedata', '}', '/>']);
    });
    it('with js attr value', function() {
      var lexer = homunculus.getLexer('jsx');
      var tokens = lexer.parse('<a href="#" data={a++}/>');
      expect(join(tokens)).to.eql(['<', 'a', ' ', 'href', '=', '"#"', ' ', 'data', '=', '{', 'a', '++', '}', '/>']);
    });
    it('empty text with js', function() {
      var lexer = homunculus.getLexer('jsx');
      var tokens = lexer.parse('<a>1{}2</a>');
      expect(join(tokens)).to.eql(['<', 'a', '>', '1', '{', '}', '2', '</', 'a', '>']);
    });
    it('text with js 1', function() {
      var lexer = homunculus.getLexer('jsx');
      var tokens = lexer.parse('<a>1{b}2</a>');
      expect(join(tokens)).to.eql(['<', 'a', '>', '1', '{', 'b', '}', '2', '</', 'a', '>']);
    });
    it('text with js 2', function() {
      var lexer = homunculus.getLexer('jsx');
      var tokens = lexer.parse('<a>111{a?b:c}222</a>');
      expect(join(tokens)).to.eql(['<', 'a', '>', '111', '{', 'a', '?', 'b', ':', 'c', '}', '222', '</', 'a', '>']);
    });
    it('recursion 1', function() {
      var lexer = homunculus.getLexer('jsx');
      var tokens = lexer.parse('<a>{a?<b>1</b>:<b>2</b>}222</a>');
      expect(join(tokens)).to.eql(['<', 'a', '>', '{', 'a', '?', '<', 'b', '>', '1', '</', 'b', '>', ':', '<', 'b', '>', '2', '</', 'b', '>', '}', '222', '</', 'a', '>']);
    });
    it('recursion 2', function() {
      var lexer = homunculus.getLexer('jsx');
      var tokens = lexer.parse('<a>111{[<b/>,"",<span>{test}</span>]}222</a>');
      expect(join(tokens)).to.eql(['<', 'a', '>', '111', '{', '[', '<', 'b', '/>', ',', '""', ',', '<', 'span', '>', '{', 'test', '}', '</', 'span', '>', ']', '}', '222', '</', 'a', '>']);
    });
    it('{ entity error', function() {
      var lexer = homunculus.getLexer('jsx');
      expect(function() {
        lexer.parse('<a>{</a>');
      }).to.throwError();
    });
    it('< entity error', function() {
      var lexer = homunculus.getLexer('jsx');
      expect(function() {
        lexer.parse('<a><</a>');
      }).to.throwError();
    });
    it('member mark', function() {
      var lexer = homunculus.getLexer('jsx');
      var tokens = lexer.parse('<a.b></a.b>');
      expect(join(tokens)).to.eql(['<', 'a', '.', 'b', '>', '</', 'a', '.', 'b', '>']);
    });
    it('namespace mark', function() {
      var lexer = homunculus.getLexer('jsx');
      var tokens = lexer.parse('<a:b></a:b>');
      expect(join(tokens)).to.eql(['<', 'a', ':', 'b', '>', '</', 'a', ':', 'b', '>']);
    });
    it('nest mark', function() {
      var lexer = homunculus.getLexer('jsx');
      var tokens = lexer.parse('<a><b></b></a>');
      expect(join(tokens)).to.eql(['<', 'a', '>', '<', 'b', '>', '</', 'b', '>', '</', 'a', '>']);
    });
    it('nest mark with text', function() {
      var lexer = homunculus.getLexer('jsx');
      var tokens = lexer.parse('<a><b><c>123</c>456</b></a>,<d><e></e></d>');
      expect(join(tokens)).to.eql(['<', 'a', '>', '<', 'b', '>', '<', 'c', '>', '123', '</', 'c', '>', '456', '</', 'b', '>', '</', 'a', '>', ',', '<', 'd', '>', '<', 'e', '>', '</', 'e', '>', '</', 'd', '>']);
    });
  });
  describe('line && col', function() {
    it('normal', function() {
      var lexer = homunculus.getLexer('jsx');
      var tokens = lexer.parse('<a href="#" data={}>1{assign}2</a>');
      var arr = tokens.map(function(item) {
        return item.col();
      });
      //console.log(arr)
      expect(arr).to.eql([1, 2, 3, 4, 8, 9, 12, 13, 17, 18, 19, 20, 21, 22, 23, 29, 30, 31, 33, 34]);
    });
  });
});