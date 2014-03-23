var Class = require('../../util/Class');
var Env = require('./Env');
var JsNode = require('./Node');
var Token = require('../../lexer/Token');
var Context = Class(function(parser) {
  this.env = new Env();
  this.parser = parser;
}).methods({
  parse: function(code) {
    var ast = this.parser.parse(code);
    recursion(ast, this.env);
    return this.env;
  }
});

function recursion(node, env) {
  var isToken = node.name() == JsNode.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      var s = token.content();
      if(s == 'return') {
        env.addReturn(node);
      }
    }
  }
  else {
    if(node.name() == JsNode.VARDECL) {
      vardecl(node, env);
    }
    else if(node.name() == JsNode.FNDECL) {
      env = fndecl(node, env);
    }
    else if(node.name() == JsNode.FNEXPR) {
      env = fnexpr(node, env);
    }
    else if(node.name() == JsNode.PRMREXPR) {
      prmrexpr(node, env);
    }
    node.leaves().forEach(function(leaf, i) {
      recursion(leaf, env);
    });
  }
}
function vardecl(node, env) {
  var leaves = node.leaves();
  var assign = !!leaves[1];
  env.addVar(node, assign);
}
function fndecl(node, env) {
  var v = node.leaves()[1].leaves().content();
  var child = new Env(env, v);
  var params = node.leaves()[3];
  if(params.name() == JsNode.FNPARAMS) {
    addParam(params, child);
  }
  return child;
}
function fnexpr(node, env) {
  //函数表达式name为空
  var child = new Env(env);
  //记录形参
  var params;
  var v = node.leaves()[1];
  if(v.name() == JsNode.TOKEN) {
    params = node.leaves()[3];
  }
  else {
    params = node.leaves()[2];
  }
  if(params.name() == JsNode.FNPARAMS) {
    addParam(params, child);
  }
  //匿名函数检查实参传入情况
  var next = node.next();
  //!function(){}()形式
  if(next && next.name() == JsNode.ARGS) {
    var leaves = next.leaves();
    //长度2为()空参数，长度3有参数，第2个节点
    if(leaves.length == 3) {
      addAParam(leaves[1], child);
    }
  }
  //(function(){})()形式
  else {
    var prmr = node.parent();
    var prev = node.prev();
    if(prmr.name() == JsNode.PRMREXPR && prev && prev.name() == JsNode.TOKEN && prev.token().content() == '(') {
      next = prmr.next();
      if(next && next.name() == JsNode.ARGS) {
        var leaves = next.leaves();
        //长度2为()空参数，长度3有参数，第2个节点
        if(leaves.length == 3) {
          addAParam(leaves[1], child);
        }
      }
    }
  }
  return child;
}
//支持es6
function addParam(params, child) {
  params.leaves().forEach(function(leaf, i) {
    if(leaf.name() == JsNode.TOKEN && leaf.token().content() != ',') {
      child.addParam(leaf.token().content());
    }
    else if(leaf.name() == JsNode.RESTPARAM) {
      child.addParam(leaf.leaves()[1].token().content());
    }
  });
}
function addAParam(params, child) {
  params.leaves().forEach(function(leaf, i) {
    if(i % 2 == 0) {
      child.addAParam(leaf);
    }
  });
}
function prmrexpr(node, env) {
  //console.log(node)
}

module.exports = Context;