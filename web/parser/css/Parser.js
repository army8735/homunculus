define(function(require, exports, module) {
  var IParser = require('../Parser');
  var character = require('../../util/character');
  var Lexer = require('../../lexer/Lexer');
  var Rule = require('../../lexer/rule/CssRule');
  var Token = require('../../lexer/Token');
  var Node = require('./Node');
  var S = {};
  S[Token.BLANK] = S[Token.TAB] = S[Token.COMMENT] = S[Token.LINE] = true;
  var MQL = {
    'only': true,
    'not': true,
    'all': true,
    'aural': true,
    'braille': true,
    'handheld': true,
    'print': true,
    'projection': true,
    'screen': true,
    'tty': true,
    'embossed': true,
    'tv': true,
    '(': true
  };
  var MT = {
    'all': true,
    'aural': true,
    'braille': true,
    'handheld': true,
    'print': true,
    'projection': true,
    'screen': true,
    'tty': true,
    'embossed': true,
    'tv': true
  };
  var Parser = IParser.extend(function(lexer) {
    IParser.call(this, lexer);
    this.init(lexer);
    return this;
  }).methods({
    init: function(lexer) {
      if(lexer) {
        this.lexer = lexer;
      }
      else if(this.lexer) {
        this.lexer.init();
      }
      else {
        this.lexer = new Lexer(new Rule());
      }
      this.look = null;
      this.tokens = null;
      this.lastLine = 1;
      this.lastCol = 1;
      this.line = 1;
      this.col = 1;
      this.index = 0;
      this.length = 0;
      this.ignores = {};
      this.invalids = {};
      this.tree = {};
    },
    parse: function(code) {
      this.lexer.parse(code);
      this.tree = this.sheet();
      return this.tree;
    },
    ast: function() {
      return this.tree;
    },
    sheet: function() {
      this.tokens = this.lexer.tokens();
      this.length = this.tokens.length;
      if(this.tokens.length) {
        this.move();
      }
      var node = new Node(Node.SHEET);
      while(this.look) {
        var element = this.element();
        if(element) {
          node.add(element);
        }
      }
      return node;
    },
    element: function() {
      switch(this.look.type()) {
        case Token.HEAD:
          return this.head();
        case Token.VARS:
          return this.vardecl();
        case Token.SELECTOR:
          return this.styleset();
        default:
          if(this.look.content() == '[' && this.look.type() != Token.HACK) {
            return this.styleset();
          }
          return this.match();
      }
    },
    head: function() {
      var s = this.look.content().toLowerCase();
      s = s.replace(/^@(-moz-|-o-|-ms-|-webkit-)/, '@');
      switch(s) {
        case '@import':
          return this.impt();
        case '@media':
          return this.media();
        case '@charset':
          return this.charset();
        case '@font-face':
          return this.fontface();
        case '@keyframes':
          return this.kframes();
        case '@page':
          return this.page();
  //      case '@function':
  //        return this.fn();
        case '@namespace':
          return this.namespace();
        case '@document':
          return this.doc();
      }
    },
    impt: function() {
      var node = new Node(Node.IMPORT);
      node.add(this.match());
      node.add(this.url(true));
      if(this.look && MQL.hasOwnProperty(this.look.content().toLowerCase())) {
        node.add(this.mediaQList());
      }
      node.add(this.match(';'));
      return node;
    },
    media: function() {
      var node = new Node(Node.MEDIA);
      node.add(this.match());
      if(!this.look) {
        this.error();
      }
      if(MQL.hasOwnProperty(this.look.content().toLowerCase())
        || this.look.type() == Token.HACK) {
        node.add(this.mediaQList());
      }
      if(this.look && this.look.content() == '{') {
        node.add(this.block());
      }
      return node;
    },
    mediaQList: function() {
      var node = new Node(Node.MEDIAQLIST);
      node.add(this.mediaQuery());
      while(this.look && this.look.content() == ',') {
        node.add(
          this.match(),
          this.mediaQuery()
        );
      }
      return node;
    },
    mediaQuery: function() {
      var node = new Node(Node.MEDIAQUERY);
      if(this.look && ['only', 'not'].indexOf(this.look.content().toLowerCase()) > -1) {
        node.add(this.match());
      }
      if(!this.look) {
        this.error();
      }
      if(this.look.content() == '(') {
        node.add(this.expr());
      }
      else {
        node.add(this.mediaType());
      }
      if(this.look && this.look.content().toLowerCase() == 'and') {
        node.add(
          this.match(),
          this.expr()
        );
      }
      return node;
    },
    mediaType: function() {
      var node = new Node(Node.MEDIATYPE);
      if(this.look && this.look.type() == Token.HACK) {
        node.add(this.match());
      }
      if(!this.look || !MT.hasOwnProperty(this.look.content().toLowerCase())) {
        this.error();
      }
      node.add(this.match());
      if(this.look && this.look.type() == Token.HACK) {
        node.add(this.match());
        if(this.look && MT.hasOwnProperty(this.look.content().toLowerCase())) {
          node.add(this.match());
          if(this.look && this.look.type() == Token.HACK) {
            node.add(this.match());
          }
        }
      }
      return node;
    },
    expr: function() {
      var node = new Node(Node.EXPR);
      node.add(this.match('('));
      node.add(this.key());
      if(this.look && this.look.content() == ':') {
        node.add(this.match(':'));
        node.add(this.value(true));
      }
      node.add(this.match(')'));
      return node;
    },
    charset: function() {
      var node = new Node(Node.CHARSET);
      node.add(this.match());
      node.add(this.match(Token.STRING));
      node.add(this.match(';'));
      return node;
    },
    fontface: function() {
      var node = new Node(Node.FONTFACE);
      node.add(this.match());
  
      var node2 = new Node(Node.BLOCK);
      node2.add(this.match('{'));
  
      node2.add(this.style('font-family'));
      node2.add(this.style('src'));
  
      while(this.look && this.look.content() == 'src') {
        node2.add(this.style('src'));
      }
      while(this.look && this.look.content() != '}') {
        node2.add(this.style());
      }
      node2.add(this.match('}'));
      node.add(node2);
      return node;
    },
    kframes: function() {
      var node = new Node(Node.KEYFRAMES);
      node.add(this.match());
      node.add(this.match(Token.ID));
      node.add(this.block(true));
      return node;
    },
    page: function() {
      var node = new Node(Node.PAGE);
      node.add(this.match());
      if(this.look && this.look.type() == Token.ID) {
        node.add(this.match());
      }
      if(this.look && this.look.type() == Token.PSEUDO) {
        node.add(this.match());
      }
      node.add(this.block());
      return node;
    },
    namespace: function() {
      var node = new Node(Node.NAMESPACE);
      node.add(this.match());
      if(this.look && this.look.type() == Token.ID) {
        node.add(this.match());
      }
      node.add(this.match(Token.STRING));
      node.add(this.match(';'));
      return node;
    },
    doc: function() {
      var node = new Node(Node.DOC);
      node.add(
        this.match(),
        this.match(Token.ID),
        this.match('('),
        this.match(')'),
        this.block()
      );
      return node;
    },
    vardecl: function() {
      var node = new Node(Node.VARDECL);
      node.add(this.match());
      if(!this.look) {
        this.error();
      }
      if([':', '='].indexOf(this.look.content()) > -1) {
        node.add(this.match());
      }
      node.add(this.value());
      node.add(this.match(';'));
      return node;
    },
    styleset: function(kf) {
      var node = new Node(Node.STYLESET);
      node.add(this.selectors(kf));
      node.add(this.block());
      return node;
    },
    selectors: function(kf) {
      var node = new Node(Node.SELECTORS);
      node.add(this.selector(kf));
      while(this.look && this.look.content() == ',') {
        node.add(this.match());
        node.add(this.selector(kf));
      }
      return node;
    },
    selector: function(kf) {
      var node = new Node(Node.SELECTOR);
      if(!this.look) {
        this.error();
      }
      if(kf && this.look.type() == Token.NUMBER) {
        node.add(this.match());
        node.add(this.match('%'));
      }
      else {
        var s = this.look.content().toLowerCase();
        if(s == '[' && this.look.type() != Token.HACK) {
          node.add(this.match());
          while(this.look && this.look.content() != ']') {
            node.add(this.match([Token.ATTR, Token.SIGN, Token.VARS, Token.NUMBER, Token.UNITS, Token.STRING]));
          }
          node.add(this.match(']'));
        }
        else {
          node.add(this.match(Token.SELECTOR));
        }
        while(this.look && [',', ';', '{', '}'].indexOf(this.look.content()) == -1) {
          if(this.look.content() == '[' && this.look.type() != Token.HACK) {
            node.add(this.match());
            while(this.look && this.look.content() != ']') {
              node.add(this.match([Token.ATTR, Token.SIGN, Token.VARS, Token.NUMBER, Token.UNITS, Token.STRING]));
            }
            node.add(this.match(']'));
          }
          else {
            node.add(this.match([Token.SELECTOR, Token.PSEUDO, Token.SIGN]));
          }
        }
      }
      return node;
    },
    block: function(kf) {
      var node = new Node(Node.BLOCK);
      node.add(this.match('{'));
      while(this.look
        && this.look.content() != '}') {
        if(this.look.type() == Token.SELECTOR
          || this.look.content() == '['
            && this.look.type() != Token.HACK) {
          node.add(this.styleset());
        }
        else if(kf && this.look.type() == Token.NUMBER) {
          node.add(this.styleset(kf));
        }
        else if(this.look.type() == Token.HEAD) {
          node.add(this.head());
        }
        else {
          node.add(this.style());
        }
      }
      node.add(this.match('}'));
      return node;
    },
    style: function(name) {
      var node = new Node(Node.STYLE);
      node.add(this.key(name));
      node.add(this.match(':'));
      node.add(this.value());
      while(this.look && this.look.type() == Token.HACK) {
        node.add(this.match());
      }
      node.add(this.match(';'));
      return node;
    },
    key: function(name) {
      var node = new Node(Node.KEY);
      while(this.look && this.look.type() == Token.HACK) {
        node.add(this.match());
      }
      node.add(this.match(name || Token.KEYWORD));
      return node;
    },
    value: function(noP) {
      var node = new Node(Node.VALUE);
      if(!this.look) {
        this.error();
      }
      var s = this.look.content().toLowerCase();
      if([Token.HACK, Token.VARS, Token.ID, Token.PROPERTY, Token.NUMBER, Token.STRING, Token.HEAD, Token.SIGN, Token.UNITS, Token.KEYWORD].indexOf(this.look.type()) > -1
        && [';', '}'].indexOf(s) == -1) {
        if(s == 'url') {
          node.add(this.url());
        }
        else {
          node.add(this.match());
        }
      }
      else {
        this.error();
      }
      while(this.look) {
        s = this.look.content().toLowerCase();
        if([Token.HACK, Token.VARS, Token.ID, Token.PROPERTY, Token.NUMBER, Token.STRING, Token.HEAD, Token.KEYWORD, Token.SIGN, Token.UNITS, Token.KEYWORD].indexOf(this.look.type()) > -1
          && [';', '}'].indexOf(this.look.content()) == -1) {
          if(noP && this.look.content() == ')') {
            break;
          }
          if(s == 'url') {
            node.add(this.url());
          }
          else if(s == 'format') {
            node.add(this.format());
          }
          else {
            node.add(this.match());
          }
        }
        else {
          break;
        }
      }
      if(this.look && this.look.type() == Token.IMPORTANT) {
        node.add(this.match());
      }
      return node;
    },
    url: function(ellipsis) {
      if(!this.look) {
        this.error();
      }
      var node = new Node(Node.URL);
      if(ellipsis && this.look.type() == Token.STRING) {
        if(this.look.content().charAt(0) == '"') {
          node.add(this.match());
        }
        else {
          this.error('missing quotation');
        }
      }
      else {
        node.add(
          this.match('url'),
          this.match('('),
          this.match([Token.VARS, Token.STRING]),
          this.match(')')
        );
      }
      return node;
    },
    format: function() {
      var node = new Node(Node.FORMAT);
      node.add(this.match());
      node.add(this.match('('));
      node.add(this.match([Token.VARS, Token.STRING]));
      node.add(this.match(')'));
      return node;
    },
    match: function(type, msg) {
      //未定义为所有
      if(character.isUndefined(type)) {
        if(this.look) {
          var l = this.look;
          this.move();
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
        if(this.look && this.look.content().toLowerCase() == type) {
          var l = this.look;
          this.move();
          return new Node(Node.TOKEN, l);
        }
        else if(type == ';' && this.look && this.look.content() == '}') {
          var l = new Token(Token.VIRTUAL, ';');
          return new Node(Node.TOKEN, l);
        }
        else {
          this.error('missing ' + type + (msg || ''));
        }
      }
      else if(typeof type == 'number') {
        if(this.look && this.look.type() == type) {
          var l = this.look;
          this.move();
          return new Node(Node.TOKEN, l);
        }
        else {
          this.error('missing ' + Token.type(type) + (msg || ''));
        }
      }
    },
    error: function(msg) {
      msg = 'SyntaxError: ' + (msg || ' syntax error');
      throw new Error(msg + ' line ' + this.lastLine + ' col ' + this.lastCol + ' look ' + (this.look && this.look.content()));
    },
    move: function() {
      this.lastLine = this.line;
      this.lastCol = this.col;
      do {
        this.look = this.tokens[this.index++];
        if(!this.look) {
          return;
        }
        //存下忽略的token
        if([Token.BLANK, Token.TAB, Token.ENTER, Token.LINE, Token.COMMENT, Token.IGNORE].indexOf(this.look.type()) != -1) {
          this.ignores[this.index - 1] = this.look;
        }
        if(this.look.type() == Token.LINE) {
          this.line++;
          this.col = 1;
        }
        else if(this.look.type() == Token.COMMENT) {
          var s = this.look.content(),
            n = character.count(s, character.LINE);
          if(n > 0) {
            this.line += n;
            var i = s.lastIndexOf(character.LINE);
            this.col += s.length - i - 1;
          }
        }
        else if(this.look.type() == Token.IGNORE) {
          var s = this.look.content(),
            n = character.count(s, character.LINE);
          if(n > 0) {
            this.line += n;
            var i = s.lastIndexOf(character.LINE);
            this.col += s.length - i - 1;
          }
        }
        else {
          this.col += this.look.content().length;
          if([Token.BLANK, Token.TAB, Token.ENTER].indexOf(this.look.type()) == -1) {
            break;
          }
        }
      } while(this.index <= this.length);
    },
    ignore: function() {
      return this.ignores;
    },
    invalid: function() {
      return this.invalids;
    }
  });
  module.exports = Parser;
});