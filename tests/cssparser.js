var homunculus = require('../');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Token = homunculus.getClass('token');
var Parser = homunculus.getClass('parser', 'css');
var CssNode = homunculus.getClass('node', 'css');

var res;
var index;

function jion(node, ignore) {
  res = '';
  index = 0;
  while(ignore[index]) {
    res += ignore[index++].content();
  }
  recursion(node, ignore);
  return res;
}
function recursion(node, ignore) {
  var isToken = node.name() == CssNode.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      res += token.content();
      while(ignore[++index]) {
        res += ignore[index].content();
      }
    }
  }
  else {
    node.leaves().forEach(function(leaf, i) {
      recursion(leaf, ignore);
    });
  }
}

function tree(node, arr) {
  arr = arr || [];
  var isToken = node.name() == CssNode.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      arr.push(token.content());
    }
  }
  else {
    arr.push(node.name());
    var childs = [];
    arr.push(childs);
    node.leaves().forEach(function(leaf, i) {
      tree(leaf, childs);
    });
  }
  return arr;
}

describe('cssparser', function() {
  describe('keyword test', function() {
    var rule = require('../src/lexer/rule/CssRule')
    var KEYWORDS = rule.KEYWORDS;
    var VALUES = rule.VALUES;
    var COLORS = rule.COLORS;
    var parser = homunculus.getParser('css');
    it('kw', function() {
      KEYWORDS.forEach(function(k) {
        expect(parser.lexer.rule.keyWords().hasOwnProperty(k)).to.be.ok();
      });
    });
    it('value', function() {
      VALUES.forEach(function(k) {
        expect(parser.lexer.rule.values().hasOwnProperty(k)).to.be.ok();
      });
    });
    it('color', function() {
      COLORS.forEach(function(k) {
        expect(parser.lexer.rule.colors().hasOwnProperty(k)).to.be.ok();
      });
    });
  });
  describe('simple test', function() {
    it('@import string', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@import "a";');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IMPORT,["@import",CssNode.URL,["\"a\""],";"]]]);
    });
    it('@import ignore case', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@IMPORT "a";');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IMPORT,["@IMPORT",CssNode.URL,["\"a\""],";"]]]);
    });
    it('@import url(string)', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@import url("a");');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IMPORT,["@import",CssNode.URL,["url","(","\"a\"",")"],";"]]]);
    });
    it('@import url(string) no quote', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@import url(a);');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IMPORT,["@import",CssNode.URL,["url","(","a",")"],";"]]]);
    });
    it('@import with media', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@import "a" all;');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IMPORT,["@import",CssNode.URL,["\"a\""],CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["all"]]],";"]]]);
    });
    it('@import error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@import');
      }).to.throwError();
    });
    it('@import string no ; error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@import url(a)');
      }).to.throwError();
    });
    it('@import string with \' error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@import \'a\';');
      }).to.throwError();
    });
    it('@media query type', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media all');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["all"]]]]]]);
    });
    it('@media query expr', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media (width:100)');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,[CssNode.EXPR,["(",CssNode.KEY,["width"],":",CssNode.VALUE,["100"],")"]]]]]]);
    });
    it('@media query{}', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media all{}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["all"]]],CssNode.BLOCK,["{","}"]]]]);
    });
    it('@media query and', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media not all and(width:800px)');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,["not",CssNode.MEDIATYPE,["all"],"and",CssNode.EXPR,["(",CssNode.KEY,["width"],":",CssNode.VALUE,["800","px"],")"]]]]]]);
    });
    it('@media multi query', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media only screen and (-webkit-min-device-pixel-ratio: 2), screen and (min--moz-device-pixel-ratio: 2){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,["only",CssNode.MEDIATYPE,["screen"],"and",CssNode.EXPR,["(",CssNode.KEY,["-webkit-","min-device-pixel-ratio"],":",CssNode.VALUE,["2"],")"]],",",CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["screen"],"and",CssNode.EXPR,["(",CssNode.KEY,["min--moz-device-pixel-ratio"],":",CssNode.VALUE,["2"],")"]]],CssNode.BLOCK,["{","}"]]]]);
    });
    it('@media ignore unknow', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media screen,3D{}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["screen"]],",",CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["3","D"]]],CssNode.BLOCK,["{","}"]]]]);
    });
    it('@media multi and', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media only screen and (min-width:120.063em) and (max-width:99999999em){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,["only",CssNode.MEDIATYPE,["screen"],"and",CssNode.EXPR,["(",CssNode.KEY,["min-width"],":",CssNode.VALUE,["120.063","em"],")"],"and",CssNode.EXPR,["(",CssNode.KEY,["max-width"],":",CssNode.VALUE,["99999999","em"],")"]]],CssNode.BLOCK,["{","}"]]]]);
    });
    it('@media hack 1', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media screen\\9');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["screen","\\9"]]]]]]);
    });
    it('@media hack 2', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media \\0screen\\,screen\\9');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["\\0","screen","\\,","screen","\\9"]]]]]]);
    });
    it('@media error 1', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@media');
      }).to.throwError();
    });
    it('@media error 2', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@media(');
      }).to.throwError();
    });
    it('@media error 3', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@media (notkeyword:1)');
      }).to.throwError();
    });
    it('@charset string', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@charset "arail";');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.CHARSET,["@charset","\"arail\"",";"]]]);
    });
    it('@charset vars', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@charset $a;');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.CHARSET,["@charset","$a",";"]]]);
    });
    it('@charset error 1', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@charset');
      }).to.throwError();
    });
    it('@charset error 2', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@charset "arial"');
      }).to.throwError();
    });
    it('@font-face normal', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@font-face{font-family:YH;src:url(http://domain/fonts/MSYH.TTF)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FONTFACE,["@font-face",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["font-family"],":",CssNode.VALUE,["YH"],";"],CssNode.STYLE,[CssNode.KEY,["src"],":",CssNode.VALUE,[CssNode.URL,["url","(","http://domain/fonts/MSYH.TTF",")"]]],"}"]]]]);
    });
    it('@font-face with format', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@font-face{font-family:YH;src:url(xx),format("embedded-opentype")}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FONTFACE,["@font-face",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["font-family"],":",CssNode.VALUE,["YH"],";"],CssNode.STYLE,[CssNode.KEY,["src"],":",CssNode.VALUE,[CssNode.URL,["url","(","xx",")"],",",CssNode.FORMAT,["format","(","\"embedded-opentype\"",")"]]],"}"]]]]);
    });
    it('@font-face mulit', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@font-face{font-family:YH;src:url(a),url(b)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FONTFACE,["@font-face",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["font-family"],":",CssNode.VALUE,["YH"],";"],CssNode.STYLE,[CssNode.KEY,["src"],":",CssNode.VALUE,[CssNode.URL,["url","(","a",")"],",",CssNode.URL,["url","(","b",")"]]],"}"]]]]);
    });
    it('@font-face error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@font-face');
      }).to.throwError();
    });
    it('@page normal', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@page thin:first{size:3in 8in}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.PAGE,["@page","thin",":first",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["size"],":",CssNode.VALUE,["3","in","8","in"]],"}"]]]]);
    });
    it('@page without id', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@page :first{size:3in 8in}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.PAGE,["@page",":first",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["size"],":",CssNode.VALUE,["3","in","8","in"]],"}"]]]]);
    });
    it('@page empty', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@page {}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.PAGE,["@page",CssNode.BLOCK,["{","}"]]]]);
    });
    it('@page error 1', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@page thin:first');
      }).to.throwError();
    });
    it('@keyframes normal', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@keyframes testanimations{}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.KEYFRAMES,["@keyframes","testanimations",CssNode.BLOCK,["{","}"]]]]);
    });
    it('@keyframes from to', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@keyframes testanimations{from{transform:translate(0,0)}to{transform:translate(100,20)}}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.KEYFRAMES,["@keyframes","testanimations",CssNode.BLOCK,["{",CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["from"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["transform"],":",CssNode.VALUE,["translate","(","0",",","0",")"]],"}"]],CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["to"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["transform"],":",CssNode.VALUE,["translate","(","100",",","20",")"]],"}"]],"}"]]]]);
    });
    it('@keyframes percent', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@keyframes testanimations{10%{width:0}}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.KEYFRAMES,["@keyframes","testanimations",CssNode.BLOCK,["{",CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["10","%"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["width"],":",CssNode.VALUE,["0"]],"}"]],"}"]]]]);
    });
    it('@keyframes error 1', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@keyframes {}');
      }).to.throwError();
    });
    it('@keyframes error 2', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@keyframes a');
      }).to.throwError();
    });
    it('@namespace normal', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@namespace a "url";');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.NAMESPACE,["@namespace","a","\"url\"",";"]]]);
    });
    it('@namespace without id', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@namespace "url";');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.NAMESPACE,["@namespace","\"url\"",";"]]]);
    });
    it('@namespace error 1', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@namespace');
      }).to.throwError();
    });
    it('@namespace error 2', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@keyframes {}');
      }).to.throwError();
    });
    it('@document normal', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@-moz-document url-prefix(){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.DOC,["@-moz-document","url-prefix","(",")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('@document error 1', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@-moz-document');
      }).to.throwError();
    });
    it('@document error 2', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@-moz-document {}');
      }).to.throwError();
    });
    it('@document error 3', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@-moz-document a{}');
      }).to.throwError();
    });
    it('@document error 4', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@-moz-document a({}');
      }).to.throwError();
    });
    it('@viewport', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@viewport{width:0}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VIEWPORT,["@viewport",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["width"],":",CssNode.VALUE,["0"]],"}"]]]]);
    });
    it('@counter-style', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@counter-style a{width:0}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.CTSTYLE,["@counter-style","a",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["width"],":",CssNode.VALUE,["0"]],"}"]]]]);
    });
    it('@supports', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@supports not(transform-origin:2px){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.SUPPORTS,["@supports",CssNode.CNDT,["not",CssNode.CNDT,["(",CssNode.CNDT,[CssNode.STYLE,[CssNode.KEY,["transform-origin"],":",CssNode.VALUE,["2","px"]]],")"]],CssNode.SHEET,["}"]]]]);
    });
    it('@supports error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@supports not(');
      }).to.throwError();
    });
    it('$ is variable', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{width:$a}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["width"],":",CssNode.VALUE,["$a"]],"}"]]]]);
    });
    it('unknow @ is variable', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{width:@a}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["width"],":",CssNode.VALUE,["@a"]],"}"]]]]);
    });
    it('normal style', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{width:0}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["width"],":",CssNode.VALUE,["0"]],"}"]]]]);
    });
    it('css3 variable', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse(':root{var-companyblue:#369;var-lighterblue:powderblue;}');
      expect(tree(node)).to.eql([CssNode.SHEET,[":root","{",CssNode.VARDECL,["var-companyblue",":",CssNode.VALUE,["#369"],";"],CssNode.VARDECL,["var-lighterblue",":",CssNode.VALUE,["powderblue"],";"],"}"]]);
    });
    it('css3 cal()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('h3{color:var(lighterblue);}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["h3"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,["var","(","lighterblue",")"],";"],"}"]]]]);
    });
    it('vardecl', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a:1;@b=2;');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARDECL,["$a",":",CssNode.VALUE,["1"],";"],CssNode.VARDECL,["@b","=",CssNode.VALUE,["2"],";"]]]);
    });
    it('vardecl error 1', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('$a');
      }).to.throwError();
    });
    it('vardecl error 2', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('$a:');
      }).to.throwError();
    });
    it('nesting {}', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('h3{color:#000;h1{margin:0}}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["h3"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,["#000"],";"],CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["h1"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,["0"]],"}"]],"}"]]]]);
    });
    it('multi selectors', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a,p{}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["a"],",",CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{","}"]]]]);
    });
    it('multi values', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a{margin:0px 2px 3% auto}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,["0","px","2","px","3","%","auto"]],"}"]]]]);
    });
    it('[pseudo]', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('[hidden]{}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["[","hidden","]"]],CssNode.BLOCK,["{","}"]]]]);
    });
    it('[pseudo] in block', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a{[hidden]{}}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["a"]],CssNode.BLOCK,["{",CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["[","hidden","]"]],CssNode.BLOCK,["{","}"]],"}"]]]]);
    });
    it('selector[pseudo]', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a[hidden]{}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["a","[","hidden","]"]],CssNode.BLOCK,["{","}"]]]]);
    });
    it('hack', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{[;width:0;];}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["[",";","width"],":",CssNode.VALUE,["0"],";","]",";"],"}"]]]]);
    });
    it('rgb', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{color:rgb(0, 0, 255)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,[CssNode.RGB,["rgb","(","0",",","0",",","255",")"]]],"}"]]]]);
    });
    it('rgba', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{color:rgba(0, 0, 255, 0.5)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,[CssNode.RGBA,["rgba","(","0",",","0",",","255",",","0.5",")"]]],"}"]]]]);
    });
    it('hsl', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{color:hsl(0, 5%, 100%)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,[CssNode.HSL,["hsl","(","0",",","5","%",",","100","%",")"]]],"}"]]]]);
    });
    it('hsl zero', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{color:hsl(0, 0, 100%)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,[CssNode.HSL,["hsl","(","0",",","0",",","100","%",")"]]],"}"]]]]);
    });
    it('hsl units error 1', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('p{color:hsl(0, 3, 100%)}')
      }).to.throwError();
    });
    it('hsl units error 2', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('p{color:hsl(0, 3%, 100deg)}')
      }).to.throwError();
    });
    it('hsla', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{color:hsla(0, 5%, 100%, 0.2)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,[CssNode.HSLA,["hsla","(","0",",","5","%",",","100","%",",","0.2",")"]]],"}"]]]]);
    });
    it('max', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{color:max(1+2, 100)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,[CssNode.MAX,["max","(",CssNode.PARAM,[CssNode.ADDEXPR,["1","+","2"]],",",CssNode.PARAM,["100"],")"]]],"}"]]]]);
    });
    it('min', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{color:min(1+2, 100)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,[CssNode.MIN,["min","(",CssNode.PARAM,[CssNode.ADDEXPR,["1","+","2"]],",",CssNode.PARAM,["100"],")"]]],"}"]]]]);
    });
    it('linear-gradient 1', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{background:linear-gradient(#fff,#333)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["background"],":",CssNode.VALUE,[CssNode.LINEARGRADIENT,["linear-gradient","(",CssNode.COLORSTOP,["#fff"],",",CssNode.COLORSTOP,["#333"],")"]]],"}"]]]]);
    });
    it('linear-gradient 2', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{background:linear-gradient(to right,#fff 10%,#333,red)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["background"],":",CssNode.VALUE,[CssNode.LINEARGRADIENT,["linear-gradient","(",CssNode.POINT,["to","right"],",",CssNode.COLORSTOP,["#fff","10","%"],",",CssNode.COLORSTOP,["#333"],",",CssNode.COLORSTOP,["red"],")"]]],"}"]]]]);
    });
    it('linear-gradient 3', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{background:linear-gradient(45deg,#fff 10%,transparent)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["background"],":",CssNode.VALUE,[CssNode.LINEARGRADIENT,["linear-gradient","(",CssNode.POINT,["45","deg"],",",CssNode.COLORSTOP,["#fff","10","%"],",",CssNode.COLORSTOP,["transparent"],")"]]],"}"]]]]);
    });
    it('radial-gradient 1', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{color:radial-gradient(circle,#f00,#ff0,#080)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,[CssNode.RADIOGRADIENT,["radial-gradient","(","circle",",",CssNode.COLORSTOP,["#f00"],",",CssNode.COLORSTOP,["#ff0"],",",CssNode.COLORSTOP,["#080"],")"]]],"}"]]]]);
    });
    it('radial-gradient 2', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{color:radial-gradient(50%, 10% 20%,#f00,#ff0,#080)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,[CssNode.RADIOGRADIENT,["radial-gradient","(",CssNode.POS,[CssNode.LEN,["50","%"]],",",CssNode.LEN,["10","%"],CssNode.LEN,["20","%"],",",CssNode.COLORSTOP,["#f00"],",",CssNode.COLORSTOP,["#ff0"],",",CssNode.COLORSTOP,["#080"],")"]]],"}"]]]]);
    });
    it('new kw', function() {
      var parser = homunculus.getParser('css');
      parser.lexer.rule.addKeyWord('xx');
      var node = parser.parse('p{xx:#fff}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["xx"],":",CssNode.VALUE,['#fff']],"}"]]]]);
    });
    it('var can contain a styleset', function() {
      var parser = homunculus.getParser('css');
      parser.lexer.rule.addKeyWord('xx');
      var node = parser.parse('@a = color:#fff;');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARDECL,["@a","=",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,["#fff"]],";"]]]);
    });
    it('fn decl', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('fn($a, $b){margin:$a;$b;$c()}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FN,["fn",CssNode.PARAMS,["(","$a",",","$b",")"],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,["$a"],";"],"$b",";",CssNode.FNC,["$c",CssNode.CPARAMS,["(",")"]],"}"]]]]);
    });
    it('fn call', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{fn(background:url(xxx), #fff)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.FNC,["fn",CssNode.CPARAMS,["(",CssNode.VALUE,["background",":",CssNode.URL,["url","(","xxx",")"]],",",CssNode.VALUE,["#fff"],")"]],"}"]]]]);
    });
    it('@extend', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{@extend a}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.EXTEND,["@extend",CssNode.SELECTORS,[CssNode.SELECTOR,["a"]]],"}"]]]]);
    });
    it('@extend multi', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body[type=text]{@extend .a, input[type=text]}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body","[","type","=","text","]"]],CssNode.BLOCK,["{",CssNode.EXTEND,["@extend",CssNode.SELECTORS,[CssNode.SELECTOR,[".a"],",",CssNode.SELECTOR,["input","[","type","=","text","]"]]],"}"]]]]);
    });
    it('&', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{&:hover{}}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["&",":hover"]],CssNode.BLOCK,["{","}"]],"}"]]]]);
    });
  });
  describe('operate', function() {
    it('add in url()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('.a{background:url("a"+"b")}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,[".a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["background"],":",CssNode.VALUE,[CssNode.URL,["url","(",CssNode.ADDEXPR,["\"a\"","+","\"b\""],")"]]],"}"]]]]);
    });
    it('add in url() and first is $', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('.a{background:url($a+"b")}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,[".a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["background"],":",CssNode.VALUE,[CssNode.URL,["url","(",CssNode.ADDEXPR,["$a","+","\"b\""],")"]]],"}"]]]]);
    });
    it('mtpl in url()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('.a{background:url($a+$b*$c)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,[".a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["background"],":",CssNode.VALUE,[CssNode.URL,["url","(",CssNode.ADDEXPR,["$a","+",CssNode.MTPLEXPR,["$b","*","$c"]],")"]]],"}"]]]]);
    });
  });
  describe('lib test', function() {
    it('bootstrap', function() {
      var parser = homunculus.getParser('css');
      var code = fs.readFileSync(path.join(__dirname, './lib/bootstrap.css'), { encoding: 'utf-8' });
      var node = parser.parse(code);
      var ignore = parser.ignore();
      var str = jion(node, ignore);
      expect(str).to.eql(code);
    });
    it('bootstrap-theme', function() {
      var parser = homunculus.getParser('css');
      var code = fs.readFileSync(path.join(__dirname, './lib/bootstrap-theme.css'), { encoding: 'utf-8' });
      var node = parser.parse(code);
      var ignore = parser.ignore();
      var str = jion(node, ignore);
      expect(str).to.eql(code);
    });
    it('normalize', function() {
      var parser = homunculus.getParser('css');
      var code = fs.readFileSync(path.join(__dirname, './lib/normalize.css'), { encoding: 'utf-8' });
      var node = parser.parse(code);
      var ignore = parser.ignore();
      var str = jion(node, ignore);
      expect(str).to.eql(code);
    });
    it('foundation', function() {
      var parser = homunculus.getParser('css');
      var code = fs.readFileSync(path.join(__dirname, './lib/foundation.css'), { encoding: 'utf-8' });
      var node = parser.parse(code);
      var ignore = parser.ignore();
      var str = jion(node, ignore);
      expect(str).to.eql(code);
    });
    it('animate', function() {
      var parser = homunculus.getParser('css');
      var code = fs.readFileSync(path.join(__dirname, './lib/animate.css'), { encoding: 'utf-8' });
      var node = parser.parse(code);
      var ignore = parser.ignore();
      var str = jion(node, ignore);
      expect(str).to.eql(code);
    });
    it('gumby', function() {
      var parser = homunculus.getParser('css');
      var code = fs.readFileSync(path.join(__dirname, './lib/gumby.css'), { encoding: 'utf-8' });
      var node = parser.parse(code);
      var ignore = parser.ignore();
      var str = jion(node, ignore);
      expect(str).to.eql(code);
    });
  });
  describe('other test', function() {
    it('node #parent,#prev,#next', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a{}');
      var styleset = node.first();
      var children = styleset.leaves();
      var a = children[0];
      var b = children[1];
      expect(node.parent()).to.be(null);
      expect(a.parent()).to.be(styleset);
      expect(b.parent()).to.be(styleset);
      expect(a.prev()).to.be(null);
      expect(a.next()).to.be(b);
      expect(b.prev()).to.be(a);
    });
    it('node #leaf,#size,#leaves', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a{}');
      var styleset = node.first();
      expect(styleset.name()).to.be(CssNode.STYLESET);
      expect(styleset.size()).to.be(2);
      expect(styleset.leaves().length).to.be(2);
    });
    it('node #nid', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a{}');
      expect(node.nid()).to.be.a('number');
    });
    it('#ast should return as parse return', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a{}');
      expect(node).to.equal(parser.ast());
    });
    it('init class Parser(lexer) with a lexer', function() {
      var lexer = homunculus.getLexer('css');
      var parser = new Parser(lexer);
      var node = parser.parse('a{}');
      expect(node).to.equal(parser.ast());
      expect(function() {
        parser.init();
      }).to.not.throwError();
    });
    it('CssNode#getKey', function() {
      expect(CssNode.getKey('sheet')).to.eql('SHEET');
      expect(function() {
        CssNode.getKey('');
      }).to.throwError();
    });
  });
});