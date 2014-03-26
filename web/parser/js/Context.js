define(function(require, exports, module) {
  var Class = require('../../util/Class');
  var JsNode = require('./Node');
  var Token = require('../../lexer/Token');
  var Parser = require('./Parser');
  var id = 0;
  var Context = Class(function(parent, name) {
    this.id = id++;
    this.parser = new Parser();
    this.parent = parent || null; //父上下文，如果是全局则为空
    this.name = name || null; //上下文名称，即函数名，函数表达式为空，全局也为空
    this.thisIs = null; //上下文环境中this的值，函数表达式中可能会赋值
    this.children = []; //函数声明或函数表达式所产生的上下文
    this.childrenMap = {}; //键是函数名，值是上下文，匿名函数表达式键为cid
    this.vars = []; //变量var声明
    this.varsMap = {}; //键为id字面量，值是它的token的节点
    this.params = []; //形参，函数上下文才有，即全局无
    this.paramsMap = {}; //键为id字面量，值是它的token的节点
    this.aParams = []; //实参，函数表达式才有
    this.vids = []; //上下文环境里用到的变量id
    this.vidsMap = {}; //键为id字面量，值是它的token的节点
    this.returns = []; //上下文环境里return语句
    if(!this.isTop()) {
      this.parent.addChild(this);
    }
  }).methods({
    parse: function(code) {
      var ast;
      if(code instanceof  JsNode) {
        ast = code;
      }
      else {
        ast = this.parser.parse(code);
      }
      recursion(ast, this);
      return this;
    },
    getId: function() {
      return this.id;
    },
    getName: function() {
      return this.name;
    },
    getParent: function() {
      return this.parent;
    },
    getThis: function() {
      return this.thisIs;
    },
    setThis: function(t) {
      this.thisIs = t;
      return this;
    },
    isTop: function() {
      return !this.parent;
    },
    isFnexpr: function() {
      return !this.isTop() && !this.name;
    },
    hasParam: function(p) {
      return this.paramsMap.hasOwnProperty(p);
    },
    getParams: function() {
      return this.params;
    },
    addParam: function(p) {
      //形参不可能重复，无需判断
      this.paramsMap[p] = this.params.length;
      this.params.push(p);
      return this;
    },
    getAParams: function() {
      return this.aParams;
    },
    addAParam: function(ap) {
      this.aParams.push(ap);
      return this;
    },
    getChild: function(name) {
      return this.childrenMap[name];
    },
    getChildren: function() {
      return this.children;
    },
    //通过name查找函数声明，id查找表达式
    hasChild: function(name) {
      return this.childrenMap.hasOwnProperty(name);
    },
    addChild: function(child) {
      var name = child.getName();
      //函数表达式名字为空用id删除
      if(name) {
        this.delChild(name);
      }
      else {
        this.delChild(child.getId());
      }
      name = name || child.getId();
      this.childrenMap[name] = child;
      this.children.push(child);
      return this;
    },
    //name函数声明，id表达式
    delChild: function(name) {
      if(this.hasChild(name)) {
        var i = this.children.indexOf(this.childrenMap[name]);
        this.children.splice(i, 1);
        delete this.childrenMap[name];
      }
      return this;
    },
    hasVar: function(v) {
      return this.varsMap.hasOwnProperty(v);
    },
    addVar: function(node, assign) {
      var v = node.leaves()[0].token().content();
      //赋值拥有最高优先级，会覆盖掉之前的函数声明和var
      if(assign) {
        this.delVar(v);
        this.delChild(v);
      }
      //仅仅是var声明无赋值，且已有过声明或函数，忽略之
      else if(this.hasVar(v) || this.hasChild(v)) {
        return this;
      }
      this.varsMap[v] = node;
      this.vars.push(node);
      return this;
    },
    delVar: function(v) {
      if(this.hasVar(v)) {
        var i = this.vars.indexOf(this.varsMap[v]);
        this.vars.splice(i, 1);
        delete this.varsMap[v];
      }
      return this;
    },
    getVars: function() {
      return this.vars;
    },
    addReturn: function(node) {
      this.returns.push(node);
      return this;
    },
    getReturns: function() {
      return this.returns;
    },
    hasVid: function(v) {
      return this.vidsMap.hasOwnProperty(v);
    },
    addVid: function(node) {
      var v = node.token().content();
      if(this.vidsMap.hasOwnProperty(v)) {
        return;
      }
      this.vids.push(node);
      this.vidsMap[v] = node;
      return this;
    },
    getVids: function() {
      return this.vids;
    }
  });
  
  function recursion(node, context) {
    var isToken = node.name() == JsNode.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(isToken) {
      if(!isVirtual) {
        var token = node.token();
        var s = token.content();
        if(s == 'return') {
          context.addReturn(node);
        }
      }
    }
    else {
      if(node.name() == JsNode.VARDECL) {
        vardecl(node, context);
      }
      else if(node.name() == JsNode.FNDECL) {
        context = fndecl(node, context);
      }
      else if(node.name() == JsNode.FNEXPR) {
        context = fnexpr(node, context);
      }
      else if(node.name() == JsNode.PRMREXPR) {
        prmrexpr(node, context);
      }
      node.leaves().forEach(function(leaf, i) {
        recursion(leaf, context);
      });
    }
  }
  function vardecl(node, context) {
    var leaves = node.leaves();
    var assign = !!leaves[1];
    context.addVar(node, assign);
  }
  function fndecl(node, context) {
    var v = node.leaves()[1].leaves().content();
    var child = new Context(context, v);
    var params = node.leaves()[3];
    if(params.name() == JsNode.FNPARAMS) {
      addParam(params, child);
    }
    return child;
  }
  function fnexpr(node, context) {
    //函数表达式name为空
    var child = new Context(context);
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
  function prmrexpr(node, context) {
    var first = node.leaves()[0];
    if(first.name() == JsNode.TOKEN) {
      var token = first.token();
      if(token.type() == Token.ID) {
        context.addVid(first);
      }
    }
  }
  
  module.exports = Context;
});