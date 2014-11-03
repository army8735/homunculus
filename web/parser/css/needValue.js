define(function(require, exports, module) {var Token = require('../../lexer/Token');
var Node = require('./Node');

var res;
function recursion(node) {
  var isToken = node.name() == Node.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      if(token.type() == Token.VARS && token.content().charAt(0) == '$') {
        res = false;
      }
    }
  }
  else {
    if([Node.ADDEXPR, Node.MTPLEXPR].indexOf(node.name()) > -1) {
      res = false;
    }
    var leaves = node.leaves();
    leaves.forEach(function(leaf) {
      recursion(leaf);
    });
  }
}

module.exports = function(node) {
  res = true;
  recursion(node);
  return res;
}});