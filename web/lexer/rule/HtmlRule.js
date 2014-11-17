define(function(require, exports, module) {var Rule = require('./Rule');
var LineSearch = require('../match/LineSearch');
var CompleteEqual = require('../match/CompleteEqual');
var RegMatch = require('../match/RegMatch');
var character = require('../../util/character');
var Token = require('../HtmlToken');
var HtmlRule = Rule.extend(function() {
  var self = this;
  Rule.call(self, HtmlRule.KEYWORDS);

  self.addMatch(new CompleteEqual(Token.BLANK, character.BLANK));
  self.addMatch(new CompleteEqual(Token.TAB, character.TAB));
  self.addMatch(new CompleteEqual(Token.LINE, character.ENTER + character.LINE));
  self.addMatch(new CompleteEqual(Token.LINE, character.ENTER));
  self.addMatch(new CompleteEqual(Token.LINE, character.LINE));

  self.addMatch(new CompleteEqual(Token.HEAD, '!DOCTYPE', null, true));
  self.addMatch(new LineSearch(Token.STRING, '"', '"', true));
  self.addMatch(new LineSearch(Token.STRING, "'", "'", true));
  self.addMatch(new CompleteEqual(Token.SIGN, '=', null, true));
  self.addMatch(new RegMatch(Token.NUMBER, /^\d+/));

  var id = new RegMatch(Token.PROPERTY, /^[a-z]+(-\w+)*/i);
  id.callback = function(token) {
    var prev = token.prev();
    if(prev && prev.type() == Token.MARK) {
      token.type(Token.KEYWORD);
    }
    else {
      var s = token.content();
      if(/^data-/i.test(s)) {
        token.type(Token.DATA);
      }
    }
  };
  self.addMatch(id);
}).statics({
  KEYWORDS: 'doctype a abbr acronym address applet area article aside audio b base basefont bdi bdo big blockquote body br button canvas caption center cite code col colgroup command datalist dd del details dfn dialog dir div dl dt em embed fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hr html i iframe img input ins kbd keygen label legend li link main map mark menu menuitem meta meter nav noframes noscript object ol optgroup option output p param pre progress q rp rt ruby s samp script section select small source span strike strong style sub summary sup table tbody td textarea tfoot th thead time title tr track tt u ul var video wbr'.split(' ')
});
module.exports = HtmlRule;});