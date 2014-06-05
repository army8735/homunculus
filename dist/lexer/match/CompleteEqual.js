(function(factory) {
  if(typeof define === 'function' && (define.amd || define.cmd)) {
    define(factory);
  }
  else {
    factory(require, exports, module);
  }
})(function(require, exports, module) {
  var Match = require('./Match');
  var character = require('../../util/character');
  var CompleteEqual = Match.extend(function(type, result, setPReg) {
    Match.call(this, type, setPReg);
    this.result = result;
  }).methods({
    match: function(c, code, index) {
      return code.substr(--index, this.result.length) == this.result;
    }
  });
  module.exports = CompleteEqual;
});