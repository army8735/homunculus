var EcmascriptRule = require('./EcmascriptRule');
var LineSearch = require('../match/LineSearch');
var LineParse = require('../match/LineParse');
var CompleteEqual = require('../match/CompleteEqual');
var RegMatch = require('../match/RegMatch');
var CharacterSet = require('../match/CharacterSet');
var JSXToken = require('../JSXToken');
var character = require('../../util/character');

var JSXRule = EcmascriptRule.extend(function() {
  var self = this;
  EcmascriptRule.call(self, EcmascriptRule.KEYWORDS, true);
}).statics({
  MARK: new RegMatch(JSXToken.MARK, /^<[a-z]\w*(?:-\w+)*/i)
});
module.exports = JSXRule;