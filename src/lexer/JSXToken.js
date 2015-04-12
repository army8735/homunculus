var Token = require('./Token');

var JSXToken = Token.extend(function(type, content, val, sIndex) {
    Token.call(this, type, content, val, sIndex);
}).statics({
    MARK: 15,
    ATTR: 16
});

module.exports = JSXToken;