var homunculus = require('../');

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
    it('var duplicate', function() {
      var context = homunculus.getContext('js');
      context.parse('var a = 1;var a = 2;');
      expect(context.getVars().length).to.be(1);
    });
    it('var replace with fn', function() {
      var context = homunculus.getContext('js');
      context.parse('var a;function a(){}');
      expect(context.hasVar('a')).to.be(false);
      expect(context.hasChild('a')).to.be(true);
    });
    it('vardecl replace with fn', function() {
      var context = homunculus.getContext('js');
      context.parse('var a = 1;function a(){}');
      expect(context.hasVar('a')).to.be(true);
      expect(context.hasChild('a')).to.be(false);
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
      context.parse('function a(b, c, d){}');
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
    it('fnexpr with name', function() {
      var context = homunculus.getContext('js');
      context.parse('~function a(){}();');
      var first = context.getChildren()[0];
      expect(first.getName()).to.be(null);
    });
    it('fnexpr with params', function() {
      var context = homunculus.getContext('js');
      context.parse('~function a(b){}();');
      var first = context.getChildren()[0];
      expect(first.hasParam('b')).to.ok();
      expect(first.getParams().length).to.be(1);
    });
    it('fnexpr call this', function() {
      var context = homunculus.getContext('js');
      context.parse('~function a(b){}.call(this, 1);');
      var first = context.getChildren()[0];
      expect(first.getAParams().length).to.be(1);
      expect(first.getThis().leaves()[0].token().content()).to.be('this');
    });
    it('fnexpr apply this', function() {
      var context = homunculus.getContext('js');
      context.parse('~function a(b){}.apply(this, [1, 2]);');
      var first = context.getChildren()[0];
      expect(first.getAParams().length).to.be(2);
      expect(first.getThis().leaves()[0].token().content()).to.be('this');
    });
    it('fnexpr in ()', function() {
      var context = homunculus.getContext('js');
      context.parse('(function a(){})();');
      expect(context.getChildren().length).to.be(1);
    });
    it('fnexpr in () with params', function() {
      var context = homunculus.getContext('js');
      context.parse('(function(b){})(0);');
      var first = context.getChildren()[0];
      expect(first.hasParam('b')).to.ok();
    });
    it('fnexpr in () with params & with name', function() {
      var context = homunculus.getContext('js');
      context.parse('(function a(b){})();');
      var first = context.getChildren()[0];
      expect(first.hasParam('b')).to.ok();
    });
    it('fnexpr in () with call', function() {
      var context = homunculus.getContext('js');
      context.parse('(function(a){}).call(this, 1);');
      var first = context.getChildren()[0];
      expect(first.getThis().leaves()[0].token().content()).to.be('this');
    });
    it('fnexpr in () with apply', function() {
      var context = homunculus.getContext('js');
      context.parse('(function(a){}).apply(this, [1]);');
      var first = context.getChildren()[0];
      expect(first.getAParams().length).to.be(1);
    });
    it('isFnexpr', function() {
      var context = homunculus.getContext('js');
      context.parse('~function(){}();');
      var first = context.getChildren()[0];
      expect(first.isFnexpr()).to.ok();
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
    it('vid toString', function() {
      var context = homunculus.getContext('js');
      context.parse('toString.call(this)');
      expect(context.hasVid('toString')).to.be(true);
    });
    it('#getVid', function() {
      var context = homunculus.getContext('js');
      context.parse('a = 1');
      expect(context.getVid('a')[0]).to.be(context.getVids()[0]);
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
    it('#getParent top', function() {
      var context = homunculus.getContext('js');
      context.parse('function a(){}');
      var first = context.getChild('a');
      expect(context.getParent()).to.be(null);
    });
    it('#getParent child', function() {
      var context = homunculus.getContext('js');
      context.parse('function a(){}');
      var first = context.getChild('a');
      expect(first.getParent()).to.be(context);
    });
    it('#getNode', function() {
      var context = homunculus.getContext('js');
      context.parse('function a(){}');
      var first = context.getChild('a');
      var ast = context.parser.ast();
      expect(first.getNode()).to.be(ast.leaves()[0]);
    });
    it('parse ast', function() {
      var Context = homunculus.getClass('context', 'js');
      var parser = homunculus.getParser('js');
      parser.parse('function a(){}');
      var context = new Context();
      context.parse(parser.ast());
      expect(context.hasChild('a')).to.ok();
    });
    it('#addVid duplicate', function() {
      var context = homunculus.getContext('js');
      context.parse('a.b = 1;a = 2;');
      expect(context.getVids().length).to.be(2);
    });
  });
});