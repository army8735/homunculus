define(function(require, exports, module) {var Token = require('./Token');

var HtmlToken = Token.extend(function(type, content, val, sIndex) {
  Token.call(this, type, content, val, sIndex);
}).statics({
  HEAD: 12,
  PROPERTY: 15,
  DATA: 24,
  TEXT: 25,
  MARK: 26
});

module.exports = HtmlToken;});