var homunculus = require('../');

var expect = require('expect.js');
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
    describe('commnet', function() {
      it('single', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('//aasfdsf\n//');
        expect(join(tokens)).to.eql(['//aasfdsf', '\n', '//']);
        expect(type(tokens)).to.eql([6, 3, 6]);
      });
      it('multi', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('/*\n//*/');
        expect(join(tokens)).to.eql(['/*\n//*/']);
        expect(type(tokens)).to.eql([6]);
      });
    });
    describe('@media', function() {
      it('normal', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@media screen and(width:800px)');
        expect(join(tokens)).to.eql(['@media', ' ', 'screen', ' ', 'and', '(', 'width', ':', '800', 'px', ')']);
        expect(type(tokens)).to.eql([12, 1, 15, 1, 15, 8, 10, 8, 4, 20, 8]);
      });
      it('multi', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@media screen,print and(width:0)');
        expect(join(tokens)).to.eql(['@media', ' ', 'screen', ',', 'print', ' ', 'and', '(', 'width', ':', '0', ')']);
        expect(type(tokens)).to.eql([12, 1, 15, 8, 15, 1, 15, 8, 10, 8, 4, 8]);
      });
    });
    describe('@import', function() {
      it('normal', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@import url(xxx)');
        expect(join(tokens)).to.eql(['@import', ' ', 'url', '(', 'xxx', ')']);
        expect(type(tokens)).to.eql([12, 1, 15, 8, 7, 8]);
      });
      it('with quote', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@import url("xxx")');
        expect(join(tokens)).to.eql(['@import', ' ', 'url', '(', '"xxx"', ')']);
        expect(type(tokens)).to.eql([12, 1, 15, 8, 7, 8]);
      });
      it('with quote and line', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@import url("x\\\nx")');
        expect(join(tokens)).to.eql(['@import', ' ', 'url', '(', '"x\\\nx"', ')']);
        expect(type(tokens)).to.eql([12, 1, 15, 8, 7, 8]);
      });
      it('url with blank and no quote', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@import url(x x)');
        expect(join(tokens)).to.eql(['@import', ' ', 'url', '(', 'x x', ')']);
        expect(type(tokens)).to.eql([12, 1, 15, 8, -2, 8]);
      });
      it('url with line and no quote', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@import url(x\nx)');
        expect(join(tokens)).to.eql(['@import', ' ', 'url', '(', 'x\nx', ')']);
        expect(type(tokens)).to.eql([12, 1, 15, 8, -2, 8]);
      });
      it('url with no )', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@import url(x');
        expect(join(tokens)).to.eql(['@import', ' ', 'url', '(', 'x']);
        expect(type(tokens)).to.eql([12, 1, 15, 8, -2]);
      });
      it('url with no ) but line', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@import url(x\n');
        expect(join(tokens)).to.eql(['@import', ' ', 'url', '(', 'x\n']);
        expect(type(tokens)).to.eql([12, 1, 15, 8, -2]);
      });
      it('multi', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@import url("style.css") screen, print;');
        expect(join(tokens)).to.eql(['@import', ' ', 'url', '(', '"style.css"', ')', ' ', 'screen', ',', ' ', 'print', ';']);
        expect(type(tokens)).to.eql([12, 1, 15, 8, 7, 8, 1, 15, 8, 1, 15, 8]);
      });
    });
    describe('selector', function() {
      it('#id', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('#id{}');
        expect(join(tokens)).to.eql(['#id', '{', '}']);
        expect(type(tokens)).to.eql([21, 8, 8]);
      });
      it('#id in block', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('#id{#id2{}}');
        expect(join(tokens)).to.eql(['#id', '{', '#id2', '{', '}', '}']);
        expect(type(tokens)).to.eql([21, 8, 21, 8, 8, 8]);
      });
      it('#fff is not number', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('#fff{}');
        expect(join(tokens)).to.eql(['#fff', '{', '}']);
        expect(type(tokens)).to.eql([21, 8, 8]);
      });
      it('.class', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('.class{}');
        expect(join(tokens)).to.eql(['.class', '{', '}']);
        expect(type(tokens)).to.eql([21, 8, 8]);
      });
      it('.class in block', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('.class{.class{}}');
        expect(join(tokens)).to.eql(['.class', '{', '.class', '{', '}', '}']);
        expect(type(tokens)).to.eql([21, 8, 21, 8, 8, 8]);
      });
      it('*', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('*{}');
        expect(join(tokens)).to.eql(['*', '{', '}']);
        expect(type(tokens)).to.eql([21, 8, 8]);
      });
      it('tagname', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{}');
        expect(join(tokens)).to.eql(['body', '{', '}']);
        expect(type(tokens)).to.eql([21, 8, 8]);
      });
      it('tagname in block', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{div{}}');
        expect(join(tokens)).to.eql(['body', '{', 'div', '{', '}', '}']);
        expect(type(tokens)).to.eql([21, 8, 21, 8, 8, 8]);
      });
      it('pseudo', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('a:hover{}p:not(:first){}');
        expect(join(tokens)).to.eql(['a', ':hover', '{', '}', 'p', ':not(:first)', '{', '}']);
        expect(type(tokens)).to.eql([21, 19, 8, 8, 21, 19, 8, 8]);
      });
      it('pseudo at start', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse(':hover{}');
        expect(join(tokens)).to.eql([':hover', '{', '}']);
        expect(type(tokens)).to.eql([19, 8, 8]);
      });
      it('pseudo after ,', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p,:root{}');
        expect(join(tokens)).to.eql(['p', ',', ':root', '{', '}']);
        expect(type(tokens)).to.eql([21, 8, 19, 8, 8]);
      });
      it('* and pseudo', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('*:first-child+html');
        expect(join(tokens)).to.eql(['*', ':first-child', '+', 'html']);
        expect(type(tokens)).to.eql([21, 19, 8, 21]);
      });
      it('pseudo with ()', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body:not(:-moz-handler-blocked)');
        expect(join(tokens)).to.eql(['body', ':not(:-moz-handler-blocked)']);
        expect(type(tokens)).to.eql([21, 19]);
      });
      it('attr 1', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('a[class*="c"]{}');
        expect(join(tokens)).to.eql(['a', '[', 'class', '*=', '"c"', ']', '{', '}']);
        expect(type(tokens)).to.eql([21, 8, 22, 8, 7, 8, 8, 8]);
      });
      it('attr 2', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('html[lang]');
        expect(join(tokens)).to.eql(['html', '[', 'lang', ']']);
        expect(type(tokens)).to.eql([21, 8, 22, 8]);
      });
    });
    describe('style', function() {
      it('background', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{background:url(xxx) no-repeat}');
        expect(join(tokens)).to.eql(['p', '{', 'background', ':', 'url', '(', 'xxx', ')', ' ', 'no-repeat', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 15, 8, 7, 8, 1, 15, 8]);
      });
      it('outof {} is useless', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('color:#333');
        expect(join(tokens)).to.eql(['color', ':', '#333']);
        expect(type(tokens)).to.eql([-2, 8, 21]);
      });
      it('#number', function(){
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{color:#333}');
        expect(join(tokens)).to.eql(['p', '{', 'color', ':', '#333', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 4, 8]);
      });
      it('color', function(){
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{color:red}');
        expect(join(tokens)).to.eql(['p', '{', 'color', ':', 'red', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 4, 8]);
      });
      it('!important', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{margin:0!important}');
        expect(join(tokens)).to.eql(['p', '{', 'margin', ':', '0', '!important', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 4, 18, 8]);
      });
      it('!important out of {} is useless', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('margin:0!important');
        expect(join(tokens)).to.eql(['margin', ':', '0', '!important']);
        expect(type(tokens)).to.eql([-2, 8, 4, -2]);
      });
      it('repeat kw', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{margin margin:0;}');
        expect(join(tokens)).to.eql(['p', '{', 'margin', ' ', 'margin', ':', '0', ';', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 1, 10, 8, 4, 8, 8]);
      });
    });
    describe('hack', function() {
      it('*-_', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{_margin:0;*padding:0;-margin:0}');
        expect(join(tokens)).to.eql(['p', '{', '_', 'margin', ':', '0', ';', '*', 'padding', ':', '0', ';', '-', 'margin', ':', '0', '}']);
        expect(type(tokens)).to.eql([21, 8, 17, 10, 8, 4, 8, 17, 10, 8, 4, 8, 17, 10, 8, 4, 8]);
      });
      it('\\9 \\0 \\9\\0', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{margin:0\\9;margin:0\\0;margin:0\\9\\0}');
        expect(join(tokens)).to.eql(['p', '{', 'margin', ':', '0', '\\9', ';', 'margin', ':', '0', '\\0', ';', 'margin', ':', '0', '\\9\\0', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 4, 17, 8, 10, 8, 4, 17, 8, 10, 8, 4, 17, 8]);
      });
      it('out of {} is usefull', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('-_\\9');
        expect(join(tokens)).to.eql(['-', '_', '\\9']);
        expect(type(tokens)).to.eql([8, 8, 17]);
      });
      it('* out of {} is selector', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('*{}');
        expect(join(tokens)).to.eql(['*', '{', '}']);
        expect(type(tokens)).to.eql([21, 8, 8]);
      });
      it('@media \\0screen{}', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@media \\0screen{}');
        expect(join(tokens)).to.eql(['@media', ' ', '\\0', 'screen', '{', '}']);
        expect(type(tokens)).to.eql([12, 1, 17, 15, 8, 8]);
      });
      it('-moz-', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{-moz-width:1}');
        expect(join(tokens)).to.eql(['p', '{', '-moz-', 'width', ':', '1', '}']);
        expect(type(tokens)).to.eql([21, 8, 17, 10, 8, 4, 8]);
      });
      it('-webkit-', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{-webkit-width:1}');
        expect(join(tokens)).to.eql(['p', '{', '-webkit-', 'width', ':', '1', '}']);
        expect(type(tokens)).to.eql([21, 8, 17, 10, 8, 4, 8]);
      });
      it('-ms-', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{-ms-width:1}');
        expect(join(tokens)).to.eql(['p', '{', '-ms-', 'width', ':', '1', '}']);
        expect(type(tokens)).to.eql([21, 8, 17, 10, 8, 4, 8]);
      });
      it('-o-', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{-o-width:1}');
        expect(join(tokens)).to.eql(['p', '{', '-o-', 'width', ':', '1', '}']);
        expect(type(tokens)).to.eql([21, 8, 17, 10, 8, 4, 8]);
      });
      it('[;;];', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{[;width:0;];}');
        expect(join(tokens)).to.eql(['p', '{', '[', ';', 'width', ':', '0', ';', ']', ';', '}']);
        expect(type(tokens)).to.eql([21, 8, 17, 17, 10, 8, 4, 8, 17, 17, 8]);
      });
    });
    describe('unknow', function() {
      it('with {}', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('`p{}');
        expect(join(tokens)).to.eql(['`p{}']);
        expect(type(tokens)).to.eql([-2]);
      });
      it('with ;', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('`;p{}');
        expect(join(tokens)).to.eql(['`;', 'p', '{', '}']);
        expect(type(tokens)).to.eql([-2, 21, 8, 8]);
      });
      it('none', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('`p');
        expect(join(tokens)).to.eql(['`p']);
        expect(type(tokens)).to.eql([-2]);
      });
      it('in {}', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{|margin:0}');
        expect(join(tokens)).to.eql(['p', '{', '|margin:0', '}']);
        expect(type(tokens)).to.eql([21, 8, -2, 8]);
      });
      it('in {} with out }', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{|margin:0');
        expect(join(tokens)).to.eql(['p', '{', '|margin:0']);
        expect(type(tokens)).to.eql([21, 8, -2]);
      });
      it('in {} with ;', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{|;margin:0}');
        expect(join(tokens)).to.eql(['p', '{', '|;', 'margin', ':', '0', '}']);
        expect(type(tokens)).to.eql([21, 8, -2, 10, 8, 4, 8]);
      });
    });
    describe('nesting {}', function() {
      it('selector', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{p{*margin:0;*{}}}');
        expect(join(tokens)).to.eql(['p', '{', 'p', '{', '*', 'margin', ':', '0', ';', '*', '{', '}', '}', '}']);
        expect(type(tokens)).to.eql([21, 8, 21, 8, 17, 10, 8, 4, 8, 21, 8, 8, 8, 8]);
      });
      it('#fff is not number', function () {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('#fff{#fff{}}');
        expect(join(tokens)).to.eql(['#fff', '{', '#fff', '{', '}', '}']);
        expect(type(tokens)).to.eql([21, 8, 21, 8, 8, 8]);
      });
    });
    describe('var', function() {
      it('normal', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$a:1');
        expect(join(tokens)).to.eql(['$a', ':', '1']);
        expect(type(tokens)).to.eql([16, 8, 4]);
      });
      it('@', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@a:1');
        expect(join(tokens)).to.eql(['@a', ':', '1']);
        expect(type(tokens)).to.eql([16, 8, 4]);
      });
      it('css3', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('var-a:1');
        expect(join(tokens)).to.eql(['var-a', ':', '1']);
        expect(type(tokens)).to.eql([16, 8, 4]);
      });
      it.only('use in css3', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{width:var(a)}');
        expect(join(tokens)).to.eql(['p', '{', 'width', ':', 'var', '(', 'a', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 15, 8, 16, 8, 8]);
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
  describe('cache line', function() {
    it('normal', function() {
      var lexer = homunculus.getLexer('css');
      lexer.cache(1);
      lexer.parse('body{}\np{}');
      expect(lexer.finish()).to.eql(false);
      lexer.parseOn();
      expect(lexer.finish()).to.eql(true);
    });
  });
});