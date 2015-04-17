define(function(require, exports, module) {var Es6Parser = require('../es6/Parser');
var Node = require('./Node');
var Token = require('../../lexer/JSXToken');

var Parser = Es6Parser.extend(function(lexer) {
  Es6Parser.call(this, lexer);
  this.init(lexer);
  return this;
}).methods({
  prmrexpr: function() {
    if(this.look.type() == Token.MARK) {
      var node = new Node(Node.PRMREXPR);
      node.add(this.jsxelem());
    }
    else {
      return Es6Parser.prototype.prmrexpr.call(this);
    }
  },
  jsxelem: function() {
    var node = new Node(Node.JSXELEM);
    return node;
  }
});

module.exports = Parser;});