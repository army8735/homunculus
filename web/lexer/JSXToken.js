define(function(require, exports, module) {var Token = require('./Token');

var JSXToken = Token.extend(function(type, content, val, sIndex) {
  Token.call(this, type, content, val, sIndex);
}).statics({
  MARK: 26,
  ELEM: 24,
  PROPERTY: 15,
  TEXT: 25
});

module.exports = JSXToken;});