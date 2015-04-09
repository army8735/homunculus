define(function(require, exports, module) {var IParser = require('../Parser');
var character = require('../../util/character');
var Lexer = require('../../lexer/Lexer');
var Rule = require('../../lexer/rule/CssRule');
var Token = require('../../lexer/CssToken');
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

var NO_MTPL = {
  'font': true,
  'border-image': true,
  'device-aspect-ratio': true,
  'device-pixel-ratio': true,
  'min-device-pixel-ratio': true,
  'max-device-pixel-ratio': true,
  'min--moz-device-pixel-ratio': true,
  'max--moz-device-pixel-ratio': true
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
        var isFn = false;
        for(var i = this.index; i < this.length; i++) {
          var t = this.tokens[i];
          if(!S.hasOwnProperty(t.type())) {
            isFn = t.content() == '(';
            break;
          }
        }
        return isFn ? this.fn() : this.varstmt();
      case Token.SELECTOR:
      case Token.PSEUDO:
        return this.styleset();
      default:
        if(this.look.content() == '[' && this.look.type() != Token.HACK) {
          return this.styleset();
        }
        if(['{', '}'].indexOf(this.look.content()) > -1) {
          this.error();
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
      case '@namespace':
        return this.namespace();
      case '@document':
        return this.doc();
      case '@counter-style':
        return this.ctstyle();
      case '@viewport':
        return this.viewport();
      case '@supports':
        return this.supports();
      case '@extend':
        return this.extend();
      case '@if':
        return this.ifstmt();
      case '@for':
        return this.forstmt();
      default:
        this.error('unknow head');
    }
  },
  extend: function() {
    var node = new Node(Node.EXTEND);
    node.add(this.match());
    if(!this.look) {
      this.error();
    }
    node.add(this.selectors());
    node.add(this.match(';'));
    return node;
  },
  supports: function() {
    var node = new Node(Node.SUPPORTS);
    node.add(this.match());
    while(this.look && this.look.content() != '{') {
      node.add(this.cndt());
    }
    node.add(this.block());
    return node;
  },
  cndt: function() {
    var node = new Node(Node.CNDT);
    if(!this.look) {
      this.error();
    }
    switch(this.look.content().toLowerCase()) {
      case 'and':
      case 'not':
      case 'or':
        node.add(this.match());
        node.add(this.cndt());
        break;
      case '(':
        node.add(
          this.match(),
          this.cndt(),
          this.match(')')
        );
        break;
      default:
        node.add(this.style(null, true));
        break;
    }
    return node;
  },
  viewport: function() {
    var node = new Node(Node.VIEWPORT);
    node.add(this.match());
    node.add(this.block());
    return node;
  },
  ctstyle: function() {
    var node = new Node(Node.CTSTYLE);
    node.add(this.match());
    node.add(this.match(Token.ID));
    node.add(this.block());
    return node;
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
    while(this.look && this.look.content().toLowerCase() == 'and') {
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
    if(this.look && MT.hasOwnProperty(this.look.content().toLowerCase())) {
      node.add(this.match());
    }
    else {
      while(this.look
      && [Token.ID, Token.NUMBER, Token.UNITS, Token.PROPERTY].indexOf(this.look.type()) > -1
      && !MT.hasOwnProperty(this.look.content().toLowerCase())) {
        node.add(this.match());
      }
    }
    while(this.look && this.look.type() == Token.HACK) {
      node.add(this.match());
      if(this.look && MT.hasOwnProperty(this.look.content().toLowerCase())) {
        node.add(this.match());
      }
      else {
        while(this.look
        && [Token.ID, Token.NUMBER, Token.UNITS, Token.PROPERTY].indexOf(this.look.type()) > -1
        && !MT.hasOwnProperty(this.look.content().toLowerCase())) {
          node.add(this.match());
        }
      }
    }
    return node;
  },
  expr: function() {
    var node = new Node(Node.EXPR);
    node.add(this.match('('));
    var k = this.key();
    node.add(k);
    var first = k.first();
    if(first.token().type() == Token.HACK) {
      first = first.next();
    }
    var name = first.token().content().toLowerCase();
    //有可能整个变量作为一个键值，无需再有:value部分
    if(this.look && this.look.content() == ':') {
      node.add(this.match(':'));
      node.add(this.value(name));
    }
    node.add(this.match(')'));
    return node;
  },
  charset: function() {
    var node = new Node(Node.CHARSET);
    node.add(this.match());
    node.add(this.addexpr(Token.STRING));
    node.add(this.match(';'));
    return node;
  },
  fontface: function() {
    var node = new Node(Node.FONTFACE);
    node.add(this.match());

    var node2 = new Node(Node.BLOCK);
    node2.add(this.match('{'));

    outer:
    while(this.look) {
      if(this.look.type() == Token.VARS) {
        var isFnCall = false;
        for(var i = this.index; i < this.length; i++) {
          var t = this.tokens[i];
          if(!S.hasOwnProperty(t.type())) {
            isFnCall = t.content() == '(';
            break;
          }
        }
        if(isFnCall) {
          node2.add(this.fnc());
        }
        else {
          node2.add(this.addexpr());
          if(this.look && this.look.content() == ':') {
            node2.add(
              this.match(),
              this.value()
            );
          }
          else {
            node2.add(this.match(';'));
          }
        }
        break;
      }
      switch(this.look.content().toLowerCase()) {
        case 'font-family':
        case 'src':
        case 'font-weight':
        case 'font-style':
          node2.add(this.style(this.look.content()));
          break;
        default:
          break outer;
      }
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
  fn: function() {
    var node = new Node(Node.FN);
    node.add(
      this.match(Token.VARS),
      this.params(),
      this.block()
    );
    return node;
  },
  params: function() {
    var node = new Node(Node.PARAMS);
    node.add(this.match('('));
    while(this.look && this.look.content() != ')') {
      node.add(this.match(Token.VARS));
      if(this.look && this.look.content() == ',') {
        node.add(this.match());
      }
    }
    node.add(this.match(')'));
    return node;
  },
  fnc: function() {
    var node = new Node(Node.FNC);
    node.add(
      this.match(),
      this.cparams()
    );
    return node;
  },
  cparams: function() {
    var node = new Node(Node.CPARAMS);
    node.add(this.match('('));
    while(this.look && this.look.content() != ')') {
      if(this.look.content() == '~'
        && this.tokens[this.index]
        && [Token.VARS, Token.STRING].indexOf(this.tokens[this.index].type()) > -1) {
        node.add(this.unbox());
      }
      else if(this.look.content() == '[') {
        node.add(this.arrltr());
      }
      else if(this.look.content() == '@dir') {
        node.add(this.dir());
      }
      else if(this.look.type() == Token.KEYWORD || this.look.type() == Token.HACK) {
        node.add(this.style(null, true, true));
      }
      else {
        node.add(this.value(null, true));
      }
      if(this.look && this.look.content() == ',') {
        node.add(this.match());
      }
    }
    node.add(this.match(')'));
    return node;
  },
  namespace: function() {
    var node = new Node(Node.NAMESPACE);
    node.add(this.match());
    if(this.look && this.look.type() == Token.ID) {
      node.add(this.match());
    }
    node.add(this.addexpr(Token.STRING));
    node.add(this.match(';'));
    return node;
  },
  doc: function() {
    var node = new Node(Node.DOC);
    node.add(this.match());
    if(!this.look) {
      this.error();
    }
    switch(this.look.content().toLowerCase()) {
      case 'url-prefix':
      case 'domain':
      case 'regexp':
        node.add(this.urlPrefix(this.look.content().toUpperCase().replace('-', '')));
        break;
      case 'url':
        node.add(this.url());
        break;
      default:
        this.error();
    }
    while(this.look && this.look.content() == ',') {
      node.add(this.match());
      if(!this.look) {
        this.error();
      }
      switch(this.look.content().toLowerCase()) {
        case 'url-prefix':
        case 'domain':
        case 'regexp':
          node.add(this.urlPrefix(this.look.content().toUpperCase().replace('-', '')));
          break;
        case 'url':
          node.add(this.url());
          break;
        default:
          this.error();
      }
    }
    if(this.look && this.look.content() == '{') {
      node.add(this.block());
    }
    return node;
  },
  urlPrefix: function(name) {
    var node = new Node(Node[name]);
    node.add(
      this.match(),
      this.match('(')
    );
    if(this.look && this.look.content() != ')') {
      node.add(this.addexpr(Token.STRING));
    }
    node.add(this.match(')'));
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
    else {
      this.error();
    }
    if(!this.look) {
      this.error();
    }
    if(this.look.content() == '[') {
      node.add(this.arrltr());
    }
    else if(this.look.content() == '@dir') {
      node.add(this.dir());
    }
    else if(this.look.type() == Token.KEYWORD || this.look.type() == Token.HACK) {
      node.add(this.style(null, true, true));
    }
    else {
      node.add(this.value(null, true));
    }
    return node;
  },
  styleset: function(kf) {
    var node = new Node(Node.STYLESET);
    node.add(this.selectors(kf));
    //兼容less的继承写法，即只写一个选择器
    if(this.look && [';', '}'].indexOf(this.look.content()) > -1) {
      node.name(Node.EXTEND);
      var extend = new Token(Token.VIRTUAL, '@extend');
      extend = new Node(Node.TOKEN, extend);
      node.addFirst(extend);
      return node;
    }
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
        node.add(this.match([Token.SELECTOR, Token.PSEUDO, Token.HACK, Token.VARS]));
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
          node.add(this.match([Token.SELECTOR, Token.PSEUDO, Token.SIGN, Token.HACK, Token.VARS]));
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
      else if(this.look.type() == Token.VARS) {
        var isFnCall = false;
        var isDecl = false;
        for(var i = this.index; i < this.length; i++) {
          var t = this.tokens[i];
          if(!S.hasOwnProperty(t.type())) {
            isFnCall = t.content() == '(';
            isDecl = [':', '='].indexOf(t.content()) > -1;
            break;
          }
        }
        if(isFnCall) {
          node.add(this.fnc());
        }
        else if(isDecl) {
          node.add(this.varstmt());
        }
        else {
          node.add(this.addexpr());
          if(this.look && this.look.content() == ':') {
            node.add(
              this.match(),
              this.value()
            );
          }
          else {
            node.add(this.match(';'));
          }
        }
      }
      else if(this.look.content() == ';') {
        node.add(this.match());
      }
      else {
        node.add(this.style());
      }
    }
    node.add(this.match('}'));
    return node;
  },
  style: function(name, noS, noC) {
    var node = new Node(Node.STYLE);
    var k = this.key(name);
    node.add(k);
    var first = k.first();
    if(first.token().type() == Token.HACK) {
      first = first.next();
    }
    name = first.token().content().toLowerCase();
    node.add(this.match(':'));
    node.add(this.value(name, noC));
    while(this.look && this.look.type() == Token.HACK) {
      node.add(this.match());
    }
    if(!noS) {
      node.add(this.match(';'));
    }
    return node;
  },
  key: function(name) {
    var node = new Node(Node.KEY);
    while(this.look && this.look.type() == Token.HACK) {
      node.add(this.match());
    }
    if(!this.look) {
      this.error();
    }
    if(name) {
      if(this.look.type() == Token.VARS) {
        node.add(this.match());
      }
      else {
        node.add(this.match(name));
      }
    }
    else {
      node.add(this.addexpr([Token.STRING, Token.KEYWORD]));
    }
    return node;
  },
  value: function(name, noComma) {
    var node = new Node(Node.VALUE);
    if(!this.look) {
      this.error();
    }
    var s = this.look.content().toLowerCase();
    if(s == '~'
      && this.tokens[this.index]
      && [Token.VARS, Token.STRING].indexOf(this.tokens[this.index].type()) > -1) {
      node.add(this.unbox());
      return node;
    }
    var pCount = 0;
    var bCount = 0;
    if([Token.COLOR, Token.HACK, Token.VARS, Token.ID, Token.PROPERTY, Token.NUMBER, Token.STRING, Token.HEAD, Token.SIGN, Token.UNITS, Token.KEYWORD].indexOf(this.look.type()) > -1
      && [';', '}'].indexOf(s) == -1) {
      //内置函数必须后跟(
      var next = this.tokens[this.index] && this.tokens[this.index].content() == '(';
      switch(s) {
        case 'var':
          node.add(next ? this.vars() : this.match());
          break;
        case 'url':
          node.add(next ? this.url() : this.match());
          break;
        case 'format':
          node.add(next ? this.format() : this.match());
          break;
        case 'rgb':
          node.add(next ? this.rgb() : this.match());
          break;
        case 'rgba':
          node.add(next ? this.rgb(true) : this.match());
          break;
        case 'hsl':
          node.add(next ? this.hsl() : this.match());
          break;
        case 'hsla':
          node.add(next ? this.hsl(true) : this.match());
          break;
        case 'max':
          node.add(next ? this.minmax(true) : this.match());
          break;
        case 'min':
          node.add(next ? this.minmax() : this.match());
          break;
        case 'calc':
          node.add(next ? this.calc() : this.match());
          break;
        //这几个语法完全一样
        //cycle是toggle的老版本写法
        case 'cycle':
        case 'toggle':
        case 'counter':
        case 'attr':
        case 'translate':
        case 'rect':
        case 'translate3d':
        case 'translatex':
        case 'translatey':
        case 'translatez':
        case 'rotate':
        case 'rotate3d':
        case 'rotatex':
        case 'rotatey':
        case 'rotatez':
        case 'scale':
        case 'scale3d':
        case 'scalex':
        case 'scaley':
        case 'scalez':
          node.add(next ? this.counter(s) : this.match());
          break;
        case 'linear-gradient':
        case 'repeating-linear-gradient':
          node.add(next ? this.lg() : this.match());
          break;
        case 'radial-gradient':
        case 'repeating-radial-gradient':
          node.add(next ? this.rg() : this.match());
          break;
        case 'alpha':
        case 'blur':
        case 'chroma':
        case 'dropshadow':
        case 'fliph':
        case 'flipv':
        case 'glow':
        case 'gray':
        case 'invert':
        case 'light':
        case 'mask':
        case 'shadow':
        case 'wave':
        case 'xray':
        case 'dximagetransform.microsoft.gradient':
          node.add(next ? this.filter() : this.match());
          break;
        default:
          if(s == '(') {
            pCount++;
          }
          else if(s == ')') {
            this.error();
          }
          else if(noComma && s == ',') {
            this.error();
          }
          else if(s == '[') {
            bCount++;
          }
          else if(s == ']') {
            if(bCount == 0) {
              return node;
            }
            bCount--;
          }
          //LL2确定是否是fncall
          var fncall = false;
          if(this.look.type() == Token.VARS) {
            for(var i = this.index; i < this.length; i++) {
              var t = this.tokens[i];
              if(!S.hasOwnProperty(t.type())) {
                if(t.content() == '(') {
                  fncall = true;
                }
                break;
              }
            }
          }
          if(fncall) {
            node.add(this.fnc());
          }
          else if(NO_MTPL.hasOwnProperty(name)) {
            node.add(this.addexpr(undefined, null, true));
          }
          else {
            node.add(this.addexpr());
          }
          break;
      }
    }
    else {
      this.error();
    }
    outer:
    while(this.look) {
      s = this.look.content().toLowerCase();
      if([Token.COLOR, Token.HACK, Token.VARS, Token.ID, Token.PROPERTY, Token.NUMBER, Token.STRING, Token.HEAD, Token.KEYWORD, Token.SIGN, Token.UNITS, Token.KEYWORD].indexOf(this.look.type()) > -1
        && [';', '}'].indexOf(this.look.content()) == -1) {
        //内置函数必须后跟(
        var next = this.tokens[this.index] && this.tokens[this.index].content() == '(';
        switch(s) {
          case 'var':
            node.add(next ? this.vars() : this.match());
            break;
          case 'url':
            node.add(next ? this.url() : this.match());
            break;
          case 'format':
            node.add(next ? this.format() : this.match());
            break;
          case 'rgb':
            node.add(next ? this.rgb() : this.match());
            break;
          case 'rgba':
            node.add(next ? this.rgb(true) : this.match());
            break;
          case 'hsl':
            node.add(next ? this.hsl() : this.match());
            break;
          case 'hsla':
            node.add(next ? this.hsl(true) : this.match());
            break;
          case 'min':
            node.add(next ? this.minmax() : this.match());
            break;
          case 'max':
            node.add(next ? this.minmax(true) : this.match());
            break;
          case 'calc':
            node.add(next ? this.calc() : this.match());
            break;
          //这几个语法完全一样
          //cycle是toggle的老版本写法
          case 'cycle':
          case 'toggle':
          case 'counter':
          case 'attr':
          case 'translate':
          case 'rect':
          case 'translate3d':
          case 'translatex':
          case 'translatey':
          case 'translatez':
          case 'rotate':
          case 'rotate3d':
          case 'rotatex':
          case 'rotatey':
          case 'rotatez':
          case 'scale':
          case 'scale3d':
          case 'scalex':
          case 'scaley':
          case 'scalez':
            node.add(next ? this.counter(s) : this.match());
            break;
          case 'linear-gradient':
          case 'repeating-linear-gradient':
            node.add(next ? this.lg() : this.match());
            break;
          case 'radial-gradient':
          case 'repeating-radial-gradient':
            node.add(next ? this.rg() : this.match());
            break;
          case 'alpha':
          case 'blur':
          case 'chroma':
          case 'dropshadow':
          case 'fliph':
          case 'flipv':
          case 'glow':
          case 'gray':
          case 'invert':
          case 'light':
          case 'mask':
          case 'shadow':
          case 'wave':
          case 'xray':
          case 'dximagetransform.microsoft.gradient':
            node.add(next ? this.filter() : this.match());
            break;
          default:
            if(s == '(') {
              pCount++;
            }
            else if(s == ')') {
              pCount--;
              if(pCount < 0) {
                break outer;
              }
            }
            else if(noComma && s == ',') {
              break outer;
            }
            else if(s == '[') {
              bCount++;
            }
            else if(s == ']') {
              if(bCount == 0) {
                return node;
              }
              bCount--;
            }
            else if(s == '~'
              && this.tokens[this.index]
              && [Token.VARS, Token.STRING].indexOf(this.tokens[this.index].type()) > -1) {
              node.add(this.unbox());
              break;
            }
            //LL2确定是否是fncall
            var fncall = false;
            if(this.look.type() == Token.VARS) {
              for(var i = this.index; i < this.length; i++) {
                var t = this.tokens[i];
                if(!S.hasOwnProperty(t.type())) {
                  if(t.content() == '(') {
                    fncall = true;
                  }
                  break;
                }
              }
            }
            if(fncall) {
              node.add(this.fnc());
            }
            else if(NO_MTPL.hasOwnProperty(name)) {
              node.add(this.addexpr(undefined, null, true));
            }
            else {
              node.add(this.addexpr());
            }
            break;
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
  rg: function() {
    var node = new Node(Node.RADIOGRADIENT);
    node.add(
      this.match(),
      this.match('(')
    );
    if(!this.look) {
      this.error();
    }
    if(this.look.type() == Token.NUMBER
      || ['left', 'center', 'right'].indexOf(this.look.content().toLowerCase()) > -1) {
      node.add(this.pos());
      node.add(this.match(','));
    }
    if(!this.look) {
      this.error();
    }
    if(this.look.type() == Token.NUMBER) {
      node.add(this.len());
      node.add(this.len());
    }
    else {
      node.add(this.match(['circle', 'ellipse', 'closest-side', 'closest-corner', 'farthest-side', 'farthest-corner', 'contain', 'cover']));
    }
    node.add(this.match(','), this.colorstop());
    while(this.look && this.look.content() == ',') {
      node.add(
        this.match(),
        this.colorstop()
      );
    }
    node.add(this.match(')'));
    return node;
  },
  pos: function() {
    var node = new Node(Node.POS);
    if(this.look.type() == Token.NUMBER) {
      node.add(this.len());
    }
    else {
      node.add(this.match(['left', 'center', 'right']));
    }
    if(this.look) {
      if(this.look.type() == Token.NUMBER) {
        node.add(this.len());
      }
      else if(['top', 'center', 'bottom'].indexOf(this.look.content().toLowerCase()) > -1){
        node.add(this.match());
      }
    }
    return node;
  },
  len: function() {
    var node = new Node(Node.LEN);
    var isZeror = this.look.content() == '0';
    node.add(this.match(Token.NUMBER));
    if(this.look && this.look.type() == Token.UNITS) {
      node.add(this.match());
    }
    else if(!isZeror) {
      this.error();
    }
    return node;
  },
  lg: function() {
    var node = new Node(Node.LINEARGRADIENT);
    node.add(
      this.match(),
      this.match('(')
    );
    if(!this.look) {
      this.error();
    }
    switch(this.look.type()) {
      case Token.NUMBER:
      case Token.PROPERTY:
      case Token.ID:
        node.add(this.point());
        node.add(this.match(','));
        break;
    }
    node.add(
      this.colorstop(),
      this.match(','),
      this.colorstop()
    );
    while(this.look && this.look.content() == ',') {
      node.add(
        this.match(),
        this.colorstop()
      );
    }
    node.add(this.match(')'));
    return node;
  },
  point: function() {
    var node = new Node(Node.POINT);
    if(this.look.type() == Token.NUMBER) {
      node.add(
        this.match(),
        this.match('deg')
      );
    }
    else {
      if(this.look && this.look.content().toLowerCase() == 'to') {
        node.add(this.match());
      }
      node.add(this.match(['left', 'right', 'top', 'bottom', 'center']));
      if(this.look && this.look.content().toLowerCase() == 'to') {
        node.add(this.match());
      }
      if(this.look && this.look.type() == Token.PROPERTY) {
        node.add(this.match(['left', 'right', 'top', 'bottom', 'center']));
      }
    }
    return node;
  },
  colorstop: function() {
    var node = new Node(Node.COLORSTOP);
    if(!this.look) {
      this.error();
    }
    if(this.look.type() == Token.COLOR) {
      node.add(this.match(Token.COLOR));
    }
    else {
      switch(this.look.content()) {
        case 'rgb':
          node.add(this.rgb());
          break;
        case 'rgba':
          node.add(this.rgb(true));
          break;
        case 'hsl':
          node.add(this.hsl());
          break;
        case 'hsla':
          node.add(this.hsl(true));
          break;
        default:
          this.error();
      }
    }
    if(this.look
      && this.look.type() == Token.NUMBER) {
      var isZero = this.look.content() == '0';
      node.add(this.match());
      if(this.look && this.look.type() == Token.UNITS) {
        node.add(this.match());
      }
      else if(!isZero) {
        this.error();
      }
    }
    return node;
  },
  minmax: function(max) {
    var node = new Node(max ? Node.MAX : Node.MIN);
    node.add(
      this.match(),
      this.match('(')
    );
    node.add(this.param());
    while(this.look && this.look.content() == ',') {
      node.add(this.match());
      node.add(this.param());
    }
    node.add(this.match(')'));
    return node;
  },
  param: function(expr) {
    var node = new Node(Node.PARAM);
    var s = this.look.content().toLowerCase();
    if([Token.COLOR, Token.HACK, Token.VARS, Token.ID, Token.PROPERTY, Token.NUMBER, Token.STRING, Token.HEAD, Token.SIGN, Token.UNITS, Token.KEYWORD].indexOf(this.look.type()) > -1
      && [';', '}', ')', ','].indexOf(s) == -1) {
      node.add(expr ? this.addexpr() : this.match());
    }
    else {
      this.error();
    }
    while(this.look) {
      s = this.look.content().toLowerCase();
      if([Token.COLOR, Token.HACK, Token.VARS, Token.ID, Token.PROPERTY, Token.NUMBER, Token.STRING, Token.HEAD, Token.KEYWORD, Token.SIGN, Token.UNITS, Token.KEYWORD].indexOf(this.look.type()) > -1
        && [';', '}', ')', ','].indexOf(this.look.content()) == -1) {
        node.add(expr ? this.addexpr() : this.match());
      }
      else {
        break;
      }
    }
    return node;
  },
  vars: function() {
    var node = new Node(Node.VARS);
    node.add(
      this.match(),
      this.match('('),
      this.addexpr(),
      this.match(')')
    );
    return node;
  },
  calc: function() {
    var node = new Node(Node.CALC);
    node.add(
      this.match(),
      this.match('(')
    );
    var count = 0;
    while(this.look) {
      var s = this.look.content();
      if([';', '}'].indexOf(s) > -1) {
        this.error();
      }
      else if(s == '(') {
        count++;
      }
      else if(s == ')') {
        if(count-- == 0) {
          break;
        }
      }
      node.add(this.match());
    }
    node.add(this.match(')'));
    return node;
  },
  counter: function(name) {
    var node = new Node(Node[name.toUpperCase()]);
    node.add(
      this.match(),
      this.match('('),
      this.param(true)
    );
    while(this.look && this.look.content() == ',') {
      node.add(
        this.match(),
        this.param(true)
      );
    }
    node.add(this.match(')'));
    return node;
  },
  filter: function() {
    var node = new Node(Node.FILTER);
    var isFn = false;
    for(var i = this.index; i < this.length; i++) {
      var t = this.tokens[i];
      if(!S.hasOwnProperty(t.type())) {
        isFn = t.content() == '(';
        break;
      }
    }
    if(!isFn) {
      return this.match();
    }
    node.add(
      this.match(),
      this.match('(')
    );
    node.add(this.param(true));
    while(this.look && this.look.content() == ',') {
      node.add(
        this.match(),
        this.param(true)
      );
    }
    node.add(this.match(')'));
    return node;
  },
  rgb: function(alpha) {
    var node = new Node(alpha ? Node.RGBA : Node.RGB);
    node.add(
      this.match(),
      this.match('('),
      this.addexpr(Token.NUMBER),
      this.match(','),
      this.addexpr(Token.NUMBER),
      this.match(','),
      this.addexpr(Token.NUMBER)
    );
    if(alpha) {
      node.add(
        this.match(','),
        this.addexpr(Token.NUMBER)
      );
    }
    node.add(this.match(')'));
    return node;
  },
  hsl: function(alpha) {
    var node = new Node(alpha ? Node.HSLA : Node.HSL);
    node.add(
      this.match(),
      this.match('('),
      this.addexpr(Token.NUMBER),
      this.match(',')
    );
    var isZero = this.look && this.look.content() == '0';
    var isVar = this.look && this.look.type() == Token.VARS;
    node.add(this.addexpr(Token.NUMBER, true));
    if(this.look && this.look.content() == '%') {
      node.add(this.match());
    }
    else if(!isZero && !isVar) {
      this.error();
    }
    node.add(this.match(','));
    var isZero = this.look && this.look.content() == '0';
    var isVar = this.look && this.look.type() == Token.VARS;
    node.add(this.addexpr(Token.NUMBER, true));
    if(this.look && this.look.content() == '%') {
      node.add(this.match());
    }
    else if(!isZero && !isVar) {
      this.error();
    }
    if(alpha) {
      node.add(
        this.match(','),
        this.addexpr(Token.NUMBER)
      );
    }
    node.add(this.match(')'));
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
        this.match('(')
      );
      if(this.look && this.look.content() != ')') {
        node.add(this.addexpr(Token.STRING));
      }
      node.add(this.match(')'));
    }
    return node;
  },
  format: function() {
    var node = new Node(Node.FORMAT);
    node.add(this.match());
    node.add(this.match('('));
    node.add(this.addexpr(Token.STRING));
    node.add(this.match(')'));
    return node;
  },
  addexpr: function(accepts, noUnit, noMtpl) {
    if(accepts && !Array.isArray(accepts)) {
      accepts = [accepts];
    }
    if(accepts && accepts.indexOf(Token.VARS) == -1) {
      accepts = accepts.concat([Token.VARS]);
    }
    if(accepts && accepts.indexOf(Token.NUMBER) == -1) {
      accepts = accepts.concat([Token.NUMBER]);
    }
    var node = new Node(Node.ADDEXPR);
    var mtplexpr = this.mtplexpr(accepts, noUnit, noMtpl);
    if(this.look && ['+', '-'].indexOf(this.look.content()) != -1) {
      node.add(mtplexpr);
      while(this.look && ['+', '-'].indexOf(this.look.content()) != -1) {
        node.add(
          this.match(),
          this.mtplexpr(accepts, noUnit, noMtpl)
        );
        if(!noUnit && this.look && this.look.type() == Token.UNITS) {
          node.add(this.match());
        }
      }
    }
    else {
      return mtplexpr;
    }
    return node;
  },
  mtplexpr: function(accepts, noUnit, noMtpl) {
    var node = new Node(Node.MTPLEXPR);
    var prmrexpr = this.prmrexpr(accepts, noUnit);
    if(!noMtpl && this.look && ['*', '/'].indexOf(this.look.content()) != -1) {
      node.add(prmrexpr);
      while(this.look && ['*', '/'].indexOf(this.look.content()) != -1) {
        node.add(
          this.match(),
          this.prmrexpr(accepts)
        );
        if(!noUnit && this.look && this.look.type() == Token.UNITS) {
          node.add(this.match());
        }
      }
    }
    else {
      return prmrexpr;
    }
    return node;
  },
  prmrexpr: function(accepts, noUnit) {
    var node = new Node(Node.PRMREXPR);
    if(this.look && this.look.content() == '(') {
      node.add(
        this.match('('),
        this.addexpr(accepts, noUnit),
        this.match(')')
      );
      return node;
    }
    if(this.look.content() == '@basename') {
      return this.basename();
    }
    else if(this.look.content() == '@extname') {
      return this.extname();
    }
    else if(this.look.content() == '@width') {
      return this.width();
    }
    else if(this.look.content() == '@height') {
      return this.height();
    }
    //紧接着的(说明这是个未知的css内置id()
    var next = this.tokens[this.index];
    if(next && next.content() == '('
      && [Token.PROPERTY, Token.ID].indexOf(this.look.type()) > -1) {
      return this.bracket();
    }
    var temp = this.match(accepts);
    if(!noUnit && this.look && this.look.type() == Token.UNITS) {
      temp = [temp, this.match()];
    }
    return temp;
  },
  bracket: function() {
    var node = new Node(Node.BRACKET);
    node.add(
      this.match([Token.ID, Token.PROPERTY]),
      this.match('(')
    );
    while(this.look && this.look.content() != ')') {
      node.add(this.addexpr());
    }
    node.add(this.match(')'));
    return node;
  },
  ifstmt: function() {
    var node = new Node(Node.IFSTMT);
    node.add(
      this.match(),
      this.match('('),
      this.eqstmt(),
      this.match(')'),
      this.block()
    );
    if(this.look) {
      if(this.look.content() == '@elseif') {
        node.add(this.ifstmt());
      }
      else if(this.look.content() == '@else') {
        node.add(this.match(), this.block());
      }
    }
    return node;
  },
  forstmt: function() {
    var node = new Node(Node.FORSTMT);
    node.add(
      this.match(),
      this.match('(')
    );
    var type = 0; //0为普通，1为in，2为of
    //in和of和普通语句三种区分
    //debugger
    for(var i = this.index; i < this.length; i++) {
      var token = this.tokens[i];
      if(!S[token.type()]) {
        if(token.content() == 'in') {
          type = 1;
        }
        else if(token.content() == 'of') {
          type = 2;
        }
        break;
      }
    }
    if(type == 0) {
      //@for(varstmt ; expr ; epxr)
      if(this.look.content() != ';') {
        node.add(this.varstmt());
      }
      else {
        node.add(this.match(';'));
      }
      node.add(this.eqstmt());
      node.add(this.match(';'));
      node.add(this.eqstmt());
    }
    else if(type == 1) {
      //@for($var in expr)
      node.add(
        this.match(Token.VARS),
        this.match('in'),
        this.exprstmt()
      );
    }
    else if(type == 2) {
      //@for($var of expr)
      node.add(
        this.match(Token.VARS),
        this.match('of'),
        this.exprstmt()
      );
    }
    node.add(this.match(')'));
    node.add(this.block());
    return node;
  },
  varstmt: function() {
    var node = new Node(Node.VARSTMT);
    node.add(this.vardecl());
    while(this.look && this.look.content() == ',') {
      node.add(this.match(), this.vardecl());
    }
    node.add(this.match(';'));
    return node;
  },
  exprstmt: function() {
    if(!this.look) {
      this.error();
    }
    if(this.look.content() == '@dir') {
      return this.dir();
    }
    return this.eqstmt();
  },
  eqstmt: function() {
    var node = new Node(Node.EQSTMT);
    var relstmt = this.relstmt();
    if(this.look && {
        '==': true,
        '!=': true
      }.hasOwnProperty(this.look.content())) {
      node.add(
        relstmt,
        this.match(),
        this.relstmt()
      );
    }
    else {
      return relstmt;
    }
    return node;
  },
  relstmt: function() {
    var node = new Node(Node.RELSTMT);
    var addstmt = this.addstmt();
    if(this.look && {
        '>': true,
        '<': true,
        '>=': true,
        '<=': true
      }.hasOwnProperty(this.look.content())) {
      node.add(
        addstmt,
        this.match(),
        this.addstmt()
      );
    }
    else {
      return addstmt;
    }
    return node;
  },
  addstmt: function() {
    if(this.look.content() == '@basename') {
      return this.basename();
    }
    else if(this.look.content() == '@extname') {
      return this.extname();
    }
    var node = new Node(Node.ADDSTMT);
    var mtplstmt = this.mtplstmt();
    if(this.look && {
        '+': true,
        '-': true
      }.hasOwnProperty(this.look.content())) {
      node.add(
        mtplstmt,
        this.match(),
        this.mtplstmt()
      );
      while(this.look && {
        '+': true,
        '-': true
      }.hasOwnProperty(this.look.content())) {
        node.add(
          mtplstmt,
          this.match(),
          this.mtplstmt()
        );
      }
    }
    else {
      return mtplstmt;
    }
    return node;
  },
  mtplstmt: function() {
    var node = new Node(Node.MTPLSTMT);
    var postfixstmt = this.postfixstmt();
    if(this.look && {
        '*': true,
        '/': true
      }.hasOwnProperty(this.look.content())) {
      node.add(
        postfixstmt,
        this.match(),
        this.postfixstmt()
      );
      while(this.look && {
        '*': true,
        '/': true
      }.hasOwnProperty(this.look.content())) {
        node.add(
          postfixstmt,
          this.match(),
          this.postfixstmt()
        );
      }
    }
    else {
      return postfixstmt;
    }
    return node;
  },
  postfixstmt: function() {
    if(this.look.content() == '@width') {
      return this.width();
    }
    else if(this.look.content() == '@height') {
      return this.height();
    }
    var node = new Node(Node.POSTFIXSTMT);
    var prmrstmt = this.prmrstmt();
    if(this.look && {
        '++': true,
        '--': true
      }.hasOwnProperty(this.look.content())) {
      node.add(
        prmrstmt,
        this.match()
      );
    }
    else {
      return prmrstmt;
    }
    return node;
  },
  prmrstmt: function() {
    var node = new Node(Node.PRMRSTMT);
    switch(this.look.type()) {
      case Token.VARS:
      case Token.NUMBER:
      case Token.STRING:
        node.add(this.match());
        break;
      default:
        switch(this.look.content()) {
          case '(':
            node.add(
              this.match(),
              this.eqstmt(),
              this.match(')')
            );
            break;
          case '[':
            return this.arrltr();
          default:
            this.error();
        }
    }
    return node;
  },
  arrltr: function() {
    var node = new Node(Node.ARRLTR);
    node.add(this.match('['));
    while(this.look && this.look.content() != ']') {
      if(this.look.content() == ',') {
        node.add(this.match());
      }
      if(!this.look) {
        this.error();
      }
      if(this.look.type() == Token.KEYWORD || this.look.type() == Token.HACK) {
        node.add(this.style(null, true, true));
      }
      else {
        node.add(this.value(null, true));
      }
    }
    node.add(this.match(']'));
    return node;
  },
  dir: function() {
    var node = new Node(Node.DIR);
    node.add(
      this.match(),
      this.cparams()
    );
    return node;
  },
  basename: function() {
    var node = new Node(Node.BASENAME);
    node.add(
      this.match(),
      this.cparams()
    );
    return node;
  },
  extname: function() {
    var node = new Node(Node.EXTNAME);
    node.add(
      this.match(),
      this.cparams()
    );
    return node;
  },
  width: function() {
    var node = new Node(Node.WIDTH);
    node.add(
      this.match(),
      this.cparams()
    );
    return node;
  },
  height: function() {
    var node = new Node(Node.HEIGHT);
    node.add(
      this.match(),
      this.cparams()
    );
    return node;
  },
  unbox: function() {
    var node = new Node(Node.UNBOX);
    node.add(
      this.match('~'),
      this.match([Token.VARS, Token.STRING])
    );
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
  }
});
module.exports = Parser;});