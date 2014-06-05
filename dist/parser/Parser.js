(function(factory) {
  if(typeof define === 'function' && (define.amd || define.cmd)) {
    define(factory);
  }
  else {
    factory(require, exports, module);
  }
})(function(require, exports, module) {
  var Class = require('../util/Class');
  var Parser = Class(function(lexer) {
    this.lexer = lexer;
    this.tree =  {};
    this.ignores = {};
    return this;
  }).methods({
    parse: function(code) {
      return this.tree;
    },
    ast: function() {
      return this.tree;
    },
    ignore: function() {
      return this.ignores;
    }
  });
  module.exports = Parser;
});