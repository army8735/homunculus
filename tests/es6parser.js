var homunculus = require('../');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Token = homunculus.getClass('token');
var Parser = homunculus.getClass('parser', 'es6');
var JsNode = homunculus.getClass('node', 'es6');

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
  var isToken = node.name() == JsNode.TOKEN;
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
  var isToken = node.name() == JsNode.TOKEN;
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

describe('es6parser', function() {
  describe('simple test', function () {
    it('varstmt no assign', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var a;');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["a"]],";"]]]);
    });
    it('varstmt with assign', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var a = 1;');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["a"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]],";"]]]);
    });
    it('varstmt with multi', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var a, b = 1;');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["a"]],",",JsNode.VARDECL,[JsNode.BINDID,["b"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]],";"]]]);
    });
    it('destructuring array', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var [a] = [1]');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["a"]],"]"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,["1"],"]"]]]]]]]);
    });
    it('destructuring with restparam', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var [a, ...b] = [1, 2, 3]');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["a"]],",",JsNode.BINDREST,["...",JsNode.BINDID,["b"]],"]"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,["1"],",",JsNode.PRMREXPR,["2"],",",JsNode.PRMREXPR,["3"],"]"]]]]]]]);
    });
    it('destructuring with default value', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var [a = 1, [b] = [2]] = [, []]');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["a"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]],",",JsNode.BINDELEM,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["b"]],"]"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,["2"],"]"]]]],"]"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",",",JsNode.PRMREXPR,[JsNode.ARRLTR,["[","]"]],"]"]]]]]]]);
    });
    it('destructuring object', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var {x, y = 1, "f": [z]} = {}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.OBJBINDPAT,["{",JsNode.BINDPROPT,[JsNode.SINGLENAME,[JsNode.BINDID,["x"]]],",",JsNode.BINDPROPT,[JsNode.SINGLENAME,[JsNode.BINDID,["y"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]]],",",JsNode.BINDPROPT,[JsNode.PROPTNAME,[JsNode.LTRPROPT,["\"f\""]],":",JsNode.BINDELEM,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["z"]],"]"]]],"}"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.OBJLTR,["{","}"]]]]]]]);
    });
    it('destructuring complex', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var [x, {"a":[y=1,{z=2},...o]}] = []');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["x"]],",",JsNode.BINDELEM,[JsNode.OBJBINDPAT,["{",JsNode.BINDPROPT,[JsNode.PROPTNAME,[JsNode.LTRPROPT,["\"a\""]],":",JsNode.BINDELEM,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["y"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]],",",JsNode.BINDELEM,[JsNode.OBJBINDPAT,["{",JsNode.BINDPROPT,[JsNode.SINGLENAME,[JsNode.BINDID,["z"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["2"]]]],"}"]],",",JsNode.BINDREST,["...",JsNode.BINDID,["o"]],"]"]]],"}"]],"]"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[","]"]]]]]]]);
    });
    it('destructuring without assign should throw error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('var [a];');
      }).to.throwError();
    });
    it('destructuring object error 1', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var {');
      }).to.throwError();
    });
    it('destructuring object error 2', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var {a');
      }).to.throwError();
    });
    it('destructuring object error 3', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var {!');
      }).to.throwError();
    });
    it('destructuring object error 4', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var {a ');
      }).to.throwError();
    });
  });
});