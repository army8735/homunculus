var homunculus = require('../homunculus');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');
var os = require('os');
var isWin = /win/i.test(os.type());

var Token = homunculus.getClass('token');
var JsNode = homunculus.getClass('node', 'js');

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

describe('jsparser', function() {
  describe('simple test', function() {
    it('varstmt no assign', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var a;');
      expect(tree(node, [])).to.eql([JsNode.PROGRAM, [JsNode.VARSTMT, ['var', [JsNode.VARDECL, ['a', ';']]]]]);
    });
    it('varstmt with assign', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var a = 1;');
      expect(tree(node, [])).to.eql([JsNode.PROGRAM, [JsNode.VARSTMT, ['var', [JsNode.VARDECL, ['a', '=', [JsNode.PRMREXPR, [1]], ';']]]]]);
    });
  });
  describe('js lib exec test', function() {
    it('jquery 1.11.0', function() {
      var parser = homunculus.getParser('js');
      var code = fs.readFileSync(path.join(__dirname, './jquery-1.11.0.js'), { encoding: 'utf-8' });
      var node = parser.parse(code);
      var ignore = parser.ignore();
      var str = jion(node, ignore);
      expect(str).to.eql(code);
    });
  });
});