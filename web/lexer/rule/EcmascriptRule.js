define(function(require, exports, module) {
  var Rule = require('./Rule');
  var LineSearch = require('../match/LineSearch');
  var LineParse = require('../match/LineParse');
  var CompleteEqual = require('../match/CompleteEqual');
  var RegMatch = require('../match/RegMatch');
  var CharacterSet = require('../match/CharacterSet');
  var Token = require('../Token');
  var Lexer = require('../Lexer');
  var character = require('../../util/character');
  var EcmascriptRule = Rule.extend(function() {
    var self = this;
    Rule.call(self, EcmascriptRule.KEYWORDS, true);
  
    self.addMatch(new CompleteEqual(Token.BLANK, character.BLANK));
    self.addMatch(new CompleteEqual(Token.TAB, character.TAB));
    self.addMatch(new CompleteEqual(Token.LINE, character.ENTER + character.LINE));
    self.addMatch(new CompleteEqual(Token.LINE, character.ENTER));
    self.addMatch(new CompleteEqual(Token.LINE, character.LINE));
  
    self.addMatch(new LineSearch(Token.COMMENT, '//', [character.ENTER + character.LINE, character.ENTER, character.LINE]));
    self.addMatch(new LineSearch(Token.COMMENT, '/*', '*/', true));
    self.addMatch(new LineParse(Token.STRING, '"', '"', false, Lexer.IS_REG));
    self.addMatch(new LineParse(Token.STRING, "'", "'", false, Lexer.IS_REG));
    self.addMatch(new LineParse(Token.TEMPLATE, '`', '`', true, Lexer.IS_REG));
  
    self.addMatch(new RegMatch(Token.ID, /^[$a-zA-Z_][$\w]*/, Lexer.SPECIAL, function() {
      return !!(self.keyWords().hasOwnProperty(this.content()));
    }, function() {
      return ['if', 'for', 'while'].indexOf(this.content()) != -1;
    }));
  
    self.addMatch(new RegMatch(Token.NUMBER, /^\.\d+(?:E[+-]?\d*)?/i, {
      'SyntaxError: missing exponent': /E[+-]?$/i
    }, Lexer.NOT_REG));
  
    self.addMatch(new CompleteEqual(Token.SIGN, ']', Lexer.NOT_REG));
  
    ['*=', '/=', '+=', '-=', '%=', '^=', '&=', '|=', '&&', '--', '++', '===', '==', '!==', '!=', '||', '>>>=', '<<<=', '<<<', '>>>', '>>=', '<<=', '<<', '>>', '>=', '<=', '...', '?:', '=>'].forEach(function(o) {
      self.addMatch(new CompleteEqual(Token.SIGN, o, Lexer.IS_REG));
    });
    self.addMatch(new CharacterSet(Token.SIGN, ':;/?.,[]{}~!^|%=-+*()~><&\\', Lexer.IS_REG));
  
    self.addMatch(new RegMatch(Token.NUMBER, /^0x[\da-f]*/i, {
      "SyntaxError: missing hexadecimal digits after '0x'": /^0x$/i
    }, Lexer.NOT_REG));
    self.addMatch(new RegMatch(Token.NUMBER, /^\d+\.?\d*(?:E[+-]?\d*)?/i, {
      'SyntaxError: missing exponent': /E[+-]?$/i
    }, Lexer.NOT_REG));
  
    self.addMatch(new CompleteEqual(Token.LINE, '\u2028'));
    self.addMatch(new CompleteEqual(Token.LINE, '\u2029'));
    self.addMatch(new CharacterSet(Token.BLANK, '\f\u000b\u00A0\uFEFF\u200b\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'));
  }).statics({
    KEYWORDS: 'break case catch class const continue debugger default delete do else enum export extends false finally for function if implements import in instanceof interface let new null package private protected public return static super switch this throw true try typeof var void while with yield'.split(' ')
  });
  module.exports = EcmascriptRule;
});