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
  });
});