var Lexer = require('./src/lexer/Lexer');
var CssLexer = require('./src/lexer/CssLexer');

var EcmascriptRule = require('./src/lexer/rule/EcmascriptRule');
var CssRule = require('./src/lexer/rule/CssRule');
var JavaRule = require('./src/lexer/rule/JavaRule');
var CRule = require('./src/lexer/rule/CRule');

var Token = require('./src/lexer/Token');

var JsParser = require('./src/parser/js/Parser');
var CssParser = require('./src/parser/css/Parser');

var JsNode = require('./src/parser/js/Node');
var CssNode = require('./src/parser/css/Node');

var JsContext = require('./src/parser/js/Context');

exports.getClass = function(type, lan) {
  type = (type || '').toLowerCase();
  lan = (lan || '').toLowerCase();
  switch(type) {
    case 'lexer':
      switch(lan) {
        case 'js':
        case 'javascript':
        case 'es':
        case 'ecmascript':
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
      switch(lan) {
        case 'js':
        case 'javascript':
        case 'es':
        case 'ecmascript':
          return JsParser;
        case 'css':
          return CssParser;
        default:
          throw new Error('Unsupport Language Parser: ' + lan);
      }
    break;
    case 'node':
      switch(lan) {
        case 'js':
        case 'javascript':
        case 'es':
        case 'ecmascript':
          return JsNode;
        case 'css':
          return CssNode;
        default:
          throw new Error('Unsupport Language Node: ' + lan);
      }
    break;
    case 'context':
      switch(lan) {
        case 'js':
        case 'javascript':
        case 'es':
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

exports.getLexer = function(lan) {
  lan = lan.toLowerCase();
  switch(lan) {
    case 'js':
    case 'javascript':
    case 'es':
    case 'ecmascript':
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

exports.getParser = function(lan) {
  lan = lan.toLowerCase();
  switch(lan) {
    case 'js':
    case 'javascript':
    case 'es':
    case 'ecmascript':
      return new JsParser(exports.getLexer(lan));
    case 'css':
      return new CssParser(exports.getLexer(lan));
    default:
      throw new Error('Unsupport Language Parser: ' + lan);
  }
};

exports.getContext = function(lan) {
  lan = lan.toLowerCase();
  switch(lan) {
    case 'js':
    case 'javascript':
    case 'es':
    case 'ecmascript':
      return new JsContext();
    default:
      throw new Error('Unsupport Language Context: ' + lan);
  }
};