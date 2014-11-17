var homunculus = require('../');

var expect = require('expect.js');
var JsNode = homunculus.getClass('node', 'js');

var walk = homunculus.getClass('walk');

describe('simple', function() {
  it('js', function() {
    var parser = homunculus.getParser('js');
    var node = parser.parse(' var a = 1;');
    var ignore = parser.ignore();
    var varstmt, vardecl, number, ignores = [];
    walk.simple(node, ignore, {
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
});