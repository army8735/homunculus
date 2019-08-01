define(function(require, exports, module) {var Lexer = require('./lexer/Lexer');
var CssLexer = require('./lexer/CssLexer');
var HtmlLexer = require('./lexer/HtmlLexer');
var EcmascriptLexer = require('./lexer/EcmascriptLexer');
var JSXLexer = require('./lexer/JSXLexer');
var CSXLexer = require('./lexer/CSXLexer');
var AxmlLexer = require('./lexer/AxmlLexer');

var EcmascriptRule = require('./lexer/rule/EcmascriptRule');
var CssRule = require('./lexer/rule/CssRule');
var JavaRule = require('./lexer/rule/JavaRule');
var CRule = require('./lexer/rule/CRule');
var HtmlRule = require('./lexer/rule/HtmlRule');
var AxmlRule = require('./lexer/rule/AxmlRule');

var Token = require('./lexer/Token');
var CssToken = require('./lexer/CssToken');
var HtmlToken = require('./lexer/HtmlToken');
var JSXToken = require('./lexer/JSXToken');
var CSXToken = require('./lexer/CSXToken');
var AxmlToken = require('./lexer/AxmlToken');

var JsParser = require('./parser/js/Parser');
var Es6Parser = require('./parser/es6/Parser');
var CssParser = require('./parser/css/Parser');
var HtmlParser = require('./parser/html/Parser');
var JSXParser = require('./parser/jsx/Parser');
var CSXParser = require('./parser/csx/Parser');
var AxmlParser = require('./parser/axml/Parser');

var JsNode = require('./parser/js/Node');
var Es6Node = require('./parser/es6/Node');
var CssNode = require('./parser/css/Node');
var HtmlNode = require('./parser/html/Node');
var JSXNode = require('./parser/jsx/Node');
var CSXNode = require('./parser/csx/Node');
var AxmlNode = require('./parser/axml/Node');

var JsContext = require('./parser/js/Context');

var walk = require('./util/walk');

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
        case 'es6':
        case 'es7':
        case 'es2015':
        case 'es2016':
        case 'ecmascript':
        case 'as':
        case 'actionscript':
          return EcmascriptLexer;
        case 'css':
          return CssLexer;
        case 'html':
        case 'htm':
          return HtmlLexer;
        case 'axml':
          return AxmlLexer;
        case 'jsx':
          return JSXLexer;
        case 'csx':
          return CSXLexer;
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
        case 'es7':
        case 'es2015':
        case 'es2016':
          return Es6Parser;
        case 'css':
          return CssParser;
        case 'html':
        case 'htm':
          return HtmlParser;
        case 'axml':
          return AxmlParser;
        case 'jsx':
          return JSXParser;
        case 'csx':
          return CSXParser;
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
        case 'es7':
        case 'es8':
        case 'es2015':
        case 'es2016':
          return Es6Node;
        case 'css':
          return CssNode;
        case 'html':
        case 'htm':
          return HtmlNode;
        case 'axml':
          return AxmlNode;
        case 'jsx':
          return JSXNode;
        case 'csx':
          return CSXNode;
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
        case 'es6':
        case 'es7':
        case 'es8':
        case 'es2015':
        case 'es2016':
          return JsContext;
        default:
          throw new Error('Unsupport Language Context: ' + lan);
      }
      break;
    case 'token':
      switch (lan) {
        case 'css':
          return CssToken;
        case 'htm':
        case 'html':
          return HtmlToken;
        case 'axml':
          return AxmlToken;
        case 'jsx':
          return JSXToken;
        case 'csx':
          return CSXToken;
        default:
          return Token;
      }
    case 'rule':
      switch (lan) {
        case 'js':
        case 'javascript':
        case 'es':
        case 'es5':
        case 'es6':
        case 'es7':
        case 'es8':
        case 'es2015':
        case 'es2016':
        case 'ecmascript':
          return EcmascriptRule;
        case 'css':
          return CssRule;
        case 'htm':
        case 'html':
          return HtmlRule;
        case 'axml':
          return AxmlRule;
        case 'jsx':
          return EcmascriptRule;
        case 'csx':
          return EcmascriptRule;
        default:
          throw new Error('Unsupport Language Context: ' + lan);
      }
    case 'walk':
      return walk;
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
    case 'es7':
    case 'es8':
    case 'es2015':
    case 'es2016':
    case 'as':
    case 'actionscript':
      return new EcmascriptLexer(new EcmascriptRule());
    case 'css':
      return new CssLexer(new CssRule());
    case "java":
      return new Lexer(new JavaRule());
    case "c":
    case "c++":
    case "cpp":
    case "cplusplus":
      return new Lexer(new CRule());
    case 'html':
    case 'htm':
      return new HtmlLexer(new HtmlRule());
    case 'axml':
      return new AxmlLexer(new AxmlRule());
    case 'jsx':
      return new JSXLexer(new EcmascriptRule());
    case 'csx':
      return new CSXLexer(new EcmascriptRule());
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
    case 'es7':
    case 'es8':
    case 'es2015':
    case 'es2016':
      return new Es6Parser(exports.getLexer(lan));
    case 'css':
      return new CssParser(exports.getLexer(lan));
    case 'html':
    case 'htm':
      return new HtmlParser(exports.getLexer(lan));
    case 'axml':
      return new AxmlParser(exports.getLexer(lan));
    case 'jsx':
      return new JSXParser(exports.getLexer(lan));
    case 'csx':
      return new CSXParser(exports.getLexer(lan));
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
    case 'es6':
    case 'es7':
    case 'es8':
    case 'es2015':
    case 'es2016':
      return new JsContext();
    default:
      throw new Error('Unsupport Language Context: ' + lan);
  }
};

exports.reset = function() {
  Token.reset();
};
});