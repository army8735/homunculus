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
  var LineParse = require('../match/LineParse');
  var CompleteEqual = require('../match/CompleteEqual');
  var RegMatch = require('../match/RegMatch');
  var Token = require('../Token');
  var JavaRule = Rule.extend(function() {
      var self = this;
      Rule.call(self, JavaRule.KEYWORDS);
      
      self.addMatch(new LineSearch(Token.COMMENT, '//', '\n'));
      self.addMatch(new LineSearch(Token.COMMENT, '/*', '*/', true));
      self.addMatch(new LineParse(Token.STRING, '"', '"'));
      self.addMatch(new LineParse(Token.STRING, "'", "'"));
      self.addMatch(new RegMatch(Token.ID, /^[a-zA-Z_]\w*/));
      self.addMatch(new RegMatch(Token.ANNOT, /^@\w+/));
  
      ['~', '!', '%', '^', '&&', '&', '*', '(', ')', '--', '-', '++', '+', '===', '==', '=', '!==', '!=', '[', ']', '{', '}', '||', '|', '\\', '<<<', '>>>', '<<', '>>', '<', '>', '>=', '<=', ',', '...', '.', '?:', '?', ':', ';', '/'].forEach(function(o) {
        self.addMatch(new CompleteEqual(Token.SIGN, o));
      });
    }).statics({
      KEYWORDS: 'if else for break case continue function true false switch default do while int float double long throws transient abstract assert boolean byte class const enum instanceof try volatilechar extends final finally goto implements import protected return void char interface native new package private protected throw short public return strictfp super synchronized this static null String'.split(' ')
    });
  module.exports = JavaRule;
});