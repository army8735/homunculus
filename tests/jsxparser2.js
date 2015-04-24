var homunculus = require('../');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Token = homunculus.getClass('token', 'jsx');
var Parser = homunculus.getClass('parser', 'jsx');
var JsNode = homunculus.getClass('node', 'jsx');

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

describe('jsxparser2', function() {
  describe('simple test', function() {
    it('single close', function() {
      var parser = homunculus.getParser('jsx');
      var node = parser.parse('<a/>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.JSXSelfClosingElement,["<","a","/>"]]]]]);
    });
    it('with one attr', function() {
      var parser = homunculus.getParser('jsx');
      var node = parser.parse('<a href="#"/>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.JSXSelfClosingElement,["<","a",JsNode.JSXAttributes,[JsNode.JSXAttribute,["href","=","\"#\""]],"/>"]]]]]);
    });
    it('with servel attr', function() {
      var parser = homunculus.getParser('jsx');
      var node = parser.parse('<a href="#" name="test" data-num=123/>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.JSXSelfClosingElement,["<","a",JsNode.JSXAttributes,[JsNode.JSXAttribute,["href","=","\"#\""],JsNode.JSXAttribute,["name","=","\"test\""],JsNode.JSXAttribute,["data-num","=","123"]],"/>"]]]]]);
    });
    it('with spread attr', function() {
      var parser = homunculus.getParser('jsx');
      var node = parser.parse('<a href="#" {...somedata}/>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.JSXSelfClosingElement,["<","a",JsNode.JSXAttributes,[JsNode.JSXAttribute,["href","=","\"#\""],JsNode.JSXSpreadAttribute,["{","...",JsNode.PRMREXPR,["somedata"],"}"]],"/>"]]]]]);
    });
    it('with js attr value', function() {
      var parser = homunculus.getParser('jsx');
      var node = parser.parse('<a href="#" data={a++}/>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.JSXSelfClosingElement,["<","a",JsNode.JSXAttributes,[JsNode.JSXAttribute,["href","=","\"#\""],JsNode.JSXAttribute,["data","=",JsNode.JSXAttributeValue,["{",JsNode.POSTFIXEXPR,[JsNode.PRMREXPR,["a"],"++"],"}"]]],"/>"]]]]]);
    });
    it('empty text with js', function() {
      var parser = homunculus.getParser('jsx');
      var node = parser.parse('<a>1{}2</a>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.JSXElement,[JsNode.JSXOpeningElement,["<","a",">"],"1",JsNode.JSXChild,["{","}"],"2",JsNode.JSXClosingElement,["</","a",">"]]]]]]);
    });
    it('text with js 1', function() {
      var parser = homunculus.getParser('jsx');
      var node = parser.parse('<a>1{b}2</a>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.JSXElement,[JsNode.JSXOpeningElement,["<","a",">"],"1",JsNode.JSXChild,["{",JsNode.PRMREXPR,["b"],"}"],"2",JsNode.JSXClosingElement,["</","a",">"]]]]]]);
    });
    it('text with js 2', function() {
      var parser = homunculus.getParser('jsx');
      var node = parser.parse('<a>111{a?b:c}222</a>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.JSXElement,[JsNode.JSXOpeningElement,["<","a",">"],"111",JsNode.JSXChild,["{",JsNode.CNDTEXPR,[JsNode.PRMREXPR,["a"],"?",JsNode.PRMREXPR,["b"],":",JsNode.PRMREXPR,["c"]],"}"],"222",JsNode.JSXClosingElement,["</","a",">"]]]]]]);
    });
    it('recursion 1', function() {
      var parser = homunculus.getParser('jsx');
      var node = parser.parse('<a>{a?<b>1</b>:<b>2</b>}222</a>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.JSXElement,[JsNode.JSXOpeningElement,["<","a",">"],JsNode.JSXChild,["{",JsNode.CNDTEXPR,[JsNode.PRMREXPR,["a"],"?",JsNode.JSXElement,[JsNode.JSXOpeningElement,["<","b",">"],"1",JsNode.JSXClosingElement,["</","b",">"]],":",JsNode.JSXElement,[JsNode.JSXOpeningElement,["<","b",">"],"2",JsNode.JSXClosingElement,["</","b",">"]]],"}"],"222",JsNode.JSXClosingElement,["</","a",">"]]]]]]);
    });
    it('recursion 2', function() {
      var parser = homunculus.getParser('jsx');
      var node = parser.parse('<a>111{[<b/>,"",<span>{test}</span>]}222</a>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.JSXElement,[JsNode.JSXOpeningElement,["<","a",">"],"111",JsNode.JSXChild,["{",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.JSXSelfClosingElement,["<","b","/>"],",",JsNode.PRMREXPR,["\"\""],",",JsNode.JSXElement,[JsNode.JSXOpeningElement,["<","span",">"],JsNode.JSXChild,["{",JsNode.PRMREXPR,["test"],"}"],JsNode.JSXClosingElement,["</","span",">"]],"]"]],"}"],"222",JsNode.JSXClosingElement,["</","a",">"]]]]]]);
    });
    it('member mark', function() {
      var parser = homunculus.getParser('jsx');
      var node = parser.parse('<a.b></a.b>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.JSXElement,[JsNode.JSXOpeningElement,["<",JsNode.JSXMemberExpression,["a",".","b"],">"],JsNode.JSXClosingElement,["</",JsNode.JSXMemberExpression,["a",".","b"],">"]]]]]]);
    });
    it('namespace mark', function() {
      var parser = homunculus.getParser('jsx');
      var node = parser.parse('<a:b></a:b>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.JSXElement,[JsNode.JSXOpeningElement,["<",JsNode.JSXMemberExpression,["a",":","b"],">"],JsNode.JSXClosingElement,["</",JsNode.JSXMemberExpression,["a",":","b"],">"]]]]]]);
    });
    it('mark mismatching', function() {
      var parser = homunculus.getParser('jsx');
      expect(function() {
        parser.parse('<a></b>');
      }).to.throwError();
    });
    it('member mismatching', function() {
      var parser = homunculus.getParser('jsx');
      expect(function() {
        parser.parse('<a.b></b>');
      }).to.throwError();
    });
    it('namespace mismatching', function() {
      var parser = homunculus.getParser('jsx');
      expect(function() {
        parser.parse('<a:b></b>');
      }).to.throwError();
    });
  });
});