if(typeof exports === 'object') {
  var Lexer = require('./src/lexer/Lexer');
  var CssLexer = require('./src/lexer/CssLexer');

  var EcmascriptRule = require('./src/lexer/rule/EcmascriptRule');
  var CssRule = require('./src/lexer/rule/CssRule');
  var JavaRule = require('./src/lexer/rule/JavaRule');
  var CRule = require('./src/lexer/rule/CRule');

  var Token = require('./src/lexer/Token');

  var JsParser = require('./src/parser/js/Parser');
  var Es6Parser = require('./src/parser/es6/Parser');
  var CssParser = require('./src/parser/css/Parser');

  var JsNode = require('./src/parser/js/Node');
  var Es6Node = require('./src/parser/es6/Node');
  var CssNode = require('./src/parser/css/Node');

  var JsContext = require('./src/parser/js/Context');

  exports.getClass = function (type, lan) {
    type = (type || '').toLowerCase();
    lan = (lan || '').toLowerCase();
    switch (type) {
      case 'lexer':
        switch (lan) {
          case 'js':
          case 'javascript':
          case 'es':
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
      case 'ecmascript':
        return new JsContext();
      default:
        throw new Error('Unsupport Language Context: ' + lan);
    }
  };
}
else if(typeof define === 'function') {
  define(function(require, exports, module) {
    var Lexer = require('./web/lexer/Lexer');
    var CssLexer = require('./web/lexer/CssLexer');

    var EcmascriptRule = require('./web/lexer/rule/EcmascriptRule');
    var CssRule = require('./web/lexer/rule/CssRule');
    var JavaRule = require('./web/lexer/rule/JavaRule');
    var CRule = require('./web/lexer/rule/CRule');

    var Token = require('./web/lexer/Token');

    var JsParser = require('./web/parser/js/Parser');
    var Es6Parser = require('./web/parser/es6/Parser');
    var CssParser = require('./web/parser/css/Parser');

    var JsNode = require('./web/parser/js/Node');
    var Es6Node = require('./web/parser/es6/Node');
    var CssNode = require('./web/parser/css/Node');

    var JsContext = require('./web/parser/js/Context');

    exports.getClass = function (type, lan) {
      type = (type || '').toLowerCase();
      lan = (lan || '').toLowerCase();
      switch (type) {
        case 'lexer':
          switch (lan) {
            case 'js':
            case 'javascript':
            case 'es':
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
        case 'ecmascript':
          return new JsContext();
        default:
          throw new Error('Unsupport Language Context: ' + lan);
      }
    };
  });
}