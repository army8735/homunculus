var Lexer = require('./lexer/Lexer');
var CssLexer = require('./lexer/CssLexer');

var EcmascriptRule = require('./lexer/rule/EcmascriptRule');
var CssRule = require('./lexer/rule/CssRule');
var JavaRule = require('./lexer/rule/JavaRule');
var CRule = require('./lexer/rule/CRule');

var Token = require('./lexer/Token');

var JsParser = require('./parser/js/Parser');
var Es6Parser = require('./parser/es6/Parser');
var CssParser = require('./parser/css/Parser');

var JsNode = require('./parser/js/Node');
var Es6Node = require('./parser/es6/Node');
var CssNode = require('./parser/css/Node');

var JsContext = require('./parser/js/Context');

exports.getClass = function (type, lan) {
  type = (type || '').toLowerCase();
  lan = (lan || '').toLowerCase();
  switch (type) {
    case 'lexer':
      switch (lan) {
        case 'js':
        case 'javascript':
        case 'es':
        case 'es5':
        case 'ecmascript':
        case 'es6':
        case 'as':
        case 'actionscript':
          return Lexer;
        case 'css':
          return CssLexer;
        default:
          throw new Error('Unsupport Language Lexer: ' + lan);
      }
      break;
    case 'parser':
      switch (lan) {
        case 'js':
        case 'javascript':
        case 'es':
        case 'es5':
        case 'ecmascript':
          return JsParser;
        case 'es6':
          return Es6Parser;
        case 'css':
          return CssParser;
        default:
          throw new Error('Unsupport Language Parser: ' + lan);
      }
      break;
    case 'node':
      switch (lan) {
        case 'js':
        case 'javascript':
        case 'es':
        case 'es5':
        case 'ecmascript':
          return JsNode;
        case 'es6':
          return Es6Node;
        case 'css':
          return CssNode;
        default:
          throw new Error('Unsupport Language Node: ' + lan);
      }
      break;
    case 'context':
      switch (lan) {
        case 'js':
        case 'javascript':
        case 'es':
        case 'es5':
        case 'ecmascript':
          return JsContext;
        default:
          throw new Error('Unsupport Language Context: ' + lan);
      }
      break;
    case 'token':
      return Token;
    default:
      throw new Error('Unsupport Class Type: ' + type);
  }
};

exports.getLexer = function (lan) {
  lan = lan.toLowerCase();
  switch (lan) {
    case 'js':
    case 'javascript':
    case 'es':
    case 'es5':
    case 'ecmascript':
    case 'es6':
    case 'as':
    case 'actionscript':
      return new Lexer(new EcmascriptRule());
    case 'css':
      return new CssLexer(new CssRule());
    case "java":
      return new Lexer(new JavaRule());
    case "c":
    case "c++":
    case "cpp":
    case "cplusplus":
      return new Lexer(new CRule());
    default:
      throw new Error('Unsupport Language Lexer: ' + lan);
  }
};

exports.getParser = function (lan) {
  lan = lan.toLowerCase();
  switch (lan) {
    case 'js':
    case 'javascript':
    case 'es':
    case 'es5':
    case 'ecmascript':
      return new JsParser(exports.getLexer(lan));
    case 'es6':
      return new Es6Parser(exports.getLexer(lan));
    case 'css':
      return new CssParser(exports.getLexer(lan));
    default:
      throw new Error('Unsupport Language Parser: ' + lan);
  }
};

exports.getContext = function (lan) {
  lan = lan.toLowerCase();
  switch (lan) {
    case 'js':
    case 'javascript':
    case 'es':
    case 'es5':
    case 'ecmascript':
      return new JsContext();
    default:
      throw new Error('Unsupport Language Context: ' + lan);
  }
};