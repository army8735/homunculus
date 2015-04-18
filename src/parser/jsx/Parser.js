var Es6Parser = require('../es6/Parser');
var Node = require('./Node');
var Token = require('../../lexer/JSXToken');
var character = require('../../util/character');

var Parser = Es6Parser.extend(function(lexer) {
  Es6Parser.call(this, lexer);
  this.init(lexer);
  return this;
}).methods({
  prmrexpr: function() {
    if(this.look.type() == Token.MARK) {
      return this.jsxelem();
    }
    else {
      return Es6Parser.prototype.prmrexpr.call(this);
    }
  },
  jsxelem: function() {
    var node = new Node(Node.JSXOpeningElement);
    node.add(
      this.match(),
      this.jsxelemname()
    );
    while(this.look
      &&
      (this.look.type() == Token.PROPERTY
        || this.look.content() == '{')) {
      node.add(this.attr());
    }
    if(!this.look) {
      this.error();
    }
    if(this.look.content() == '/>') {
      node.add(this.match());
      node.name(Node.JSXSelfClosingElement);
      return node;
    }
    node.add(this.match('>'));
    var n = new Node(Node.JSXElement);
    n.add(node);
    while(this.look && this.look.type() != Token.MARK) {
      n.add(this.jsxchild());
    }
    n.add(this.close());
    return n;
  },
  jsxelemname: function() {
    //TODO: JSXElementName
    return this.match(Token.ELEM);
  },
  attr: function() {
    if(this.look.content() == '{') {
      return this.spreadattr();
    }
    //TODO: JSXElementName
    var node = new Node(Node.JSXAttribute);
    node.add(
      this.attrname(),
      this.match('='),
      this.attrval()
    );
    return node;
  },
  spreadattr: function() {
    //TODO: JSXSpreadAttribute
  },
  attrname: function() {
    var id = this.match(Token.PROPERTY);
    if(this.look && this.look.content() == ':') {
      var node = new Node(Node.JSXNamespacedName);
      node.add(id,
        this.match(),
        this.match(Token.PROPERTY)
      );
      return node;
    }
    return id;
  },
  attrval: function() {
    if(!this.look) {
      this.error();
    }
    if(this.look.content() == '{') {
      //TODO: { AssignmentExpression }
    }
    else if(this.look.type() == Token.STRING) {
      return this.match();
    }
    return this.jsxelem();
  },
  jsxchild: function() {
    switch(this.look.type()) {
      case Token.TEXT:
        return this.match();
      case Token.MARK:
        return this.jsxelem();
      default:
        //TODO: { AssignmentExpressionopt }
        var node = new Node(Node.JSXChild);
        return node;
    }
  },
  close: function() {
    var node = new Node(Node.JSXClosingElement);
    node.add(
      this.match('</'),
      this.jsxelemname(),
      this.match('>')
    )
    return node;
  },
  match: function(type, line, msg) {
    if(typeof type == 'boolean') {
      msg = line;
      line = type;
      type = undefined;
    }
    if(typeof line != 'boolean') {
      line = false;
      msg = line;
    }
    //未定义为所有非空白token
    if(character.isUndefined(type)) {
      if(this.look) {
        var l = this.look;
        this.move(line);
        return new Node(Node.TOKEN, l);
      }
      else {
        this.error('syntax error' + (msg || ''));
      }
    }
    //或者根据token的type或者content匹配
    else if(typeof type == 'string') {
      //特殊处理;，不匹配但有换行或者末尾时自动补全，还有受限行
      if(type == ';'
        && (!this.look
        || (this.look.content() != type && this.hasMoveLine)
        || this.look.content() == '}')
      ) {
        if(this.look && S[this.look.type()]) {
          this.move();
        }
        return this.virtual(';');
      }
      else if(this.look && this.look.content() == type) {
        var l = this.look;
        this.move(line);
        return new Node(Node.TOKEN, l);
      }
      else {
        this.error('missing ' + type + (msg || ''));
      }
    }
    else if(typeof type == 'number') {
      if(this.look && this.look.type() == type) {
        var l = this.look;
        this.move(line);
        return new Node(Node.TOKEN, l);
      }
      else {
        this.error('missing ' + Token.type(type) + (msg || ''));
      }
    }
  }
});

module.exports = Parser;