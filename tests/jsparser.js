var homunculus = require('../');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Token = homunculus.getClass('token');
var Parser = homunculus.getClass('parser', 'js');
var JsNode = homunculus.getClass('node', 'js');

var res;
var index;

function jion(node, ignore) {
  res = '';
  index = 0;
  while(ignore[index]) {
    res += ignore[index++].content();
  }
  recursion(node, ignore);
  return res;
}
function recursion(node, ignore) {
  var isToken = node.name() == JsNode.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      res += token.content();
      while(ignore[++index]) {
        res += ignore[index].content();
      }
    }
  }
  else {
    node.leaves().forEach(function(leaf, i) {
      recursion(leaf, ignore);
    });
  }
}

function tree(node, arr) {
  arr = arr || [];
  var isToken = node.name() == JsNode.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      arr.push(token.content());
    }
  }
  else {
    arr.push(node.name());
    var childs = [];
    arr.push(childs);
    node.leaves().forEach(function(leaf, i) {
      tree(leaf, childs);
    });
  }
  return arr;
}

describe('jsparser', function() {
  describe('simple test', function() {
    it('varstmt no assign', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var a;');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.VARSTMT, ['var', JsNode.VARDECL, ['a'], ';']]]);
    });
    it('varstmt with assign', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var a = 1;');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.VARSTMT, ['var', JsNode.VARDECL, ['a', JsNode.ASSIGN, ['=', JsNode.PRMREXPR, [1]]], ';']]]);
    });
    it('varstmt with multi', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var a, b = 1;');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.VARSTMT, ['var', JsNode.VARDECL, ['a'], ',', JsNode.VARDECL, ['b', JsNode.ASSIGN, ['=', JsNode.PRMREXPR, [1]]], ';']]]);
    });
    it('newexpr 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('new A');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.NEWEXPR, ['new', JsNode.PRMREXPR, ['A']]]]]);
    });
    it('newexpr 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('new A()');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.NEWEXPR, ['new', JsNode.PRMREXPR, ['A'], JsNode.ARGS, ['(', ')']]]]]);
    });
    it('newexpr 3', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('new A().f');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.MMBEXPR, [JsNode.NEWEXPR, ['new', JsNode.PRMREXPR, ['A'], JsNode.ARGS, ['(', ')']], '.', 'f']]]]);
    });
    it('newexpr 4', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('new A().f()');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.CALLEXPR, [JsNode.MMBEXPR, [JsNode.NEWEXPR, ['new', JsNode.PRMREXPR, ['A'], JsNode.ARGS, ['(', ')']], '.', 'f'], JsNode.ARGS, ['(', ')']]]]]);
    });
    it('newexpr 5', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('new new A().f()');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.NEWEXPR, ['new', JsNode.MMBEXPR, [JsNode.NEWEXPR, ['new', JsNode.PRMREXPR, ['A'], JsNode.ARGS, ['(', ')']], '.', 'f'], JsNode.ARGS, ['(', ')']]]]]);
    });
    it('newexpr 6', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('new A()[1]');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.EXPRSTMT,[JsNode.MMBEXPR,[JsNode.NEWEXPR,["new",JsNode.PRMREXPR,["A"],JsNode.ARGS,["(",")"]],"[",JsNode.PRMREXPR,["1"],"]"]]]]);
    });
    it('newexpr error', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('new');
      }).to.throwError();
    });
    it('mmbexpr 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a.b.c');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.EXPRSTMT,[JsNode.MMBEXPR,[JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],".","b"],".","c"]]]]);
    });
    it('mmbexpr 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a.b[c]');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.EXPRSTMT,[JsNode.MMBEXPR,[JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],".","b"],"[",JsNode.PRMREXPR,["c"],"]"]]]]);
    });
    it('mmbexpr 3', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a.b');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.EXPRSTMT,[JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],".","b"]]]]);
    });
    it('mmbexpr 4', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a[2]');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.MMBEXPR, [JsNode.PRMREXPR, ['a'], '[', JsNode.PRMREXPR, ['2'], ']']]]]);
    });
    it('mmbexpr error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('a.');
      }).to.throwError();
    });
    it('returnstmt 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('return a');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.RETSTMT, ['return', JsNode.PRMREXPR, ['a']]]]);
    });
    it('returnstmt 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('return\na');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.RETSTMT, ['return'], JsNode.EXPRSTMT, [JsNode.PRMREXPR, ['a']]]]);
    });
    it('returnstmt 3', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('return/*\n*/a');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.RETSTMT, ['return'], JsNode.EXPRSTMT, [JsNode.PRMREXPR, ['a']]]]);
    });
    it('returnstmt 4', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('return a\nreturn');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.RETSTMT, ['return', JsNode.PRMREXPR, ['a']], JsNode.RETSTMT, ['return']]]);
    });
    it('returnstmt 5', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('{return}');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.BLOCK, ['{', JsNode.RETSTMT, ['return'], '}']]]);
    });
    it('postfixexpr 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a++ + b');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.ADDEXPR, [JsNode.POSTFIXEXPR, [JsNode.PRMREXPR, ['a'], '++'], '+', JsNode.PRMREXPR, ['b']]]]]);
    });
    it('postfixexpr 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a\nb++');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.PRMREXPR, ['a']], JsNode.EXPRSTMT, [JsNode.POSTFIXEXPR, [JsNode.PRMREXPR, ['b'], '++']]]]);
    });
    it('postfixexpr 3', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a/*\n*/b++');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.PRMREXPR, ['a']], JsNode.EXPRSTMT, [JsNode.POSTFIXEXPR, [JsNode.PRMREXPR, ['b'], '++']]]]);
    });
    it('postfixexpr 4', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a++');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.EXPRSTMT,[JsNode.POSTFIXEXPR,[JsNode.PRMREXPR,["a"],"++"]]]]);
    });
    it('postfixexpr error 1', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('a++ ++');
      }).to.throwError();
    });
    it('postfixexpr error 2', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('++');
      }).to.throwError();
    });
    it('fndecl', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('function a() {}');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.FNDECL, ['function', 'a', '(', ')', '{', JsNode.FNBODY, [], '}']]]);
    });
    it('fndecl with params', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('function a(b,c) {}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.FNDECL,["function","a","(",JsNode.FNPARAMS,["b",",","c"],")","{",JsNode.FNBODY,[],"}"]]]);
    });
    it('fndecl error 1', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('function a(');
      }).to.throwError();
    });
    it('fnexpr 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('~function() {}()');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.UNARYEXPR, ['~', JsNode.CALLEXPR, [JsNode.FNEXPR, ['function', '(', ')', '{', JsNode.FNBODY, [], '}'], JsNode.ARGS, ['(', ')']]]]]]);
    });
    it('fnexpr 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('(function() {})()');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.CALLEXPR, [JsNode.PRMREXPR, ['(', JsNode.FNEXPR, ['function', '(', ')', '{', JsNode.FNBODY, [], '}'], ')'], JsNode.ARGS, ['(', ')']]]]]);
    });
    it('fnexpr error 1', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('(function');
      }).to.throwError();
    });
    it('fnexpr error 2', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('(function(');
      }).to.throwError();
    });
    it('fnexpr error 3', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('(function(a,');
      }).to.throwError();
    });
    it('fnexpr error 4', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('(function(a,1');
      }).to.throwError();
    });
    it('labelstmt', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('label:;');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.LABSTMT, ['label', ':', JsNode.EMPTSTMT, [';']]]]);
    });
    it('prmrexpr 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.PRMREXPR, ['a']]]]);
    });
    it('prmrexpr 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('true');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.PRMREXPR, ['true']]]]);
    });
    it('prmrexpr 3', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('null');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.PRMREXPR, ['null']]]]);
    });
    it('prmrexpr 4', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('this');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.PRMREXPR, ['this']]]]);
    });
    it('prmrexpr 5', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('false');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.PRMREXPR, ['false']]]]);
    });
    it('prmrexpr 6', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('[]');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.PRMREXPR, [JsNode.ARRLTR, ['[', ']']]]]]);
    });
    it('prmrexpr 7', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('!{}');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.UNARYEXPR, ['!', JsNode.PRMREXPR, [JsNode.OBJLTR, ['{', '}']]]]]]);
    });
    it('prmrexpr error', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('.');
      }).to.throwError();
    });
    it('arrltr', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('[,,,2,3,]');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,[JsNode.ARRLTR,["[",",",",",",",JsNode.PRMREXPR,["2"],",",JsNode.PRMREXPR,["3"],",","]"]]]]]);
    });
    it('arrltr error', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('[,,,2,3,');
      }).to.throwError();
    });
    it('objltr', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var o = {a: [], "b": 3, 5: {}}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,["o",JsNode.ASSIGN,["=",JsNode.PRMREXPR,[JsNode.OBJLTR,["{",JsNode.PROPTASSIGN,["a",":",JsNode.PRMREXPR,[JsNode.ARRLTR,["[","]"]]],",",JsNode.PROPTASSIGN,["\"b\"",":",JsNode.PRMREXPR,["3"]],",",JsNode.PROPTASSIGN,["5",":",JsNode.PRMREXPR,[JsNode.OBJLTR,["{","}"]]],"}"]]]]]]]);
    });
    it('keyword can be obj\'s property', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var o = {var:1}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,["o",JsNode.ASSIGN,["=",JsNode.PRMREXPR,[JsNode.OBJLTR,["{",JsNode.PROPTASSIGN,["var",":",JsNode.PRMREXPR,["1"]],"}"]]]]]]]);
    });
    it('keyword can not be label', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var:');
      }).to.throwError();
    });
    it('keyword after get/set', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('~{get var(){}}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.EXPRSTMT,[JsNode.UNARYEXPR,["~",JsNode.PRMREXPR,[JsNode.OBJLTR,["{",JsNode.PROPTASSIGN,["get","var","(",")","{",JsNode.FNBODY,[],"}"],"}"]]]]]]);
    });
    it('objltr error', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var o = {+');
      }).to.throwError();
    });
    it('getter', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var o = {get a(){}}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,["o",JsNode.ASSIGN,["=",JsNode.PRMREXPR,[JsNode.OBJLTR,["{",JsNode.PROPTASSIGN,["get","a","(",")","{",JsNode.FNBODY,[],"}"],"}"]]]]]]]);
    });
    it('getter error 1', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var o = {get a}');
      }).to.throwError();
    });
    it('getter error 2', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var o = {get a(}');
      }).to.throwError();
    });
    it('getter error 3', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var o = {get a()}');
      }).to.throwError();
    });
    it('getter error 4', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var o = {get 3}');
      }).to.throwError();
    });
    it('setter', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var o = {set a(b){}}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,["o",JsNode.ASSIGN,["=",JsNode.PRMREXPR,[JsNode.OBJLTR,["{",JsNode.PROPTASSIGN,["set","a","(","b",")","{",JsNode.FNBODY,[],"}"],"}"]]]]]]]);
    });
    it('setter error 1', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var o = {set a}');
      }).to.throwError();
    });
    it('setter error 2', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var o = {set a(}');
      }).to.throwError();
    });
    it('setter error 3', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var o = {set a()}');
      }).to.throwError();
    });
    it('setter error 4', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var o = {set a(){}}');
      }).to.throwError();
    });
    it('callexpr 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a()');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.CALLEXPR, [JsNode.PRMREXPR, ['a'], JsNode.ARGS, ['(', ')']]]]]);
    });
    it('callexpr 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a.b()');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.CALLEXPR, [JsNode.MMBEXPR, [JsNode.PRMREXPR, ['a'], '.', 'b'], JsNode.ARGS, ['(', ')']]]]]);
    });
    it('callexpr 3', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('new A().f()');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.CALLEXPR, [JsNode.MMBEXPR, [JsNode.NEWEXPR, ['new', JsNode.PRMREXPR, ['A'], JsNode.ARGS, ['(', ')']], '.', 'f'], JsNode.ARGS, ['(', ')']]]]]);
    });
    it('callexpr 4', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('f()()');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.EXPRSTMT,[JsNode.CALLEXPR,[JsNode.CALLEXPR,[JsNode.PRMREXPR,["f"],JsNode.ARGS,["(",")"]],JsNode.ARGS,["(",")"]]]]]);
    });
    it('callexpr 5', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('f().b[1]');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.EXPRSTMT,[JsNode.MMBEXPR,[JsNode.MMBEXPR,[JsNode.CALLEXPR,[JsNode.PRMREXPR,["f"],JsNode.ARGS,["(",")"]],".","b"],"[",JsNode.PRMREXPR,["1"],"]"]]]]);
    });
    it('callexpr 6', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a.b().c.d()');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.EXPRSTMT,[JsNode.CALLEXPR,[JsNode.MMBEXPR,[JsNode.MMBEXPR,[JsNode.CALLEXPR,[JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],".","b"],JsNode.ARGS,["(",")"]],".","c"],".","d"],JsNode.ARGS,["(",")"]]]]]);
    });
    it('callexpr error', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('f(');
      }).to.throwError();
    });
    it('unaryexpr 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('typeof a');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.UNARYEXPR, ['typeof', JsNode.PRMREXPR, ['a']]]]]);
    });
    it('unaryexpr 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('!!0');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.UNARYEXPR, ['!', JsNode.UNARYEXPR, ['!', JsNode.PRMREXPR, ['0']]]]]]);
    });
    it('unaryexpr error 1', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('!');
      }).to.throwError();
    });
    it('unaryexpr error 2', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('++ +a');
      }).to.throwError();
    });
    it('mtplexpr 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a * b');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.MTPLEXPR, [JsNode.PRMREXPR, ['a'], '*', JsNode.PRMREXPR, ['b']]]]]);
    });
    it('mtplexpr 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a() * b[0]');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.MTPLEXPR, [JsNode.CALLEXPR, [JsNode.PRMREXPR, ['a'], JsNode.ARGS, ['(', ')']], '*', JsNode.MMBEXPR, [JsNode.PRMREXPR, ['b'], '[', JsNode.PRMREXPR, ['0'], ']']]]]]);
    });
    it('mtplexpr 3', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('!a * b--');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.MTPLEXPR, [JsNode.UNARYEXPR, ['!', JsNode.PRMREXPR, ['a']], '*', JsNode.POSTFIXEXPR, [JsNode.PRMREXPR, ['b'], '--']]]]]);
    });
    it('addexpr 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a + b * 2 - c');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.ADDEXPR, [JsNode.PRMREXPR, ["a"], "+", JsNode.MTPLEXPR, [JsNode.PRMREXPR, ["b"], "*", JsNode.PRMREXPR, ["2"]], "-", JsNode.PRMREXPR, ["c"]]]]]);
    });
    it('addexpr 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('~a + a++ + ++a');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.ADDEXPR, [JsNode.UNARYEXPR, ["~", JsNode.PRMREXPR, ["a"]], "+", JsNode.POSTFIXEXPR, [JsNode.PRMREXPR, ["a"], "++"], "+", JsNode.UNARYEXPR, ["++", JsNode.PRMREXPR, ["a"]]]]]]);
    });
    it('shiftexpr 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a>>a+1');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.SHIFTEXPR, [JsNode.PRMREXPR, ["a"], ">>", JsNode.ADDEXPR, [JsNode.PRMREXPR, ["a"], "+", JsNode.PRMREXPR, ["1"]]]]]]);
    });
    it('shiftexpr 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a*b>>>c/d<<--e');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.SHIFTEXPR, [JsNode.MTPLEXPR, [JsNode.PRMREXPR, ["a"], "*", JsNode.PRMREXPR, ["b"]], ">>>", JsNode.MTPLEXPR, [JsNode.PRMREXPR, ["c"], "/", JsNode.PRMREXPR, ["d"]], "<<", JsNode.UNARYEXPR, ["--", JsNode.PRMREXPR, ["e"]]]]]]);
    });
    it('reltexpr 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a > b');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.RELTEXPR, [JsNode.PRMREXPR, ["a"], ">", JsNode.PRMREXPR, ["b"]]]]]);
    });
    it('reltexpr 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a <= b+1');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.RELTEXPR, [JsNode.PRMREXPR, ["a"], "<=", JsNode.ADDEXPR, [JsNode.PRMREXPR, ["b"], "+", JsNode.PRMREXPR, ["1"]]]]]]);
    });
    it('reltexpr 3', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a instanceof new A()');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.RELTEXPR, [JsNode.PRMREXPR, ["a"], "instanceof", JsNode.NEWEXPR, ["new", JsNode.PRMREXPR, ["A"], JsNode.ARGS, ["(", ")"]]]]]]);
    });
    it('reltexpr error', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('a <');
      }).to.throwError();
    });
    it('eqexpr 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a == 3');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.EQEXPR, [JsNode.PRMREXPR, ["a"], "==", JsNode.PRMREXPR, ["3"]]]]]);
    });
    it('eqexpr 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a === b + 3');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.EQEXPR, [JsNode.PRMREXPR, ["a"], "===", JsNode.ADDEXPR, [JsNode.PRMREXPR, ["b"], "+", JsNode.PRMREXPR, ["3"]]]]]]);
    });
    it('eqexpr 3', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a !== b >>> 4');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.EQEXPR, [JsNode.PRMREXPR, ["a"], "!==", JsNode.SHIFTEXPR, [JsNode.PRMREXPR, ["b"], ">>>", JsNode.PRMREXPR, ["4"]]]]]]);
    });
    it('eqexpr error', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('a ==');
      }).to.throwError();
    });
    it('bitandexpr', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('void a & --b');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.BITANDEXPR, [JsNode.UNARYEXPR, ["void", JsNode.PRMREXPR, ["a"]], "&", JsNode.UNARYEXPR, ["--", JsNode.PRMREXPR, ["b"]]]]]]);
    });
    it('bitxorexpr', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a>1 ^ b--');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.BITXOREXPR, [JsNode.RELTEXPR, [JsNode.PRMREXPR, ["a"], ">", JsNode.PRMREXPR, ["1"]], "^", JsNode.POSTFIXEXPR, [JsNode.PRMREXPR, ["b"], "--"]]]]]);
    });
    it('bitorexpr', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('++b | -a');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.BITOREXPR, [JsNode.UNARYEXPR, ["++", JsNode.PRMREXPR, ["b"]], "|", JsNode.UNARYEXPR, ["-", JsNode.PRMREXPR, ["a"]]]]]]);
    });
    it('logandexpr', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a.b && c >> 1');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.LOGANDEXPR, [JsNode.MMBEXPR, [JsNode.PRMREXPR, ["a"], ".", "b"], "&&", JsNode.SHIFTEXPR, [JsNode.PRMREXPR, ["c"], ">>", JsNode.PRMREXPR, ["1"]]]]]]);
    });
    it('logorexpr', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a || b && c || d && f');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.LOGOREXPR, [JsNode.PRMREXPR, ["a"], "||", JsNode.LOGANDEXPR, [JsNode.PRMREXPR, ["b"], "&&", JsNode.PRMREXPR, ["c"]], "||", JsNode.LOGANDEXPR, [JsNode.PRMREXPR, ["d"], "&&", JsNode.PRMREXPR, ["f"]]]]]]);
    });
    it('condexpr', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a && b ? false || true : typeof null');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.CNDTEXPR, [JsNode.LOGANDEXPR, [JsNode.PRMREXPR, ["a"], "&&", JsNode.PRMREXPR, ["b"]], "?", JsNode.LOGOREXPR, [JsNode.PRMREXPR, ["false"], "||", JsNode.PRMREXPR, ["true"]], ":", JsNode.UNARYEXPR, ["typeof", JsNode.PRMREXPR, ["null"]]]]]]);
    });
    it('assignexpr 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a = b = c');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.ASSIGNEXPR, [JsNode.PRMREXPR, ["a"], "=", JsNode.ASSIGNEXPR, [JsNode.PRMREXPR, ["b"], "=", JsNode.PRMREXPR, ["c"]]]]]]);
    });
    it('assignexpr 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('a += b %= c');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.ASSIGNEXPR, [JsNode.PRMREXPR, ["a"], "+=", JsNode.ASSIGNEXPR, [JsNode.PRMREXPR, ["b"], "%=", JsNode.PRMREXPR, ["c"]]]]]]);
    });
    it('assignexpr error', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('a + b = c');
      }).to.throwError();
    });
    it('expr 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('(1)');
      expect(tree(node)).to.eql([JsNode.PROGRAM, [JsNode.EXPRSTMT, [JsNode.PRMREXPR, ["(", JsNode.PRMREXPR, ["1"], ")"]]]]);
    });
    it('expr 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('(a, !b, c+d)');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.EXPRSTMT,[JsNode.PRMREXPR,["(",JsNode.EXPR,[JsNode.PRMREXPR,["a"],",",JsNode.UNARYEXPR,["!",JsNode.PRMREXPR,["b"]],",",JsNode.ADDEXPR,[JsNode.PRMREXPR,["c"],"+",JsNode.PRMREXPR,["d"]]],")"]]]]);
    });
    it('expr error 1', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('(a,');
      }).to.throwError();
    });
    it('expr error 2', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('(a, b');
      }).to.throwError();
    });
    it('block', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('{}{}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.BLOCK,["{","}"],JsNode.BLOCK,["{","}"]]]);
    });
    it('varstmt 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var a, b;');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,["a"],",",JsNode.VARDECL,["b"],";"]]]);
    });
    it('varstmt 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var a = 1');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,["a",JsNode.ASSIGN,["=",JsNode.PRMREXPR,["1"]]]]]]);
    });
    it('varstmt 3', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var a = b = 1');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,["a",JsNode.ASSIGN,["=",JsNode.ASSIGNEXPR,[JsNode.PRMREXPR,["b"],"=",JsNode.PRMREXPR,["1"]]]]]]]);
    });
    it('varstmt 4', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var a = [{}]');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.VARSTMT,["var",JsNode.VARDECL,["a",JsNode.ASSIGN,["=",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,[JsNode.OBJLTR,["{","}"]],"]"]]]]]]]);
    });
    it('varstmt error 1', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var')
      }).to.throwError();
    });
    it('varstmt error 2', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('var a=');
      }).to.throwError();
    });
    it('emptstmt', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse(';{;}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.EMPTSTMT,[";"],JsNode.BLOCK,["{",JsNode.EMPTSTMT,[";"],"}"]]]);
    });
    it('ifstmt 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('if(true);');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.IFSTMT,["if","(",JsNode.PRMREXPR,["true"],")",JsNode.EMPTSTMT,[";"]]]]);
    });
    it('ifstmt 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('if(true){}else if(true){}else{}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.IFSTMT,["if","(",JsNode.PRMREXPR,["true"],")",JsNode.BLOCK,["{","}"],"else",JsNode.IFSTMT,["if","(",JsNode.PRMREXPR,["true"],")",JsNode.BLOCK,["{","}"],"else",JsNode.BLOCK,["{","}"]]]]]);
    });
    it('ifstmt missing stmt', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('if(true)');
      }).to.throwError();
    });
    it('whilestmt 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('while(false);');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.EMPTSTMT,[";"]]]]);
    });
    it('whilestmt 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('while(false){}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.BLOCK,["{","}"]]]]);
    });
    it('dowhilestmt 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('do;while(false)');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["do",JsNode.EMPTSTMT,[";"],"while","(",JsNode.PRMREXPR,["false"],")"]]]);
    });
    it('dowhilestmt 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('do{}while(false)');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["do",JsNode.BLOCK,["{","}"],"while","(",JsNode.PRMREXPR,["false"],")"]]]);
    });
    it('forstmt 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('for(;;){}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["for","(",";",";",")",JsNode.BLOCK,["{","}"]]]]);
    });
    it('forstmt 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('for(var a = 1; a < len; a++){}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["for","(",JsNode.VARSTMT,["var",JsNode.VARDECL,["a",JsNode.ASSIGN,["=",JsNode.PRMREXPR,["1"]]]],";",JsNode.RELTEXPR,[JsNode.PRMREXPR,["a"],"<",JsNode.PRMREXPR,["len"]],";",JsNode.POSTFIXEXPR,[JsNode.PRMREXPR,["a"],"++"],")",JsNode.BLOCK,["{","}"]]]]);
    });
    it('forstmt 3', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('for(o in {});');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["for","(",JsNode.PRMREXPR,["o"],"in",JsNode.PRMREXPR,[JsNode.OBJLTR,["{","}"]],")",JsNode.EMPTSTMT,[";"]]]]);
    });
    it('forstmt 4', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('for(var k in {}){}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["for","(",JsNode.VARSTMT,["var",JsNode.VARDECL,["k"]],"in",JsNode.PRMREXPR,[JsNode.OBJLTR,["{","}"]],")",JsNode.BLOCK,["{","}"]]]]);
    });
    it('forstmt 5', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('for(new A in [1,2]);');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["for","(",JsNode.NEWEXPR,["new",JsNode.PRMREXPR,["A"]],"in",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,["1"],",",JsNode.PRMREXPR,["2"],"]"]],")",JsNode.EMPTSTMT,[";"]]]]);
    });
    it('forstmt 6', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('for(a.b in [1,2]);');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["for","(",JsNode.MMBEXPR,[JsNode.PRMREXPR,["a"],".","b"],"in",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.PRMREXPR,["1"],",",JsNode.PRMREXPR,["2"],"]"]],")",JsNode.EMPTSTMT,[";"]]]]);
    });
    it('forstmt missing expr', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('for(');
      }).to.throwError();
    });
    it('forstmt leftexpr error', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('for(a() in b);');
      }).to.throwError();
    });
    it('forstmt missing ; 1', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('for(var a');
      }).to.throwError();
    });
    it('forstmt missing ; 2', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('for(var a;');
      }).to.throwError();
    });
    it('forstmt missing ; 3', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('for(var a;a > 10;');
      }).to.throwError();
    });
    it('forstmt missing ; 4', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('for(a');
      }).to.throwError();
    });
    it('forstmt missing ; 5', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('for(a;');
      }).to.throwError();
    });
    it('forstmt missing ; 6', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('for(a;b');
      }).to.throwError();
    });
    it('forstmt missing ; 7', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('for(a;b;');
      }).to.throwError();
    });
    it('forstmt with in could not has multi varstmt', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('for(var a,b in {});');
      }).to.throwError();
    });
    it('forstmt with in first', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('for(in {});');
      }).to.throwError();
    });
    it('cntnstmt 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('while(false){continue;}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.BLOCK,["{",JsNode.CNTNSTMT,["continue",";"],"}"]]]]);
    });
    it('cntnstmt 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('while(false){continue a;}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.BLOCK,["{",JsNode.CNTNSTMT,["continue","a",";"],"}"]]]]);
    });
    it('cntnstmt 3', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('while(false){continue\na;}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.BLOCK,["{",JsNode.CNTNSTMT,["continue"],JsNode.EXPRSTMT,[JsNode.PRMREXPR,["a"],";"],"}"]]]]);
    });
    it('brkstmt 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('while(false){break;}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.BLOCK,["{",JsNode.BRKSTMT,["break",";"],"}"]]]]);
    });
    it('brkstmt 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('while(false){break a;}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.BLOCK,["{",JsNode.BRKSTMT,["break","a",";"],"}"]]]]);
    });
    it('brkstmt 3', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('while(false){break\na;}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.ITERSTMT,["while","(",JsNode.PRMREXPR,["false"],")",JsNode.BLOCK,["{",JsNode.BRKSTMT,["break"],JsNode.EXPRSTMT,[JsNode.PRMREXPR,["a"],";"],"}"]]]]);
    });
    it('withstmt', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('with(a){}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.WITHSTMT,["with","(",JsNode.PRMREXPR,["a"],")",JsNode.BLOCK,["{","}"]]]]);
    });
    it('withstmt error', function() {
      var parser = homunculus.getParser('es6');
      expect(function() {
        parser.parse('with(){}');
      }).to.throwError();
    });
    it('swchstmt', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('switch(a){case 1:case 2:;break;default:;}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.SWCHSTMT,["switch","(",JsNode.PRMREXPR,["a"],")",JsNode.CASEBLOCK,["{",JsNode.CASECLAUSE,["case",JsNode.PRMREXPR,["1"],":"],JsNode.CASECLAUSE,["case",JsNode.PRMREXPR,["2"],":",JsNode.EMPTSTMT,[";"],JsNode.BRKSTMT,["break",";"]],JsNode.DFTCLAUSE,["default",":",JsNode.EMPTSTMT,[";"]],"}"]]]]);
    });
    it('swchstmt error', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('switch(a){else:;}');
      }).to.throwError();
    });
    it('thrstmt', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('throw e;');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.THRSTMT,["throw",JsNode.PRMREXPR,["e"],";"]]]);
    });
    it('thrstmt error', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('throw');
      }).to.throwError();
    });
    it('trystmt 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('try{}catch(e){}finally{}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.TRYSTMT,["try",JsNode.BLOCK,["{","}"],JsNode.CACH,["catch","(","e",")",JsNode.BLOCK,["{","}"]],JsNode.FINL,["finally",JsNode.BLOCK,["{","}"]]]]]);
    });
    it('trystmt 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('try{}finally{}');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.TRYSTMT,["try",JsNode.BLOCK,["{","}"],JsNode.FINL,["finally",JsNode.BLOCK,["{","}"]]]]]);
    });
    it('trystmt error 1', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('try');
      }).to.throwError();
    });
    it('trystmt error 2', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('try{');
      }).to.throwError();
    });
    it('trystmt error 3', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('try{}catch');
      }).to.throwError();
    });
    it('trystmt error 4', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('try{}catch{');
      }).to.throwError();
    });
    it('trystmt error 5', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('try{}catch(');
      }).to.throwError();
    });
    it('trystmt error 6', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('try{}catch()');
      }).to.throwError();
    });
    it('trystmt error 7', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('try{}catch(a,b)');
      }).to.throwError();
    });
    it('trystmt error 8', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('try{}catch(a){');
      }).to.throwError();
    });
    it('trystmt error 9', function() {
      var parser = homunculus.getParser('js');
      expect(function() {
        parser.parse('try{}finally');
      }).to.throwError();
    });
    it('debstmt', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('debugger;');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[JsNode.DEBSTMT,["debugger",";"]]]);
    });
    it('empty 1', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('');
      expect(tree(node)).to.eql([JsNode.PROGRAM,[]]);
    });
    it('empty 2', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse();
      expect(tree(node)).to.eql([JsNode.PROGRAM,[]]);
    });
  });
  describe('js lib exec test', function() {
    it('jquery 1.11.0', function() {
      var parser = homunculus.getParser('js');
      var code = fs.readFileSync(path.join(__dirname, './lib/jquery-1.11.0.js'), { encoding: 'utf-8' });
      var node = parser.parse(code);
      var ignore = parser.ignore();
      var str = jion(node, ignore);
      expect(str).to.eql(code);
    });
    it('jquery 1.11.0 min', function() {
      var parser = homunculus.getParser('js');
      var code = fs.readFileSync(path.join(__dirname, './lib/jquery-1.11.0.min.js'), { encoding: 'utf-8' });
      var node = parser.parse(code);
      var ignore = parser.ignore();
      var str = jion(node, ignore);
      expect(str).to.eql(code);
    });
    it('backbone 1.1.0', function() {
      var parser = homunculus.getParser('js');
      var code = fs.readFileSync(path.join(__dirname, './lib/backbone.js'), { encoding: 'utf-8' });
      var node = parser.parse(code);
      var ignore = parser.ignore();
      var str = jion(node, ignore);
      expect(str).to.eql(code);
    });
    it('handlebars', function() {
      var parser = homunculus.getParser('js');
      var code = fs.readFileSync(path.join(__dirname, './lib/handlebars.js'), { encoding: 'utf-8' });
      var node = parser.parse(code);
      var ignore = parser.ignore();
      var str = jion(node, ignore);
      expect(str).to.eql(code);
    });
    it('bootstrap 3.0.0', function() {
      var parser = homunculus.getParser('js');
      var code = fs.readFileSync(path.join(__dirname, './lib/bootstrap.js'), { encoding: 'utf-8' });
      var node = parser.parse(code);
      var ignore = parser.ignore();
      var str = jion(node, ignore);
      expect(str).to.eql(code);
    });
    it('expect 0.1.2', function() {
      var parser = homunculus.getParser('js');
      var code = fs.readFileSync(path.join(__dirname, './lib/expect.js'), { encoding: 'utf-8' });
      var node = parser.parse(code);
      var ignore = parser.ignore();
      var str = jion(node, ignore);
      expect(str).to.eql(code);
    });
    it('html5shiv 3.6.1', function() {
      var parser = homunculus.getParser('js');
      var code = fs.readFileSync(path.join(__dirname, './lib/html5shiv.js'), { encoding: 'utf-8' });
      var node = parser.parse(code);
      var ignore = parser.ignore();
      var str = jion(node, ignore);
      expect(str).to.eql(code);
    });
    it('formatter', function() {
      var parser = homunculus.getParser('js');
      var code = fs.readFileSync(path.join(__dirname, './lib/formatter.js'), { encoding: 'utf-8' });
      var node = parser.parse(code);
      var ignore = parser.ignore();
      var str = jion(node, ignore);
      expect(str).to.eql(code);
    });
  });
  describe('other test', function() {
    it('node #parent,#prev,#next', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var a, b;');
      var varstmt = node.leaves()[0];
      var children = varstmt.leaves();
      var a = children[0];
      var b = children[1];
      expect(node.parent()).to.be(null);
      expect(a.parent()).to.be(varstmt);
      expect(b.parent()).to.be(varstmt);
      expect(a.prev()).to.be(null);
      expect(a.next()).to.be(b);
      expect(b.prev()).to.be(a);
    });
    it('node #leaf,#size,#leaves', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var a');
      var varstmt = node.leaf(0);
      expect(varstmt.name()).to.be(JsNode.VARSTMT);
      expect(varstmt.size()).to.be(3);
      expect(varstmt.leaves().length).to.be(3);
    });
    it('node #nid', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var a');
      expect(node.nid()).to.be.a('number');
    });
    it('#ast should return as parse return', function() {
      var parser = homunculus.getParser('js');
      var node = parser.parse('var a, b;');
      expect(node).to.equal(parser.ast());
    });
    it('init class Parser(lexer) with a lexer', function() {
      var lexer = homunculus.getLexer('js');
      var parser = new Parser(lexer);
      var node = parser.parse('var a, b;');
      expect(node).to.equal(parser.ast());
      expect(function() {
        parser.init();
      }).to.not.throwError();
    });
    it('JsNode#getKey', function() {
      expect(JsNode.getKey('program')).to.eql('PROGRAM');
      expect(function() {
        JsNode.getKey('');
      }).to.throwError();
    });
  });
});