var homunculus = require('../homunculus');

var expect = require('expect.js');

describe('jscontext', function() {
  describe('simple tests', function() {
    it('var test 1', function() {
      var context = homunculus.getContext('js');
      var env = context.parse('var a = 1, b, c = {}');
      expect(env.getVars().length).to.be(3);
      expect(env.hasVar('a')).to.be(true);
      expect(env.hasVar('b')).to.be(true);
      expect(env.hasVar('c')).to.be(true);
    });
    it('var test 2', function() {
      var context = homunculus.getContext('js');
      var env = context.parse('var a = b = 1;var a;');
      expect(env.getVars().length).to.be(1);
      expect(env.hasVar('a')).to.be(true);
    });
    it('fndecl test1', function() {
      var context = homunculus.getContext('js');
      var env = context.parse('function a(){}var a;function b(){}');
      expect(env.getVars().length).to.be(0);
      expect(env.hasVar('a')).to.be(false);
      expect(env.hasChild('a')).to.be(true);
      expect(env.hasChild('b')).to.be(true);
    });
    it('fndecl test2', function() {
      var context = homunculus.getContext('js');
      var env = context.parse('function a(){}var a = 1;');
      expect(env.hasVar('a')).to.be(true);
      expect(env.hasChild('a')).to.be(false);
    });
    it('fndecl test3', function() {
      var context = homunculus.getContext('js');
      var env = context.parse('function a(){var c = 1;}');
      expect(env.hasChild('a')).to.be(true);
      var a = env.getChild('a');
      expect(a.hasVar('c')).to.be(true);
    });
    it('fndecl params test', function() {
      var context = homunculus.getContext('js');
      var env = context.parse('function a(b, c = 1, ...d){}');
      var a = env.getChild('a');
      expect(a.hasParam('b')).to.be(true);
      expect(a.hasParam('c')).to.be(true);
      expect(a.hasParam('d')).to.be(true);
    });
  });
});