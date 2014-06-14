define(function(require, exports, module) {
  var Match = require('./Match');
  var character = require('../../util/character');
  var CompleteEqual = Match.extend(function(type, result, setPReg, ignoreCase) {
    Match.call(this, type, setPReg);
    this.result = result;
    this.ignoreCase = ignoreCase;
  }).methods({
    match: function(c, code, index) {
      var s = code.substr(--index, this.result.length);
      return this.ignoreCase
        ? s.toLowerCase() == this.result.toLowerCase()
        : s == this.result;
    }
  });
  module.exports = CompleteEqual;
});