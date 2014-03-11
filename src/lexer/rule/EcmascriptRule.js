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
  self.addMatch(new CompleteEqual(Token.ENTER, character.ENTER));
  self.addMatch(new CompleteEqual(Token.LINE, character.LINE));

  self.addMatch(new LineSearch(Token.COMMENT, '//', '\n'));
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

  ['*=', '/=', '+=', '-=', '%=', '^=', '&=', '|=', '&&', '--', '++', '===', '==', '!==', '!=', '||', '>>>=', '<<<=', '<<<', '>>>', '>>=', '<<=', '<<', '>>', '>=', '<=', '...', '?:'].forEach(function(o) {
    self.addMatch(new CompleteEqual(Token.SIGN, o, Lexer.IS_REG));
  });
  self.addMatch(new CharacterSet(Token.SIGN, ':;/?.,[]{}~!^|%=-+*()~><&\\', Lexer.IS_REG));

  self.addMatch(new RegMatch(Token.NUMBER, /^0x[\da-f]*/i, {
    "SyntaxError: missing hexadecimal digits after '0x'": /^0x$/i
  }, Lexer.NOT_REG));
  self.addMatch(new RegMatch(Token.NUMBER, /^\d+\.?\d*(?:E[+-]?\d*)?/i, {
    'SyntaxError: missing exponent': /E[+-]?$/i
  }, Lexer.NOT_REG));

  self.addMatch(new CharacterSet(Token.BLANK, '\u00a0\f\u000b\u200b\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'));
}).statics({
  KEYWORDS: 'abstract boolean break byte case catch char class const continue debugger default delete do double else enum export extends false final finally float for function goto if implements import in instanceof int interface let long native new null package private protected public return short static super switch synchronized this throw throws transient true try typeof var void volatile while with'.split(' ')
});
module.exports = EcmascriptRule;