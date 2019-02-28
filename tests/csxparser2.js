var homunculus = require('../');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Token = homunculus.getClass('token', 'csx');
var JsNode = homunculus.getClass('node', 'csx');

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
  var isToken = node.isToken();
  if(isToken) {
    var isVirtual = node.token().isVirtual();
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

describe('csxparser2', function() {
  describe('simple test', function() {
    it('single close', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a/>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXSelfClosingElement,["<","a","/>"]]]]]);
    });
    it('with one attr', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a href="#"/>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXSelfClosingElement,["<","a",JsNode.CSXAttribute,["href","=","\"#\""],"/>"]]]]]);
    });
    it('with servel attr', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a href="#" name="test" data-num=123/>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXSelfClosingElement,["<","a",JsNode.CSXAttribute,["href","=","\"#\""],JsNode.CSXAttribute,["name","=","\"test\""],JsNode.CSXAttribute,["data-num","=","123"],"/>"]]]]]);
    });
    it('with spread attr', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a href="#" {...somedata}/>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXSelfClosingElement,["<","a",JsNode.CSXAttribute,["href","=","\"#\""],JsNode.CSXSpreadAttribute,["{","...",JsNode.PRMREXPR,["somedata"],"}"],"/>"]]]]]);
    });
    it('with js attr value', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a href="#" data={a++}/>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXSelfClosingElement,["<","a",JsNode.CSXAttribute,["href","=","\"#\""],JsNode.CSXAttribute,["data","=",JsNode.CSXAttributeValue,["{",JsNode.POSTFIXEXPR,[JsNode.PRMREXPR,["a"],"++"],"}"]],"/>"]]]]]);
    });
    it('spread multi', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a {...spread}href="#"{...spread2}/>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXSelfClosingElement,["<","a",JsNode.CSXSpreadAttribute,["{","...",JsNode.PRMREXPR,["spread"],"}"],JsNode.CSXAttribute,["href","=","\"#\""],JsNode.CSXSpreadAttribute,["{","...",JsNode.PRMREXPR,["spread2"],"}"],"/>"]]]]]);
    });
    it('empty text with js', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a>1{}2</a>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","a",">"],"1",JsNode.CSXChild,["{","}"],"2",JsNode.CSXClosingElement,["</","a",">"]]]]]]);
    });
    it('text with js 1', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a>1{b}2</a>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","a",">"],"1",JsNode.CSXChild,["{",JsNode.PRMREXPR,["b"],"}"],"2",JsNode.CSXClosingElement,["</","a",">"]]]]]]);
    });
    it('text with js 2', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a>111{a?b:c}222</a>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","a",">"],"111",JsNode.CSXChild,["{",JsNode.CNDTEXPR,[JsNode.PRMREXPR,["a"],"?",JsNode.PRMREXPR,["b"],":",JsNode.PRMREXPR,["c"]],"}"],"222",JsNode.CSXClosingElement,["</","a",">"]]]]]]);
    });
    it('recursion 1', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a>{a?<b>1</b>:<b>2</b>}222</a>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","a",">"],JsNode.CSXChild,["{",JsNode.CNDTEXPR,[JsNode.PRMREXPR,["a"],"?",JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","b",">"],"1",JsNode.CSXClosingElement,["</","b",">"]],":",JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","b",">"],"2",JsNode.CSXClosingElement,["</","b",">"]]],"}"],"222",JsNode.CSXClosingElement,["</","a",">"]]]]]]);
    });
    it('recursion 2', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a>111{[<b/>,"",<span>{test}</span>]}222</a>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","a",">"],"111",JsNode.CSXChild,["{",JsNode.PRMREXPR,[JsNode.ARRLTR,["[",JsNode.CSXSelfClosingElement,["<","b","/>"],",",JsNode.PRMREXPR,["\"\""],",",JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","span",">"],JsNode.CSXChild,["{",JsNode.PRMREXPR,["test"],"}"],JsNode.CSXClosingElement,["</","span",">"]],"]"]],"}"],"222",JsNode.CSXClosingElement,["</","a",">"]]]]]]);
    });
    it('nest mark', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a><b></b></a>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","a",">"],JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","b",">"],JsNode.CSXClosingElement,["</","b",">"]],JsNode.CSXClosingElement,["</","a",">"]]]]]]);
    });
    it('nest mark with text', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a><b><c>123</c>456</b></a>,<d><e></e></d>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.EXPR,[JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","a",">"],JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","b",">"],JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","c",">"],"123",JsNode.CSXClosingElement,["</","c",">"]],"456",JsNode.CSXClosingElement,["</","b",">"]],JsNode.CSXClosingElement,["</","a",">"]],",",JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","d",">"],JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","e",">"],JsNode.CSXClosingElement,["</","e",">"]],JsNode.CSXClosingElement,["</","d",">"]]]]]]]);
    });
    it('member mark', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a.b></a.b>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXElement,[JsNode.CSXOpeningElement,["<",JsNode.CSXMemberExpression,["a",".","b"],">"],JsNode.CSXClosingElement,["</",JsNode.CSXMemberExpression,["a",".","b"],">"]]]]]]);
    });
    it('namespace mark', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a:b></a:b>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXElement,[JsNode.CSXOpeningElement,["<",JsNode.CSXMemberExpression,["a",":","b"],">"],JsNode.CSXClosingElement,["</",JsNode.CSXMemberExpression,["a",":","b"],">"]]]]]]);
    });
    it('self close', function() {
      var parser = homunculus.getParser('csx');
      expect(function() {
        parser.parse('<img>');
      }).to.throwError();
    });
    it('mark missing', function() {
      var parser = homunculus.getParser('csx');
      expect(function() {
        parser.parse('<a>');
      }).to.throwError();
    });
    it('mark mismatching', function() {
      var parser = homunculus.getParser('csx');
      expect(function() {
        parser.parse('<a></b>');
      }).to.throwError();
    });
    it('member mismatching', function() {
      var parser = homunculus.getParser('csx');
      expect(function() {
        parser.parse('<a.b></b>');
      }).to.throwError();
    });
    it('namespace mismatching', function() {
      var parser = homunculus.getParser('csx');
      expect(function() {
        parser.parse('<a:b></b>');
      }).to.throwError();
    });
    it('long', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a attr={<b attr2={<c/>}>1</b>} attr3="2">3</a>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","a",JsNode.CSXAttribute,["attr","=",JsNode.CSXAttributeValue,["{",JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","b",JsNode.CSXAttribute,["attr2","=",JsNode.CSXAttributeValue,["{",JsNode.CSXSelfClosingElement,["<","c","/>"],"}"]],">"],"1",JsNode.CSXClosingElement,["</","b",">"]],"}"]],JsNode.CSXAttribute,["attr3","=","\"2\""],">"],"3",JsNode.CSXClosingElement,["</","a",">"]]]]]]);
    });
    it('embed self-close', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<div><input/></div>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","div",">"],JsNode.CSXSelfClosingElement,["<","input","/>"],JsNode.CSXClosingElement,["</","div",">"]]]]]]);
    });
    it('bind property', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<a @n="1" @m={t} test=2/>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXSelfClosingElement,["<","a",JsNode.CSXBindAttribute,["@n","=","\"1\""],JsNode.CSXBindAttribute,["@m","=",JsNode.CSXAttributeValue,["{",JsNode.PRMREXPR,["t"],"}"]],JsNode.CSXAttribute,["test","=","2"],"/>"]]]]]);
    });
    it('custom geom', function() {
      var parser = homunculus.getParser('csx');
      var node = parser.parse('<$line/>');
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXSelfClosingElement,["<","$line","/>"]]]]]);
    });
  });
  describe('file', function() {
    it('1', function() {
      var s = fs.readFileSync(path.join(__dirname, './lib/csx.js'), { encoding: 'utf-8' });
      var parser = homunculus.getParser('csx');
      var node = parser.parse(s);
      expect(tree(node)).to.eql([JsNode.SCRIPT,[JsNode.SCRIPTBODY,[JsNode.EXPRSTMT,[JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","div",">"],"\n  ",JsNode.CSXChild,["{",JsNode.CALLEXPR,[JsNode.MMBEXPR,[JsNode.PRMREXPR,["names"],".","map"],JsNode.ARGS,["(",JsNode.ARGLIST,[JsNode.PRMREXPR,[JsNode.FNEXPR,["function","(",JsNode.FMPARAMS,[JsNode.SINGLENAME,[JsNode.BINDID,["name"]]],")","{",JsNode.FNBODY,[JsNode.RETSTMT,["return",JsNode.CSXElement,[JsNode.CSXOpeningElement,["<","div",">"],"Hello, ",JsNode.CSXChild,["{",JsNode.PRMREXPR,["name"],"}"],"!",JsNode.CSXClosingElement,["</","div",">"]]]],"}"]]],")"]],"}"],"\n",JsNode.CSXClosingElement,["</","div",">"]]]]]]);
    });
  });
});
