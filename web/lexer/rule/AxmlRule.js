define(function(require, exports, module) {var Rule = require('./Rule');
var LineSearch = require('../match/LineSearch');
var CompleteEqual = require('../match/CompleteEqual');
var RegMatch = require('../match/RegMatch');
var character = require('../../util/character');
var Token = require('../AxmlToken');
var AxmlRule = Rule.extend(function() {
  var self = this;
  Rule.call(self, AxmlRule.KEYWORDS);

  self.addMatch(new CompleteEqual(Token.BLANK, character.BLANK));
  self.addMatch(new CompleteEqual(Token.TAB, character.TAB));
  self.addMatch(new CompleteEqual(Token.LINE, character.ENTER + character.LINE));
  self.addMatch(new CompleteEqual(Token.LINE, character.ENTER));
  self.addMatch(new CompleteEqual(Token.LINE, character.LINE));

  self.addMatch(new CompleteEqual(Token.DOC, '!DOCTYPE', null, true));
  self.addMatch(new LineSearch(Token.STRING, '"', '"', true));
  self.addMatch(new LineSearch(Token.STRING, "'", "'", true));
  self.addMatch(new CompleteEqual(Token.SIGN, '=', null, true));
  self.addMatch(new RegMatch(Token.NUMBER, /^\d+/));
  self.addMatch(new RegMatch(Token.PROPERTY, /^[a-z]+:[a-z]+/i));
  self.addMatch(new RegMatch(Token.PROPERTY, /^[a-z]+(-\w+)*/i));
}).statics({
  KEYWORDS: []
});
module.exports = AxmlRule;
});