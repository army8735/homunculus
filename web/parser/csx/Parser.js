define(function(require, exports, module) {var Es6Parser = require('../es6/Parser');
var Node = require('./Node');
var Token = require('../../lexer/CSXToken');
var character = require('../../util/character');
var Lexer = require('../../lexer/CSXLexer');

var Parser = Es6Parser.extend(function(lexer) {
  Es6Parser.call(this, lexer);
  this.init(lexer);
  return this;
}).methods({
  prmrexpr: function() {
    if(this.look.type() == Token.MARK) {
      return this.CSXelem();
    }
    else {
      return Es6Parser.prototype.prmrexpr.call(this);
    }
  },
  CSXelem: function() {
    var node = new Node(Node.CSXOpeningElement);
    node.add(
      this.match(),
      this.CSXelemname()
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
    while(this.look) {
      if(this.look.type() == Token.BIND_PROPERTY) {
        node.add(this.bindAttr());
      }
      else if(this.look.type() == Token.PROPERTY) {
        node.add(this.attr());
      }
      else if(this.look.content() == '{') {
        node.add(this.spreadattr());
      }
      else {
        break;
      }
    }
    if(!this.look) {
      this.error();
    }
    if(this.look.content() == '/>') {
      node.add(this.match());
      node.name(Node.CSXSelfClosingElement);
      return node;
    }
    node.add(this.match('>'));
    var n = new Node(Node.CSXElement);
    n.add(node);
    while(this.look && this.look.content() != '</') {
      n.add(this.CSXchild());
    }
    n.add(this.close(name, type));
    return n;
  },
  CSXelemname: function(name, type) {
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
      var node = new Node(Node.CSXMemberExpression);
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
  CSXmember: function(names) {
    var node = new Node(Node.CSXMemberExpression);
    names.forEach(function(name) {
      node.add(this.match(name));
    });
    return node;
  },
  bindAttr: function() {
    var node = new Node(Node.CSXBindAttribute);
    node.add(
      this.match(Token.BIND_PROPERTY),
      this.match('='),
      this.attrval()
    );
    return node;
  },
  attr: function() {
    var node = new Node(Node.CSXAttribute);
    node.add(
      this.attrname(),
      this.match('='),
      this.attrval()
    );
    return node;
  },
  spreadattr: function() {
    var node = new Node(Node.CSXSpreadAttribute);
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
      var node = new Node(Node.CSXNamespacedName);
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
      var node = new Node(Node.CSXAttributeValue);
      node.add(this.match());
      if(this.look && this.look.content() != '}') {
        node.add(this.assignexpr());
      }
      node.add(this.match('}'));
      return node;
    }
    else if(this.look.content() == '[') {
      var node = new Node(Node.CSXAttributeValue);
      node.add(this.match());
      while(this.look && this.look.content() != ']') {
        node.add(this.assignexpr());
        if(this.look && this.look.content() == ',') {
          node.add(this.match());
        }
      }
      node.add(this.match(']'));
      return node;
    }
    else if([Token.STRING, Token.NUMBER].indexOf(this.look.type()) > -1) {
      return this.match();
    }
    return this.CSXelem();
  },
  CSXchild: function() {
    switch(this.look.type()) {
      case Token.TEXT:
        return this.match();
      case Token.MARK:
        return this.CSXelem();
      default:
        var node = new Node(Node.CSXChild);
        node.add(this.match('{'));
        if(this.look && this.look.content() != '}') {
          node.add(this.assignexpr());
        }
        node.add(this.match('}'));
        return node;
    }
  },
  close: function(name, type) {
    var node = new Node(Node.CSXClosingElement);
    node.add(
      this.match('</'),
      this.CSXelemname(name, type),
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
    //数组为其中一个即可
    else if(Array.isArray(type)) {
      if(this.look) {
        for(var i = 0, len = type.length; i < len; i++) {
          var t = type[i];
          if(typeof t == 'string' && this.look.content() == t) {
            var l = this.look;
            this.move();
            return new Node(Node.TOKEN, l);
          }
          else if(typeof t == 'number' && this.look.type() == t) {
            var l = this.look;
            this.move();
            return new Node(Node.TOKEN, l);
          }
        }
      }
      this.error('missing ' + type.join('|') + (msg || ''));
    }
    //或者根据token的type或者content匹配
    else if(typeof type == 'string') {
      //特殊处理;，不匹配但有换行或者末尾时自动补全，还有受限行
      if(type == ';'
        && (!this.look
        || (this.look.content() != type && this.hasMoveLine)
        || this.look.content() == '}')
      ) {
        if(this.look && Es6Parser.S[this.look.type()]) {
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
}).statics({
  SELF_CLOSE: Lexer.SELF_CLOSE
});

module.exports = Parser;});