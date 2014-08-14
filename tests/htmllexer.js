var homunculus = require('../');

var expect = require('expect.js');
var path = require('path');
var fs = require('fs');

var Token = homunculus.getClass('token');
var HtmlLexer = homunculus.getClass('lexer', 'html');

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

describe('htmllexer', function() {
  describe('simple test', function() {
    describe('commnet', function() {
      it('normal', function () {
        var lexer = homunculus.getLexer('html');
        var tokens = lexer.parse('<!--comment-->');
        expect(join(tokens)).to.eql(['<!--comment-->']);
        expect(type(tokens)).to.eql([6]);
      });
    });
    describe('doctype', function() {
      it('normal', function () {
        var lexer = homunculus.getLexer('html');
        var tokens = lexer.parse('<!DOCTYPE>');
        expect(join(tokens)).to.eql(['<', '!DOCTYPE', '>']);
        expect(type(tokens)).to.eql([26, 12, 26]);
      });
      it('ignore case', function () {
        var lexer = homunculus.getLexer('html');
        var tokens = lexer.parse('<!doctype>');
        expect(join(tokens)).to.eql(['<', '!doctype', '>']);
        expect(type(tokens)).to.eql([26, 12, 26]);
      });
    });
    describe('markdown', function() {
      it('normal', function () {
        var lexer = homunculus.getLexer('html');
        var tokens = lexer.parse('<html></html>');
        expect(join(tokens)).to.eql(['<', 'html', '>', '</', 'html', '>']);
        expect(type(tokens)).to.eql([26, 10, 26, 26, 10, 26]);
      });
      it('selfclose', function() {
        var lexer = homunculus.getLexer('html');
        var tokens = lexer.parse('<img/>');
        expect(join(tokens)).to.eql(['<', 'img', '/>']);
        expect(type(tokens)).to.eql([26, 10, 26]);
      });
      it('without />', function() {
        var lexer = homunculus.getLexer('html');
        var tokens = lexer.parse('<img>');
        expect(join(tokens)).to.eql(['<', 'img', '>']);
        expect(type(tokens)).to.eql([26, 10, 26]);
      });
      it('custom mark', function() {
        var lexer = homunculus.getLexer('html');
        var tokens = lexer.parse('<custom>');
        expect(join(tokens)).to.eql(['<', 'custom', '>']);
        expect(type(tokens)).to.eql([26, 10, 26]);
      });
      it('attribute', function() {
        var lexer = homunculus.getLexer('html');
        var tokens = lexer.parse('<a href="#">');
        expect(join(tokens)).to.eql(['<', 'a', ' ', 'href', '=', '"#"', '>']);
        expect(type(tokens)).to.eql([26, 10, 1, 15, 8, 7, 26]);
      });
      it('custom attribute', function() {
        var lexer = homunculus.getLexer('html');
        var tokens = lexer.parse('<a custom=1>');
        expect(join(tokens)).to.eql(['<', 'a', ' ', 'custom', '=', '1', '>']);
        expect(type(tokens)).to.eql([26, 10, 1, 15, 8, 4, 26]);
      });
      it('data attribute', function() {
        var lexer = homunculus.getLexer('html');
        var tokens = lexer.parse('<a data-b=1>');
        expect(join(tokens)).to.eql(['<', 'a', ' ', 'data-b', '=', '1', '>']);
        expect(type(tokens)).to.eql([26, 10, 1, 24, 8, 4, 26]);
      });
      it('attr without quote', function() {
        var lexer = homunculus.getLexer('html');
        var tokens = lexer.parse('<input checked=checked>');
        expect(join(tokens)).to.eql(['<', 'input', ' ', 'checked', '=', 'checked', '>']);
        expect(type(tokens)).to.eql([26, 10, 1, 15, 8, 15, 26]);
      });
      it('attr without value', function() {
        var lexer = homunculus.getLexer('html');
        var tokens = lexer.parse('<input checked>');
        expect(join(tokens)).to.eql(['<', 'input', ' ', 'checked', '>']);
        expect(type(tokens)).to.eql([26, 10, 1, 15, 26]);
      });
      it('text', function() {
        var lexer = homunculus.getLexer('html');
        var tokens = lexer.parse('<div>text</div> <p/>');
        expect(join(tokens)).to.eql(['<', 'div', '>', 'text', '</', 'div', '>', ' ', '<', 'p', '/>']);
        expect(type(tokens)).to.eql([26, 10, 26, 25, 26, 10, 26, 25, 26, 10, 26]);
      });
      it('error', function() {
        var lexer = homunculus.getLexer('html');
        expect(function() {
          lexer.parse('<div |>');
        }).to.throwError();
      });
    });
  });
  describe('page test', function() {
    it('demo/html', function() {
      var s = fs.readFileSync(path.join(__dirname, '..', 'demo', 'html.html'), { encoding: 'utf-8' });
      var lexer = homunculus.getLexer('html');
      var tokens = lexer.parse(s);
      expect(tokens.length).to.eql(160);
    });
  });
});