define(function(require, exports, module) {var Token = require('./Token');
var types;

var JSXToken = Token.extend(function(type, content, val, sIndex) {
  Token.call(this, type, content, val, sIndex);
}).statics({
  MARK: 15,
  ELEM: 16,
  ATTR: 17,
  TEXT: 18
});

module.exports = JSXToken;});