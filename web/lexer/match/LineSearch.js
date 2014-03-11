define(function(require, exports, module) {
  var Match = require('./Match');
  var Token = require('../Token');
  var character = require('../../util/character');
  var LineSearch = Match.extend(function(type, begin, end, contain, setPReg) {
    if(character.isUndefined(contain)) {
      contain = false;
    }
    Match.call(this, type, setPReg);
    this.begin = begin;
    this.end = end;
    this.contain = contain;
    this.msg = null;
  }).methods({
    match: function(c, code, index) {
      this.msg = null;
      if(this.begin == code.substr(--index, this.begin.length)) {
        var i = code.indexOf(this.end, index + this.begin.length);
        if(i == -1) {
          if(this.contain) {
            this.msg = 'SyntaxError: unterminated ' + Token.type(this.type).toLowerCase();
          }
          i = code.length;
        }
        else if(this.contain) {
          i += this.end.length;
        }
        this.result = code.slice(index, i);
        return true;
      }
      return false;
    },
    error: function() {
      return this.msg;
    }
  });
  module.exports = LineSearch;
});