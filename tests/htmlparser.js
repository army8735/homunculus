var homunculus = require('../');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Token = homunculus.getClass('token', 'html');
var Parser = homunculus.getClass('parser', 'html');
var HtmlNode = homunculus.getClass('node', 'html');

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
  var isToken = node.name() == HtmlNode.TOKEN;
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
  var isToken = node.name() == HtmlNode.TOKEN;
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
      var parser = homunculus.getParser('html');
      var node = parser.parse('<!doctype html>');
      expect(tree(node)).to.eql([HtmlNode.DOCUMENT,[HtmlNode.MARK,["<","!doctype",HtmlNode.ATTR,["html"],">"]]]);
    });
    it('single mark', function() {
      var parser = homunculus.getParser('html');
      var node = parser.parse('<img src="about:blank">');
      expect(tree(node)).to.eql([HtmlNode.DOCUMENT,[HtmlNode.MARK,["<","img",HtmlNode.ATTR,["src","=","\"about:blank\""],">"]]]);
    });
    it('single mark closed', function() {
      var parser = homunculus.getParser('html');
      var node = parser.parse('<img src="about:blank"/>');
      expect(tree(node)).to.eql([HtmlNode.DOCUMENT,[HtmlNode.MARK,["<","img",HtmlNode.ATTR,["src","=","\"about:blank\""],"/>"]]]);
    });
    it('couple mark', function() {
      var parser = homunculus.getParser('html');
      var node = parser.parse('<div><span></span></div>');
      expect(tree(node)).to.eql([HtmlNode.DOCUMENT,[HtmlNode.MARK,["<","div",">",HtmlNode.MARK,["<","span",">","</","span",">"],"</","div",">"]]]);
    });
    it('text node', function() {
      var parser = homunculus.getParser('html');
      var node = parser.parse('<div>\n<span>123<b>456</b></span> </div>');
      expect(tree(node)).to.eql([HtmlNode.DOCUMENT,[HtmlNode.MARK,["<","div",">","\n",HtmlNode.MARK,["<","span",">","123",HtmlNode.MARK,["<","b",">","456","</","b",">"],"</","span",">"]," ","</","div",">"]]]);
    });
    it('custom node', function() {
      var parser = homunculus.getParser('html');
      var node = parser.parse('<custom/>');
      expect(tree(node)).to.eql([HtmlNode.DOCUMENT, [HtmlNode.MARK, ["<", "custom", "/>"]]]);
    });
    it('custom attr', function() {
      var parser = homunculus.getParser('html');
      var node = parser.parse('<custom custom="123"></custom>');
      expect(tree(node)).to.eql([HtmlNode.DOCUMENT,[HtmlNode.MARK,["<","custom",HtmlNode.ATTR,["custom","=","\"123\""],">","</","custom",">"]]]);
    });
    it('data attr', function() {
      var parser = homunculus.getParser('html');
      var node = parser.parse('<img data-name="1">');
      expect(tree(node)).to.eql([HtmlNode.DOCUMENT,[HtmlNode.MARK,["<","img",HtmlNode.ATTR,["data-name","=","\"1\""],">"]]]);
    });
    it('comment', function() {
      var parser = homunculus.getParser('html');
      var node = parser.parse('<!--comment--><img/>');
      expect(tree(node)).to.eql([HtmlNode.DOCUMENT,[HtmlNode.MARK,["<","img","/>"]]]);
    });
    it('single attr', function() {
      var parser = homunculus.getParser('html');
      var node = parser.parse('<input checked>');
      expect(tree(node)).to.eql([HtmlNode.DOCUMENT,[HtmlNode.MARK,["<","input",HtmlNode.ATTR,["checked"],">"]]]);
    });
    it('single before couple', function() {
      var parser = homunculus.getParser('html');
      var node = parser.parse('<img/><div></div>');
      expect(tree(node)).to.eql([HtmlNode.DOCUMENT,[HtmlNode.MARK,["<","img","/>"],HtmlNode.MARK,["<","div",">","</","div",">"]]]);
    });
    it('!doctype must be the first', function() {
      var parser = homunculus.getParser('html');
      expect(function() {
        parser.parse('<img/><!doctype html>');
      }).to.throwError();
    });
    it('couple mark must be closed', function() {
      var parser = homunculus.getParser('html');
      expect(function() {
        parser.parse('<div>');
      }).to.throwError();
    });
    it('not suit', function() {
      var parser = homunculus.getParser('html');
      expect(function() {
        parser.parse('<div>123</p>');
      }).to.throwError();
    });
    it('script autoclose', function() {
      var parser = homunculus.getParser('html');
      var node = parser.parse('<script/>');
      expect(tree(node)).to.eql([HtmlNode.DOCUMENT,[HtmlNode.MARK,["<","script","/>"]]]);
    });
    it('script not close', function() {
      var parser = homunculus.getParser('html');
      expect(function() {
        parser.parse('<script>var a');
      }).to.throwError();
    });
    it('style contain others', function() {
      var parser = homunculus.getParser('html');
      var node = parser.parse('<style><div>123</div></style>');
      expect(tree(node)).to.eql([HtmlNode.DOCUMENT,[HtmlNode.MARK,["<","style",">","<div>123</div>","</","style",">"]]]);
    });
  });
});