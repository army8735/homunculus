define(function(require, exports, module) {var Es6Parser = require('../es6/Parser');
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
    //id只有1个，member和namespace有多个
    var type = node.last().size() > 1 ? node.last().name() : null;
    var name;
    if(type) {
      name = [];
      node.last().leaves().forEach(function(leaf) {
        name.push(leaf.token().content());
      });
    }
    else {
      name = node.last().token().content();
    }
    while(this.look
      && (this.look.type() == Token.PROPERTY
        || this.look.content() == '{')) {
      node.add(this.attrs());
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
    while(this.look && this.look.content() != '</') {
      n.add(this.jsxchild());
    }
    n.add(this.close(name, type));
    return n;
  },
  jsxelemname: function(name, type) {
    if(name) {
      if(type) {
        var node = new Node(type);
        var self = this;
        name.forEach(function(na) {
          node.add(self.match(na));
        });
        return node;
      }
      else {
        return this.match(name);
      }
    }
    else {
      var node = new Node(Node.JSXMemberExpression);
      node.add(this.match());
      if(!this.look) {
        this.error();
      }
      if(this.look.content() == '.') {
        while(this.look && this.look.content() == '.') {
          node.add(
            this.match(),
            this.match(Token.ELEM)
          );
        }
      }
      else if(this.look.content() == ':') {
        while(this.look && this.look.content() == ':') {
          node.add(
            this.match(),
            this.match(Token.ELEM)
          );
        }
      }
      else {
        return node.first();
      }
      return node;
    }
  },
  jsxmember: function(names) {
    var node = new Node(Node.JSXMemberExpression);
    names.forEach(function(name) {
      node.add(this.match(name));
    });
    return node;
  },
  attrs: function() {
    if(this.look && this.look.content() == '{') {
      return this.spreadattr();
    }
    var node = new Node(Node.JSXAttributes);
    while(this.look && this.look.type() == Token.PROPERTY) {
      node.add(this.attr());
    }
    if(this.look && this.look.content() == '{') {
      node.add(this.spreadattr());
    }
    return node;
  },
  attr: function() {
    var node = new Node(Node.JSXAttribute);
    node.add(
      this.attrname(),
      this.match('='),
      this.attrval()
    );
    return node;
  },
  spreadattr: function() {
    var node = new Node(Node.JSXSpreadAttribute);
    node.add(
      this.match(),
      this.match('...'),
      this.assignexpr(),
      this.match('}')
    );
    return node;
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
      var node = new Node(Node.JSXAttributeValue);
      node.add(this.match('{'));
      if(this.look && this.look.content() != '}') {
        node.add(this.assignexpr());
      }
      node.add(this.match('}'));
      return node;
    }
    else if([Token.STRING, Token.NUMBER].indexOf(this.look.type()) > -1) {
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
        var node = new Node(Node.JSXChild);
        node.add(this.match('{'));
        if(this.look && this.look.content() != '}') {
          node.add(this.assignexpr());
        }
        node.add(this.match('}'));
        return node;
    }
  },
  close: function(name, type) {
    var node = new Node(Node.JSXClosingElement);
    node.add(
      this.match('</'),
      this.jsxelemname(name, type),
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

module.exports = Parser;});