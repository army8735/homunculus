var homunculus = require('../');

var expect = require('expect.js');
var path = require('path');

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
        expect(type(tokens)).to.eql([8, 12, 8]);
      });
    });
  });
});