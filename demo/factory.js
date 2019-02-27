define(function(require, exports) {
	var Lexer = require('./lexer/Lexer'),
		EcmascriptLexer = require('./lexer/EcmascriptLexer'),
		CssLexer = require('./lexer/CssLexer'),
    HtmlLexer = require('./lexer/HtmlLexer'),
    JSXLexer = require('./lexer/JSXLexer'),
		CSXLexer = require('./lexer/CSXLexer'),
		EcmascriptRule = require('./lexer/rule/EcmascriptRule'),
		CssRule = require('./lexer/rule/CssRule'),
    HtmlRule = require('./lexer/rule/HtmlRule'),
    JavaRule = require('./lexer/rule/JavaRule'),
    CRule = require('./lexer/rule/CRule');
	exports.lexer = function(syntax) {
		switch(syntax.toLowerCase()) {
			case 'js':
			case 'javascript':
			case 'ecmascript':
			case 'jscript':
			case 'as':
			case 'as3':
			case 'actionscript':
			case 'actionscript3':
				return new EcmascriptLexer(new EcmascriptRule());
			case 'css':
			case 'css2':
			case 'css3':
				return new CssLexer(new CssRule());
			case 'java':
				return new Lexer(new JavaRule());
			case 'c':
			case 'c++':
			case 'cpp':
			case 'cplusplus':
				return new Lexer(new CRule());
      case 'htm':
      case 'html':
        return new HtmlLexer(new HtmlRule());
      case 'jsx':
        return new JSXLexer(new EcmascriptRule());
			case 'csx':
				return new CSXLexer(new EcmascriptRule());
		}
	};
});