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
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["a"]],";"]]]);
    });
    it('varstmt with assign', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var a = 1;');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["a"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]],";"]]]);
    });
    it('varstmt with multi', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var a, b = 1;');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["a"]],",",JsNode.VARDECL,[JsNode.BINDID,["b"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]],";"]]]);
    });
    it('destructuring array', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var [a] = [1]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["a"]],"]"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,["1"],"]"]]]]]]]);
    });
    it('destructuring with restparam', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var [a, ...b] = [1, 2, 3]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["a"]],",",JsNode.BINDREST,["...",JsNode.BINDID,["b"]],"]"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,["1"],",",JsNode.PRMREXPR,["2"],",",JsNode.PRMREXPR,["3"],"]"]]]]]]]);
    });
    it('destructuring with default value', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var [a = 1, [b] = [2]] = [, []]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["a"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]],",",JsNode.BINDELEM,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["b"]],"]"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,["2"],"]"]]]],"]"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",",",JsNode.PRMREXPR,[JsNode.ARRLTR,["[","]"]],"]"]]]]]]]);
    });
    it('destructuring object', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var {x, y = 1, "f": [z]} = {}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.OBJBINDPAT,["{",JsNode.BINDPROPT,[JsNode.SINGLENAME,[JsNode.BINDID,["x"]]],",",JsNode.BINDPROPT,[JsNode.SINGLENAME,[JsNode.BINDID,["y"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]]],",",JsNode.BINDPROPT,[JsNode.PROPTNAME,[JsNode.LTRPROPT,["\"f\""]],":",JsNode.BINDELEM,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["z"]],"]"]]],"}"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.OBJLTR,["{","}"]]]]]]]);
    });
    it('destructuring complex', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var [x, {"a":[y=1,{z=2},...o]}] = []');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["x"]],",",JsNode.BINDELEM,[JsNode.OBJBINDPAT,["{",JsNode.BINDPROPT,[JsNode.PROPTNAME,[JsNode.LTRPROPT,["\"a\""]],":",JsNode.BINDELEM,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["y"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]],",",JsNode.BINDELEM,[JsNode.OBJBINDPAT,["{",JsNode.BINDPROPT,[JsNode.SINGLENAME,[JsNode.BINDID,["z"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["2"]]]],"}"]],",",JsNode.BINDREST,["...",JsNode.BINDID,["o"]],"]"]]],"}"]],"]"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[","]"]]]]]]]);
    });
    it('destructuring without assign should throw error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('var [a];');
      }).to.throwError();
    });
    it('destructuring object error 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('var {');
      }).to.throwError();
    });
    it('destructuring object error 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('var {a');
      }).to.throwError();
    });
    it('destructuring object error 3', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('var {!');
      }).to.throwError();
    });
    it('destructuring object error 4', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('var {a ');
      }).to.throwError();
    });
    it('letstmt 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('let a');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.LEXDECL,["let",JsNode.LEXBIND,[JsNode.BINDID,["a"]]]]]);
    });
    it('letstmt 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('let a, b = 1');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.LEXDECL,["let",JsNode.LEXBIND,[JsNode.BINDID,["a"]],",",JsNode.LEXBIND,[JsNode.BINDID,["b"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]]]]]);
    });
    it('cststmt 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('const a');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.LEXDECL,["const",JsNode.LEXBIND,[JsNode.BINDID,["a"]]]]]);
    });
    it('cststmt 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('const a, b = 1');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.LEXDECL,["const",JsNode.LEXBIND,[JsNode.BINDID,["a"]],",",JsNode.LEXBIND,[JsNode.BINDID,["b"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]]]]]);
    });
    it('fndecl', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('function a() {}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.FNDECL,["function",JsNode.BINDID,["a"],"(",JsNode.FMPARAMS,[],")","{",JsNode.FNBODY,[],"}"]]]);
    });
    it('fndecl with params', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('function a(b,c) {}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.FNDECL,["function",JsNode.BINDID,["a"],"(",JsNode.FMPARAMS,[JsNode.SINGLENAME,[JsNode.BINDID,["b"]],",",JsNode.SINGLENAME,[JsNode.BINDID,["c"]]],")","{",JsNode.FNBODY,[],"}"]]]);
    });
    it('fndecl bindelem', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('function a(b, c = 1, ...d){}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.FNDECL,["function",JsNode.BINDID,["a"],"(",JsNode.FMPARAMS,[JsNode.SINGLENAME,[JsNode.BINDID,["b"]],",",JsNode.SINGLENAME,[JsNode.BINDID,["c"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]],",",JsNode.BINDREST,["...",JsNode.BINDID,["d"]]],")","{",JsNode.FNBODY,[],"}"]]]);
    });
    it('fndecl bindelem 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('function a(b, c = d*2){}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.FNDECL,["function",JsNode.BINDID,["a"],"(",JsNode.FMPARAMS,[JsNode.SINGLENAME,[JsNode.BINDID,["b"]],",",JsNode.SINGLENAME,[JsNode.BINDID,["c"],JsNode.INITLZ,["=",JsNode.MTPLEXPR,[JsNode.PRMREXPR,["d"],"*",JsNode.PRMREXPR,["2"]]]]],")","{",JsNode.FNBODY,[],"}"]]]);
    });
    it('fndecl rest', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('function a(...b){}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.FNDECL,["function",JsNode.BINDID,["a"],"(",JsNode.FMPARAMS,[JsNode.BINDREST,["...",JsNode.BINDID,["b"]]],")","{",JsNode.FNBODY,[],"}"]]]);
    });
    it('fndecl error 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('function');
      }).to.throwError();
    });
    it('fndecl error 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('function a');
      }).to.throwError();
    });
    it('fndecl error 3', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('function a(');
      }).to.throwError();
    });
    it('fndecl error 4', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('function a()');
      }).to.throwError();
    });
    it('fndecl error 5', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('function a() {');
      }).to.throwError();
    });
    it('fnexpr 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('~function() {}()');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.EXPRSTMT,[JsNode.UNARYEXPR,["~",JsNode.CALLEXPR,[JsNode.FNEXPR,["function","(",JsNode.FMPARAMS,[],")","{",JsNode.FNBODY,[],"}"],JsNode.ARGS,["(",")"]]]]]]);
    });
    it('fnexpr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('(function a() {})()');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.EXPRSTMT,[JsNode.CALLEXPR,[JsNode.PRMREXPR,["(",JsNode.FNEXPR,["function",JsNode.BINDID,["a"],"(",JsNode.FMPARAMS,[],")","{",JsNode.FNBODY,[],"}"],")"],JsNode.ARGS,["(",")"]]]]]);
    });
    it('fnexpr error 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('(function');
      }).to.throwError();
    });
    it('fnexpr error 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('(function(');
      }).to.throwError();
    });
    it('fnexpr error 3', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('(function(a,');
      }).to.throwError();
    });
    it('fnexpr error 4', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('(function(a,1');
      }).to.throwError();
    });
    it('arrinit error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('[');
      }).to.throwError();
    });
    it('arrltr', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('[,,,2,3,]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.ARRLTR,["[",",",",",",",JsNode.PRMREXPR,["2"],",",JsNode.PRMREXPR,["3"],",","]"]]]]]);
    });
    it('arrltr spread', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('[...a]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.SPREAD,["...",JsNode.PRMREXPR,["a"]],"]"]]]]]);
    });
    it('arrltr error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('[,,,2,3,');
      }).to.throwError();
    });
    it('arrcmph no if', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('[for(a of b)a]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.ARRCMPH,["[",JsNode.CMPHFOR,["for","(",JsNode.BINDID,["a"],"of",JsNode.PRMREXPR,["b"],")"],JsNode.PRMREXPR,["a"],"]"]]]]]);
    });
    it('arrcmph with if', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('[for(a of b)if(a>1)a]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.ARRCMPH,["[",JsNode.CMPHFOR,["for","(",JsNode.BINDID,["a"],"of",JsNode.PRMREXPR,["b"],")"],JsNode.CMPHIF,["if","(",JsNode.RELTEXPR,[JsNode.PRMREXPR,["a"],">",JsNode.PRMREXPR,["1"]],")"],JsNode.PRMREXPR,["a"],"]"]]]]]);
    });
    it('arrcmph recursion', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('[for(a of b)if(true)for(c of a)if(false)c]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.ARRCMPH,["[",JsNode.CMPHFOR,["for","(",JsNode.BINDID,["a"],"of",JsNode.PRMREXPR,["b"],")"],JsNode.CMPHIF,["if","(",JsNode.PRMREXPR,["true"],")"],JsNode.CMPHFOR,["for","(",JsNode.BINDID,["c"],"of",JsNode.PRMREXPR,["a"],")"],JsNode.CMPHIF,["if","(",JsNode.PRMREXPR,["false"],")"],JsNode.PRMREXPR,["c"],"]"]]]]]);
    });
    it('arrcmph forbindpat', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('[for([a,b] of c)a+b]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.ARRCMPH,["[",JsNode.CMPHFOR,["for","(",JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["a"]],",",JsNode.SINGLENAME,[JsNode.BINDID,["b"]],"]"],"of",JsNode.PRMREXPR,["c"],")"],JsNode.ADDEXPR,[JsNode.PRMREXPR,["a"],"+",JsNode.PRMREXPR,["b"]],"]"]]]]]);
    });
    it('arrcmph error 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('[for');
      }).to.throwError();
    });
    it('arrcmph error 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('[for(');
      }).to.throwError();
    });
    it('arrcmph error 3', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('[for(a');
      }).to.throwError();
    });
    it('arrcmph error 4', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('[for(a of');
      }).to.throwError();
    });
    it('arrcmph error 5', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('[for(a of b');
      }).to.throwError();
    });
    it('arrcmph error 6', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('[for(a of b)');
      }).to.throwError();
    });
    it('arrcmph error 7', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('[for(a of b)if');
      }).to.throwError();
    });
    it('arrcmph error 8', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('[for(a of b)if(');
      }).to.throwError();
    });
    it('arrcmph error 9', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('[for(a of b)if(true');
      }).to.throwError();
    });
    it('arrcmph error 10', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('[for(a of b)if(true)');
      }).to.throwError();
    });
    it('arrcmph error 11', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('[for(a of b)if(true)a');
      }).to.throwError();
    });
  });
});