var Class = require('../util/Class');
var walk = require('../util/walk');
var Parser = Class(function(lexer) {
  this.lexer = lexer;
  this.tree =  {};
  this.ignores = {};
  return this;
}).methods({
  parse: function(code) {
    return this.tree;
  },
  ast: function(plainObject) {
    if(plainObject) {
      return walk.plainObject(this.tree);
    }
    return this.tree;
  },
  ignore: function() {
    return this.ignores;
  }
});
module.exports = Parser;