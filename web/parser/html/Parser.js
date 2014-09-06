define(function(require, exports, module) {var IParser = require('../Parser');
var character = require('../../util/character');
var Lexer = require('../../lexer/HtmlLexer');
var Rule = require('../../lexer/rule/HtmlRule');
var Token = require('../../lexer/Token');
var Node = require('./Node');
var S = {};
S[Token.BLANK] = S[Token.TAB] = S[Token.COMMENT] = S[Token.LINE] = S[Token.ENTER] = true;
var SINGLE = {
  'img': true,
  'meta': true,
  'link': true,
  '!doctype': true,
  'br': true,
  '!doctype': true,
  'basefont': true,
  'base': true,
  'col': true,
  'embed': true,
  'frame': true,
  'hr': true,
  'input': true,
  'keygen': true,
  'area': true,
  'param': true,
  'source': true,
  'track': true
};

var Parser = IParser.extend(function(lexer) {
  IParser.call(this, lexer);
  this.init(lexer);
  return this;
}).methods({
  parse: function(code) {
    this.lexer.parse(code);
    this.tree = this.document();
    return this.tree;
  },
  init: function(lexer) {
    this.look = null;
    this.tokens = null;
    this.lastLine = 1;
    this.lastCol = 1;
    this.line = 1;
    this.col = 1;
    this.index = 0;
    this.length = 0;
    this.ignores = {};
    this.hasMoveLine = false;
    this.tree = {};
    if(lexer) {
      this.lexer = lexer;
    }
    else if(this.lexer) {
      this.lexer.init();
    }
    else {
      this.lexer = new Lexer(new Rule());
    }
  },
  document: function() {
    this.tokens = this.lexer.tokens();
    this.length = this.tokens.length;
    if(this.tokens.length) {
      this.move();
    }
    var node = new Node(Node.DOCUMENT);
    var first = true;
    while(this.look) {
      node.add(this.element(first));
      first = false;
    }
    return node;
  },
  element: function(first) {
    var node;
    if(this.look.type() == Token.TEXT) {
      node = new Node(Node.TEXT);
      node.add(this.match());
    }
    else if(this.look.type() == Token.MARK) {
      return this.mark(first);
    }
    return node;
  },
  mark: function(first) {
    var node = new Node(Node.MARK);
    node.add(this.match('<'));
    if(!this.look) {
      this.error();
    }
    var tagName = this.look;
    if(first && this.look.type() == Token.HEAD) {
      node.add(this.match());
    }
    else {
      node.add(this.match(Token.KEYWORD));
    }
    tagName = tagName.content().toLowerCase();
    while(this.look
      && this.look.type() != Token.MARK
      && this.look.type() != Token.KEYWORD) {
      node.add(this.attr());
    }
    if(!this.look) {
      this.error();
    }
    if(SINGLE.hasOwnProperty(tagName)) {
      if(this.look.content() == '/>') {
        node.add(this.match('/>'));
      }
      else {
        node.add(this.match('>'));
      }
    }
    else {
      if(this.look.content() == '/>') {
        node.add(this.match('/>'));
      }
      else {
        node.add(this.match('>'));
        if(!this.look) {
          this.error();
        }
        if(this.look.type() == Token.TEXT) {
          node.add(this.match());
        }
        if(this.look && this.look.content() == '<') {
          node.add(this.element());
          if(this.look && this.look.type() == Token.TEXT) {
            node.add(this.match());
          }
        }
        node.add(this.match('</'));
        node.add(this.match(tagName));
        node.add(this.match('>'));
      }
    }
    return node;
  },
  attr: function() {
    var node = new Node(Node.ATTR);
    if(this.look.type() == Token.PROPERTY) {
      node.add(this.match());
    }
    else {
      node.add(this.match(Token.DATA));
    }
    if(this.look && this.look.content() == '=') {
      node.add(this.match('='));
      if(!this.look) {
        this.error();
      }
      switch(this.look.type()) {
        case Token.STRING:
        case Token.NUMBER:
        case Token.PROPERTY:
          node.add(this.match());
          break;
        default:
          this.error();
      }
    }
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
  },
  move: function(line) {
    this.lastLine = this.line;
    this.lastCol = this.col;
    //遗留下来的换行符
    this.hasMoveLine = false;
    do {
      this.look = this.tokens[this.index++];
      if(!this.look) {
        return;
      }
      //存下忽略的token
      if(S[this.look.type()]) {
        this.ignores[this.index - 1] = this.look;
      }
      //包括line的情况下要跳出
      if(this.look.type() == Token.LINE) {
        this.line++;
        this.col = 1;
        this.hasMoveLine = true;
        if(line) {
          break;
        }
      }
      else if(this.look.type() == Token.COMMENT) {
        var s = this.look.content();
        var n = character.count(this.look.content(), character.LINE);
        if(n > 0) {
          this.line += n;
          var i = s.lastIndexOf(character.LINE);
          this.col += s.length - i - 1;
          this.hasMoveLine = true;
          if(line) {
            break;
          }
        }
      }
      else {
        this.col += this.look.content().length;
        if(!S[this.look.type()]) {
          break;
        }
      }
    } while(this.index <= this.length);
  },
  error: function(msg) {
    msg = 'SyntaxError: ' + (msg || ' syntax error');
    throw new Error(msg + ' line ' + this.lastLine + ' col ' + this.lastCol);
  }
});
module.exports = Parser;});