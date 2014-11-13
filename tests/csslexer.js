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
      it('*,', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('*,:after,:*{}');
        expect(join(tokens)).to.eql(['*', ',', ':after', ',', ':', '*', '{', '}']);
        expect(type(tokens)).to.eql([21, 8, 19, 8, 8, 21, 8, 8]);
      });
      it('* depth', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('*{*{}}');
        expect(join(tokens)).to.eql(['*', '{', '*', '{', '}', '}']);
        expect(type(tokens)).to.eql([21, 8, 21, 8, 8, 8]);
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
      it('attr 3', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('[class*=block-grid-]');
        expect(join(tokens)).to.eql(['[', 'class', '*=', 'block-grid-', ']']);
        expect(type(tokens)).to.eql([8, 22, 8, 22, 8]);
      });
      it('> and +', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('a>b+c{}');
        expect(join(tokens)).to.eql(['a', '>', 'b', '+', 'c', '{', '}']);
        expect(type(tokens)).to.eql([21, 8, 21, 8, 21, 8, 8]);
      });
      it('> and + with blank', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('a > b + c{}');
        expect(join(tokens)).to.eql(['a', ' ', '>', ' ', 'b', ' ', '+', ' ', 'c', '{', '}']);
        expect(type(tokens)).to.eql([21, 1, 8, 1, 21, 1, 8, 1, 21, 8, 8]);
      });
    });
    describe('style', function() {
      it('background', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{background:url(xxx) no-repeat}');
        expect(join(tokens)).to.eql(['p', '{', 'background', ':', 'url', '(', 'xxx', ')', ' ', 'no-repeat', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 15, 8, 7, 8, 1, 15, 8]);
      });
      it('outof {}', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('color:#333');
        expect(join(tokens)).to.eql(['color', ':', '#333']);
        expect(type(tokens)).to.eql([10, 8, 23]);
      });
      it('#number', function(){
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{color:#333}');
        expect(join(tokens)).to.eql(['p', '{', 'color', ':', '#333', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 23, 8]);
      });
      it('color', function(){
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{color:red}');
        expect(join(tokens)).to.eql(['p', '{', 'color', ':', 'red', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 23, 8]);
      });
      it('!important', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{margin:0!important}');
        expect(join(tokens)).to.eql(['p', '{', 'margin', ':', '0', '!important', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 4, 18, 8]);
      });
      it('!important out of {}', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('margin:0!important');
        expect(join(tokens)).to.eql(['margin', ':', '0', '!important']);
        expect(type(tokens)).to.eql([10, 8, 4, 18]);
      });
      it('repeat kw', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{margin margin:0;}');
        expect(join(tokens)).to.eql(['p', '{', 'margin', ' ', 'margin', ':', '0', ';', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 1, 10, 8, 4, 8, 8]);
      });
      it('special kw', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@media(min--moz-device-pixel-ratio:no-repeat)');
        expect(join(tokens)).to.eql(['@media', '(', 'min--moz-device-pixel-ratio', ':', 'no-repeat', ')']);
        expect(type(tokens)).to.eql([12, 8, 10, 8, 15, 8]);
      });
      it('alpha width (', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{filter:alpha(opacity=50)}');
        expect(join(tokens)).to.eql(['body', '{', 'filter', ':', 'alpha', '(', 'opacity', '=', '50', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 15, 8, 15, 8, 4, 8, 8]);
      });
      it('alpha single', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{filter:alpha}');
        expect(join(tokens)).to.eql(['body', '{', 'filter', ':', 'alpha', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 15, 8]);
      });
      it('operate', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{margin:0 -.25em}');
        expect(join(tokens)).to.eql(['body', '{', 'margin', ':', '0', ' ', '-.25', 'em', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 4, 1, 4, 20, 8]);
      });
      it('operate with ()', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{margin:0 3-(.25em)}');
        expect(join(tokens)).to.eql(['body', '{', 'margin', ':', '0', ' ', '3', '-', '(', '.25', 'em', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 4, 1, 4, 8, 8, 4, 20, 8, 8]);
      });
      it('unit after ()', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{margin:(1 + 2)px}');
        expect(join(tokens)).to.eql(['body', '{', 'margin', ':', '(', '1', ' ', '+', ' ', '2', ')', 'px', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 8, 4, 1, 8, 1, 4, 8, 20, 8]);
      });
      it('% unit after number', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{margin:1%}');
        expect(join(tokens)).to.eql(['body', '{', 'margin', ':', '1', '%', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 4, 20, 8]);
      });
      it('no blank between unit and ()', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('.a{margin:+2px -1px}');
        expect(join(tokens)).to.eql(['.a', '{', 'margin', ':', '+2', 'px', ' ', '-1', 'px', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 4, 20, 1, 4, 20, 8]);
      });
      it('+number, -number', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{margin:(1 + 2) px}');
        expect(join(tokens)).to.eql(['body', '{', 'margin', ':', '(', '1', ' ', '+', ' ', '2', ')', ' ', 'px', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 8, 4, 1, 8, 1, 4, 8, 1, 5, 8]);
      });
      it('value can contain +', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{unicode-range:U+1000-1212}');
        expect(join(tokens)).to.eql(['body', '{', 'unicode-range', ':', 'U+1000-1212', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 5, 8]);
      });
      it('~', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{margin:~"1,2"}');
        expect(join(tokens)).to.eql(['p', '{', 'margin', ':', '~', '"1,2"', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 8, 7, 8]);
      });
    });
    describe('hack', function() {
      it('*-_', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{_margin:0;*padding:0;-margin:0}');
        expect(join(tokens)).to.eql(['p', '{', '_', 'margin', ':', '0', ';', '*', 'padding', ':', '0', ';', '-', 'margin', ':', '0', '}']);
        expect(type(tokens)).to.eql([21, 8, 17, 10, 8, 4, 8, 17, 10, 8, 4, 8, 17, 10, 8, 4, 8]);
      });
      it('_ out of {}', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('_:-ms-fullscreen{}');
        expect(join(tokens)).to.eql(['_', ':-ms-fullscreen', '{', '}']);
        expect(type(tokens)).to.eql([17, 19, 8, 8]);
      });
      it('\\9 \\0 \\9\\0', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{margin:0\\9;margin:0\\0;margin:0\\9\\0}');
        expect(join(tokens)).to.eql(['p', '{', 'margin', ':', '0', '\\9', ';', 'margin', ':', '0', '\\0', ';', 'margin', ':', '0', '\\9\\0', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 4, 17, 8, 10, 8, 4, 17, 8, 10, 8, 4, 17, 8]);
      });
      it('out of {}', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('-_\\9');
        expect(join(tokens)).to.eql(['-', '_', '\\9']);
        expect(type(tokens)).to.eql([17, 17, 17]);
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
        expect(type(tokens)).to.eql([21, 8, 17, 17, 10, 8, 4, 17, 17, 8, 8]);
      });
      it('\\,', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@media \\0screen\\,');
        expect(join(tokens)).to.eql(['@media', ' ', '\\0', 'screen', '\\,']);
        expect(type(tokens)).to.eql([12, 1, 17, 15, 17]);
      });
      it('\\,', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@media \\0screen\\,');
        expect(join(tokens)).to.eql(['@media', ' ', '\\0', 'screen', '\\,']);
        expect(type(tokens)).to.eql([12, 1, 17, 15, 17]);
      });
      it('filter', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('.a{filter: progid:DXImageTransform.Microsoft.gradient(enabled = false);}');
        expect(join(tokens)).to.eql(['.a', '{', 'filter', ':', ' ', 'progid', ':', 'DXImageTransform.Microsoft.gradient',
          '(', 'enabled', ' ', '=', ' ', 'false', ')', ';', '}' ]);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 1, 5, 8, 5, 8, 15, 1, 8, 1, 15, 8, 8, 8]);
      });
      it('!ie like', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('a{margin:0!ie;padding:0!other}');
        expect(join(tokens)).to.eql(['a', '{', 'margin', ':', '0', '!ie', ';', 'padding', ':', '0', '!other', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 4, 17, 8, 10, 8, 4, 17, 8]);
      });
      it('|', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{|margin:0}');
        expect(join(tokens)).to.eql(['p', '{', '|', 'margin', ':', '0', '}']);
        expect(type(tokens)).to.eql([21, 8, 17, 10, 8, 4, 8]);
      });
      it('`', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{`margin:0}');
        expect(join(tokens)).to.eql(['p', '{', '`', 'margin', ':', '0', '}']);
        expect(type(tokens)).to.eql([21, 8, 17, 10, 8, 4, 8]);
      });
      it('~', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{~margin:0}');
        expect(join(tokens)).to.eql(['p', '{', '~', 'margin', ':', '0', '}']);
        expect(type(tokens)).to.eql([21, 8, 17, 10, 8, 4, 8]);
      });
      it('?', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{?margin:0}');
        expect(join(tokens)).to.eql(['p', '{', '?', 'margin', ':', '0', '}']);
        expect(type(tokens)).to.eql([21, 8, 17, 10, 8, 4, 8]);
      });
      it('/', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{/margin:0}');
        expect(join(tokens)).to.eql(['p', '{', '/', 'margin', ':', '0', '}']);
        expect(type(tokens)).to.eql([21, 8, 17, 10, 8, 4, 8]);
      });
      it('%', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{%margin:0}');
        expect(join(tokens)).to.eql(['p', '{', '%', 'margin', ':', '0', '}']);
        expect(type(tokens)).to.eql([21, 8, 17, 10, 8, 4, 8]);
      });
    });
    describe('unknow', function() {
      it('with ;', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('`;p{}');
        expect(join(tokens)).to.eql(['`', ';', 'p', '{', '}']);
        expect(type(tokens)).to.eql([17, 8, 21, 8, 8]);
      });
      it('none', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('`p');
        expect(join(tokens)).to.eql(['`', 'p']);
        expect(type(tokens)).to.eql([17, 21]);
      });
      it('；', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{；margin:0');
        expect(join(tokens)).to.eql(['p', '{', '；margin:0']);
        expect(type(tokens)).to.eql([21, 8, -2]);
      });
      it('； in {}', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{；margin:0}');
        expect(join(tokens)).to.eql(['p', '{', '；margin:0', '}']);
        expect(type(tokens)).to.eql([21, 8, -2, 8]);
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
      it('new kw', function() {
        var lexer = homunculus.getLexer('css');
        lexer.rule.addKeyWord('dd');
        var tokens = lexer.parse('p{dd:#fff}');
        expect(join(tokens)).to.eql(['p', '{', 'dd', ':', '#fff', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 23, 8]);
      });
      it('new kw by static', function() {
        homunculus.getClass('rule', 'css').addKeyWord('hhh');
        homunculus.getClass('rule', 'css').addKeyWord(['jjj']);
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{hhh:#fff;jjj:#000}');
        expect(join(tokens)).to.eql(['p', '{', 'hhh', ':', '#fff', ';', 'jjj', ':', '#000', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 23, 8, 10, 8, 23, 8]);
      });
      it('new value', function() {
        var lexer = homunculus.getLexer('css');
        lexer.rule.addValue('qq');
        var tokens = lexer.parse('p{margin:qq}');
        expect(join(tokens)).to.eql(['p', '{', 'margin', ':', 'qq', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 15, 8]);
      });
      it('new value by static', function() {
        homunculus.getClass('rule', 'css').addValue('ww');
        homunculus.getClass('rule', 'css').addValue(['ee']);
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{margin:ww;padding:ee}');
        expect(join(tokens)).to.eql(['p', '{', 'margin', ':', 'ww', ';', 'padding', ':', 'ee', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 15, 8, 10, 8, 15, 8]);
      });
      it('new color', function() {
        var lexer = homunculus.getLexer('css');
        lexer.rule.addColor('uu');
        var tokens = lexer.parse('p{color:uu}');
        expect(join(tokens)).to.eql(['p', '{', 'color', ':', 'uu', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 23, 8]);
      });
      it('new color by static', function() {
        homunculus.getClass('rule', 'css').addColor('nn');
        homunculus.getClass('rule', 'css').addColor(['mm']);
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{color:nn;color:mm}');
        expect(join(tokens)).to.eql(['p', '{', 'color', ':', 'nn', ';', 'color', ':', 'mm', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 23, 8, 10, 8, 23, 8]);
      });
      it('&', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{&:hover{}}');
        expect(join(tokens)).to.eql(['body', '{', '&', ':hover', '{', '}', '}']);
        expect(type(tokens)).to.eql([21, 8, 21, 19, 8, 8, 8]);
      });
    });
    describe('var', function() {
      it('normal', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$a:1');
        expect(join(tokens)).to.eql(['$a', ':', '1']);
        expect(type(tokens)).to.eql([16, 8, 4]);
      });
      it('unknow @', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('@a:1');
        expect(join(tokens)).to.eql(['@a', ':', '1']);
        expect(type(tokens)).to.eql([16, 8, 4]);
      });
      it('$', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$a:1');
        expect(join(tokens)).to.eql(['$a', ':', '1']);
        expect(type(tokens)).to.eql([16, 8, 4]);
      });
      it('css3', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('var-a:1');
        expect(join(tokens)).to.eql(['var-a', ':', '1']);
        expect(type(tokens)).to.eql([16, 8, 4]);
      });
      it('css3 --', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('--a:1');
        expect(join(tokens)).to.eql(['--a', ':', '1']);
        expect(type(tokens)).to.eql([16, 8, 4]);
      });
      it('use in css3', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('p{width:var(a)}');
        expect(join(tokens)).to.eql(['p', '{', 'width', ':', 'var', '(', 'a', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 15, 8, 16, 8, 8]);
      });
      it('can contain a styleset', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$c: background:url(xxx);');
        expect(join(tokens)).to.eql(['$c', ':', ' ', 'background', ':', 'url', '(', 'xxx', ')', ';']);
        expect(type(tokens)).to.eql([16, 8, 1, 10, 8, 15, 8, 7, 8, 8]);
      });
      it('fn decl', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('fn($a, $b){}');
        expect(join(tokens)).to.eql(['fn', '(', '$a', ',', ' ', '$b', ')', '{', '}']);
        expect(type(tokens)).to.eql([16, 8, 16, 8, 1, 16, 8, 8, 8]);
      });
      it('fn call', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('fn(background:url(xxx), #fff)');
        expect(join(tokens)).to.eql(['fn', '(', 'background', ':', 'url', '(', 'xxx', ')', ',', ' ', '#fff', ')']);
        expect(type(tokens)).to.eql([16, 8, 10, 8, 15, 8, 7, 8, 8, 1, 23, 8]);
      });
      it('fn call a value', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{fn(#FFF)}');
        expect(join(tokens)).to.eql(['body', '{', 'fn', '(', '#FFF', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 16, 8, 23, 8, 8]);
      });
      it('fn call multi value', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{fn(#FFF,3,id)}');
        expect(join(tokens)).to.eql(['body', '{', 'fn', '(', '#FFF', ',', '3', ',', 'id', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 16, 8, 23, 8, 4, 8, 5, 8, 8]);
      });
      it('fn call a kw value', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{fn(background)}');
        expect(join(tokens)).to.eql(['body', '{', 'fn', '(', 'background', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 16, 8, 15, 8, 8]);
      });
      it('fn call complex', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{fn(background:#FFF,margin,3px,padding:0)}');
        expect(join(tokens)).to.eql(['body', '{', 'fn', '(', 'background', ':', '#FFF', ',', 'margin', ',', '3', 'px', ',', 'padding', ':', '0', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 16, 8, 10, 8, 23, 8, 15, 8, 4, 20, 8, 10, 8, 4, 8, 8]);
      });
      it('fn call url()', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{fn(background:url(xxx),margin)}');
        expect(join(tokens)).to.eql(['body', '{', 'fn', '(', 'background', ':', 'url', '(', 'xxx', ')', ',', 'margin', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 16, 8, 10, 8, 15, 8, 7, 8, 8, 15, 8, 8]);
      });
      it('fn call in value', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('a{margin:$fn(1)}');
        expect(join(tokens)).to.eql(['a', '{', 'margin', ':', '$fn', '(', '1', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 16, 8, 4, 8, 8]);
      });
      it('fn call in value multi value', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('a{margin:$fn(1,#FFF)}');
        expect(join(tokens)).to.eql(['a', '{', 'margin', ':', '$fn', '(', '1', ',', '#FFF', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 16, 8, 4, 8, 23, 8, 8]);
      });
      it('fn call in value a kw value', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('a{margin:$fn(background)}');
        expect(join(tokens)).to.eql(['a', '{', 'margin', ':', '$fn', '(', 'background', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 16, 8, 15, 8, 8]);
      });
      it('fn call in value complex', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{margin:$fn(background:#FFF,margin,3px,padding:0)}');
        expect(join(tokens)).to.eql(['body', '{', 'margin', ':', '$fn', '(', 'background', ':', '#FFF', ',', 'margin', ',', '3', 'px', ',', 'padding', ':', '0', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 16, 8, 10, 8, 23, 8, 15, 8, 4, 20, 8, 10, 8, 4, 8, 8]);
      });
      it('fn call add', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{fn(1 + 2)}');
        expect(join(tokens)).to.eql(['body', '{', 'fn', '(', '1', ' ', '+', ' ', '2', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 16, 8, 4, 1, 8, 1, 4, 8, 8]);
      });
      it('fn call add in value', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{margin:$fn(1 + 2)}');
        expect(join(tokens)).to.eql(['body', '{', 'margin', ':', '$fn', '(', '1', ' ', '+', ' ', '2', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 16, 8, 4, 1, 8, 1, 4, 8, 8]);
      });
      it('fn call mtpl', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{fn(1 * 2)}');
        expect(join(tokens)).to.eql(['body', '{', 'fn', '(', '1', ' ', '*', ' ', '2', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 16, 8, 4, 1, 8, 1, 4, 8, 8]);
      });
      it('fn call mtpl in value', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{margin:$fn(1 * 2)}');
        expect(join(tokens)).to.eql(['body', '{', 'margin', ':', '$fn', '(', '1', ' ', '*', ' ', '2', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 16, 8, 4, 1, 8, 1, 4, 8, 8]);
      });
      it('fn call string add', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{fn("1" + 2)}');
        expect(join(tokens)).to.eql(['body', '{', 'fn', '(', '"1"', ' ', '+', ' ', '2', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 16, 8, 7, 1, 8, 1, 4, 8, 8]);
      });
      it('fn call string add in value', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{margin:$fn("1" + 2)}');
        expect(join(tokens)).to.eql(['body', '{', 'margin', ':', '$fn', '(', '"1"', ' ', '+', ' ', '2', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 16, 8, 7, 1, 8, 1, 4, 8, 8]);
      });
      it('fn call hack', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{fn(*margin)}');
        expect(join(tokens)).to.eql(['body', '{', 'fn', '(', '*', 'margin', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 16, 8, 17, 10, 8, 8]);
      });
      it('fn call hack value', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{fn(*margin:a)}');
        expect(join(tokens)).to.eql(['body', '{', 'fn', '(', '*', 'margin', ':', 'a', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 16, 8, 17, 10, 8, 5, 8, 8]);
      });
      it('fn call hack in value', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{margin:$fn(*margin)}');
        expect(join(tokens)).to.eql(['body', '{', 'margin', ':', '$fn', '(', '*', 'margin', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 16, 8, 17, 10, 8, 8]);
      });
      it('fn call hack value in value', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{margin:$fn(*margin:a)}');
        expect(join(tokens)).to.eql(['body', '{', 'margin', ':', '$fn', '(', '*', 'margin', ':', 'a', ')', '}']);
        expect(type(tokens)).to.eql([21, 8, 10, 8, 16, 8, 17, 10, 8, 5, 8, 8]);
      });
      it('@extend', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{@extend a;}');
        expect(join(tokens)).to.eql(['body', '{', '@extend', ' ', 'a', ';', '}']);
        expect(type(tokens)).to.eql([21, 8, 12, 1, 21, 8, 8]);
      });
      it('@extend 2', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{@extend .s;}');
        expect(join(tokens)).to.eql(['body', '{', '@extend', ' ', '.s', ';', '}']);
        expect(type(tokens)).to.eql([21, 8, 12, 1, 21, 8, 8]);
      });
      it('@extend 3', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('body{@extend custom;}');
        expect(join(tokens)).to.eql(['body', '{', '@extend', ' ', 'custom', ';', '}']);
        expect(type(tokens)).to.eql([21, 8, 12, 1, 21, 8, 8]);
      });
      it('$chinese', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$中文=1;');
        expect(join(tokens)).to.eql(['$中文', '=', '1', ';']);
        expect(type(tokens)).to.eql([16, 8, 4, 8]);
      });
      it('chinese()', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$中文(){}');
        expect(join(tokens)).to.eql(['$中文', '(', ')', '{', '}']);
        expect(type(tokens)).to.eql([16, 8, 8, 8, 8]);
      });
      it('vardecl is a kw value', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$a:background;');
        expect(join(tokens)).to.eql(['$a', ':', 'background', ';']);
        expect(type(tokens)).to.eql([16, 8, 15, 8]);
      });
      it('vardecl is a style', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$a:background:#FFF;');
        expect(join(tokens)).to.eql(['$a', ':', 'background', ':', '#FFF', ';']);
        expect(type(tokens)).to.eql([16, 8, 10, 8, 23, 8]);
      });
      it('vardecl no ;', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$a:background');
        expect(join(tokens)).to.eql(['$a', ':', 'background']);
        expect(type(tokens)).to.eql([16, 8, 5]);
      });
      it('vardecl hack', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$a:*background;');
        expect(join(tokens)).to.eql(['$a', ':', '*', 'background', ';']);
        expect(type(tokens)).to.eql([16, 8, 17, 10, 8]);
      });
      it('vardecl hack value', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$a:*margin:a;');
        expect(join(tokens)).to.eql(['$a', ':', '*', 'margin', ':', 'a', ';']);
        expect(type(tokens)).to.eql([16, 8, 17, 10, 8, 5, 8]);
      });
      it('vardecl add', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$a:1+ 2;');
        expect(join(tokens)).to.eql(['$a', ':', '1', '+', ' ', '2', ';']);
        expect(type(tokens)).to.eql([16, 8, 4, 8, 1, 4, 8]);
      });
      it('vardecl mtpl', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$a:1*2;');
        expect(join(tokens)).to.eql(['$a', ':', '1', '*', '2', ';']);
        expect(type(tokens)).to.eql([16, 8, 4, 8, 4, 8]);
      });
      it('vardecl string add', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$a:"1"+ 2;');
        expect(join(tokens)).to.eql(['$a', ':', '"1"', '+', ' ', '2', ';']);
        expect(type(tokens)).to.eql([16, 8, 7, 8, 1, 4, 8]);
      });
      it('vardecl string mtpl', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$a:"1"*2;');
        expect(join(tokens)).to.eql(['$a', ':', '"1"', '*', '2', ';']);
        expect(type(tokens)).to.eql([16, 8, 7, 8, 4, 8]);
      });
      it('vardecl url()', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$a:url(xxx);');
        expect(join(tokens)).to.eql(['$a', ':', 'url', '(', 'xxx', ')', ';']);
        expect(type(tokens)).to.eql([16, 8, 15, 8, 7, 8, 8]);
      });
      it('vardecl fn()', function() {
        var lexer = homunculus.getLexer('css');
        var tokens = lexer.parse('$a:unknow();');
        expect(join(tokens)).to.eql(['$a', ':', 'unknow', '(', ')', ';']);
        expect(type(tokens)).to.eql([16, 8, 5, 8, 8, 8]);
      });
    });
  });
  describe('operate', function() {
    it('add in url()', function() {
      var lexer = homunculus.getLexer('css');
      var tokens = lexer.parse('.a{background:url("a"+"b")}');
      expect(join(tokens)).to.eql(['.a', '{', 'background', ':', 'url', '(', '"a"', '+', '"b"', ')', '}']);
      expect(type(tokens)).to.eql([21, 8, 10, 8, 15, 8, 7, 8, 7, 8, 8]);
    });
    it('add in url() and first is $', function() {
      var lexer = homunculus.getLexer('css');
      var tokens = lexer.parse('.a{background:url($a+"b")}');
      expect(join(tokens)).to.eql(['.a', '{', 'background', ':', 'url', '(', '$a', '+', '"b"', ')', '}']);
      expect(type(tokens)).to.eql([21, 8, 10, 8, 15, 8, 16, 8, 7, 8, 8]);
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
    it('#prev,#next', function() {
      var lexer = homunculus.getLexer('css');
      var tokens = lexer.parse('p{}');
      expect(tokens[0].prev()).to.eql(null);
      expect(tokens[1].prev()).to.eql(tokens[0]);
      expect(tokens[0].next()).to.eql(tokens[1]);
      expect(tokens[2].next()).to.eql(null);
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