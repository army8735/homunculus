var homunculus = require('../homunculus');

var expect = require('expect.js');

var Lexer = require('../src/lexer/Lexer');
var CssLexer = require('../src/lexer/CssLexer');
var JsParser = require('../src/parser/js/Parser');
var CssParser = require('../src/parser/css/Parser');
var JsNode = require('../src/parser/js/Node');
var CssNode = require('../src/parser/css/Node');
var Token = require('../src/lexer/Token');
var JsContext = require('../src/parser/js/Context');

describe('api of homunculus', function() {
  it('#getClass', function() {
    expect(homunculus.getClass('lexer', 'js')).to.be(Lexer);
    expect(homunculus.getClass('lexer', 'javascript')).to.be(Lexer);
    expect(homunculus.getClass('lexer', 'es')).to.be(Lexer);
    expect(homunculus.getClass('lexer', 'ecmascript')).to.be(Lexer);
    expect(homunculus.getClass('lexer', 'as')).to.be(Lexer);
    expect(homunculus.getClass('lexer', 'actionscript')).to.be(Lexer);

    expect(homunculus.getClass('lexer', 'css')).to.be(CssLexer);

    expect(homunculus.getClass('parser', 'js')).to.be(JsParser);
    expect(homunculus.getClass('parser', 'javascript')).to.be(JsParser);
    expect(homunculus.getClass('parser', 'es')).to.be(JsParser);
    expect(homunculus.getClass('parser', 'ecmascript')).to.be(JsParser);

    expect(homunculus.getClass('parser', 'css')).to.be(CssParser);

    expect(homunculus.getClass('node', 'js')).to.be(JsNode);
    expect(homunculus.getClass('node', 'javascript')).to.be(JsNode);
    expect(homunculus.getClass('node', 'es')).to.be(JsNode);
    expect(homunculus.getClass('node', 'ecmascript')).to.be(JsNode);

    expect(homunculus.getClass('node', 'css')).to.be(CssNode);

    expect(homunculus.getClass('token')).to.be(Token);

    expect(homunculus.getClass('context', 'js')).to.be(JsContext);
    expect(homunculus.getClass('context', 'javascript')).to.be(JsContext);
    expect(homunculus.getClass('context', 'es')).to.be(JsContext);
    expect(homunculus.getClass('context', 'ecmascript')).to.be(JsContext);
  });
  it('#getLexer', function() {
    expect(homunculus.getLexer('js')).to.be.a(Lexer);
    expect(homunculus.getLexer('javascript')).to.be.a(Lexer);
    expect(homunculus.getLexer('es')).to.be.a(Lexer);
    expect(homunculus.getLexer('ecmascript')).to.be.a(Lexer);
    expect(homunculus.getLexer('as')).to.be.a(Lexer);
    expect(homunculus.getLexer('actionscript')).to.be.a(Lexer);

    expect(homunculus.getLexer('css')).to.be.a(CssLexer);
  });
  it('#getParser', function() {
    expect(homunculus.getParser('js')).to.be.a(JsParser);
    expect(homunculus.getParser('javascript')).to.be.a(JsParser);
    expect(homunculus.getParser('es')).to.be.a(JsParser);
    expect(homunculus.getParser('ecmascript')).to.be.a(JsParser);

    expect(homunculus.getParser('css')).to.be.a(CssParser);
  });
  it('#getContext', function() {
    expect(homunculus.getContext('js')).to.be.a(JsContext);
    expect(homunculus.getContext('javascript')).to.be.a(JsContext);
    expect(homunculus.getContext('es')).to.be.a(JsContext);
    expect(homunculus.getContext('ecmascript')).to.be.a(JsContext);
  });
});