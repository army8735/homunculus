define(function(require, exports, module) {var Es6Parser = require('../es6/Parser');

var Parser = Es6Parser.extend(function(lexer) {
  Es6Parser.call(this, lexer);
  this.init(lexer);
  return this;
});

module.exports = Es6Parser;});