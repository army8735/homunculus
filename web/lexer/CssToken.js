define(function(require, exports, module) {var Token = require('./Token');

var CssToken = Token.extend(function(type, content, val, sIndex) {
  Token.call(this, type, content, val, sIndex);
}).statics({
  HEAD: 12,
  PROPERTY: 15,
  VARS: 16,
  HACK: 17,
  IMPORTANT: 18,
  PSEUDO: 19,
  UNITS: 20,
  SELECTOR: 21,
  ATTR: 22,
  COLOR: 23
});

module.exports = CssToken;});