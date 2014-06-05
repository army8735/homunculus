(function(factory) {
  if(typeof define === 'function' && (define.amd || define.cmd)) {
    define(factory);
  }
  else {
    factory(require, exports, module);
  }
})(function(require, exports, module) {
  var Rule = require('./Rule');
  var LineSearch = require('../match/LineSearch');
  var RegMatch = require('../match/RegMatch');
  var LineParse = require('../match/LineParse');
  var CompleteEqual = require('../match/CompleteEqual');
  var Token = require('../Token');
  var CRule = Rule.extend(function() {
      var self = this;
      Rule.call(self, CRule.KEYWORDS);
      
      self.addMatch(new LineSearch(Token.COMMENT, '//', '\n'));
      self.addMatch(new LineSearch(Token.COMMENT, '/*', '*/', true));
      self.addMatch(new LineParse(Token.STRING, '"', '"'));
      self.addMatch(new LineParse(Token.STRING, "'", "'"));
      self.addMatch(new RegMatch(Token.ID, /^[a-zA-Z_]\w*/));
      self.addMatch(new RegMatch(Token.HEAD, /^#\w+/));
  
      ['~', '!', '%', '^', '&&', '&', '*', '(', ')', '--', '-', '++', '+', '===', '==', '=', '!==', '!=', '[', ']', '{', '}', '||', '|', '\\', '<<<', '>>>', '<<', '>>', '<', '>', '>=', '<=', ',', '...', '.', '?:', '?', ':', ';', '/'].forEach(function(o) {
        self.addMatch(new CompleteEqual(Token.SIGN, o));
      });
    }).statics({
      KEYWORDS: 'if else for break case continue function true false switch default do while int float double long const_cast private short char return void static null whcar_t volatile  uuid explicit extern class const __finally __exception __try virtual using signed namespace new public protected __declspec delete unsigned friend goto inline mutable deprecated dllexport dllimport dynamic_cast enum union bool naked typeid noinline noreturn nothrow register this reinterpret_cast selectany sizeof static_cast struct template thread throw try typedef typename'.split(' ')
    });
  module.exports = CRule;
});