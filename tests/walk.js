var homunculus = require('../');

var expect = require('expect.js');
var JsNode = homunculus.getClass('node', 'js');
var Token = homunculus.getClass('token', 'js');

var walk = homunculus.getClass('walk');

describe('js', function() {
  it('simple', function() {
    var parser = homunculus.getParser('js');
    var node = parser.parse(' var a = 1;');
    var varstmt, vardecl, number;
    walk.simple(node, {
      'varstmt': function() {
        varstmt = true;
      },
      'vardecl': function(node) {
        vardecl = node;
      }
    }, {
      '4': function(token) {
        number = token.content();
      },
      '5': function(token, igs) {
        igs.forEach(function(ig) {
          ignores.push(ig.content());
        });
      }
    });
    expect(varstmt).to.eql(true);
    expect(vardecl.name()).to.eql(JsNode.VARDECL);
    expect(number).to.eql('1');
  });
  it('simpleIgnore', function() {
    var parser = homunculus.getParser('js');
    var node = parser.parse(' var a = 1;');
    var ignore = parser.ignore();
    var varstmt, vardecl, number, ignores = [];
    walk.simpleIgnore(node, ignore, {
      'varstmt': function() {
        varstmt = true;
      },
      'vardecl': function(node) {
        vardecl = node;
      }
    }, {
      '4': function(token) {
        number = token.content();
      },
      '5': function(token, igs) {
        igs.forEach(function(ig) {
          ignores.push(ig.content());
        });
      }
    });
    expect(varstmt).to.eql(true);
    expect(vardecl.name()).to.eql(JsNode.VARDECL);
    expect(number).to.eql('1');
    expect(ignores).to.eql([' ']);
  });
  it('recursion', function() {
    var parser = homunculus.getParser('js');
    var node = parser.parse('var a');
    var nodes = [];
    var tokens = [];
    walk.recursion(node, function(node, isToken) {
      if(isToken) {
        tokens.push(node.type());
      }
      else {
        nodes.push(node.name());
      }
    });
    expect(nodes).to.eql([JsNode.PROGRAM, JsNode.VARSTMT, JsNode.VARDECL]);
    expect(tokens).to.eql([Token.KEYWORD, Token.ID]);
  });
  it('plainObject', function() {
    var parser = homunculus.getParser('js');
    var node = parser.parse('var a = 1');
    var plainObject = walk.plainObject(node);
    expect(plainObject).to.eql(["PROGRAM",["VARSTMT",["var","VARDECL",["a","ASSIGN",["=","PRMREXPR",["1"]]]]]]);
  });
});