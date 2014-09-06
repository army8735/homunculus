define(function(require, exports, module) {var Match = require('./Match');
var character = require('../../util/character');
var CompleteEqual = Match.extend(function(type, result, setPReg, ignoreCase) {
  Match.call(this, type, setPReg);
  this.result = result;
  this.ignoreCase = ignoreCase;
  this.temp = null;
}).methods({
  match: function(c, code, index) {
    this.temp = code.substr(--index, this.result.length);
    return this.ignoreCase
      ? this.temp.toLowerCase() == this.result.toLowerCase()
      : this.temp == this.result;
  },
  content: function() {
    return this.temp;
  }
});
module.exports = CompleteEqual;});