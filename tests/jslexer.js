var homunculus = require('../');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Token = homunculus.getClass('token', 'js');
var Lexer = homunculus.getClass('lexer', 'js');

function join(tokens) {
  var arr = tokens.map(function(token) {
    return token.content();
  });
  return arr;
}

describe('jslexer', function() {
  describe('simple test', function() {
    it('string literal with back_slash', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('"string\\"""str"');
      expect(join(tokens)).to.eql(['"string\\""', '"str"']);
    });
    it('string literal with double back_slash', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('"string\\\\""str"');
      expect(join(tokens)).to.eql(['"string\\\\"', '"str"']);
    });
    it('string literal no end', function() {
      var lexer = homunculus.getLexer('js');
      expect(function() {
        lexer.parse('"sdfsdf');
      }).to.throwError();
    });
    it('string multiline', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('"string\\\r\n""str"');
      expect(join(tokens)).to.eql(['"string\\\r\n"', '"str"']);
    });
    it('string multiline without back_slash', function() {
      var lexer = homunculus.getLexer('js');
      expect(function() {
        lexer.parse('"string\n"');
      }).to.throwError();
    });
    it('id and sign in var stmt', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('var a = 1;var b');
      expect(join(tokens)).to.eql(['var', ' ', 'a', ' ', '=', ' ', '1', ';', 'var', ' ', 'b']);
    });
    it('perl style regular 1', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('/.*\d[^a-z]\\//g, /[/]/');
      expect(join(tokens)).to.eql(['/.*\d[^a-z]\\//g', ',', ' ', '/[/]/']);
    });
    it('perl style regular 2', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('/.*\d[^a-z]\\//gi');
      expect(join(tokens)).to.eql(['/.*\d[^a-z]\\//gi']);
    });
    it('perl style regular with no { in if stmt', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('if(true)/x/');
      expect(join(tokens)).to.eql(['if', '(', 'true', ')', '/x/']);
    });
    it('perl style regular with expr in ()', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('(a)/b (a)/ /x/');
      expect(join(tokens)).to.eql(['(', 'a', ')', '/', 'b', ' ', '(', 'a', ')', '/', ' ', '/x/']);
    });
    it('perl style regular with unknow flag', function() {
      var lexer = homunculus.getLexer('js');
      expect(function() {
        lexer.parse('/reg/op;');
      }).to.throwError();
    });
    it('perl style regular with unknow flag in loose mode', function() {
      var lexer = homunculus.getLexer('js');
      Lexer.mode(Lexer.LOOSE);
      expect(function() {
        lexer.parse('/reg/op;');
      }).to.not.throwError();
      Lexer.mode(Lexer.STRICT);
    });
    it('perl style regular no end', function() {
      var lexer = homunculus.getLexer('js');
      expect(function() {
        lexer.parse('/reg');
      }).to.throwError();
    });
    it('perl style regular cross line', function() {
      var lexer = homunculus.getLexer('js');
      expect(function() {
        lexer.parse('/reg\n/');
      }).to.throwError();
    });
    it('perl style regular cross line in loose mode', function() {
      var lexer = homunculus.getLexer('js');
      Lexer.mode(Lexer.LOOSE);
      expect(function() {
        lexer.parse('/reg\n/');
      }).to.not.throwError();
      Lexer.mode(Lexer.STRICT);
    });
    it('perl style regular cross line in []', function() {
      var lexer = homunculus.getLexer('js');
      expect(function() {
        lexer.parse('/reg[\n]/');
      }).to.throwError();
    });
    it('perl style regular cross line in [] in loose mode', function() {
      var lexer = homunculus.getLexer('js');
      Lexer.mode(Lexer.LOOSE);
      expect(function() {
        lexer.parse('/reg[\n]/');
      }).to.not.throwError();
      Lexer.mode(Lexer.STRICT);
    });
    it('signle line comment', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('//comment\n//cc');
      expect(join(tokens)).to.eql(['//comment', '\n', '//cc']);
    });
    it('multi line comment', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('/*comment\\*/ /*comment\ncc*/');
      expect(join(tokens)).to.eql(['/*comment\\*/', ' ', '/*comment\ncc*/']);
    });
    it('multi line comment no end', function() {
      var lexer = homunculus.getLexer('js');
      expect(function() {
        lexer.parse('/*cc');
      }).to.throwError();
    });
    it('template', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('`template`');
      expect(join(tokens)).to.eql(['`template`']);
    });
    it('number', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('0.541 .32E+8 123E9 45.2E-10');
      expect(join(tokens)).to.eql(['0.541', ' ', '.32E+8', ' ', '123E9', ' ', '45.2E-10']);
    });
    it('super', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('super.super');
      expect(tokens[0].type()).to.eql(Token.KEYWORD);
      expect(tokens[2].type()).to.eql(Token.ID);
    });
    it('other keyword can be property name', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('a.var');
      expect(tokens[2].type()).to.eql(Token.ID);
    });
    it('unknow token', function() {
      var lexer = homunculus.getLexer('js');
      expect(function() {
        lexer.parse('€');
      }).to.throwError();
    });
  });
  describe('complex test', function() {
    it('test 1', function() {
      var lexer = homunculus.getLexer('js');
      var code = fs.readFileSync(path.join(__dirname, './jslexer/1.js'), { encoding: 'utf-8' });
      code = code.replace(/\r\n/g, '\n');
      var tokens = lexer.parse(code);
      var res = fs.readFileSync(path.join(__dirname, './jslexer/1.txt'), { encoding: 'utf-8' });
      res = JSON.parse(res);
      expect(join(tokens)).to.eql(res);
    });
    it('test 2', function() {
      var lexer = homunculus.getLexer('js');
      var code = fs.readFileSync(path.join(__dirname, './jslexer/2.js'), { encoding: 'utf-8' });
      code = code.replace(/\r\n/g, '\n');
      var tokens = lexer.parse(code);
      var res = fs.readFileSync(path.join(__dirname, './jslexer/2.txt'), { encoding: 'utf-8' });
      res = JSON.parse(res);
      expect(join(tokens)).to.eql(res);
    });
    it('test 3', function() {
      var lexer = homunculus.getLexer('js');
      var code = fs.readFileSync(path.join(__dirname, './jslexer/3.js'), { encoding: 'utf-8' });
      code = code.replace(/\r\n/g, '\n');
      var tokens = lexer.parse(code);
      var res = fs.readFileSync(path.join(__dirname, './jslexer/3.txt'), { encoding: 'utf-8' });
      res = JSON.parse(res);
      expect(join(tokens)).to.eql(res);
    });
  });
  describe('index test', function() {
    var lexer = homunculus.getLexer('js');
    var tokens = lexer.parse('var a = /reg/;var b=/**/2;');
    it('tokens length', function() {
      expect(tokens.length).to.eql(15);
    });
    it('tokens sIndex 1', function() {
      expect(tokens[0].sIndex()).to.eql(0);
    });
    it('tokens sIndex 2', function() {
      expect(tokens[1].sIndex()).to.eql(3);
    });
    it('tokens sIndex 3', function() {
      expect(tokens[6].sIndex()).to.eql(8);
    });
    it('tokens sIndex 4', function() {
      expect(tokens[13].sIndex()).to.eql(24);
    });
  });
  describe('js lib exec test', function() {
    it('jquery 1.11.0', function() {
      var lexer = homunculus.getLexer('js');
      var code = fs.readFileSync(path.join(__dirname, './lib/jquery-1.11.0.js'), { encoding: 'utf-8' });
      var tokens = lexer.parse(code);
      var str = '';
      tokens.forEach(function(token) {
        str += token.content();
      });
      expect(str).to.eql(code);
    });
    it('jquery 1.11.0 min', function() {
      var lexer = homunculus.getLexer('js');
      var code = fs.readFileSync(path.join(__dirname, './lib/jquery-1.11.0.min.js'), { encoding: 'utf-8' });
      var tokens = lexer.parse(code);
      var str = '';
      tokens.forEach(function(token) {
        str += token.content();
      });
      expect(str).to.eql(code);
    });
    it('backbone 1.1.0', function() {
      var lexer = homunculus.getLexer('js');
      var code = fs.readFileSync(path.join(__dirname, './lib/backbone.js'), { encoding: 'utf-8' });
      var tokens = lexer.parse(code);
      var str = '';
      tokens.forEach(function(token) {
        str += token.content();
      });
      expect(str).to.eql(code);
    });
    it('handlebars', function() {
      var lexer = homunculus.getLexer('js');
      var code = fs.readFileSync(path.join(__dirname, './lib/handlebars.js'), { encoding: 'utf-8' });
      var tokens = lexer.parse(code);
      var str = '';
      tokens.forEach(function(token) {
        str += token.content();
      });
      expect(str).to.eql(code);
    });
    it('Uri', function() {
      var lexer = homunculus.getLexer('js');
      var code = fs.readFileSync(path.join(__dirname, './lib/Uri.js'), { encoding: 'utf-8' });
      var tokens = lexer.parse(code);
      var str = '';
      tokens.forEach(function(token) {
        str += token.content();
      });
      expect(str).to.eql(code);
    });
  });
  describe('other tests', function() {
    it('Token#type', function() {
      expect(Token.type(18)).to.eql('IMPORTANT');
    });
    it('Token#content', function() {
      var token = new Token(Token.STRING, '', 0);
      token.content('a');
      expect(token.content()).eql('a');
    });
    it('Token#val', function() {
      var token = new Token(Token.STRING, '', 0);
      token.val('a');
      expect(token.val()).eql('a');
    });
    it('Token#tag', function() {
      var token = new Token(Token.NUMBER, '', 0);
      token.tag(Token.STRING);
      expect(token.tag()).eql('STRING');
    });
    it('Token#tid', function() {
      var token = new Token(Token.NUMBER, '', 0);
      token.tid(0);
      expect(token.tid()).eql(0);
    });
    it('Token#sIndex', function() {
      var token = new Token(Token.NUMBER, '', 0);
      token.sIndex(1);
      expect(token.sIndex()).eql(1);
    });
    it('cache parse', function() {
      var lexer = homunculus.getLexer('js');
      lexer.cache(1);
      lexer.parse('var a;\nvar b;');
      expect(lexer.finish()).to.not.ok();
      expect(lexer.line()).to.be(2);
      lexer.parseOn();
      expect(lexer.finish()).to.ok();
      expect(lexer.col()).to.be(7);
    });
    it('mode test', function() {
      expect(Lexer.mode()).to.eql(Lexer.STRICT);
      Lexer.mode(Lexer.LOOSE);
      expect(Lexer.mode()).to.eql(Lexer.LOOSE);
      Lexer.mode(Lexer.STRICT);
    });
    it('mode error in strict', function() {
      var lexer = homunculus.getLexer('js');
      expect(function() {
        lexer.parse('0.3E');
      }).to.throwError();
    });
    it('mode console in loose', function() {
      var lexer = homunculus.getLexer('js');
      Lexer.mode(Lexer.LOOSE);
      expect(function() {
        lexer.parse('0.3E');
      }).to.not.throwError();
      Lexer.mode(Lexer.STRICT);
    });
  });
});