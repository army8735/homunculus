var homunculus = require('../homunculus');

var expect = require('expect.js');

describe('jscontext', function() {
  describe('simple tests', function() {
    it('var 1', function() {
      var context = homunculus.getContext('js');
      context.parse('var a = 1, b, c = {}');
      expect(context.getVars().length).to.be(3);
      expect(context.hasVar('a')).to.be(true);
      expect(context.hasVar('b')).to.be(true);
      expect(context.hasVar('c')).to.be(true);
    });
    it('var 2', function() {
      var context = homunculus.getContext('js');
      context.parse('var a = b = 1;var a;');
      expect(context.getVars().length).to.be(1);
      expect(context.hasVar('a')).to.be(true);
    });
    it('fndecl 1', function() {
      var context = homunculus.getContext('js');
      context.parse('function a(){}var a;function b(){}');
      expect(context.getVars().length).to.be(0);
      expect(context.hasVar('a')).to.be(false);
      expect(context.hasChild('a')).to.be(true);
      expect(context.hasChild('b')).to.be(true);
    });
    it('fndecl 2', function() {
      var context = homunculus.getContext('js');
      context.parse('function a(){}var a = 1;');
      expect(context.hasVar('a')).to.be(true);
      expect(context.hasChild('a')).to.be(false);
    });
    it('fndecl 3', function() {
      var context = homunculus.getContext('js');
      context.parse('function a(){var c = 1;}');
      expect(context.hasChild('a')).to.be(true);
      var a = context.getChild('a');
      expect(a.hasVar('c')).to.be(true);
    });
    it('fndecl params', function() {
      var context = homunculus.getContext('js');
      context.parse('function a(b, c = 1, ...d){}');
      var a = context.getChild('a');
      expect(a.hasParam('b')).to.be(true);
      expect(a.hasParam('c')).to.be(true);
      expect(a.hasParam('d')).to.be(true);
    });
    it('fnexpr', function() {
      var context = homunculus.getContext('js');
      context.parse('~function(){var a = 1;}()');
      expect(context.hasVar('a')).to.be(false);
      expect(context.getChildren().length).to.be(1);
      var first = context.getChildren()[0];
      var cid = first.getId();
      expect(context.getChild(cid)).to.equal(first);
    });
    it('fnexpr actual param', function() {
      var context = homunculus.getContext('js');
      context.parse('~function(){}(a, this, 3);');
      var first = context.getChildren()[0];
      expect(first.getAParams().length).to.be(3);
    });
    it('vid 1', function() {
      var context = homunculus.getContext('js');
      context.parse('var a = 1, b = {};c;b.a = 1;');
      expect(context.hasVid('a')).to.be(false);
      expect(context.hasVid('b')).to.be(true);
      expect(context.hasVid('c')).to.be(true);
    });
    it('vid 2', function() {
      var context = homunculus.getContext('js');
      context.parse('var a = b = 1;');
      expect(context.hasVid('a')).to.be(false);
      expect(context.hasVid('b')).to.be(true);
    });
    it('vid 3', function() {
      var context = homunculus.getContext('js');
      context.parse('~function(){var a = 1;b;}()');
      var first = context.getChildren()[0];
      expect(first.hasVid('a')).to.be(false);
      expect(first.hasVid('b')).to.be(true);
    });
    it('return 1', function() {
      var context = homunculus.getContext('js');
      context.parse('return a;');
      expect(context.getReturns().length).to.be(1);
    });
    it('return 2', function() {
      var context = homunculus.getContext('js');
      context.parse('function a() {return;}');
      var first = context.getChild('a');
      expect(first.getReturns().length).to.be(1);
    });
    it('return 3', function() {
      var context = homunculus.getContext('js');
      context.parse('~function() {return;}()');
      var first = context.getChildren()[0];
      expect(first.getReturns().length).to.be(1);
    });
    it('return 4', function() {
      var context = homunculus.getContext('js');
      context.parse('if(a)return true;else return false;');
      expect(context.getReturns().length).to.be(2);
    });
  });
});