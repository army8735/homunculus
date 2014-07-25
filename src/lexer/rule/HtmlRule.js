var Rule = require('./Rule');
var LineSearch = require('../match/LineSearch');
var LineParse = require('../match/LineParse');
var CompleteEqual = require('../match/CompleteEqual');
var RegMatch = require('../match/RegMatch');
var CharacterSet = require('../match/CharacterSet');
var Token = require('../Token');
var Lexer = require('../Lexer');
var character = require('../../util/character');
var HtmlRule = Rule.extend(function() {
  var self = this;
  Rule.call(self, HtmlRule.KEYWORDS);
}).statics({
  KEYWORDS: 'doctype a abbr acronym address applet area article aside audio b base basefont bdi bdo big blockquote body br button canvas caption center cite code col colgroup command datalist dd del details dfn dialog dir div dl dt em embed fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hr html i iframe img input ins kbd keygen label legend li link main map mark menu menuitem meta meter nav noframes noscript object ol optgroup option output p param pre progress q rp rt ruby s samp script section select small source span strike strong style sub summary sup table tbody td textarea tfoot th thead time title tr track tt u ul var video wbr'.split(' ')
});
module.exports = HtmlRule;