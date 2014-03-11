var homunculus = require('../homunculus');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Lexer = require('../src/lexer/Lexer');
var Token = require('../src/lexer/Token');

describe('jslexer', function() {
  describe('simple test', function() {
    it('string literal with back_slash', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('"string\\"""str"');
      var arr = tokens.map(function(token) {
        return token.content();
      });
      expect(arr).to.eql(['"string\\""', '"str"']);
    });
    it('string literal with double back_slash', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('"string\\\\""str"');
      var arr = tokens.map(function(token) {
        return token.content();
      });
      expect(arr).to.eql(['"string\\\\"', '"str"']);
    });
    it('id and sign in var stmt', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('var a = 1;var b');
      var arr = tokens.map(function(token) {
        return token.content();
      });
      expect(arr).to.eql(['var', ' ', 'a', ' ', '=', ' ', '1', ';', 'var', ' ', 'b']);
    });
    it('perl style regular 1', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('/.*\d[^a-z]\\//g, /[/]/');
      var arr = tokens.map(function(token) {
        return token.content();
      });
      expect(arr).to.eql(['/.*\d[^a-z]\\//g', ',', ' ', '/[/]/']);
    });
    it('perl style regular 2', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('/.*\d[^a-z]\\//gi');
      var arr = tokens.map(function(token) {
        return token.content();
      });
      expect(arr).to.eql(['/.*\d[^a-z]\\//gi']);
    });
  });
  describe('complex test', function() {
    it('test 1', function() {
      var lexer = homunculus.getLexer('js');
      var code = fs.readFileSync(path.join(__dirname, './jslexer/1.js'), { encoding: 'utf-8' });
      var tokens = lexer.parse(code);
      var arr = tokens.map(function(token) {
        return token.content();
      });
      var res = fs.readFileSync(path.join(__dirname, './jslexer/1.txt'), { encoding: 'utf-8' });
      res = JSON.parse(res);
      expect(arr).to.eql(res);
    });
    it('test 2', function() {
      var lexer = homunculus.getLexer('js');
      var code = fs.readFileSync(path.join(__dirname, './jslexer/2.js'), { encoding: 'utf-8' });
      var tokens = lexer.parse(code);
      var arr = tokens.map(function(token) {
        return token.content();
      });
      var res = fs.readFileSync(path.join(__dirname, './jslexer/2.txt'), { encoding: 'utf-8' });
      res = JSON.parse(res);
      expect(arr).to.eql(res);
    });
    it('test 3', function() {
      var lexer = homunculus.getLexer('js');
      var code = fs.readFileSync(path.join(__dirname, './jslexer/3.js'), { encoding: 'utf-8' });
      var tokens = lexer.parse(code);
      var arr = tokens.map(function(token) {
        return token.content();
      });
      var res = fs.readFileSync(path.join(__dirname, './jslexer/3.txt'), { encoding: 'utf-8' });
      res = JSON.parse(res);
      expect(arr).to.eql(res);
    });
  });
});