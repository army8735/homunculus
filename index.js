if(typeof define === 'function' && (define.amd || define.cmd)) {
  define(function(require, exports, module) {
    module.exports = require('./web/Homunculus');
  });
}
else {
  module.exports = require('./src/Homunculus');
}