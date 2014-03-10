var homunculus = require('../homunculus');

var expect = require('expect.js');

describe('api of homunculus', function() {
  it('#getClass', function() {
    var JsLexer = homunculus.getClass('lexer', 'js');
    var JavascriptLexer = homunculus.getClass('lexer', 'javascript');
    var EsLexer = homunculus.getClass('lexer', 'es');
    var EcmascriptLexer = homunculus.getClass('lexer', 'ecmascript');
    var AsLexer = homunculus.getClass('lexer', 'as');
    var ActionscriptLexer = homunculus.getClass('lexer', 'actionscript');

    var JsParser = homunculus.getClass('parser', 'js');
    var JavascriptParser = homunculus.getClass('parser', 'javascript');
    var EsParser = homunculus.getClass('parser', 'es');
    var EcmascriptParser = homunculus.getClass('parser', 'ecmascript');

    var CssParser = homunculus.getClass('parser', 'css');

    var JsNode = homunculus.getClass('node', 'js');
    var JavascriptNode = homunculus.getClass('node', 'javascript');
    var EsNode = homunculus.getClass('node', 'es');
    var EcmascriptNode = homunculus.getClass('node', 'ecmascript');

    var CssNode = homunculus.getClass('node', 'css');

    expect(JsLexer).to.be(require('../src/lexer/Lexer'));
    expect(JavascriptLexer).to.be(require('../src/lexer/Lexer'));
    expect(EsLexer).to.be(require('../src/lexer/Lexer'));
    expect(EcmascriptLexer).to.be(require('../src/lexer/Lexer'));
    expect(AsLexer).to.be(require('../src/lexer/Lexer'));
    expect(ActionscriptLexer).to.be(require('../src/lexer/Lexer'));

    expect(JsParser).to.be(require('../src/parser/js/Parser'));
    expect(JavascriptParser).to.be(require('../src/parser/js/Parser'));
    expect(EsParser).to.be(require('../src/parser/js/Parser'));
    expect(EcmascriptParser).to.be(require('../src/parser/js/Parser'));

    expect(CssParser).to.be(require('../src/parser/css/Parser'));

    expect(JsNode).to.be(require('../src/parser/js/Node'));
    expect(JavascriptNode).to.be(require('../src/parser/js/Node'));
    expect(EsNode).to.be(require('../src/parser/js/Node'));
    expect(EcmascriptNode).to.be(require('../src/parser/js/Node'));

    expect(CssNode).to.be(require('../src/parser/css/Node'));
  });
});