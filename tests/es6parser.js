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
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["a"]],";"]]]]);
    });
    it('varstmt with assign', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var a = 1;');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["a"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]],";"]]]]);
    });
    it('varstmt with multi', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var a, b = 1;');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["a"]],",",JsNode.VARDECL,[JsNode.BINDID,["b"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]],";"]]]]);
    });
    it('destructuring array', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var [a] = [1]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["a"]],"]"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,["1"],"]"]]]]]]]]);
    });
    it('destructuring with restparam', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var [a, ...b] = [1, 2, 3]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["a"]],",",JsNode.BINDREST,["...",JsNode.BINDID,["b"]],"]"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,["1"],",",JsNode.PRMREXPR,["2"],",",JsNode.PRMREXPR,["3"],"]"]]]]]]]]);
    });
    it('destructuring with default value', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var [a = 1, [b] = [2]] = [, []]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["a"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]],",",JsNode.BINDELEM,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["b"]],"]"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,["2"],"]"]]]],"]"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",",",JsNode.PRMREXPR,[JsNode.ARRLTR,["[","]"]],"]"]]]]]]]]);
    });
    it('destructuring object', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var {x, y = 1, "f": [z]} = {}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.OBJBINDPAT,["{",JsNode.BINDPROPT,[JsNode.SINGLENAME,[JsNode.BINDID,["x"]]],",",JsNode.BINDPROPT,[JsNode.SINGLENAME,[JsNode.BINDID,["y"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]]],",",JsNode.BINDPROPT,[JsNode.PROPTNAME,[JsNode.LTRPROPT,["\"f\""]],":",JsNode.BINDELEM,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["z"]],"]"]]],"}"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.OBJLTR,["{","}"]]]]]]]]);
    });
    it('destructuring object with keyword property', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var {var, f,} = {}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.OBJBINDPAT,["{",JsNode.BINDPROPT,[JsNode.SINGLENAME,[JsNode.BINDID,["var"]]],",",JsNode.BINDPROPT,[JsNode.SINGLENAME,[JsNode.BINDID,["f"]]],",","}"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.OBJLTR,["{","}"]]]]]]]]);
    });
    it('destructuring complex', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var [x, {"a":[y=1,{z=2},...o]}] = []');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["x"]],",",JsNode.BINDELEM,[JsNode.OBJBINDPAT,["{",JsNode.BINDPROPT,[JsNode.PROPTNAME,[JsNode.LTRPROPT,["\"a\""]],":",JsNode.BINDELEM,[JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["y"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]],",",JsNode.BINDELEM,[JsNode.OBJBINDPAT,["{",JsNode.BINDPROPT,[JsNode.SINGLENAME,[JsNode.BINDID,["z"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["2"]]]],"}"]],",",JsNode.BINDREST,["...",JsNode.BINDID,["o"]],"]"]]],"}"]],"]"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[","]"]]]]]]]]);
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
    it('destructuring object error: kw can not in array 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('var [var] = [1]');
      }).to.throwError();
    });
    it('destructuring object error: kw can not in array 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('var [x, {"a":[var=1,{z=2},...o]}] = []');
      }).to.throwError();
    });
    it('letdecl 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('let a');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.LEXDECL,["let",JsNode.LEXBIND,[JsNode.BINDID,["a"]]]]]]);
    });
    it('letdecl 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('let a, b = 1');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.LEXDECL,["let",JsNode.LEXBIND,[JsNode.BINDID,["a"]],",",JsNode.LEXBIND,[JsNode.BINDID,["b"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]]]]]]);
    });
    it('cstdecl 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('const a');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.LEXDECL,["const",JsNode.LEXBIND,[JsNode.BINDID,["a"]]]]]]);
    });
    it('cstdecl 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('const a, b = 1');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.LEXDECL,["const",JsNode.LEXBIND,[JsNode.BINDID,["a"]],",",JsNode.LEXBIND,[JsNode.BINDID,["b"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]]]]]]);
    });
    it('fndecl', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('function a() {}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.FNDECL,["function",JsNode.BINDID,["a"],"(",JsNode.FMPARAMS,[],")","{",JsNode.FNBODY,[],"}"]]]]);
    });
    it('fndecl with params', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('function a(b,c) {}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.FNDECL,["function",JsNode.BINDID,["a"],"(",JsNode.FMPARAMS,[JsNode.SINGLENAME,[JsNode.BINDID,["b"]],",",JsNode.SINGLENAME,[JsNode.BINDID,["c"]]],")","{",JsNode.FNBODY,[],"}"]]]]);
    });
    it('fndecl bindelem', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('function a(b, c = 1, ...d){}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.FNDECL,["function",JsNode.BINDID,["a"],"(",JsNode.FMPARAMS,[JsNode.SINGLENAME,[JsNode.BINDID,["b"]],",",JsNode.SINGLENAME,[JsNode.BINDID,["c"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]],",",JsNode.BINDREST,["...",JsNode.BINDID,["d"]]],")","{",JsNode.FNBODY,[],"}"]]]]);
    });
    it('fndecl bindelem 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('function a(b, c = d*2){}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.FNDECL,["function",JsNode.BINDID,["a"],"(",JsNode.FMPARAMS,[JsNode.SINGLENAME,[JsNode.BINDID,["b"]],",",JsNode.SINGLENAME,[JsNode.BINDID,["c"],JsNode.INITLZ,["=",JsNode.MTPLEXPR,[JsNode.PRMREXPR,["d"],"*",JsNode.PRMREXPR,["2"]]]]],")","{",JsNode.FNBODY,[],"}"]]]]);
    });
    it('fndecl with fnbody', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('function a() {;}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.FNDECL,["function",JsNode.BINDID,["a"],"(",JsNode.FMPARAMS,[],")","{",JsNode.FNBODY,[JsNode.EMPTSTMT,[";"]],"}"]]]]);
    });
    it('fndecl rest', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('function a(...b){}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.FNDECL,["function",JsNode.BINDID,["a"],"(",JsNode.FMPARAMS,[JsNode.BINDREST,["...",JsNode.BINDID,["b"]]],")","{",JsNode.FNBODY,[],"}"]]]]);
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
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.UNARYEXPR,["~",JsNode.CALLEXPR,[JsNode.PRMREXPR,[JsNode.FNEXPR,["function","(",JsNode.FMPARAMS,[],")","{",JsNode.FNBODY,[],"}"]],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]]]]]]]);
    });
    it('fnexpr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('(function a() {})()');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CALLEXPR,[JsNode.PRMREXPR,[JsNode.CPEAPL,["(",JsNode.PRMREXPR,[JsNode.FNEXPR,["function",JsNode.BINDID,["a"],"(",JsNode.FMPARAMS,[],")","{",JsNode.FNBODY,[],"}"]],")"]],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]]]]]]);
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
    it('gendecl with yield', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('function * a(){yield}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.GENDECL,["function","*",JsNode.BINDID,["a"],"(",JsNode.FMPARAMS,[],")","{",JsNode.FNBODY,[JsNode.EXPRSTMT,[JsNode.YIELDEXPR,["yield"]]],"}"]]]]);
    });
    it('yield can not in gencmph', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('[for(yield of b)yield]');
      }).to.throwError();
    });
    it('genmethod', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('class A{*method(){}}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.CLASSDECL,["class",JsNode.BINDID,["A"],"{",JsNode.CLASSBODY,[JsNode.CLASSELEM,[JsNode.GENMETHOD,["*",JsNode.PROPTNAME,[JsNode.LTRPROPT,["method"]],"(",JsNode.FMPARAMS,[],")","{",JsNode.FNBODY,[],"}"]]],"}"]]]]);
    });
    it('gendecl error 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('function *');
      }).to.throwError();
    });
    it('gendecl error 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('function * a');
      }).to.throwError();
    });
    it('gendecl error 3', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('function * a(');
      }).to.throwError();
    });
    it('gendecl error 4', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('function * a()');
      }).to.throwError();
    });
    it('gendecl error 5', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('function * a(){');
      }).to.throwError();
    });
    it('yield expr error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('yield');
      }).to.throwError();
    });
    it('genexpr', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('!function * a(){}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.UNARYEXPR,["!",JsNode.PRMREXPR,[JsNode.GENEXPR,["function","*",JsNode.BINDID,["a"],"(",JsNode.FMPARAMS,[],")","{",JsNode.FNBODY,[],"}"]]]]]]]);
    });
    it('genexpr with yield', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('function *(){yield}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.GENDECL,["function","*","(",JsNode.FMPARAMS,[],")","{",JsNode.FNBODY,[JsNode.EXPRSTMT,[JsNode.YIELDEXPR,["yield"]]],"}"]]]]);
    });
    it('genexpr error 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('!function *');
      }).to.throwError();
    });
    it('genexpr error 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('!function * a');
      }).to.throwError();
    });
    it('genexpr error 3', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('!function * a(');
      }).to.throwError();
    });
    it('genexpr error 4', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('!function * a()');
      }).to.throwError();
    });
    it('genexpr error 5', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('!function * a(){');
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
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.ARRLTR,["[",",",",",",",JsNode.PRMREXPR,["2"],",",JsNode.PRMREXPR,["3"],",","]"]]]]]]);
    });
    it('arrltr spread', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('[...a]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.SPREAD,["...",JsNode.PRMREXPR,["a"]],"]"]]]]]]);
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
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.ARRCMPH,["[",JsNode.CMPH,[JsNode.CMPHFOR,["for","(",JsNode.BINDID,["a"],"of",JsNode.PRMREXPR,["b"],")"],JsNode.PRMREXPR,["a"]],"]"]]]]]]);
    });
    it('arrcmph with if', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('[for(a of b)if(a>1)a]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.ARRCMPH,["[",JsNode.CMPH,[JsNode.CMPHFOR,["for","(",JsNode.BINDID,["a"],"of",JsNode.PRMREXPR,["b"],")"],JsNode.CMPHIF,["if","(",JsNode.RELTEXPR,[JsNode.PRMREXPR,["a"],">",JsNode.PRMREXPR,["1"]],")"],JsNode.PRMREXPR,["a"]],"]"]]]]]]);
    });
    it('arrcmph recursion', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('[for(a of b)if(true)for(c of a)if(false)c]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.ARRCMPH,["[",JsNode.CMPH,[JsNode.CMPHFOR,["for","(",JsNode.BINDID,["a"],"of",JsNode.PRMREXPR,["b"],")"],JsNode.CMPHIF,["if","(",JsNode.PRMREXPR,["true"],")"],JsNode.CMPHFOR,["for","(",JsNode.BINDID,["c"],"of",JsNode.PRMREXPR,["a"],")"],JsNode.CMPHIF,["if","(",JsNode.PRMREXPR,["false"],")"],JsNode.PRMREXPR,["c"]],"]"]]]]]]);
    });
    it('arrcmph forbindpat', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('[for([a,b] of c)a+b]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.ARRCMPH,["[",JsNode.CMPH,[JsNode.CMPHFOR,["for","(",JsNode.ARRBINDPAT,["[",JsNode.SINGLENAME,[JsNode.BINDID,["a"]],",",JsNode.SINGLENAME,[JsNode.BINDID,["b"]],"]"],"of",JsNode.PRMREXPR,["c"],")"],JsNode.ADDEXPR,[JsNode.PRMREXPR,["a"],"+",JsNode.PRMREXPR,["b"]]],"]"]]]]]]);
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
    it('objlatr 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('({x,y}={"x":1,"y":2})');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.CPEAPL,["(",JsNode.ASSIGNEXPR,[JsNode.PRMREXPR,[JsNode.OBJLTR,["{",JsNode.PROPTDEF,["x"],",",JsNode.PROPTDEF,["y"],"}"]],"=",JsNode.PRMREXPR,[JsNode.OBJLTR,["{",JsNode.PROPTDEF,[JsNode.PROPTNAME,[JsNode.LTRPROPT,["\"x\""]],":",JsNode.PRMREXPR,["1"]],",",JsNode.PROPTDEF,[JsNode.PROPTNAME,[JsNode.LTRPROPT,["\"y\""]],":",JsNode.PRMREXPR,["2"]],"}"]]],")"]]]]]]);
    });
    it('objlatr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('({x,y,[a]})');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.CPEAPL,["(",JsNode.PRMREXPR,[JsNode.OBJLTR,["{",JsNode.PROPTDEF,["x"],",",JsNode.PROPTDEF,["y"],",",JsNode.PROPTDEF,[JsNode.CMPTPROPT,["[",JsNode.PRMREXPR,["a"],"]"]],"}"]],")"]]]]]]);
    });
    it('objlatr 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('!{a(){}}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.UNARYEXPR,["!",JsNode.PRMREXPR,[JsNode.OBJLTR,["{",JsNode.PROPTDEF,[JsNode.METHOD,[JsNode.PROPTNAME,[JsNode.LTRPROPT,["a"]],"(",JsNode.FMPARAMS,[],")","{",JsNode.FNBODY,[],"}"]],"}"]]]]]]]);
    });
    it('objlatr 4', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('~{x,y,}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.UNARYEXPR,["~",JsNode.PRMREXPR,[JsNode.OBJLTR,["{",JsNode.PROPTDEF,["x"],",",JsNode.PROPTDEF,["y"],",","}"]]]]]]]);
    });
    it('keyword can be obj\'s property', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var o = {var:1}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["o"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.OBJLTR,["{",JsNode.PROPTDEF,[JsNode.PROPTNAME,[JsNode.LTRPROPT,["var"]],":",JsNode.PRMREXPR,["1"]],"}"]]]]]]]]);
    });
    it('keyword can not be label', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('var:');
      }).to.throwError();
    });
    it('keyword after get/set', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('~{get var(){}}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.UNARYEXPR,["~",JsNode.PRMREXPR,[JsNode.OBJLTR,["{",JsNode.PROPTDEF,[JsNode.METHOD,["get",JsNode.PROPTNAME,[JsNode.LTRPROPT,["var"]],"(",")","{",JsNode.FNBODY,[],"}"]],"}"]]]]]]]);
    });
    it('newexpr 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('new A');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.NEWEXPR,["new",JsNode.PRMREXPR,["A"]]]]]]);
    });
    it('newexpr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('new A()');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.NEWEXPR,["new",JsNode.PRMREXPR,["A"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]]]]]]);
    });
    it('newexpr 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('new A().f');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.MMBEXPR,[JsNode.NEWEXPR,["new",JsNode.PRMREXPR,["A"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]],".","f"]]]]]);
    });
    it('newexpr 4', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('new A().f()');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CALLEXPR,[JsNode.MMBEXPR,[JsNode.NEWEXPR,["new",JsNode.PRMREXPR,["A"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]],".","f"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]]]]]]);
    });
    it('newexpr 5', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('new new A().f()');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.NEWEXPR,["new",JsNode.MMBEXPR,[JsNode.NEWEXPR,["new",JsNode.PRMREXPR,["A"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]],".","f"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]]]]]]);
    });
    it('newexpr 6', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('new A()[1]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.MMBEXPR,[JsNode.NEWEXPR,["new",JsNode.PRMREXPR,["A"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]],"[",JsNode.PRMREXPR,["1"],"]"]]]]]);
    });
    it('newexpr error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('new');
      }).to.throwError();
    });
    it('super 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('new super');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.NEWEXPR,["new","super"]]]]]);
    });
    it('super 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('new super()');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.NEWEXPR,["new","super",JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]]]]]]);
    });
    it('super 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('new super.a');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.NEWEXPR,["new",JsNode.MMBEXPR,["super",".","a"]]]]]]);
    });
    it('super 4', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('new super.a()');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.NEWEXPR,["new",JsNode.MMBEXPR,["super",".","a"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]]]]]]);
    });
    it('super 5', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('new super.a().b');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.MMBEXPR,[JsNode.NEWEXPR,["new",JsNode.MMBEXPR,["super",".","a"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]],".","b"]]]]]);
    });
    it('super 6', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('super.a');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.MMBEXPR,["super",".","a"]]]]]);
    });
    it('super 7', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('super["a"]()');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CALLEXPR,[JsNode.MMBEXPR,["super","[",JsNode.PRMREXPR,["\"a\""],"]"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]]]]]]);
    });
    it('super be an property', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('new a.super');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.NEWEXPR,["new",JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],".","super"]]]]]]);
    });
    it('super error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('super super');
      }).to.throwError();
    });
    it('mmbexpr 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a.b.c');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.MMBEXPR,[JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],".","b"],".","c"]]]]]);
    });
    it('mmbexpr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a.b[c]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.MMBEXPR,[JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],".","b"],"[",JsNode.PRMREXPR,["c"],"]"]]]]]);
    });
    it('mmbexpr 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a.b');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],".","b"]]]]]);
    });
    it('mmbexpr 4', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a[2]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],"[",JsNode.PRMREXPR,["2"],"]"]]]]]);
    });
    it('mmbexpr error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('a.');
      }).to.throwError();
    });
    it('postfixexpr 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a++ + b');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.ADDEXPR,[JsNode.POSTFIXEXPR,[JsNode.PRMREXPR,["a"],"++"],"+",JsNode.PRMREXPR,["b"]]]]]]);
    });
    it('postfixexpr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a\nb++');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,["a"]],JsNode.EXPRSTMT,[JsNode.POSTFIXEXPR,[JsNode.PRMREXPR,["b"],"++"]]]]]);
    });
    it('postfixexpr 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a/*\n*/b++');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,["a"]],JsNode.EXPRSTMT,[JsNode.POSTFIXEXPR,[JsNode.PRMREXPR,["b"],"++"]]]]]);
    });
    it('postfixexpr 4', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a++');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.POSTFIXEXPR,[JsNode.PRMREXPR,["a"],"++"]]]]]);
    });
    it('postfixexpr error 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('a++ ++');
      }).to.throwError();
    });
    it('postfixexpr error 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('++');
      }).to.throwError();
    });
    it('prmrexpr 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,["a"]]]]]);
    });
    it('prmrexpr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('true');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,["true"]]]]]);
    });
    it('prmrexpr 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('null');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,["null"]]]]]);
    });
    it('prmrexpr 4', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('this');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,["this"]]]]]);
    });
    it('prmrexpr 5', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('false');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,["false"]]]]]);
    });
    it('prmrexpr 6', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('[]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.ARRLTR,["[","]"]]]]]]);
    });
    it('prmrexpr 7', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('!{}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.UNARYEXPR,["!",JsNode.PRMREXPR,[JsNode.OBJLTR,["{","}"]]]]]]]);
    });
    it('prmrexpr error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('.');
      }).to.throwError();
    });
    it('callexpr 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a()');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CALLEXPR,[JsNode.PRMREXPR,["a"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]]]]]]);
    });
    it('callexpr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a.b()');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CALLEXPR,[JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],".","b"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]]]]]]);
    });
    it('callexpr 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('new A().f()');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CALLEXPR,[JsNode.MMBEXPR,[JsNode.NEWEXPR,["new",JsNode.PRMREXPR,["A"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]],".","f"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]]]]]]);
    });
    it('callexpr 4', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('f()()');
      expect(tree(node)).to.eql(
        [JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CALLEXPR,[JsNode.CALLEXPR,[JsNode.PRMREXPR,["f"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]]]]]]);
    });
    it('callexpr 5', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('f().b[1]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.MMBEXPR,[JsNode.MMBEXPR,[JsNode.CALLEXPR,[JsNode.PRMREXPR,["f"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]],".","b"],"[",JsNode.PRMREXPR,["1"],"]"]]]]]);
    });
    it('callexpr 6', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a.b().c.d()');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CALLEXPR,[JsNode.MMBEXPR,[JsNode.MMBEXPR,[JsNode.CALLEXPR,[JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],".","b"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]],".","c"],".","d"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]]]]]]);
    });
    it('callexpr error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('f(');
      }).to.throwError();
    });
    it('unaryexpr 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('typeof a');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.UNARYEXPR,["typeof",JsNode.PRMREXPR,["a"]]]]]]);
    });
    it('unaryexpr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('!!0');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.UNARYEXPR,["!",JsNode.UNARYEXPR,["!",JsNode.PRMREXPR,["0"]]]]]]]);
    });
    it('unaryexpr error 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('!');
      }).to.throwError();
    });
    it('unaryexpr error 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('++ +a');
      }).to.throwError();
    });
    it('mtplexpr 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a * b');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.MTPLEXPR,[JsNode.PRMREXPR,["a"],"*",JsNode.PRMREXPR,["b"]]]]]]);
    });
    it('mtplexpr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a() * b[0]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.MTPLEXPR,[JsNode.CALLEXPR,[JsNode.PRMREXPR,["a"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]],"*",JsNode.MMBEXPR,[JsNode.PRMREXPR,["b"],"[",JsNode.PRMREXPR,["0"],"]"]]]]]]);
    });
    it('mtplexpr 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('!a * b--');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.MTPLEXPR,[JsNode.UNARYEXPR,["!",JsNode.PRMREXPR,["a"]],"*",JsNode.POSTFIXEXPR,[JsNode.PRMREXPR,["b"],"--"]]]]]]);
    });
    it('addexpr 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a + b * 2 - c');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.ADDEXPR,[JsNode.PRMREXPR,["a"],"+",JsNode.MTPLEXPR,[JsNode.PRMREXPR,["b"],"*",JsNode.PRMREXPR,["2"]],"-",JsNode.PRMREXPR,["c"]]]]]]);
    });
    it('addexpr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('~a + a++ + ++a');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.ADDEXPR,[JsNode.UNARYEXPR,["~",JsNode.PRMREXPR,["a"]],"+",JsNode.POSTFIXEXPR,[JsNode.PRMREXPR,["a"],"++"],"+",JsNode.UNARYEXPR,["++",JsNode.PRMREXPR,["a"]]]]]]]);
    });
    it('shiftexpr 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a>>a+1');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.SHIFTEXPR,[JsNode.PRMREXPR,["a"],">>",JsNode.ADDEXPR,[JsNode.PRMREXPR,["a"],"+",JsNode.PRMREXPR,["1"]]]]]]]);
    });
    it('shiftexpr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a*b>>>c/d<<--e');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.SHIFTEXPR,[JsNode.MTPLEXPR,[JsNode.PRMREXPR,["a"],"*",JsNode.PRMREXPR,["b"]],">>>",JsNode.MTPLEXPR,[JsNode.PRMREXPR,["c"],"/",JsNode.PRMREXPR,["d"]],"<<",JsNode.UNARYEXPR,["--",JsNode.PRMREXPR,["e"]]]]]]]);
    });
    it('reltexpr 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a > b');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.RELTEXPR,[JsNode.PRMREXPR,["a"],">",JsNode.PRMREXPR,["b"]]]]]]);
    });
    it('reltexpr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a <= b+1');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.RELTEXPR,[JsNode.PRMREXPR,["a"],"<=",JsNode.ADDEXPR,[JsNode.PRMREXPR,["b"],"+",JsNode.PRMREXPR,["1"]]]]]]]);
    });
    it('reltexpr 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a instanceof new A()');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.RELTEXPR,[JsNode.PRMREXPR,["a"],"instanceof",JsNode.NEWEXPR,["new",JsNode.PRMREXPR,["A"],JsNode.ARGS,["(",JsNode.ARGLIST,[],")"]]]]]]]);
    });
    it('reltexpr error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('a <');
      }).to.throwError();
    });
    it('eqexpr 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a == 3');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.EQEXPR,[JsNode.PRMREXPR,["a"],"==",JsNode.PRMREXPR,["3"]]]]]]);
    });
    it('eqexpr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a === b + 3');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.EQEXPR,[JsNode.PRMREXPR,["a"],"===",JsNode.ADDEXPR,[JsNode.PRMREXPR,["b"],"+",JsNode.PRMREXPR,["3"]]]]]]]);
    });
    it('eqexpr 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a !== b >>> 4');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.EQEXPR,[JsNode.PRMREXPR,["a"],"!==",JsNode.SHIFTEXPR,[JsNode.PRMREXPR,["b"],">>>",JsNode.PRMREXPR,["4"]]]]]]]);
    });
    it('eqexpr error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('a ==');
      }).to.throwError();
    });
    it('bitandexpr', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('void a & --b');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.BITANDEXPR,[JsNode.UNARYEXPR,["void",JsNode.PRMREXPR,["a"]],"&",JsNode.UNARYEXPR,["--",JsNode.PRMREXPR,["b"]]]]]]]);
    });
    it('bitxorexpr', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a>1 ^ b--');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.BITXOREXPR,[JsNode.RELTEXPR,[JsNode.PRMREXPR,["a"],">",JsNode.PRMREXPR,["1"]],"^",JsNode.POSTFIXEXPR,[JsNode.PRMREXPR,["b"],"--"]]]]]]);
    });
    it('bitorexpr', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('++b | -a');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.BITOREXPR,[JsNode.UNARYEXPR,["++",JsNode.PRMREXPR,["b"]],"|",JsNode.UNARYEXPR,["-",JsNode.PRMREXPR,["a"]]]]]]]);
    });
    it('logandexpr', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a.b && c >> 1');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.LOGANDEXPR,[JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],".","b"],"&&",JsNode.SHIFTEXPR,[JsNode.PRMREXPR,["c"],">>",JsNode.PRMREXPR,["1"]]]]]]]);
    });
    it('logorexpr', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a || b && c || d && f');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.LOGOREXPR,[JsNode.PRMREXPR,["a"],"||",JsNode.LOGANDEXPR,[JsNode.PRMREXPR,["b"],"&&",JsNode.PRMREXPR,["c"]],"||",JsNode.LOGANDEXPR,[JsNode.PRMREXPR,["d"],"&&",JsNode.PRMREXPR,["f"]]]]]]]);
    });
    it('condexpr', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a && b ? false || true : typeof null');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CNDTEXPR,[JsNode.LOGANDEXPR,[JsNode.PRMREXPR,["a"],"&&",JsNode.PRMREXPR,["b"]],"?",JsNode.LOGOREXPR,[JsNode.PRMREXPR,["false"],"||",JsNode.PRMREXPR,["true"]],":",JsNode.UNARYEXPR,["typeof",JsNode.PRMREXPR,["null"]]]]]]]);
    });
    it('assignexpr 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a = b = c');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.ASSIGNEXPR,[JsNode.PRMREXPR,["a"],"=",JsNode.ASSIGNEXPR,[JsNode.PRMREXPR,["b"],"=",JsNode.PRMREXPR,["c"]]]]]]]);
    });
    it('assignexpr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a += b %= c');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.ASSIGNEXPR,[JsNode.PRMREXPR,["a"],"+=",JsNode.ASSIGNEXPR,[JsNode.PRMREXPR,["b"],"%=",JsNode.PRMREXPR,["c"]]]]]]]);
    });
    it('assignexpr error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('a + b = c');
      }).to.throwError();
    });
    it('expr 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('(1)');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.CPEAPL,["(",JsNode.PRMREXPR,["1"],")"]]]]]]);
    });
    it('expr 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('(a, !b, c+d)');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.CPEAPL,["(",JsNode.EXPR,[JsNode.PRMREXPR,["a"],",",JsNode.UNARYEXPR,["!",JsNode.PRMREXPR,["b"]],",",JsNode.ADDEXPR,[JsNode.PRMREXPR,["c"],"+",JsNode.PRMREXPR,["d"]]],")"]]]]]]);
    });
    it('expr 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('(a, ...b)');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.CPEAPL,["(",JsNode.PRMREXPR,["a"],",","...",JsNode.BINDID,["b"],")"]]]]]]);
    });
    it('expr error 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('(a,');
      }).to.throwError();
    });
    it('expr error 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('(a, b');
      }).to.throwError();
    });
    it('expr error 3', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('(a...b)');
      }).to.throwError();
    });
    it('expr error 4', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('(...a, b)');
      }).to.throwError();
    });
    it('returnstmt 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('return a');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.RETSTMT,["return",JsNode.PRMREXPR,["a"]]]]]);
    });
    it('returnstmt 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('return\na');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.RETSTMT,["return"],JsNode.EXPRSTMT,[JsNode.PRMREXPR,["a"]]]]]);
    });
    it('returnstmt 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('return/*\n*/a');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.RETSTMT,["return"],JsNode.EXPRSTMT,[JsNode.PRMREXPR,["a"]]]]]);
    });
    it('returnstmt 4', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('return a\nreturn');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.RETSTMT,["return",JsNode.PRMREXPR,["a"]],JsNode.RETSTMT,["return"]]]]);
    });
    it('returnstmt 5', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('{return}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.BLOCKSTMT,[JsNode.BLOCK,["{",JsNode.RETSTMT,["return"],"}"]]]]]);
    });
    it('labelstmt', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('label:;');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.LABSTMT,["label",":",JsNode.EMPTSTMT,[";"]]]]]);
    });
    it('block', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('{}{}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.BLOCKSTMT,[JsNode.BLOCK,["{","}"]],JsNode.BLOCKSTMT,[JsNode.BLOCK,["{","}"]]]]]);
    });
    it('varstmt 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var a, b;');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["a"]],",",JsNode.VARDECL,[JsNode.BINDID,["b"]],";"]]]]);
    });
    it('varstmt 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var a = 1');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["a"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]]]]]]);
    });
    it('varstmt 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var a = b = 1');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["a"],JsNode.INITLZ,["=",JsNode.ASSIGNEXPR,[JsNode.PRMREXPR,["b"],"=",JsNode.PRMREXPR,["1"]]]]]]]]);
    });
    it('varstmt 4', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var a = [{}]');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["a"],JsNode.INITLZ,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,[JsNode.OBJLTR,["{","}"]],"]"]]]]]]]]);
    });
    it('varstmt error 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('var')
      }).to.throwError();
    });
    it('varstmt error 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('var a=');
      }).to.throwError();
    });
    it('emptstmt', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse(';{;}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EMPTSTMT,[";"],JsNode.BLOCKSTMT,[JsNode.BLOCK,["{",JsNode.EMPTSTMT,[";"],"}"]]]]]);
    });
    it('ifstmt 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('if(true);');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.IFSTMT,["if","(",JsNode.PRMREXPR,["true"],")",JsNode.EMPTSTMT,[";"]]]]]);
    });
    it('ifstmt 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('if(true){}else if(true){}else{}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.IFSTMT,["if","(",JsNode.PRMREXPR,["true"],")",JsNode.BLOCKSTMT,[JsNode.BLOCK,["{","}"]],"else",JsNode.IFSTMT,["if","(",JsNode.PRMREXPR,["true"],")",JsNode.BLOCKSTMT,[JsNode.BLOCK,["{","}"]],"else",JsNode.BLOCKSTMT,[JsNode.BLOCK,["{","}"]]]]]]]);
    });
    it('ifstmt missing stmt', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('if(true)');
      }).to.throwError();
    });
    it('whilestmt 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('while(false);');
      expect(tree(node)).to.eql(
        [JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.EMPTSTMT,[";"]]]]]);
    });
    it('whilestmt 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('while(false){}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.BLOCKSTMT,[JsNode.BLOCK,["{","}"]]]]]]);
    });
    it('dowhilestmt 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('do;while(false)');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["do",JsNode.EMPTSTMT,[";"],"while","(",JsNode.PRMREXPR,["false"],")"]]]]);
    });
    it('dowhilestmt 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('do{}while(false)');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["do",JsNode.BLOCKSTMT,[JsNode.BLOCK,["{","}"]],"while","(",JsNode.PRMREXPR,["false"],")"]]]]);
    });
    it('forstmt 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('for(;;){}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["for","(",";",";",")",JsNode.BLOCKSTMT,[JsNode.BLOCK,["{","}"]]]]]]);
    });
    it('forstmt 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('for(var a = 1; a < len; a++){}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["for","(",JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["a"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]]],";",JsNode.RELTEXPR,[JsNode.PRMREXPR,["a"],"<",JsNode.PRMREXPR,["len"]],";",JsNode.POSTFIXEXPR,[JsNode.PRMREXPR,["a"],"++"],")",JsNode.BLOCKSTMT,[JsNode.BLOCK,["{","}"]]]]]]);
    });
    it('forstmt 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('for(o in {});');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["for","(",JsNode.PRMREXPR,["o"],"in",JsNode.PRMREXPR,[JsNode.OBJLTR,["{","}"]],")",JsNode.EMPTSTMT,[";"]]]]]);
    });
    it('forstmt 4', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('for(var k in {}){}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["for","(",JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["k"]]],"in",JsNode.PRMREXPR,[JsNode.OBJLTR,["{","}"]],")",JsNode.BLOCKSTMT,[JsNode.BLOCK,["{","}"]]]]]]);
    });
    it('forstmt 5', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('for(new A in [1,2]);');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["for","(",JsNode.NEWEXPR,["new",JsNode.PRMREXPR,["A"]],"in",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,["1"],",",JsNode.PRMREXPR,["2"],"]"]],")",JsNode.EMPTSTMT,[";"]]]]]);
    });
    it('forstmt 6', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('for(a.b in [1,2]);');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["for","(",JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],".","b"],"in",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,["1"],",",JsNode.PRMREXPR,["2"],"]"]],")",JsNode.EMPTSTMT,[";"]]]]]);
    });
    it('forstmt 7', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('for(new A of [1,2]);');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["for","(",JsNode.NEWEXPR,["new",JsNode.PRMREXPR,["A"]],"of",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,["1"],",",JsNode.PRMREXPR,["2"],"]"]],")",JsNode.EMPTSTMT,[";"]]]]]);
    });
    it('forstmt 8', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('for(a.b of [1,2]);');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["for","(",JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],".","b"],"of",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,["1"],",",JsNode.PRMREXPR,["2"],"]"]],")",JsNode.EMPTSTMT,[";"]]]]]);
    });
    it('forstmt 9', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('for(let a in {});');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["for","(","let",JsNode.BINDID,["a"],"in",JsNode.PRMREXPR,[JsNode.OBJLTR,["{","}"]],")",JsNode.EMPTSTMT,[";"]]]]]);
    });
    it('forstmt missing expr', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('for(');
      }).to.throwError();
    });
    it('forstmt leftexpr error 1', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('for(a() in b);');
      }).to.throwError();
    });
    it('forstmt leftexpr error 2', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('for(a() of b);');
      }).to.throwError();
    });
    it('forstmt let error', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('for(left a = 1;;);');
      }).to.throwError();
    });
    it('forstmt missing ; 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('for(var a');
      }).to.throwError();
    });
    it('forstmt missing ; 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('for(var a;');
      }).to.throwError();
    });
    it('forstmt missing ; 3', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('for(var a;a > 10;');
      }).to.throwError();
    });
    it('forstmt missing ; 4', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('for(a');
      }).to.throwError();
    });
    it('forstmt missing ; 5', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('for(a;');
      }).to.throwError();
    });
    it('forstmt missing ; 6', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('for(a;b');
      }).to.throwError();
    });
    it('forstmt missing ; 7', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('for(a;b;');
      }).to.throwError();
    });
    it('forstmt with in could not has multi varstmt', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('for(var a,b in {});');
      }).to.throwError();
    });
    it('forstmt with in first', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('for(in {});');
      }).to.throwError();
    });
    it('cntnstmt 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('while(false){continue;}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.BLOCKSTMT,[JsNode.BLOCK,["{",JsNode.CNTNSTMT,["continue",";"],"}"]]]]]]);
    });
    it('cntnstmt 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('while(false){continue a;}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.BLOCKSTMT,[JsNode.BLOCK,["{",JsNode.CNTNSTMT,["continue","a",";"],"}"]]]]]]);
    });
    it('cntnstmt 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('while(false){continue\na;}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.BLOCKSTMT,[JsNode.BLOCK,["{",JsNode.CNTNSTMT,["continue"],JsNode.EXPRSTMT,[JsNode.PRMREXPR,["a"],";"],"}"]]]]]]);
    });
    it('brkstmt 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('while(false){break;}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.BLOCKSTMT,[JsNode.BLOCK,["{",JsNode.BRKSTMT,["break",";"],"}"]]]]]]);
    });
    it('brkstmt 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('while(false){break a;}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.BLOCKSTMT,[JsNode.BLOCK,["{",JsNode.BRKSTMT,["break","a",";"],"}"]]]]]]);
    });
    it('brkstmt 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('while(false){break\na;}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.BLOCKSTMT,[JsNode.BLOCK,["{",JsNode.BRKSTMT,["break"],JsNode.EXPRSTMT,[JsNode.PRMREXPR,["a"],";"],"}"]]]]]]);
    });
    it('swchstmt', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('switch(a){case 1:case 2:;break;default:;}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.SWCHSTMT,["switch","(",JsNode.PRMREXPR,["a"],")",JsNode.CASEBLOCK,["{",JsNode.CASECLAUSE,["case",JsNode.PRMREXPR,["1"],":"],JsNode.CASECLAUSE,["case",JsNode.PRMREXPR,["2"],":",JsNode.EMPTSTMT,[";"],JsNode.BRKSTMT,["break",";"]],JsNode.DFTCLAUSE,["default",":",JsNode.EMPTSTMT,[";"]],"}"]]]]]);
    });
    it('withstmt', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('with(a){}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.WITHSTMT,["with","(",JsNode.PRMREXPR,["a"],")",JsNode.BLOCKSTMT,[JsNode.BLOCK,["{","}"]]]]]]);
    });
    it('withstmt error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('with(){}');
      }).to.throwError();
    });
    it('swchstmt error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('switch(a){else:;}');
      }).to.throwError();
    });
    it('thrstmt', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('throw e;');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.THRSTMT,["throw",JsNode.PRMREXPR,["e"],";"]]]]);
    });
    it('thrstmt error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('throw');
      }).to.throwError();
    });
    it('trystmt 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('try{}catch(e){}finally{}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.TRYSTMT,["try",JsNode.BLOCK,["{","}"],JsNode.CACH,["catch","(",JsNode.CACHPARAM,[JsNode.BINDID,["e"]],")",JsNode.BLOCK,["{","}"]],JsNode.FINL,["finally",JsNode.BLOCK,["{","}"]]]]]]);
    });
    it('trystmt 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('try{}finally{}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.TRYSTMT,["try",JsNode.BLOCK,["{","}"],JsNode.FINL,["finally",JsNode.BLOCK,["{","}"]]]]]]);
    });
    it('trystmt error 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('try');
      }).to.throwError();
    });
    it('trystmt error 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('try{');
      }).to.throwError();
    });
    it('trystmt error 3', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('try{}catch');
      }).to.throwError();
    });
    it('trystmt error 4', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('try{}catch{');
      }).to.throwError();
    });
    it('trystmt error 5', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('try{}catch(');
      }).to.throwError();
    });
    it('trystmt error 6', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('try{}catch()');
      }).to.throwError();
    });
    it('trystmt error 7', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('try{}catch(a,b)');
      }).to.throwError();
    });
    it('trystmt error 8', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('try{}catch(a){');
      }).to.throwError();
    });
    it('trystmt error 9', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('try{}finally');
      }).to.throwError();
    });
    it('debstmt', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('debugger;');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.DEBSTMT,["debugger",";"]]]]);
    });
    it('empty 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[]]);
    });
    it('empty 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse();
      expect(tree(node)).to.eql([JsNode.SCRIPT,[]]);
    });
    it('class 1', function() {
      var parser= homunculus.getParser('es6');
      var node = parser.parse('class A{}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.CLASSDECL,["class",JsNode.BINDID,["A"],"{",JsNode.CLASSBODY,[],"}"]]]]);
    });
    it('class 2', function() {
      var parser= homunculus.getParser('es6');
      var node = parser.parse('class A{;;}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.CLASSDECL,["class",JsNode.BINDID,["A"],"{",JsNode.CLASSBODY,[JsNode.CLASSELEM,[";"],JsNode.CLASSELEM,[";"]],"}"]]]]);
    });
    it('class with extends', function() {
      var parser= homunculus.getParser('es6');
      var node = parser.parse('class A extends B{}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.CLASSDECL,["class",JsNode.BINDID,["A"],JsNode.HERITAGE,["extends",JsNode.PRMREXPR,["B"]],"{",JsNode.CLASSBODY,[],"}"]]]]);
    });
    it('class method', function() {
      var parser= homunculus.getParser('es6');
      var node = parser.parse('class A{method(b){}}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.CLASSDECL,["class",JsNode.BINDID,["A"],"{",JsNode.CLASSBODY,[JsNode.CLASSELEM,[JsNode.METHOD,[JsNode.PROPTNAME,[JsNode.LTRPROPT,["method"]],"(",JsNode.FMPARAMS,[JsNode.SINGLENAME,[JsNode.BINDID,["b"]]],")","{",JsNode.FNBODY,[],"}"]]],"}"]]]]);
    });
    it('class static', function() {
      var parser= homunculus.getParser('es6');
      var node = parser.parse('class A{static method(){}}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.CLASSDECL,["class",JsNode.BINDID,["A"],"{",JsNode.CLASSBODY,[JsNode.CLASSELEM,["static",JsNode.METHOD,[JsNode.PROPTNAME,[JsNode.LTRPROPT,["method"]],"(",JsNode.FMPARAMS,[],")","{",JsNode.FNBODY,[],"}"]]],"}"]]]]);
    });
    it('class get', function() {
      var parser= homunculus.getParser('es6');
      var node = parser.parse('class A{get a(){return}}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.CLASSDECL,["class",JsNode.BINDID,["A"],"{",JsNode.CLASSBODY,[JsNode.CLASSELEM,[JsNode.METHOD,["get",JsNode.PROPTNAME,[JsNode.LTRPROPT,["a"]],"(",")","{",JsNode.FNBODY,[JsNode.RETSTMT,["return"]],"}"]]],"}"]]]]);
    });
    it('class set', function() {
      var parser= homunculus.getParser('es6');
      var node = parser.parse('class A{set a(b){}}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.CLASSDECL,["class",JsNode.BINDID,["A"],"{",JsNode.CLASSBODY,[JsNode.CLASSELEM,[JsNode.METHOD,["set",JsNode.PROPTNAME,[JsNode.LTRPROPT,["a"]],"(",JsNode.FMPARAMS,[JsNode.SINGLENAME,[JsNode.BINDID,["b"]]],")","{",JsNode.FNBODY,[],"}"]]],"}"]]]]);
    });
    it('class error 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('class');
      }).to.throwError();
    });
    it('class error 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('class A');
      }).to.throwError();
    });
    it('class error 3', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('class A extends');
      }).to.throwError();
    });
    it('class error 4', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('class A {');
      }).to.throwError();
    });
    it('class error 4', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('class A {get method{');
      }).to.throwError();
    });
    it('classexpr', function() {
      var parser= homunculus.getParser('es6');
      var node = parser.parse('!class A extends B{}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.UNARYEXPR,["!",JsNode.PRMREXPR,[JsNode.CLASSEXPR,["class",JsNode.BINDID,["A"],JsNode.HERITAGE,["extends",JsNode.PRMREXPR,["B"]],"{",JsNode.CLASSBODY,[],"}"]]]]]]]);
    });
    it('classexpr error 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('!class A');
      }).to.throwError();
    });
    it('classexpr error 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('!class A extends');
      }).to.throwError();
    });
    it('classexpr error 3', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('!class A {');
      }).to.throwError();
    });
    it('arrowfn 1', function() {
      var parser= homunculus.getParser('es6');
      var node = parser.parse('a => a');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.ARROWFN,[JsNode.ARROWPARAMS,["a"],"=>",JsNode.CNCSBODY,[JsNode.PRMREXPR,["a"]]]]]]]);
    });
    it('arrowfn 2', function() {
      var parser= homunculus.getParser('es6');
      var node = parser.parse('(a, b) => a + b');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.ARROWFN,[JsNode.ARROWPARAMS,[JsNode.CPEAPL,["(",JsNode.EXPR,[JsNode.PRMREXPR,["a"],",",JsNode.PRMREXPR,["b"]],")"]],"=>",JsNode.CNCSBODY,[JsNode.ADDEXPR,[JsNode.PRMREXPR,["a"],"+",JsNode.PRMREXPR,["b"]]]]]]]]);
    });
    it('arrowfn 3', function() {
      var parser= homunculus.getParser('es6');
      var node = parser.parse('(a, b) => {;return a-b}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.ARROWFN,[JsNode.ARROWPARAMS,[JsNode.CPEAPL,["(",JsNode.EXPR,[JsNode.PRMREXPR,["a"],",",JsNode.PRMREXPR,["b"]],")"]],"=>",JsNode.CNCSBODY,["{",JsNode.FNBODY,[JsNode.EMPTSTMT,[";"],JsNode.RETSTMT,["return",JsNode.ADDEXPR,[JsNode.PRMREXPR,["a"],"-",JsNode.PRMREXPR,["b"]]]],"}"]]]]]]);
    });
    it('arrowfn error 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('a =>');
      }).to.throwError();
    });
    it('arrowfn error 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('a => {');
      }).to.throwError();
    });
    it('module from', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('module a from "a"');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.MODULEIMPORT,["module",JsNode.BINDID,["a"],JsNode.FROMCAULSE,["from","\"a\""]]]]]);
    });
    it('module import', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('import "a"');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.IMPORTDECL,["import","\"a\""]]]]);
    });
    it('module import from 1', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('import {} from "a"');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.IMPORTDECL,["import",JsNode.IMPORTCAULSE,[JsNode.NAMEIMPORT,["{","}"]],JsNode.FROMCAULSE,["from","\"a\""]]]]]);
    });
    it('module import from 2', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('import {x} from "a"');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.IMPORTDECL,["import",JsNode.IMPORTCAULSE,[JsNode.NAMEIMPORT,["{",JsNode.IMPORTSPEC,["x"],"}"]],JsNode.FROMCAULSE,["from","\"a\""]]]]]);
    });
    it('module import from 3', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('import x from "a"');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.IMPORTDECL,["import",JsNode.IMPORTCAULSE,["x"],JsNode.FROMCAULSE,["from","\"a\""]]]]]);
    });
    it('module import from as', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('import x,{y as z,} from "a"');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.IMPORTDECL,["import",JsNode.IMPORTCAULSE,["x",",",JsNode.NAMEIMPORT,["{",JsNode.IMPORTSPEC,["y","as",JsNode.BINDID,["z"]],",","}"]],JsNode.FROMCAULSE,["from","\"a\""]]]]]);
    });
    it('module export *', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('export * from "a"');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.MODULEBODY,[JsNode.EXPORTDECL,["export","*",JsNode.FROMCAULSE,["from","\"a\""]]]]]);
    });
    it('module export from', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('export {x} from "a"');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.MODULEBODY,[JsNode.EXPORTDECL,["export",JsNode.EXPORTCAULSE,["{",JsNode.EXPORTSPEC,["x"],"}"],JsNode.FROMCAULSE,["from","\"a\""]]]]]);
    });
    it('module var', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('export var a = 1');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.MODULEBODY,[JsNode.EXPORTDECL,["export",JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["a"],JsNode.INITLZ,["=",JsNode.PRMREXPR,["1"]]]]]]]]);
    });
    it('module decl', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('export function *(){}');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.MODULEBODY,[JsNode.EXPORTDECL,["export",JsNode.GENDECL,["function","*","(",JsNode.FMPARAMS,[],")","{",JsNode.FNBODY,[],"}"]]]]]);
    });
    it('module default', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('export default a+b');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.MODULEBODY,[JsNode.EXPORTDECL,["export","default",JsNode.ADDEXPR,[JsNode.PRMREXPR,["a"],"+",JsNode.PRMREXPR,["b"]]]]]]);
    });
    it('module be an id', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var module');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.VARSTMT,["var",JsNode.VARDECL,[JsNode.BINDID,["module"]]]]]]);
    });
    it('module error 1', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('module a');
      }).to.throwError();
    });
    it('module error 2', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('module a from');
      }).to.throwError();
    });
    it('module error 3', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('import');
      }).to.throwError();
    });
    it('module error 4', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('import x');
      }).to.throwError();
    });
    it('module error 5', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('import x from');
      }).to.throwError();
    });
    it('module error 6', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('export');
      }).to.throwError();
    });
    it('module error 7', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('export x');
      }).to.throwError();
    });
    it('module error 8', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('export "a"');
      }).to.throwError();
    });
    it('module error 9', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('export x from');
      }).to.throwError();
    });
    it('export module import be property name', function() {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('a.export = 1');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.ASSIGNEXPR,[JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],".","export"],"=",JsNode.PRMREXPR,["1"]]]]]]);
    });
  });
  describe('other test', function() {
    it('node #parent,#prev,#next', function () {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var a, b;');
      var varstmt = node.leaf(0).leaf(0);
      var children = varstmt.leaves();
      var a = children[0];
      var b = children[1];
      expect(node.parent()).to.be(null);
      expect(a.parent()).to.be(varstmt);
      expect(b.parent()).to.be(varstmt);
      expect(a.prev()).to.be(null);
      expect(a.next()).to.be(b);
      expect(b.prev()).to.be(a);
    });
    it('node #leaf,#size,#leaves', function () {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var a');
      var varstmt = node.leaf(0).leaf(0);
      expect(varstmt.name()).to.be(JsNode.VARSTMT);
      expect(varstmt.size()).to.be(3);
    });
    it('#ast should return as parse return', function () {
      var parser = homunculus.getParser('es6');
      var node = parser.parse('var a, b;');
      expect(node).to.equal(parser.ast());
    });
    it('init class Parser(lexer) with a lexer', function () {
      var lexer = homunculus.getLexer('es6');
      var parser = new Parser(lexer);
      var node = parser.parse('var a, b;');
      expect(node).to.equal(parser.ast());
      expect(function () {
        parser.init();
      }).to.not.throwError();
    });
    it('JsNode#getKey', function () {
      expect(JsNode.getKey('script')).to.eql('SCRIPT');
      expect(function () {
        JsNode.getKey('');
      }).to.throwError();
    });
  });
});