var homunculus = require('../');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Token = homunculus.getClass('token', 'axml');
var Parser = homunculus.getClass('parser', 'axml');
var AxmlNode = homunculus.getClass('node', 'axml');

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
  var isToken = node.name() == AxmlNode.TOKEN;
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

describe('htmlparser', function() {
  describe('simple test', function() {
    it('!doctype', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<!doctype html>');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.SelfClosingElement,["<","!doctype",AxmlNode.Attribute,["html"],">"]]]);
    });
    it('single mark', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<img src="about:blank">');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.SelfClosingElement,["<","img",AxmlNode.Attribute,["src","=","\"about:blank\""],">"]]]);
    });
    it('single mark closed', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<img src="about:blank"/>');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.SelfClosingElement,["<","img",AxmlNode.Attribute,["src","=","\"about:blank\""],"/>"]]]);
    });
    it('couple mark', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<div><span></span></div>');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.ELEMENT,[AxmlNode.OpeningElement,["<","div",">"],AxmlNode.ELEMENT,[AxmlNode.OpeningElement,["<","span",">"],AxmlNode.ClosingElement,["</","span",">"]],AxmlNode.ClosingElement,["</","div",">"]]]]);
    });
    it('text node', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<div>\n<span>123<b>456</b></span> </div>');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.ELEMENT,[AxmlNode.OpeningElement,["<","div",">"],"\n",AxmlNode.ELEMENT,[AxmlNode.OpeningElement,["<","span",">"],"123",AxmlNode.ELEMENT,[AxmlNode.OpeningElement,["<","b",">"],"456",AxmlNode.ClosingElement,["</","b",">"]],AxmlNode.ClosingElement,["</","span",">"]]," ",AxmlNode.ClosingElement,["</","div",">"]]]]);
    });
    it('custom node', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<custom/>');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.SelfClosingElement,["<","custom","/>"]]]);
    });
    it('custom attr', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<custom custom="123"></custom>');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.ELEMENT,[AxmlNode.OpeningElement,["<","custom",AxmlNode.Attribute,["custom","=","\"123\""],">"],AxmlNode.ClosingElement,["</","custom",">"]]]]);
    });
    it('data attr', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<img data-name="1">');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.SelfClosingElement,["<","img",AxmlNode.Attribute,["data-name","=","\"1\""],">"]]]);
    });
    it('comment', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<!--comment--><img/>');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.SelfClosingElement,["<","img","/>"]]]);
    });
    it('comment complex', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<!--comment--><img/><!--comment--><!--comment-->211<div><!--comment--></div>');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.SelfClosingElement,["<","img","/>"],"211",AxmlNode.ELEMENT,[AxmlNode.OpeningElement,["<","div",">"],AxmlNode.ClosingElement,["</","div",">"]]]]);
    });
    it('single attr', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<input checked>');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.SelfClosingElement,["<","input",AxmlNode.Attribute,["checked"],">"]]]);
    });
    it('attr no quote', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<input checked=checked>');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.SelfClosingElement,["<","input",AxmlNode.Attribute,["checked","=","checked"],">"]]]);
    });
    it('attr number', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<input num=3>');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.SelfClosingElement,["<","input",AxmlNode.Attribute,["num","=","3"],">"]]]);
    });
    it('single before couple', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<img/><div></div>');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.SelfClosingElement,["<","img","/>"],AxmlNode.ELEMENT,[AxmlNode.OpeningElement,["<","div",">"],AxmlNode.ClosingElement,["</","div",">"]]]]);
    });
    it('!doctype must be the first', function() {
      var parser = homunculus.getParser('axml');
      expect(function() {
        parser.parse('<img/><!doctype html>');
      }).to.throwError();
    });
    it('couple mark must be closed', function() {
      var parser = homunculus.getParser('axml');
      expect(function() {
        parser.parse('<div>');
      }).to.throwError();
    });
    it('not suit', function() {
      var parser = homunculus.getParser('axml');
      expect(function() {
        parser.parse('<div>123</p>');
      }).to.throwError();
    });
    it('script autoclose', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<script/>');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.SelfClosingElement,["<","script","/>"]]]);
    });
    it('script not close', function() {
      var parser = homunculus.getParser('axml');
      expect(function() {
        parser.parse('<script>var a');
      }).to.throwError();
    });
    it('style contain others', function() {
      var parser = homunculus.getParser('axml');
      var node = parser.parse('<style><div>123</div></style>');
      expect(tree(node)).to.eql([AxmlNode.DOCUMENT,[AxmlNode.ELEMENT,[AxmlNode.OpeningElement,["<","style",">"],"<div>123</div>",AxmlNode.ClosingElement,["</","style",">"]]]]);
    });
  });
});
