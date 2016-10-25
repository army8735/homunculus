var homunculus = require('../');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Token = homunculus.getClass('token');
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
    it('unicode id', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('var 中文');
      expect(join(tokens)).to.eql(['var', ' ', '中文']);
    });
    it('perl style regular 1', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('/.*\\d[^a-z]\\//g, /[/]/');
      expect(join(tokens)).to.eql(['/.*\\d[^a-z]\\//g', ',', ' ', '/[/]/']);
    });
    it('perl style regular 2', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('/.*\\d[^a-z]\\//gi');
      expect(join(tokens)).to.eql(['/.*\\d[^a-z]\\//gi']);
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
    it('html start comment', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('<!--comment\n123<!--comment');
      expect(join(tokens)).to.eql(['<!--comment', '\n', '123', '<!--comment']);
    });
    it('html end comment', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('-->comment\n -->comment\n\t-->comment\n/**/-->comment\n1-->not');
      expect(join(tokens)).to.eql(['-->comment', '\n', ' ', '-->comment', '\n', '\t', '-->comment', '\n', '/**/', '-->comment', '\n', '1', '--', '>', 'not' ]);
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
    it('block with reg 1', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('var a = {} / 2');
      expect(join(tokens)).to.eql(['var', ' ', 'a', ' ', '=', ' ', '{', '}', ' ', '/', ' ', '2']);
    });
    it('block with reg 2', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('({}+1)');
      expect(join(tokens)).to.eql(['(', '{', '}', '+', '1', ')']);
    });
    it('block with reg 3', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('if(true){}');
      expect(join(tokens)).to.eql(['if', '(', 'true', ')', '{', '}']);
    });
    it('block with reg 4', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('delete{}/1');
      expect(join(tokens)).to.eql(['delete', '{', '}', '/', '1']);
    });
    it('block with reg 5', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('1?{}/1:{}/2');
      expect(join(tokens)).to.eql(['1', '?', '{', '}', '/', '1', ':', '{', '}', '/', '2']);
    });
    it('block with reg 6', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('2>>>{}/1');
      expect(join(tokens)).to.eql(['2', '>>>', '{', '}', '/', '1']);
    });
    it('block with reg & return 1', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('return{}/1');
      expect(join(tokens)).to.eql(['return', '{', '}', '/', '1']);
    });
    it('block with reg & return 2', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('return\n{}/1/');
      expect(join(tokens)).to.eql(['return', '\n', '{', '}', '/1/']);
    });
    it('block with reg & return 3', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('return/*\n*/{}/1/');
      expect(join(tokens)).to.eql(['return', '/*\n*/', '{', '}', '/1/']);
    });
    it('block with reg & return 4', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('{}\n{}/1/');
      expect(join(tokens)).to.eql(['{', '}', '\n', '{', '}', '/1/']);
    });
    it('block with reg & return 5', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('{}\n{}/1/');
      expect(join(tokens)).to.eql(['{', '}', '\n', '{', '}', '/1/']);
    });
    it('block with reg & return 6', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('(1)\n{}/1/');
      expect(join(tokens)).to.eql(['(', '1', ')', '\n', '{', '}', '/1/']);
    });
    it('block with reg & return 7', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('()=>{}/1/');
      expect(join(tokens)).to.eql(['(', ')', '=>', '{', '}', '/1/']);
    });
    it('annot 1', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('@bind');
      expect(join(tokens)).to.eql(['@bind']);
    });
    it('annot 2', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('@link(a,b)');
      expect(join(tokens)).to.eql(['@link', '(', 'a', ',', 'b', ')']);
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
      expect(Token.type(5)).to.eql('ID');
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
    it('#prev,#next', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('var a');
      expect(tokens[0].prev()).to.eql(null);
      expect(tokens[1].prev()).to.eql(tokens[0]);
      expect(tokens[0].next()).to.eql(tokens[1]);
      expect(tokens[2].next()).to.eql(null);
    });
    it('plainObject', function() {
      var lexer = homunculus.getLexer('js');
      lexer.parse('var a = 1');
      expect(lexer.tokens(true)).to.eql(['var', ' ', 'a', ' ', '=', ' ', '1']);
    });
  });
  describe('line && col', function() {
    it('normal', function() {
      var lexer = homunculus.getLexer('js');
      var tokens = lexer.parse('if(true){\na;\n/reg/}');
      var arr = tokens.map(function(item) {
        return item.col();
      });
      //console.log(arr)
      expect(tokens[0].line()).to.eql(1);
      expect(tokens[1].line()).to.eql(1);
      expect(tokens[2].line()).to.eql(1);
      expect(tokens[3].line()).to.eql(1);
      expect(tokens[4].line()).to.eql(1);
      expect(tokens[5].line()).to.eql(1);
      expect(tokens[6].line()).to.eql(2);
      expect(tokens[7].line()).to.eql(2);
      expect(tokens[8].line()).to.eql(2);
      expect(tokens[9].line()).to.eql(3);
      expect(tokens[10].line()).to.eql(3);

      expect(tokens[0].col()).to.eql(1);
      expect(tokens[1].col()).to.eql(3);
      expect(tokens[2].col()).to.eql(4);
      expect(tokens[3].col()).to.eql(8);
      expect(tokens[4].col()).to.eql(9);
      expect(tokens[5].col()).to.eql(10);
      expect(tokens[6].col()).to.eql(1);
      expect(tokens[7].col()).to.eql(2);
      expect(tokens[8].col()).to.eql(3);
      expect(tokens[9].col()).to.eql(1);
      expect(tokens[10].col()).to.eql(6);
    });
  });
});