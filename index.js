if(typeof define === 'function' && (define.amd || define.cmd)) {
  define(function(require, exports, module) {
    module.exports = require('./web/homunculus');
  });
}
else {
  module.exports = require('./src/homunculus');
}