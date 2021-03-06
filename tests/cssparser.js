var homunculus = require('../');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Token = homunculus.getClass('token', 'css');
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
  var isToken = node.isToken();
  if(isToken) {
    var isVirtual = node.token().isVirtual();
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
    it('@media hack 3', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media \\03D\\,3D\\9');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["\\0","3", "D","\\,","3", "D","\\9"]]]]]]);
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
    it('@media error 4', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@media only');
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
    it('@font-face format first', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@font-face{font-family:YH;src:format("embedded-opentype")}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FONTFACE,["@font-face",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["font-family"],":",CssNode.VALUE,["YH"],";"],CssNode.STYLE,[CssNode.KEY,["src"],":",CssNode.VALUE,[CssNode.FORMAT,["format","(","\"embedded-opentype\"",")"]]],"}"]]]]);
    });
    it('@font-face mulit', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@font-face{font-family:YH;src:url(a),url(b)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FONTFACE,["@font-face",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["font-family"],":",CssNode.VALUE,["YH"],";"],CssNode.STYLE,[CssNode.KEY,["src"],":",CssNode.VALUE,[CssNode.URL,["url","(","a",")"],",",CssNode.URL,["url","(","b",")"]]],"}"]]]]);
    });
    it('@font-face only one var', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@font-face{$a}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FONTFACE,["@font-face",CssNode.BLOCK,["{","$a","}"]]]]);
    });
    it('@font-face only multi vars', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@font-face{$a:$b}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FONTFACE,["@font-face",CssNode.BLOCK,["{","$a",":",CssNode.VALUE,["$b"],"}"]]]]);
    });
    it('@font-face width fnc', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@font-face{$a()}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FONTFACE,["@font-face",CssNode.BLOCK,["{",CssNode.FNC,["$a",CssNode.CPARAMS,["(",")"]],"}"]]]]);
    });
    it('@font-face width styleset', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@font-face{margin:0}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FONTFACE,["@font-face",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,["0"]],"}"]]]]);
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
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.KEYFRAMES,["@keyframes","testanimations",CssNode.BLOCK,["{",CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["from"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["transform"],":",CssNode.VALUE,[CssNode.TRANSLATE,["translate","(",CssNode.PARAM,["0"],",",CssNode.PARAM,["0"],")"]]],"}"]],CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["to"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["transform"],":",CssNode.VALUE,[CssNode.TRANSLATE,["translate","(",CssNode.PARAM,["100"],",",CssNode.PARAM,["20"],")"]]],"}"]],"}"]]]]);
    });
    it('@keyframes percent', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@keyframes testanimations{10%{width:0}}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.KEYFRAMES,["@keyframes","testanimations",CssNode.BLOCK,["{",CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["10","%"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["width"],":",CssNode.VALUE,["0"]],"}"]],"}"]]]]);
    });
    it('@keyframes width var', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@keyframes bn$j{}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.KEYFRAMES,["@keyframes","bn","$j",CssNode.BLOCK,["{","}"]]]]);
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
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.DOC,["@-moz-document",CssNode.URLPREFIX,["url-prefix","(",")"],CssNode.BLOCK,["{","}"]]]]);
    });
    it('@document string', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@document url-prefix("test"){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.DOC,["@document",CssNode.URLPREFIX,["url-prefix","(","\"test\"",")"],CssNode.BLOCK,["{","}"]]]]);
    });
    it('@document var', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@document url-prefix($a){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.DOC,["@document",CssNode.URLPREFIX,["url-prefix","(","$a",")"],CssNode.BLOCK,["{","}"]]]]);
    });
    it('@document multi', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@document url-prefix($a),url(){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.DOC,["@document",CssNode.URLPREFIX,["url-prefix","(","$a",")"],",",CssNode.URL,["url","(",")"],CssNode.BLOCK,["{","}"]]]]);
    });
    it('@document multi var', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@document url-prefix($a),url($b + 2),domain(aaa){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.DOC,["@document",CssNode.URLPREFIX,["url-prefix","(","$a",")"],",",CssNode.URL,["url","(",CssNode.ADDEXPR,["$b","+","2"],")"],",",CssNode.DOMAIN,["domain","(","aaa",")"],CssNode.BLOCK,["{","}"]]]]);
    });
    it('@document url()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@document url(),url(){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.DOC,["@document",CssNode.URL,["url","(",")"],",",CssNode.URL,["url","(",")"],CssNode.BLOCK,["{","}"]]]]);
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
    it('@document error 5', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@document url(),xxx(){}');
      }).to.throwError();
    });
    it('@document error 6', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@document url(),');
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
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.SUPPORTS,["@supports",CssNode.CNDT,["not",CssNode.CNDT,["(",CssNode.CNDT,[CssNode.STYLE,[CssNode.KEY,["transform-origin"],":",CssNode.VALUE,["2","px"]]],")"]],CssNode.BLOCK,["{","}"]]]]);
    });
    it('@keyframes in @supports', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@supports(animation-name:test){@keyframes a{}}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.SUPPORTS,["@supports",CssNode.CNDT,["(",CssNode.CNDT,[CssNode.STYLE,[CssNode.KEY,["animation-name"],":",CssNode.VALUE,["test"]]],")"],CssNode.BLOCK,["{",CssNode.KEYFRAMES,["@keyframes","a",CssNode.BLOCK,["{","}"]],"}"]]]]);
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
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,[":root"]],CssNode.BLOCK,["{",CssNode.VARSTMT,[CssNode.VARDECL,["var-companyblue",":",CssNode.VALUE,["#369"]],";"],CssNode.VARSTMT,[CssNode.VARDECL,["var-lighterblue",":",CssNode.VALUE,["powderblue"]],";"],"}"]]]]);
    });
    it('css3 var()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('h3{color:var(lighterblue);}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["h3"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,[CssNode.VARS,["var","(","lighterblue",")"]],";"],"}"]]]]);
    });
    it('vardecl', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a:1;@b=2;');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a",":",CssNode.VALUE,["1"]],";"],CssNode.VARSTMT,[CssNode.VARDECL,["@b","=",CssNode.VALUE,["2"]],";"]]]);
    });
    it('vardecl a kw value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a:background;');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a",":",CssNode.VALUE,["background"]],";"]]]);
    });
    it('vardecl a style', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a:background:#FFF;');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a",":",CssNode.STYLE,[CssNode.KEY,["background"],":",CssNode.VALUE,["#FFF"]]],";"]]]);
    });
    it('vardecl hack error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('$a:*background;');
      }).to.throwError();
    });
    it('vardecl hack value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a:*background:url(xxx);');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a",":",CssNode.STYLE,[CssNode.KEY,["*","background"],":",CssNode.VALUE,[CssNode.URL,["url","(","xxx",")"]]]],";"]]]);
    });
    it('vardecl add', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a:1+ 2;');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a",":",CssNode.VALUE,[CssNode.ADDEXPR,["1","+","2"]]],";"]]]);
    });
    it('vardecl mtpl', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a:1*2;');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a",":",CssNode.VALUE,[CssNode.MTPLEXPR,["1","*","2"]]],";"]]]);
    });
    it('vardecl string add', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a:margin:"1"+ 2;');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a",":",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.ADDEXPR,["\"1\"","+","2"]]]],";"]]]);
    });
    it('vardecl string mtpl', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a:margin:"1"*2;');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a",":",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.MTPLEXPR,["\"1\"","*","2"]]]],";"]]]);
    });
    it('vardecl url()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a:url(xxx);');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a",":",CssNode.VALUE,[CssNode.URL,["url","(","xxx",")"]]],";"]]]);
    });
    it('vardecl fn()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a:unknow();');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a",":",CssNode.VALUE,[CssNode.BRACKET,["unknow","(",")"]]],";"]]]);
    });
    it('vardecl $fn()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a:$b();');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a",":",CssNode.VALUE,[CssNode.FNC,["$b",CssNode.CPARAMS,["(",")"]]]],";"]]]);
    });
    it('vardecl in block', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('.a{$a=1;$b:background:#FFF}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,[".a"]],CssNode.BLOCK,["{",CssNode.VARSTMT,[CssNode.VARDECL,["$a","=",CssNode.VALUE,["1"]],";"],CssNode.VARSTMT,[CssNode.VARDECL,["$b",":",CssNode.STYLE,[CssNode.KEY,["background"],":",CssNode.VALUE,["#FFF"]]]],"}"]]]]);
    });
    it('vardecl multi', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a=1,$b="2";');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a","=",CssNode.VALUE,["1"]],",",CssNode.VARDECL,["$b","=",CssNode.VALUE,["\"2\""]],";"]]]);
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
    it('vardecl error 3', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('$a/');
      }).to.throwError();
    });
    it('vardecl error no ;', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('$a:1');
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
    it('selector +', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a>b+c{}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["a",">","b","+","c"]],CssNode.BLOCK,["{","}"]]]]);
    });
    it('selector with hack', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('_:-ms-fullscreen,:root input[type="date"],_:-ms-fullscreen{}');
      expect(tree(node)).to.eql([CssNode.SHEET,["_",CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,[":-ms-fullscreen"],",",CssNode.SELECTOR,[":root","input","[","type","=","\"date\"","]"],",",CssNode.SELECTOR,["_",":-ms-fullscreen"]],CssNode.BLOCK,["{","}"]]]]);
    });
    it('selector both name and class', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a.a{filter:progid:DXImageTransform.Microsoft.gradient(enabled = false)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["a",".a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["filter"],":",CssNode.VALUE,["progid",":","DXImageTransform",".","Microsoft",".",CssNode.BRACKET,["gradient","(","enabled","=","false",")"]]],"}"]]]]);
    });
    it('pseudo first', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse(':hover{margin:0}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,[":hover"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,["0"]],"}"]]]]);
    });
    it('pseudo complex', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('[disabled]:not(:first)[checked]:not([data="123"]){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["[","disabled","]",":not","(",":first",")","[","checked","]",":not","(","[","data","=","\"123\"","]",")"]],CssNode.BLOCK,["{","}"]]]]);
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
      var node = parser.parse('p{color:max(1 + 2, 100)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,[CssNode.MAX,["max","(",CssNode.PARAM,["1","+","2"],",",CssNode.PARAM,["100"],")"]]],"}"]]]]);
    });
    it('min', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{color:min(1 + 2, 100)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,[CssNode.MIN,["min","(",CssNode.PARAM,["1","+","2"],",",CssNode.PARAM,["100"],")"]]],"}"]]]]);
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
    it('linear-gradient 4', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{background:-moz-linear-gradient(left center,#000 20%,#f00 50%,#090 0)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["background"],":",CssNode.VALUE,["-moz-",CssNode.LINEARGRADIENT,["linear-gradient","(",CssNode.POINT,["left","center"],",",CssNode.COLORSTOP,["#000","20","%"],",",CssNode.COLORSTOP,["#f00","50","%"],",",CssNode.COLORSTOP,["#090","0"],")"]]],"}"]]]]);
    });
    it('linear-gradient miss % error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('p{color:radial-gradient(50, 10% 20%,rgb(0,0,0))}');
      }).to.throwError();
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
    it('radial-gradient 3', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{color:radial-gradient(50%, 10% 20%,rgb(0,0,0),hsla(0, 5%, 100%, 0))}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,[CssNode.RADIOGRADIENT,["radial-gradient","(",CssNode.POS,[CssNode.LEN,["50","%"]],",",CssNode.LEN,["10","%"],CssNode.LEN,["20","%"],",",CssNode.COLORSTOP,[CssNode.RGB,["rgb","(","0",",","0",",","0",")"]],",",CssNode.COLORSTOP,[CssNode.HSLA,["hsla","(","0",",","5","%",",","100","%",",","0",")"]],")"]]],"}"]]]]);
    });
    it('radial-gradient 4', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{color:radial-gradient(center,circle,#f00,#ff0,hsl(0, 5%, 100%));}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,[CssNode.RADIOGRADIENT,["radial-gradient","(",CssNode.POS,["center"],",","circle",",",CssNode.COLORSTOP,["#f00"],",",CssNode.COLORSTOP,["#ff0"],",",CssNode.COLORSTOP,[CssNode.HSL,["hsl","(","0",",","5","%",",","100","%",")"]],")"]],";"],"}"]]]]);
    });
    it('radial-gradient 5', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{color:-webkit-radial-gradient(left top,cover,#f00 20%,#ff0 50%,#080 0)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,["-webkit-",CssNode.RADIOGRADIENT,["radial-gradient","(",CssNode.POS,["left","top"],",","cover",",",CssNode.COLORSTOP,["#f00","20","%"],",",CssNode.COLORSTOP,["#ff0","50","%"],",",CssNode.COLORSTOP,["#080","0"],")"]]],"}"]]]]);
    });
    it(') error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('p{color:)}');
      }).to.throwError();
    });
    it('multi fn()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{color:#f00 max(1) min(2) hsl(0, 5%, 100%) hsla(0, 5%, 100%, 0) calc(1 + 1) var(a) rgb(0,0,0) repeating-radial-gradient(circle,#f00,#ff0,#080)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,["#f00",CssNode.MAX,["max","(",CssNode.PARAM,["1"],")"],CssNode.MIN,["min","(",CssNode.PARAM,["2"],")"],CssNode.HSL,["hsl","(","0",",","5","%",",","100","%",")"],CssNode.HSLA,["hsla","(","0",",","5","%",",","100","%",",","0",")"],CssNode.CALC,["calc","(","1","+","1",")"],CssNode.VARS,["var","(","a",")"],CssNode.RGB,["rgb","(","0",",","0",",","0",")"],CssNode.RADIOGRADIENT,["repeating-radial-gradient","(","circle",",",CssNode.COLORSTOP,["#f00"],",",CssNode.COLORSTOP,["#ff0"],",",CssNode.COLORSTOP,["#080"],")"]]],"}"]]]]);
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
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["@a","=",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,["#fff"]]],";"]]]);
    });
    it('fn decl', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('fn($a, $b){margin:$a;$b;$c()}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FN,["fn",CssNode.PARAMS,["(","$a",",","$b",")"],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,["$a"],";"],"$b",";",CssNode.FNC,["$c",CssNode.CPARAMS,["(",")"]],"}"]]]]);
    });
    it('fn call a value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{fn(#FFF)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.FNC,["fn",CssNode.CPARAMS,["(",CssNode.VALUE,["#FFF"],")"]],"}"]]]]);
    });
    it('fn call multi value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{fn(#FFF, 3, id)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.FNC,["fn",CssNode.CPARAMS,["(",CssNode.VALUE,["#FFF"],",",CssNode.VALUE,["3"],",",CssNode.VALUE,["id"],")"]],"}"]]]]);
    });
    it('fn call a kw value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{fn(background)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.FNC,["fn",CssNode.CPARAMS,["(",CssNode.VALUE,["background"],")"]],"}"]]]]);
    });
    it('fn call complex', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{fn(background:#FFF, margin, 3px, padding:0)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.FNC,["fn",CssNode.CPARAMS,["(",CssNode.STYLE,[CssNode.KEY,["background"],":",CssNode.VALUE,["#FFF"]],",",CssNode.VALUE,["margin"],",",CssNode.VALUE,["3","px"],",",CssNode.STYLE,[CssNode.KEY,["padding"],":",CssNode.VALUE,["0"]],")"]],"}"]]]]);
    });
    it('fn call in value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a{margin:$fn(1)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.FNC,["$fn",CssNode.CPARAMS,["(",CssNode.VALUE,["1"],")"]]]],"}"]]]]);
    });
    it('fn call in value multi value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a{margin:$fn(1, #FFF)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.FNC,["$fn",CssNode.CPARAMS,["(",CssNode.VALUE,["1"],",",CssNode.VALUE,["#FFF"],")"]]]],"}"]]]]);
    });
    it('fn call in value a kw value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a{margin:$fn(background)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.FNC,["$fn",CssNode.CPARAMS,["(",CssNode.VALUE,["background"],")"]]]],"}"]]]]);
    });
    it('fn call in value complex', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{margin:$fn(background:#FFF,margin,3px,padding:0)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.FNC,["$fn",CssNode.CPARAMS,["(",CssNode.STYLE,[CssNode.KEY,["background"],":",CssNode.VALUE,["#FFF"]],",",CssNode.VALUE,["margin"],",",CssNode.VALUE,["3","px"],",",CssNode.STYLE,[CssNode.KEY,["padding"],":",CssNode.VALUE,["0"]],")"]]]],"}"]]]]);
    });
    it('fn call url()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{fn(background:url(xxx),margin)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.FNC,["fn",CssNode.CPARAMS,["(",CssNode.STYLE,[CssNode.KEY,["background"],":",CssNode.VALUE,[CssNode.URL,["url","(","xxx",")"]]],",",CssNode.VALUE,["margin"],")"]],"}"]]]]);
    });
    it('not at first value fn call', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{margin:1 $fn(#FFF)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,["1",CssNode.FNC,["$fn",CssNode.CPARAMS,["(",CssNode.VALUE,["#FFF"],")"]]]],"}"]]]]);
    });
    it('fn add', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{fn(1 + 2)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.FNC,["fn",CssNode.CPARAMS,["(",CssNode.VALUE,[CssNode.ADDEXPR,["1","+","2"]],")"]],"}"]]]]);
    });
    it('fn add in value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{margin:$fn(1 + 2)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.FNC,["$fn",CssNode.CPARAMS,["(",CssNode.VALUE,[CssNode.ADDEXPR,["1","+","2"]],")"]]]],"}"]]]]);
    });
    it('fn string add', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{fn("1" + 2)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.FNC,["fn",CssNode.CPARAMS,["(",CssNode.VALUE,[CssNode.ADDEXPR,["\"1\"","+","2"]],")"]],"}"]]]]);
    });
    it('fn string add in value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{margin:$fn("1" + 2)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.FNC,["$fn",CssNode.CPARAMS,["(",CssNode.VALUE,[CssNode.ADDEXPR,["\"1\"","+","2"]],")"]]]],"}"]]]]);
    });
    it('fn mtpl', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{fn(1 * 2)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.FNC,["fn",CssNode.CPARAMS,["(",CssNode.VALUE,[CssNode.MTPLEXPR,["1","*","2"]],")"]],"}"]]]]);
    });
    it('fn string mtpl in value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{margin:$fn("1" * 2)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.FNC,["$fn",CssNode.CPARAMS,["(",CssNode.VALUE,[CssNode.MTPLEXPR,["\"1\"","*","2"]],")"]]]],"}"]]]]);
    });
    it('fn string mtpl', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{fn("1" * 2)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.FNC,["fn",CssNode.CPARAMS,["(",CssNode.VALUE,[CssNode.MTPLEXPR,["\"1\"","*","2"]],")"]],"}"]]]]);
    });
    it('fn mtpl in value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{margin:$fn(1 * 2)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.FNC,["$fn",CssNode.CPARAMS,["(",CssNode.VALUE,[CssNode.MTPLEXPR,["1","*","2"]],")"]]]],"}"]]]]);
    });
    it('fn hack error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('body{fn(*margin)}');
      }).to.throwError();
    });
    it('fn hack value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{fn(*margin:a)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.FNC,["fn",CssNode.CPARAMS,["(",CssNode.STYLE,[CssNode.KEY,["*","margin"],":",CssNode.VALUE,["a"]],")"]],"}"]]]]);
    });
    it('fn hack in value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{margin:$fn(*background:url(xxx))}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.FNC,["$fn",CssNode.CPARAMS,["(",CssNode.STYLE,[CssNode.KEY,["*","background"],":",CssNode.VALUE,[CssNode.URL,["url","(","xxx",")"]]],")"]]]],"}"]]]]);
    });
    it('fn arr', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('div{$fn([1,2])}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["div"]],CssNode.BLOCK,["{",CssNode.FNC,["$fn",CssNode.CPARAMS,["(",CssNode.ARRLTR,["[",CssNode.VALUE,["1"],",",CssNode.VALUE,["2"],"]"],")"]],"}"]]]]);
    });
    it('fn @dir', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('div{$fn(@dir(""))}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["div"]],CssNode.BLOCK,["{",CssNode.FNC,["$fn",CssNode.CPARAMS,["(",CssNode.DIR,["@dir",CssNode.CPARAMS,["(",CssNode.VALUE,["\"\""],")"]],")"]],"}"]]]]);
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
    it('@extend error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('body{@extend');
      }).to.throwError();
    });
    it('&', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{&:hover{}}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["&",":hover"]],CssNode.BLOCK,["{","}"]],"}"]]]]);
    });
    it('no value is error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('body{width}');
      }).to.throwError();
    });
    it('$ no value is right', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{$a}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{","$a","}"]]]]);
    });
    it('counter', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{content:counter(item)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["content"],":",CssNode.VALUE,[CssNode.COUNTER,["counter","(",CssNode.PARAM,["item"],")"]]],"}"]]]]);
    });
    it('counter multi', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{content:counter($a, 2)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["content"],":",CssNode.VALUE,[CssNode.COUNTER,["counter","(",CssNode.PARAM,["$a"],",",CssNode.PARAM,["2"],")"]]],"}"]]]]);
    });
    it('attr', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{content:attr(item)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["content"],":",CssNode.VALUE,[CssNode.ATTR,["attr","(",CssNode.PARAM,["item"],")"]]],"}"]]]]);
    });
    it('attr multi', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{content:attr($a, 2)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["content"],":",CssNode.VALUE,[CssNode.ATTR,["attr","(",CssNode.PARAM,["$a"],",",CssNode.PARAM,["2"],")"]]],"}"]]]]);
    });
    it('toggle', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{content:toggle(item)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["content"],":",CssNode.VALUE,[CssNode.TOGGLE,["toggle","(",CssNode.PARAM,["item"],")"]]],"}"]]]]);
    });
    it('toggle multi', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{content:toggle($a, 2)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["content"],":",CssNode.VALUE,[CssNode.TOGGLE,["toggle","(",CssNode.PARAM,["$a"],",",CssNode.PARAM,["2"],")"]]],"}"]]]]);
    });
    it('calc', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{width:calc(100 - 2)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["width"],":",CssNode.VALUE,[CssNode.CALC,["calc","(","100","-","2",")"]]],"}"]]]]);
    });
    it('calc complex', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{width:calc((100 - 2)*3)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["width"],":",CssNode.VALUE,[CssNode.CALC,["calc","(","(","100","-","2",")","*","3",")"]]],"}"]]]]);
    });
    it('calc error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('a{margin:calc(1+})}');
      }).to.throwError();
    });
    it('filter()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{filter:alpha(opacity=50)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["filter"],":",CssNode.VALUE,[CssNode.FILTER,["alpha","(",CssNode.PARAM,["opacity","=","50"],")"]]],"}"]]]]);
    });
    it('filter single', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{filter:alpha}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["filter"],":",CssNode.VALUE,["alpha"]],"}"]]]]);
    });
    it('filter() multi', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{filter:Glow(Color="#6699CC",Strength="5")}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["filter"],":",CssNode.VALUE,[CssNode.FILTER,["Glow","(",CssNode.PARAM,["Color","=","\"#6699CC\""],",",CssNode.PARAM,["Strength","=","\"5\""],")"]]],"}"]]]]);
    });
    it('unknow bracket', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{margin:unknow(xxx,xxx)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.BRACKET,["unknow","(","xxx",",","xxx",")"]]],"}"]]]]);
    });
    it('unknow bracket multi', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a{background-image: -webkit-gradient(linear, left top, right top, from(rgba(0, 0, 0, .5)), to(rgba(0, 0, 0, .0001)));}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["background-image"],":",CssNode.VALUE,["-webkit-",CssNode.BRACKET,["gradient","(","linear",",","left","top",",","right","top",",",CssNode.BRACKET,["from","(",CssNode.BRACKET,["rgba","(","0",",","0",",","0",",",".5",")"],")"],",",CssNode.BRACKET,["to","(",CssNode.BRACKET,["rgba","(","0",",","0",",","0",",",".0001",")"],")"],")"]],";"],"}"]]]]);
    });
    it('param error', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('a{margin:max(,)}');
      }).to.throwError();
    });
    it('omit @extend for compatible less', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('.a{.b}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,[".a"]],CssNode.BLOCK,["{",CssNode.EXTEND,[CssNode.SELECTORS,[CssNode.SELECTOR,[".b"]]],"}"]]]]);
    });
    it('miss {', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('a}');
      }).to.throwError();
    });
    it('miss }', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('a{');
      }).to.throwError();
    });
    it('extra {', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('a{{}');
      }).to.throwError();
    });
    it('extra }', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('a}}');
      }).to.throwError();
    });
    it('+number, -number', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('.a{margin:+2px -1px}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,[".a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,["+2","px","-1","px"]],"}"]]]]);
    });
    it('value can contain +', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a{unicode-range:U+1000-1212}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["unicode-range"],":",CssNode.VALUE,["U+1000-1212"]],"}"]]]]);
    });
    it('vardecl value contain +', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a:unicode-range:U+1000-1212;');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a",":",CssNode.STYLE,[CssNode.KEY,["unicode-range"],":",CssNode.VALUE,["U+1000-1212"]]],";"]]]);
    });
    it('vardecl contain +', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a:U+1000-1212;');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a",":",CssNode.VALUE,["U+1000-1212"]],";"]]]);
    });
    it('~ in value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{margin:~"1,2"}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.UNBOX,["~","\"1,2\""]]],"}"]]]]);
    });
    it('~ out value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{~margin:1}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["~","margin"],":",CssNode.VALUE,["1"]],"}"]]]]);
    });
    it(';', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('p{fn(1);;;margin:0}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["p"]],CssNode.BLOCK,["{",CssNode.FNC,["fn",CssNode.CPARAMS,["(",CssNode.VALUE,["1"],")"]],";",";",";",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,["0"]],"}"]]]]);
    });
    it('build-in fn can be value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a{-webkit-transform:scale3d(.9,.9,.9) rotate3d(0,0,1,-3deg);animation-name: rotate;}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["-webkit-","transform"],":",CssNode.VALUE,[CssNode.SCALE3D,["scale3d","(",CssNode.PARAM,[".9"],",",CssNode.PARAM,[".9"],",",CssNode.PARAM,[".9"],")"],CssNode.ROTATE3D,["rotate3d","(",CssNode.PARAM,["0"],",",CssNode.PARAM,["0"],",",CssNode.PARAM,["1"],",",CssNode.PARAM,["-3","deg"],")"]],";"],CssNode.STYLE,[CssNode.KEY,["animation-name"],":",CssNode.VALUE,["rotate"],";"],"}"]]]]);
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
    it('add with units', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('.a{margin:2 + 3px + 2px}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,[".a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.ADDEXPR,["2","+","3","px","+","2","px"]]],"}"]]]]);
    });
    it('mtpl in url()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('.a{background:url($a+$b*$c)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,[".a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["background"],":",CssNode.VALUE,[CssNode.URL,["url","(",CssNode.ADDEXPR,["$a","+",CssNode.MTPLEXPR,["$b","*","$c"]],")"]]],"}"]]]]);
    });
    it('mtpl with units', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('.a{margin:2 * 3px * 2px}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,[".a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.MTPLEXPR,["2","*","3","px","*","2","px"]]],"}"]]]]);
    });
    it('as a style', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{$a+$b}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.ADDEXPR,["$a","+","$b"],"}"]]]]);
    });
    it('as a key', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{$a+$b:1}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.ADDEXPR,["$a","+","$b"],":",CssNode.VALUE,["1"],"}"]]]]);
    });
    it('in @font-face', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@font-face{$a:$b + 1}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FONTFACE,["@font-face",CssNode.BLOCK,["{","$a",":",CssNode.VALUE,[CssNode.ADDEXPR,["$b","+","1"]],"}"]]]]);
    });
    it('in @namespace', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@namespace $a*2;');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.NAMESPACE,["@namespace",CssNode.MTPLEXPR,["$a","*","2"],";"]]]);
    });
    it('in @document', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@document url-prefix($a+$b){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.DOC,["@document",CssNode.URLPREFIX,["url-prefix","(",CssNode.ADDEXPR,["$a","+","$b"],")"],CssNode.BLOCK,["{","}"]]]]);
    });
    it('in @media', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media all and ($a){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["all"],"and",CssNode.EXPR,["(",CssNode.KEY,["$a"],")"]]],CssNode.BLOCK,["{","}"]]]]);
    });
    it('in @media value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@media all and ($a:$b){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.MEDIA,["@media",CssNode.MEDIAQLIST,[CssNode.MEDIAQUERY,[CssNode.MEDIATYPE,["all"],"and",CssNode.EXPR,["(",CssNode.KEY,["$a"],":",CssNode.VALUE,["$b"],")"]]],CssNode.BLOCK,["{","}"]]]]);
    });
    it('counter', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{content:counter($a + 2)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["content"],":",CssNode.VALUE,[CssNode.COUNTER,["counter","(",CssNode.PARAM,[CssNode.ADDEXPR,["$a","+","2"]],")"]]],"}"]]]]);
    });
    it('alpha 1', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{filter:alpha($a)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["filter"],":",CssNode.VALUE,[CssNode.FILTER,["alpha","(",CssNode.PARAM,["$a"],")"]]],"}"]]]]);
    });
    it('alpha 2', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{filter:alpha($a=$b + 2)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["filter"],":",CssNode.VALUE,[CssNode.FILTER,["alpha","(",CssNode.PARAM,["$a","=",CssNode.ADDEXPR,["$b","+","2"]],")"]]],"}"]]]]);
    });
    it('()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{margin:0 (1 + 2)*3}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,["0",CssNode.MTPLEXPR,[CssNode.PRMREXPR,["(",CssNode.ADDEXPR,["1","+","2"],")"],"*","3"]]],"}"]]]]);
    });
    it('in var', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a: $b*($c + 2);');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a",":",CssNode.VALUE,[CssNode.MTPLEXPR,["$b","*",CssNode.PRMREXPR,["(",CssNode.ADDEXPR,["$c","+","2"],")"]]]],";"]]]);
    });
    it('unit after ()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a{padding:(1 + 2)px}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["padding"],":",CssNode.VALUE,[CssNode.PRMREXPR,["(",CssNode.ADDEXPR,["1","+","2"],")"],"px"]],"}"]]]]);
    });
    it('no blank between unit and ()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{margin:(1 + 2) px}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.PRMREXPR,["(",CssNode.ADDEXPR,["1","+","2"],")"],"px"]],"}"]]]]);
    });
    it('ignore in font', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{font:0/0;font:bold 12px/3;}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["font"],":",CssNode.VALUE,["0","/","0"],";"],CssNode.STYLE,[CssNode.KEY,["font"],":",CssNode.VALUE,["bold","12","px","/","3"],";"],"}"]]]]);
    });
    it('ignore in border-image', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('body{border-image: url(https://i.alipayobjects.com/i/localhost/png/201411/3qhQSLX7dl.png) 0 4/4px round;}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["body"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["border-image"],":",CssNode.VALUE,[CssNode.URL,["url","(","https://i.alipayobjects.com/i/localhost/png/201411/3qhQSLX7dl.png",")"],"0","4","/","4","px","round"],";"],"}"]]]]);
    });
    it('ignore in border-image', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('a{-webkit-border-image: url(https://i.alipayobjects.com/i/localhost/png/201411/3qhQSLX7dl.png) 0 4/4px round;}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["a"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["-webkit-","border-image"],":",CssNode.VALUE,[CssNode.URL,["url","(","https://i.alipayobjects.com/i/localhost/png/201411/3qhQSLX7dl.png",")"],"0","4","/","4","px","round"],";"],"}"]]]]);
    });
  });
  describe('@ifstmt', function() {
    it('only @if', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if($b){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.PRMRSTMT,["$b"],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('@elseif', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if($b){}@elseif($a){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.PRMRSTMT,["$b"],")",CssNode.BLOCK,["{","}"],CssNode.IFSTMT,["@elseif","(",CssNode.PRMRSTMT,["$a"],")",CssNode.BLOCK,["{","}"]]]]]);
    });
    it('@else', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if($b){}@else{}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.PRMRSTMT,["$b"],")",CssNode.BLOCK,["{","}"],"@else",CssNode.BLOCK,["{","}"]]]]);
    });
    it('addexpr', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if($b + 1){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.ADDSTMT,[CssNode.PRMRSTMT,["$b"],"+",CssNode.PRMRSTMT,["1"]],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('within content', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if($a){color:#FFF;div{margin:$a}}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.PRMRSTMT,["$a"],")",CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["color"],":",CssNode.VALUE,["#FFF"],";"],CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["div"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,["$a"]],"}"]],"}"]]]]);
    });
    it('no @if error 1', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@else{}');
      }).to.throwError();
    });
    it('no @if error 2', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('@elseif($a){}');
      }).to.throwError();
    });
    it('cross 1', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if($a){@for(;$a>1;$a++){}}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.PRMRSTMT,["$a"],")",CssNode.BLOCK,["{",CssNode.FORSTMT,["@for","(",";",CssNode.RELSTMT,[CssNode.PRMRSTMT,["$a"],">",CssNode.PRMRSTMT,["1"]],";",CssNode.POSTFIXSTMT,[CssNode.PRMRSTMT,["$a"],"++"],")",CssNode.BLOCK,["{","}"]],"}"]]]]);
    });
    it('cross 2', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if($a){@if($b){}}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.PRMRSTMT,["$a"],")",CssNode.BLOCK,["{",CssNode.IFSTMT,["@if","(",CssNode.PRMRSTMT,["$b"],")",CssNode.BLOCK,["{","}"]],"}"]]]]);
    });
  });
  describe('@forstmt', function() {
    it('for(VARSTMT;EQSTMT;EQSTMT){}', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@for($a=1,$b="2";$a>$b;$a++){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FORSTMT,["@for","(",CssNode.VARSTMT,[CssNode.VARDECL,["$a","=",CssNode.VALUE,["1"]],",",CssNode.VARDECL,["$b","=",CssNode.VALUE,["\"2\""]],";"],CssNode.RELSTMT,[CssNode.PRMRSTMT,["$a"],">",CssNode.PRMRSTMT,["$b"]],";",CssNode.POSTFIXSTMT,[CssNode.PRMRSTMT,["$a"],"++"],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('for(;EQSTMT;EQSTMT){}', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@for(;$a!=$b;$a){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FORSTMT,["@for","(",";",CssNode.EQSTMT,[CssNode.PRMRSTMT,["$a"],"!=",CssNode.PRMRSTMT,["$b"]],";",CssNode.PRMRSTMT,["$a"],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('for in', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@for($a in [1,2]){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FORSTMT,["@for","(","$a","in",CssNode.ARRLTR,["[",CssNode.VALUE,["1"],",",CssNode.VALUE,["2"],"]"],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('for of', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@for($a of @dir("test")){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FORSTMT,["@for","(","$a","of",CssNode.DIR,["@dir",CssNode.CPARAMS,["(",CssNode.VALUE,["\"test\""],")"]],")",CssNode.BLOCK,["{","}"]]]]);
    });
  });
  describe('eqstmt', function() {
    it('eq', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if($a==1){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.EQSTMT,[CssNode.PRMRSTMT,["$a"],"==",CssNode.PRMRSTMT,["1"]],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('rel', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if($a>1){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.RELSTMT,[CssNode.PRMRSTMT,["$a"],">",CssNode.PRMRSTMT,["1"]],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('add/mtpl', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if($a + $b * 2){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.ADDSTMT,[CssNode.PRMRSTMT,["$a"],"+",CssNode.MTPLSTMT,[CssNode.PRMRSTMT,["$b"],"*",CssNode.PRMRSTMT,["2"]]],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('series add/mtpl', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if($a + $b + $c){}@elseif($a * $b * $c){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.ADDSTMT,[CssNode.PRMRSTMT,["$a"],"+",CssNode.PRMRSTMT,["$b"],CssNode.PRMRSTMT,["$a"],"+",CssNode.PRMRSTMT,["$c"]],")",CssNode.BLOCK,["{","}"],CssNode.IFSTMT,["@elseif","(",CssNode.MTPLSTMT,[CssNode.PRMRSTMT,["$a"],"*",CssNode.PRMRSTMT,["$b"],CssNode.PRMRSTMT,["$a"],"*",CssNode.PRMRSTMT,["$c"]],")",CssNode.BLOCK,["{","}"]]]]]);
    });
    it('postfix', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if($a++){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.POSTFIXSTMT,[CssNode.PRMRSTMT,["$a"],"++"],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('prmr', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if($a){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.PRMRSTMT,["$a"],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('()', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if($a * ($b - 1)){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.MTPLSTMT,[CssNode.PRMRSTMT,["$a"],"*",CssNode.PRMRSTMT,["(",CssNode.ADDSTMT,[CssNode.PRMRSTMT,["$b"],"-",CssNode.PRMRSTMT,["1"]],")"]],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('arrltr', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a = [1,2];');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a","=",CssNode.ARRLTR,["[",CssNode.VALUE,["1"],",",CssNode.VALUE,["2"],"]"]],";"]]]);
    });
  });
  describe('global fn @', function() {
    it('@dir', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a = @dir("test");');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a","=",CssNode.DIR,["@dir",CssNode.CPARAMS,["(",CssNode.VALUE,["\"test\""],")"]]],";"]]]);
    });
    it('@dir in exprstmt', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@for($a of @dir()){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.FORSTMT,["@for","(","$a","of",CssNode.DIR,["@dir",CssNode.CPARAMS,["(",")"]],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('@basename', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a = @basename("test");');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a","=",CssNode.VALUE,[CssNode.BASENAME,["@basename",CssNode.CPARAMS,["(",CssNode.VALUE,["\"test\""],")"]]]],";"]]]);
    });
    it('@basename in exprstmt', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if(@basename("test") > "1"){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.RELSTMT,[CssNode.BASENAME,["@basename",CssNode.CPARAMS,["(",CssNode.VALUE,["\"test\""],")"]],">",CssNode.PRMRSTMT,["\"1\""]],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('@basename in value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('div{margin:@basename("")}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["div"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.BASENAME,["@basename",CssNode.CPARAMS,["(",CssNode.VALUE,["\"\""],")"]]]],"}"]]]]);
    });
    it('@extname', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a = @extname("test");');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a","=",CssNode.VALUE,[CssNode.EXTNAME,["@extname",CssNode.CPARAMS,["(",CssNode.VALUE,["\"test\""],")"]]]],";"]]]);
    });
    it('@extname in exprstmt', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if(@extname("test") > "1"){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.RELSTMT,[CssNode.EXTNAME,["@extname",CssNode.CPARAMS,["(",CssNode.VALUE,["\"test\""],")"]],">",CssNode.PRMRSTMT,["\"1\""]],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('@extname in value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('div{margin:@extname("")}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["div"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.EXTNAME,["@extname",CssNode.CPARAMS,["(",CssNode.VALUE,["\"\""],")"]]]],"}"]]]]);
    });
    it('@width', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a = @width("test");');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a","=",CssNode.VALUE,[CssNode.WIDTH,["@width",CssNode.CPARAMS,["(",CssNode.VALUE,["\"test\""],")"]]]],";"]]]);
    });
    it('@width in exprstmt', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if(@width("test") > 1){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.RELSTMT,[CssNode.WIDTH,["@width",CssNode.CPARAMS,["(",CssNode.VALUE,["\"test\""],")"]],">",CssNode.PRMRSTMT,["1"]],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('@width in value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('div{margin:@width("") + 1}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["div"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.ADDEXPR,[CssNode.WIDTH,["@width",CssNode.CPARAMS,["(",CssNode.VALUE,["\"\""],")"]],"+","1"]]],"}"]]]]);
    });
    it('@height', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a = @height("test");');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a","=",CssNode.VALUE,[CssNode.HEIGHT,["@height",CssNode.CPARAMS,["(",CssNode.VALUE,["\"test\""],")"]]]],";"]]]);
    });
    it('@height in exprstmt', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('@if(@height("test") > 1){}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.IFSTMT,["@if","(",CssNode.RELSTMT,[CssNode.HEIGHT,["@height",CssNode.CPARAMS,["(",CssNode.VALUE,["\"test\""],")"]],">",CssNode.PRMRSTMT,["1"]],")",CssNode.BLOCK,["{","}"]]]]);
    });
    it('@height in value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('div{margin:@height("") + 1}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["div"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.ADDEXPR,[CssNode.HEIGHT,["@height",CssNode.CPARAMS,["(",CssNode.VALUE,["\"\""],")"]],"+","1"]]],"}"]]]]);
    });
  });
  describe('unbox', function() {
    it('vardecl', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a = ~"123";');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a","=",CssNode.VALUE,[CssNode.UNBOX,["~","\"123\""]]],";"]]]);
    });
    it('var as hack', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('$a = ~margin:0;');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.VARSTMT,[CssNode.VARDECL,["$a","=",CssNode.STYLE,[CssNode.KEY,["~","margin"],":",CssNode.VALUE,["0"]]],";"]]]);
    });
    it('fn call', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('div{$fn(~"123")}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["div"]],CssNode.BLOCK,["{",CssNode.FNC,["$fn",CssNode.CPARAMS,["(",CssNode.UNBOX,["~","\"123\""],")"]],"}"]]]]);
    });
    it('fnc as hack', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('div{$fn(~margin:0)}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["div"]],CssNode.BLOCK,["{",CssNode.FNC,["$fn",CssNode.CPARAMS,["(",CssNode.STYLE,[CssNode.KEY,["~","margin"],":",CssNode.VALUE,["0"]],")"]],"}"]]]]);
    });
    it('in value', function() {
      var parser = homunculus.getParser('css');
      var node = parser.parse('div{margin:~"";padding:~$a}');
      expect(tree(node)).to.eql([CssNode.SHEET,[CssNode.STYLESET,[CssNode.SELECTORS,[CssNode.SELECTOR,["div"]],CssNode.BLOCK,["{",CssNode.STYLE,[CssNode.KEY,["margin"],":",CssNode.VALUE,[CssNode.UNBOX,["~","\"\""]],";"],CssNode.STYLE,[CssNode.KEY,["padding"],":",CssNode.VALUE,[CssNode.UNBOX,["~","$a"]]],"}"]]]]);
    });
    it('only one unbxo in value', function() {
      var parser = homunculus.getParser('css');
      expect(function() {
        parser.parse('div{margin:~""~""}');
      }).to.throwError();
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
    it('pure', function() {
      var parser = homunculus.getParser('css');
      var code = fs.readFileSync(path.join(__dirname, './lib/pure.css'), { encoding: 'utf-8' });
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