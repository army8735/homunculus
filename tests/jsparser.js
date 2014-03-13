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

describe('jsparser', function() {
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