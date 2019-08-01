define(function(require, exports, module) {var Token = require('./Token');

var AxmlToken = Token.extend(function(type, content, val, sIndex) {
  Token.call(this, type, content, val, sIndex);
}).statics({
  DOC: 27,
  PROPERTY: 15,
  TEXT: 25,
  MARK: 26,
  ELEM: 24
});

module.exports = AxmlToken;
});