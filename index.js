(function(factory) {
  if(typeof define === 'function' && (define.amd || define.cmd)) {
    define(factory);
  }
  else {
    factory(require, exports, module);
  }
})(function(require, exports, module) {
  var Lexer = require('./dist/lexer/Lexer');
  var CssLexer = require('./dist/lexer/CssLexer');

  var EcmascriptRule = require('./dist/lexer/rule/EcmascriptRule');
  var CssRule = require('./dist/lexer/rule/CssRule');
  var JavaRule = require('./dist/lexer/rule/JavaRule');
  var CRule = require('./dist/lexer/rule/CRule');

  var Token = require('./dist/lexer/Token');

  var JsParser = require('./dist/parser/js/Parser');
  var Es6Parser = require('./dist/parser/es6/Parser');
  var CssParser = require('./dist/parser/css/Parser');

  var JsNode = require('./dist/parser/js/Node');
  var Es6Node = require('./dist/parser/es6/Node');
  var CssNode = require('./dist/parser/css/Node');

  var JsContext = require('./dist/parser/js/Context');

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
});