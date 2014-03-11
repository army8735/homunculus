var Match = require('./Match');
var character = require('../../util/character');
var CharacterSet = Match.extend(function(type, str, setPReg) {
  Match.call(this, type, setPReg);
  this.str = str;
}).methods({
  match: function(c, code, index) {
    var isIn = this.str.indexOf(c) > -1;
    if(isIn) {
      this.result = c;
    }
    return isIn;
  }
});
module.exports = CharacterSet;