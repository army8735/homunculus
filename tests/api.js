var homunculus = require('../');

var expect = require('expect.js');

var Lexer = require('../dist/lexer/Lexer');
var CssLexer = require('../dist/lexer/CssLexer');
var JsParser = require('../dist/parser/js/Parser');
var Es6Parser = require('../dist/parser/es6/Parser');
var CssParser = require('../dist/parser/css/Parser');
var JsNode = require('../dist/parser/js/Node');
var Es6Node = require('../dist/parser/es6/Node');
var CssNode = require('../dist/parser/css/Node');
var Token = require('../dist/lexer/Token');
var JsContext = require('../dist/parser/js/Context');

describe('api of homunculus', function() {
  it('#getClass', function() {
    expect(homunculus.getClass('lexer', 'js')).to.be(Lexer);
    expect(homunculus.getClass('lexer', 'javascript')).to.be(Lexer);
    expect(homunculus.getClass('lexer', 'es')).to.be(Lexer);
    expect(homunculus.getClass('lexer', 'es5')).to.be(Lexer);
    expect(homunculus.getClass('lexer', 'ecmascript')).to.be(Lexer);
    expect(homunculus.getClass('lexer', 'es6')).to.be(Lexer);
    expect(homunculus.getClass('lexer', 'as')).to.be(Lexer);
    expect(homunculus.getClass('lexer', 'actionscript')).to.be(Lexer);

    expect(homunculus.getClass('lexer', 'css')).to.be(CssLexer);

    expect(function() {
      homunculus.getClass('lexer', 'unknow');
    }).to.throwError();

    expect(homunculus.getClass('parser', 'js')).to.be(JsParser);
    expect(homunculus.getClass('parser', 'javascript')).to.be(JsParser);
    expect(homunculus.getClass('parser', 'es')).to.be(JsParser);
    expect(homunculus.getClass('parser', 'es5')).to.be(JsParser);
    expect(homunculus.getClass('parser', 'ecmascript')).to.be(JsParser);
    expect(homunculus.getClass('parser', 'es6')).to.be(Es6Parser);

    expect(homunculus.getClass('parser', 'css')).to.be(CssParser);

    expect(function() {
      homunculus.getClass('parser', 'unknow');
    }).to.throwError();

    expect(homunculus.getClass('node', 'js')).to.be(JsNode);
    expect(homunculus.getClass('node', 'javascript')).to.be(JsNode);
    expect(homunculus.getClass('node', 'es')).to.be(JsNode);
    expect(homunculus.getClass('node', 'es5')).to.be(JsNode);
    expect(homunculus.getClass('node', 'ecmascript')).to.be(JsNode);
    expect(homunculus.getClass('node', 'es6')).to.be(Es6Node);

    expect(homunculus.getClass('node', 'css')).to.be(CssNode);

    expect(function() {
      homunculus.getClass('node', 'unknow');
    }).to.throwError();

    expect(homunculus.getClass('token')).to.be(Token);

    expect(homunculus.getClass('context', 'js')).to.be(JsContext);
    expect(homunculus.getClass('context', 'javascript')).to.be(JsContext);
    expect(homunculus.getClass('context', 'es')).to.be(JsContext);
    expect(homunculus.getClass('context', 'es5')).to.be(JsContext);
    expect(homunculus.getClass('context', 'ecmascript')).to.be(JsContext);

    expect(function() {
      homunculus.getClass('context', 'unknow');
    }).to.throwError();
    expect(function() {
      homunculus.getClass('unknow', 'unknow');
    }).to.throwError();
  });
  it('#getLexer', function() {
    expect(homunculus.getLexer('js')).to.be.a(Lexer);
    expect(homunculus.getLexer('javascript')).to.be.a(Lexer);
    expect(homunculus.getLexer('es')).to.be.a(Lexer);
    expect(homunculus.getLexer('es5')).to.be.a(Lexer);
    expect(homunculus.getLexer('ecmascript')).to.be.a(Lexer);
    expect(homunculus.getLexer('es6')).to.be.a(Lexer);
    expect(homunculus.getLexer('as')).to.be.a(Lexer);
    expect(homunculus.getLexer('actionscript')).to.be.a(Lexer);

    expect(homunculus.getLexer('css')).to.be.a(CssLexer);

    expect(function() {
      homunculus.getLexer('unknow');
    }).to.throwError();
  });
  it('#getParser', function() {
    expect(homunculus.getParser('js')).to.be.a(JsParser);
    expect(homunculus.getParser('javascript')).to.be.a(JsParser);
    expect(homunculus.getParser('es')).to.be.a(JsParser);
    expect(homunculus.getParser('es5')).to.be.a(JsParser);
    expect(homunculus.getParser('ecmascript')).to.be.a(JsParser);
    expect(homunculus.getParser('es6')).to.be.a(Es6Parser);

    expect(homunculus.getParser('css')).to.be.a(CssParser);

    expect(function() {
      homunculus.getParser('unknow');
    }).to.throwError();
  });
  it('#getContext', function() {
    expect(homunculus.getContext('js')).to.be.a(JsContext);
    expect(homunculus.getContext('javascript')).to.be.a(JsContext);
    expect(homunculus.getContext('es')).to.be.a(JsContext);
    expect(homunculus.getContext('es5')).to.be.a(JsContext);
    expect(homunculus.getContext('ecmascript')).to.be.a(JsContext);

    expect(function() {
      homunculus.getContext('unknow');
    }).to.throwError();
  });
});