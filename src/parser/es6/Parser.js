var Class = require('../../util/Class');
var character = require('../../util/character');
var Lexer = require('../../lexer/Lexer');
var Rule = require('../../lexer/rule/EcmascriptRule');
var Token = require('../../lexer/Token');
var Node = require('./Node');
var S = {};
S[Token.BLANK] = S[Token.TAB] = S[Token.COMMENT] = S[Token.LINE] = S[Token.ENTER] = true;
var NOASSIGN = {};
NOASSIGN[Node.CNDTEXPR]
  = NOASSIGN[Node.LOGOREXPR]
  = NOASSIGN[Node.LOGANDEXPR]
  = NOASSIGN[Node.BITOREXPR]
  = NOASSIGN[Node.BITXOREXPR]
  = NOASSIGN[Node.BITANDEXPR]
  = NOASSIGN[Node.EQEXPR]
  = NOASSIGN[Node.RELTEXPR]
  = NOASSIGN[Node.SHIFTEXPR]
  = NOASSIGN[Node.ADDEXPR]
  = NOASSIGN[Node.MTPLEXPR]
  = NOASSIGN[Node.UNARYEXPR]
  = NOASSIGN[Node.POSTFIXEXPR]
  = true;
var Parser = Class(function(lexer) {
  this.init(lexer);
}).methods({
  parse: function(code) {
    this.lexer.parse(code);
    this.tree = this.script();
    return this.tree;
  },
  ast: function() {
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
  script: function() {
    this.tokens = this.lexer.tokens();
    this.length = this.tokens.length;
    if(this.tokens.length) {
      this.move();
    }
    var node = new Node(Node.SCRIPT);
    if(this.look) {
      node.add(this.scriptbody());
    }
    return node;
  },
  scriptbody: function() {
    var node = new Node(Node.SCRIPTBODY);
    while(this.look) {
      node.add(this.stmtlitem());
    }
    return node;
  },
  stmtlitem: function() {
    if(['function', 'class', 'let', 'const'].indexOf(this.look.content()) > -1) {
      return this.decl();
    }
    else {
      return this.stmt();
    }
  },
  decl: function() {
    if(!this.look) {
      this.error();
    }
    switch(this.look.content()) {
      case 'let':
      case 'const':
        return this.lexdecl();
      case 'function':
        return this.fndecl();
      case 'class':
        return this.classdecl();
    }
  },
  stmt: function() {
    if(!this.look) {
      this.error();
    }
    switch(this.look.content()) {
      case 'var':
        return this.varstmt();
      case '{':
        return this.blockstmt();
      case ';':
        return this.emptstmt();
      case 'if':
        return this.ifstmt();
      case 'do':
      case 'while':
      case 'for':
        return this.iterstmt();
      case 'continue':
        return this.cntnstmt();
      case 'break':
        return this.brkstmt();
      case 'return':
        return this.retstmt();
      case 'with':
        return this.withstmt();
      case 'switch':
        return this.swchstmt();
      case 'throw':
        return this.thrstmt();
      case 'try':
        return this.trystmt();
      case 'debugger':
        return this.debstmt();
      case 'yield':
        return this.labstmt();
      default:
        if(this.look.type() == Token.ID) {
          for(var i = this.index; i < this.length; i++) {
            var token = this.tokens[i];
            if(!S[token.type()]) {
              if(token.content() == ':') {
                return this.labstmt();
              }
              else {
                return this.exprstmt();
              }
            }
          }
        }
        return this.exprstmt();
    }
  },
  exprstmt: function() {
    var node = new Node(Node.EXPRSTMT);
    node.add(this.expr(), this.match(';'));
    return node;
  },
  lexdecl: function() {
    var node = new Node(Node.LEXDECL);
    if(this.look.content() == 'let') {
      node.add(this.match());
    }
    else if(this.look.content() == 'const') {
      node.add(this.match());
    }
    else {
      this.error();
    }
    node.add(this.lexbind());
    while(this.look && this.look.content() == ',') {
      node.add(
        this.match(),
        this.lexbind()
      );
    }
    return node;
  },
  lexbind: function() {
    var node = new Node(Node.LEXBIND);
    this.declnode(node);
    return node;
  },
  declnode: function(node) {
    if(!this.look) {
      this.error('missing variable name');
    }
    if(['[', '{'].indexOf(this.look.content()) > -1) {
      node.add(this.bindpat());
      if(!this.look || this.look.content() != '=') {
        this.error('missing = in destructuring declaration');
      }
      node.add(this.initlz());
    }
    else {
      node.add(this.bindid('missing variable name'));
      if(this.look && this.look.content() == '=') {
        node.add(this.initlz());
      }
    }
  },
  varstmt: function(noSem) {
    var node = new Node(Node.VARSTMT);
    node.add(
      this.match('var'),
      this.vardecl()
    );
    while(this.look && this.look.content() == ',') {
      node.add(
        this.match(),
        this.vardecl()
      );
    }
    if(!noSem) {
      node.add(this.match(';'));
    }
    return node;
  },
  vardecl: function() {
    var node = new Node(Node.VARDECL);
    this.declnode(node);
    return node;
  },
  bindid: function(msg) {
    var node = new Node(Node.BINDID);
    node.add(this.match(Token.ID, msg));
    return node;
  },
  bindpat: function() {
    if(this.look.content() == '[') {
      return this.arrbindpat();
    }
    else if(this.look.content() == '{') {
      return this.objbindpat();
    }
    else {
      this.error();
    }
  },
  arrbindpat: function() {
    var node = new Node(Node.ARRBINDPAT);
    node.add(this.match('['));
    while(this.look && this.look.content() != ']') {
      if(this.look.content() == ',') {
        node.add(this.match());
      }
      else if(this.look.content() == '...') {
        break;
      }
      else {
        node.add(this.bindelem());
      }
    }
    if(this.look.content() == '...') {
      node.add(this.bindrest());
    }
    node.add(this.match(']', 'missing ] after element list'));
    return node;
  },
  bindelem: function() {
    var node = new Node(Node.BINDELEM);
    if(['[', '{'].indexOf(this.look.content()) > -1) {
      node.add(this.bindpat());
      if(this.look && this.look.content() == '=') {
        node.add(this.initlz());
      }
    }
    else {
      return this.singlename();
    }
    return node;
  },
  singlename: function() {
    var node = new Node(Node.SINGLENAME);
    node.add(this.bindid());
    if(this.look && this.look.content() == '=') {
      node.add(this.initlz());
    }
    return node;
  },
  bindrest: function() {
    var node = new Node(Node.BINDREST);
    node.add(
      this.match('...'),
      this.bindid('no parameter name after ...')
    );
    return node;
  },
  objbindpat: function() {
    var node = new Node(Node.OBJBINDPAT);
    node.add(this.match('{'));
    while(this.look && this.look.content() != '}') {
      node.add(this.bindpropt());
      if(this.look && this.look.content() == ',') {
        node.add(this.match());
      }
    }
    node.add(this.match('}', 'missing } after property list'));
    return node;
  },
  bindpropt: function() {
    var node = new Node(Node.BINDPROPT);
    //只能是singlename或者properyname
    switch(this.look.type()) {
      case Token.ID:
      case Token.STRING:
      case Token.NUMBER:
      break;
      default:
        if(this.look.content() != '[') {
          this.error('invalid property id');
        }
    }
    //[为PropertyName左推导
    if(this.look.content() == '[') {
      node.add(
        this.proptname(),
        this.match(':'),
        this.bindelem()
      );
      return node;
    }
    //根据LL2分辨是PropertyName[?Yield, ?GeneratorParameter] : BindingElement[?Yield, ?GeneratorParameter]
    //还是SingleNameBinding[?Yield, ?GeneratorParameter]
    for(var i = this.index; i < this.length; i++) {
      var next = this.tokens[i];
      if(!S[next.type()]) {
        if(next.content() == ':') {
          node.add(
            this.proptname(),
            this.match(':'),
            this.bindelem()
          );
        }
        else {
          node.add(this.singlename());
        }
        return node;
      }
    }
    this.error('missing : after property id');
  },
  blockstmt: function() {
    var node = new Node(Node.BLOCKSTMT);
    node.add(this.block());
    return node;
  },
  block: function(msg) {
    var node = new Node(Node.BLOCK);
    node.add(this.match('{', msg));
    while(this.look && this.look.content() != '}') {
      node.add(this.stmtlitem());
    }
    node.add(this.match('}', 'missing } in compound statement'));
    return node;
  },
  emptstmt: function() {
    var node = new Node(Node.EMPTSTMT);
    node.add(this.match(';'));
    return node;
  },
  ifstmt: function() {
    var node = new Node(Node.IFSTMT);
    node.add(
      this.match('if'),
      this.match('('),
      this.expr(),
      this.match(')'),
      this.stmt()
    );
    if(this.look && this.look.content() == 'else') {
      node.add(
        this.match('else'),
        this.stmt()
      );
    }
    return node;
  },
  iterstmt: function() {
    var node = new Node(Node.ITERSTMT);
    switch(this.look.content()) {
      case 'do':
        node.add(
          this.match(),
          this.stmt(),
          this.match('while'),
          this.match('('),
          this.expr(),
          this.match(')'),
          this.match(';')
        );
      break;
      case 'while':
        node.add(
          this.match(),
          this.match('('),
          this.expr(),
          this.match(')'),
          this.stmt()
        );
      break;
      case 'for':
        node.add(
          this.match(),
          this.match('(')
        );
        if(!this.look) {
          this.error();
        }
        if(this.look.content() == 'var' || this.look.content() == 'let') {
          var node2 = this.look.content() == 'var' ? this.varstmt(true) : this.letstmt(true);
          if(!this.look) {
            this.error('missing ; after for-loop initializer');
          }
          if(this.look.content() == 'in') {
            if(node2.leaves().length > 2) {
              this.error('invalid for/in left-hand side');
            }
            node.add(node2);
            node.add(
              this.match(),
              this.expr()
            );
          }
          else {
            node.add(node2);
            node.add(this.match(';'));
            if(this.look.content() != ';') {
              node.add(this.expr());
            }
            node.add(this.match(';'));
            if(!this.look) {
              this.error();
            }
            if(this.look.content() != ')') {
              node.add(this.expr());
            }
          }
        }
        else {
          if(this.look.content() == 'in') {
            this.error();
          }
          var hasIn = false;
          for(var i = this.index; i < this.length; i++) {
            var t = this.tokens[i];
            if(t.content() == 'in') {
              hasIn = true;
              break;
            }
            else if(t.content() == ')') {
              break;
            }
          }
          if(hasIn) {
            node.add(this.expr(true), this.match('in'), this.expr());
          }
          else {
            if(this.look.content() != ';') {
              node.add(this.expr());
            }
            //for的;不能省略，强制判断
            if(!this.look || this.look.content() != ';') {
              this.error('missing ;')
            }
            node.add(this.match(';'));
            if(!this.look) {
              this.error();
            }
            if(this.look.content() != ';') {
              node.add(this.expr());
            }
            if(!this.look || this.look.content() != ';') {
              this.error('missing ;')
            }
            node.add(this.match(';'));
            if(!this.look) {
              this.error();
            }
            if(this.look.content() != ')') {
              node.add(this.expr());
            }
          }
        }
        node.add(this.match(')'));
        node.add(this.stmt());
    }
    return node;
  },
  cntnstmt: function() {
    var node = new Node(Node.CNTNSTMT);
    node.add(this.match('continue', true));
    if(this.look && this.look.type() == Token.ID) {
      node.add(this.match());
    }
    node.add(this.match(';'));
    return node;
  },
  brkstmt: function() {
    var node = new Node(Node.BRKSTMT);
    node.add(this.match('break', true));
    if(this.look && this.look.type() == Token.ID) {
      node.add(this.match());
    }
    node.add(this.match(';'));
    return node;
  },
  retstmt: function() {
    var node = new Node(Node.RETSTMT);
    node.add(this.match('return', true));
    //return后换行视作省略;，包括多行注释的换行
    if(this.look) {
      if(this.look.content() == ';'
        || this.look.content() == '}'
        || this.look.type() == Token.LINE
        || this.look.type() == Token.COMMENT) {
        node.add(this.match(';'));
      }
      else {
        node.add(this.expr(), this.match(';'));
      }
    }
    else {
      node.add(this.match(';'));
    }
    return node;
  },
  withstmt: function() {
    var node = new Node(Node.WITHSTMT);
    node.add(
      this.match('with', 'missing ( before with-statement object'),
      this.match('('),
      this.expr(),
      this.match(')', 'missing ) after with-statement object'),
      this.stmt()
    );
    return node;
  },
  swchstmt: function() {
    var node = new Node(Node.SWCHSTMT);
    node.add(
      this.match('switch'),
      this.match('('),
      this.expr(),
      this.match(')'),
      this.caseblock()
    );
    return node;
  },
  caseblock: function() {
    var node = new Node(Node.CASEBLOCK);
    node.add(this.match('{'));
    while(this.look && this.look.content() != '}') {
      if(this.look.content() == 'case') {
        node.add(this.caseclause());
      }
      else if(this.look.content() == 'default') {
        node.add(this.dftclause());
      }
      else {
        this.error('invalid switch statement');
      }
    }
    node.add(this.match('}'));
    return node;
  },
  caseclause: function() {
    var node = new Node(Node.CASECLAUSE);
    node.add(
      this.match('case'),
      this.expr(),
      this.match(':')
    );
    while(this.look
      && this.look.content() != 'case'
      && this.look.content() != 'default'
      && this.look.content() != '}') {
      node.add(this.stmt());
    }
    return node;
  },
  dftclause: function() {
    var node = new Node(Node.DFTCLAUSE);
    node.add(
      this.match('default'),
      this.match(':')
    );
    while(this.look && this.look.content() != '}') {
      node.add(this.stmt());
    }
    return node;
  },
  labstmt: function() {
    var node = new Node(Node.LABSTMT);
    if(this.look.content() == 'yield') {
      node.add(this.match());
    }
    else {
      node.add(this.match(Token.ID));
    }
    node.add(
      this.match(':'),
      this.stmt()
    );
    return node;
  },
  thrstmt: function() {
    var node = new Node(Node.THRSTMT);
    node.add(
      this.match('throw', true),
      this.expr(),
      this.match(';')
    );
    return node;
  },
  trystmt: function() {
    var node = new Node(Node.TRYSTMT);
    node.add(
      this.match('try'),
      this.block('missing { before try block')
    );
    if(this.look && this.look.content() == 'catch') {
      node.add(this.cach());
      if(this.look && this.look.content() == 'finally') {
        node.add(this.finl());
      }
    }
    else {
      node.add(this.finl());
    }
    return node;
  },
  debstmt: function() {
    var node = new Node(Node.DEBSTMT);
    node.add(this.match('debugger'), this.match(';'));
    return node;
  },
  cach: function() {
    var node = new Node(Node.CACH);
    node.add(
      this.match('catch', 'missing catch or finally after try'),
      this.match('(', 'missing ( before catch'),
      this.cachparam(),
      this.match(')', 'missing ) after catch'),
      this.block('missing { before catch block')
    );
    return node;
  },
  cachparam: function() {
    var node = new Node(Node.CACHPARAM);
    if(['[', '{'].indexOf(this.look.content()) > -1) {
      node.add(this.bindpat());
    }
    else {
      node.add(this.bindid('missing identifier in catch'));
    }
    return node;
  },
  finl: function() {
    var node = new Node(Node.FINL);
    node.add(
      this.match('finally'),
      this.block('missing { before finally block')
    );
    return node;
  },
  superstmt: function() {
    var node = new Node(Node.SUPERSTMT);
    node.add(this.match('super'));
    if(!this.look) {
      this.error();
    }
    if(this.look.content() == '.') {
      while(this.look && this.look.content() == '.') {
        node.add(this.match());
        if(!this.look) {
          this.error();
        }
        if(this.look.content() == 'super') {
          node.add(this.match());
        }
        else {
          break;
        }
      }
      if(this.look.content() != '(') {
        node.add(this.match(Token.ID));
        while(this.look && this.look.content() == '.') {
          node.add(this.match(), this.match(Token.ID));
        }
      }
    }
    node.add(
      this.args(),
      this.match(';')
    );
    return node;
  },
  imptstmt: function() {
    var node = new Node(Node.IMPTSTMT);
    return node;
  },
  fndecl: function() {
    var node = new Node(Node.FNDECL);
    node.add(
      this.match('function'),
      this.bindid('function statement requires a name'),
      this.match('(', 'missing ( before formal parameters'),
      this.fmparams(),
      this.match(')', 'missing ) after formal parameters'),
      this.match('{'),
      this.fnbody(),
      this.match('}', 'missing } after function body')
    );
    return node;
  },
  fnexpr: function() {
    var node = new Node(Node.FNEXPR);
    node.add(
      this.match('function')
    );
    if(!this.look) {
      this.error('missing formal parameter');
    }
    if(this.look.type() == Token.ID) {
      node.add(this.bindid());
    }
    node.add(
      this.match('(', 'missing ( before formal parameters'),
      this.fmparams(),
      this.match(')', 'missing ) after formal parameters'),
      this.match('{'),
      this.fnbody(),
      this.match('}', 'missing } after function body')
    );
    return node;
  },
  genexpr: function() {
    var node = new Node(Node.GENEXPR);
    node.add(
      this.match('function'),
      this.match('*')
    );
    if(!this.look) {
      this.error('missing formal parameter');
    }
    if(this.look.type() == Token.ID) {
      node.add(this.bindid());
    }
    node.add(
      this.match('(', 'missing ( before formal parameters'),
      this.fmparams(),
      this.match(')', 'missing ) after formal parameters'),
      this.match('{'),
      this.fnbody(),
      this.match('}', 'missing } after function body')
    );
    return node;
  },
  sfnparams: function() {
    return this.fmparams();
  },
  fmparams: function() {
    var node = new Node(Node.FMPARAMS);
    if(!this.look) {
      this.error('missing formal parameter');
    }
    while(this.look && this.look.content() != ')') {
      if(this.look.content() == '...') {
        break;
      }
      else {
        node.add(this.bindelem());
        if(this.look && this.look.content() == ',') {
          node.add(this.match());
        }
      }
    }
    if(!this.look) {
      this.error('missing ) after formal parameters');
    }
    if(this.look.content() == '...') {
      node.add(this.bindrest());
    }
    return node;
  },
  fnbody: function() {
    var node = new Node(Node.FNBODY);
    while(this.look && this.look.content() != '}') {
      node.add(this.stmtlitem());
    }
    return node;
  },
  classdecl: function() {
    var node = new Node(Node.CLASSDECL);
    node.add(
      this.match('class'),
      this.bindid()
    );
    if(!this.look) {
      this.error();
    }
    if(this.look.content() == 'extends') {
      node.add(this.heratige());
    }
    node.add(
      this.match('{'),
      this.classbody(),
      this.match('}')
    );
    return node;
  },
  classexpr: function() {
    var node = new Node(Node.CLASSEXPR);
    node.add(this.match('class'));
    if(!this.look) {
      this.error();
    }
    if(this.look.type() == Token.ID) {
      node.add(this.bindid());
    }
    if(!this.look) {
      this.error();
    }
    if(this.look.content() == 'extends') {
      node.add(this.heratige());
    }
    node.add(
      this.match('{'),
      this.classbody(),
      this.match('}')
    );
    return node;
  },
  heratige: function() {
    var node = new Node(Node.HERITAGE);
    node.add(
      this.match('extends'),
      this.leftexpr()
    );
    return node;
  },
  classbody: function() {
    var node = new Node(Node.CLASSBODY);
    while(this.look && this.look.content() != '}') {
      node.add(this.classelem());
    }
    return node;
  },
  classelem: function() {
    var node = new Node(Node.CLASSELEM);
    if(this.look.content() == ';') {
      node.add(this.match());
    }
    else if(this.look.content() == 'static') {
      node.add(
        this.match(),
        this.method()
      );
    }
    else {
      node.add(this.method());
    }
    return node;
  },
  method: function() {
    var node = new Node(Node.METHOD);
    if(this.look.content() == 'get') {
      node.add(
        this.match(),
        this.proptname(),
        this.match('('),
        this.match(')'),
        this.match('{'),
        this.fnbody(),
        this.match('}')
      );
    }
    else if(this.look.content() == 'set') {
      node.add(
        this.match(),
        this.proptname(),
        this.match('('),
        this.fmparams(),
        this.match(')'),
        this.match('{'),
        this.fnbody(),
        this.match('}')
      );
    }
    else if(this.look.content() == '*') {
      node.add(this.genmethod());
    }
    else {
      node.add(
        this.proptname(),
        this.match('('),
        this.fmparams(),
        this.match(')'),
        this.match('{'),
        this.fnbody(),
        this.match('}')
      );
    }
    return node;
  },
  genmethod: function() {
    var node = new Node(Node.GENMETHOD);
    node.add(
      this.match('*'),
      this.proptname(),
      this.match('('),
      this.fmparams(),
      this.match(')'),
      this.match('{'),
      this.fnbody(),
      this.match('}')
    );
    return node;
  },
  expr: function(noIn) {
    var node = new Node(Node.EXPR),
      assignexpr = this.assignexpr(noIn);
    //LL2区分,后的...是否为cpeapl
    if(this.look && this.look.content() == ',') {
      for(var i = this.index; i < this.length; i++) {
        var next = this.tokens[i];
        if(!S[next.type()]) {
          if(next.content() == '...') {
            return assignexpr;
          }
          break;
        }
      }
      node.add(assignexpr);
      outer:
      while(this.look && this.look.content() == ',') {
        for(var i = this.index; i < this.length; i++) {
          var next = this.tokens[i];
          if(!S[next.type()]) {
            if(next.content() == '...') {
              break outer;
            }
            break;
          }
        }
        node.add(this.match(), this.assignexpr(noIn));
      }
    }
    else {
      return assignexpr;
    }
    return node;
  },
  initlz: function(noIn) {
    var node = new Node(Node.INITLZ);
    node.add(
      this.match('='),
      this.assignexpr(noIn)
    );
    return node;
  },
  assignexpr: function(noIn) {
    var node = new Node(Node.ASSIGNEXPR);
    if(!this.look) {
      this.error();
    }
    if(this.look.content() == 'yield') {
      return this.yieldexpr();
    }
    var cndt = this.cndtexpr(noIn);
    if(this.look
      && this.look.content() == '=>'
      && cndt.name() == Node.PRMREXPR
      && cndt.size() == 1
      && (cndt.first().name() == Node.CPEAPL
        || (cndt.first().name() == Node.TOKEN
          && cndt.first().token().type() == Token.ID))) {
      node = new Node(Node.ARROWFN);
      var arrowparams = new Node(Node.ARROWPARAMS);
      arrowparams.add(cndt.first());
      node.add(
        arrowparams,
        this.match(),
        this.cncsbody()
      );
    }
    else if(this.look
      && {
        '*=': true,
        '/=': true,
        '%=': true,
        '+=': true,
        '-=': true,
        '<<=': true,
        '>>=': true,
        '>>>=': true,
        '&=': true,
        '^=': true,
        '|=': true,
        '=': true
      }.hasOwnProperty(this.look.content())
      && !NOASSIGN.hasOwnProperty(cndt.name())) {
      node.add(cndt, this.match(), this.assignexpr(noIn));
    }
    else {
      return cndt;
    }
    return node;
  },
  yieldexpr: function() {
    var node = new Node(Node.YIELDEXPR);
    node.add(this.match('yield'));
    if(this.look) {
      if(this.look.content() == '*') {
        node.add(
          this.match(),
          this.assignexpr()
        );
      }
      else if([';', '}', '...', ':', '?', ',', '=>'].indexOf(this.look.content()) == -1
        && this.look.type() != Token.KEYWORD) {
        node.add(this.assignexpr());
      }
    }
    return node;
  },
  cpeapl: function() {
    var node = new Node(Node.CPEAPL);
    node.add(this.match('('));
    if(!this.look) {
      this.error();
    }
    if(this.look.content() == '...') {
      node.add(
        this.match(),
        this.bindid(),
        this.match(')')
      );
      return node;
    }
    if(this.look.content() != ')') {
      node.add(this.expr());
    }
    if(this.look.content() == ',') {
      node.add(
        this.match(),
        this.match('...'),
        this.bindid()
      );
    }
    node.add(this.match(')'));
    return node;
  },
  cncsbody: function() {
    var node = new Node(Node.CNCSBODY);
    if(!this.look) {
      this.error();
    }
    if(this.look.content() == '{') {
      node.add(
        this.match(),
        this.fnbody(),
        this.match('}')
      );
    }
    else {
      node.add(this.assignexpr());
    }
    return node;
  },
  cndtexpr: function(noIn) {
    var node = new Node(Node.CNDTEXPR),
      logorexpr = this.logorexpr(noIn);
    if(this.look && this.look.content() == '?') {
      node.add(
        logorexpr,
        this.match(),
        this.assignexpr(noIn),
        this.match(':'),
        this.assignexpr(noIn)
      );
    }
    else {
      return logorexpr;
    }
    return node;
  },
  logorexpr: function(noIn) {
    var node = new Node(Node.LOGOREXPR),
      logandexpr = this.logandexpr(noIn);
    if(this.look && this.look.content() == '||') {
      node.add(logandexpr);
      while(this.look && this.look.content() == '||') {
        node.add(
          this.match(),
          this.logandexpr(noIn)
        );
      }
    }
    else {
      return logandexpr;
    }
    return node;
  },
  logandexpr: function(noIn) {
    var node = new Node(Node.LOGANDEXPR),
      bitorexpr = this.bitorexpr(noIn);
    if(this.look && this.look.content() == '&&') {
      node.add(bitorexpr);
      while(this.look && this.look.content() == '&&') {
        node.add(
          this.match(),
          this.bitorexpr(noIn)
        );
      }
    }
    else {
      return bitorexpr;
    }
    return node;
  },
  bitorexpr: function(noIn) {
    var node = new Node(Node.BITOREXPR),
      bitxorexpr = this.bitxorexpr(noIn);
    if(this.look && this.look.content() == '|') {
      node.add(bitxorexpr);
      while(this.look && this.look.content() == '|') {
        node.add(
          this.match(),
          this.bitxorexpr(noIn)
        );
      }
    }
    else {
      return bitxorexpr;
    }
    return node;
  },
  bitxorexpr: function(noIn) {
    var node = new Node(Node.BITXOREXPR),
      bitandexpr = this.bitandexpr(noIn);
    if(this.look && this.look.content() == '^') {
      node.add(bitandexpr);
      while(this.look && this.look.content() == '^') {
        node.add(
          this.match(),
          this.bitandexpr(noIn)
        );
      }
    }
    else {
      return bitandexpr;
    }
    return node;
  },
  bitandexpr: function(noIn) {
    var node = new Node(Node.BITANDEXPR),
      eqexpr = this.eqexpr(noIn);
    if(this.look && this.look.content() == '&') {
      node.add(eqexpr);
      while(this.look && this.look.content() == '&') {
        node.add(
          this.match(),
          this.eqexpr(noIn)
        );
      }
    }
    else {
      return eqexpr;
    }
    return node;
  },
  eqexpr: function(noIn) {
    var node = new Node(Node.EQEXPR),
      reltexpr = this.reltexpr(noIn);
    if(this.look && {
      '==': true,
      '===': true,
      '!==': true,
      '!=': true
    }.hasOwnProperty(this.look.content())) {
      node.add(reltexpr);
      while(this.look && {
        '==': true,
        '===': true,
        '!==': true,
        '!=': true
      }.hasOwnProperty(this.look.content())) {
        node.add(
          this.match(),
          this.reltexpr(noIn)
        );
      }
    }
    else {
      return reltexpr;
    }
    return node;
  },
  reltexpr: function(noIn) {
    var node = new Node(Node.RELTEXPR),
      shiftexpr = this.shiftexpr();
    if(this.look && ({
      '<': true,
      '>': true,
      '>=': true,
      '<=': true,
      'instanceof': true
    }.hasOwnProperty(this.look.content()) || (!noIn && this.look.content() == 'in'))) {
      node.add(shiftexpr);
      while(this.look && ({
        '<': true,
        '>': true,
        '>=': true,
        '<=': true,
        'instanceof': true
      }.hasOwnProperty(this.look.content()) || (!noIn && this.look.content() == 'in'))) {
        node.add(
          this.match(),
          this.shiftexpr()
        );
      }
    }
    else {
      return shiftexpr;
    }
    return node;
  },
  shiftexpr: function() {
    var node = new Node(Node.SHIFTEXPR),
      addexpr = this.addexpr();
    if(this.look && ['<<', '>>', '>>>'].indexOf(this.look.content()) != -1) {
      node.add(addexpr);
      while(this.look && ['<<', '>>', '>>>'].indexOf(this.look.content()) != -1) {
        node.add(
          this.match(),
          this.addexpr()
        );
      }
    }
    else {
      return addexpr;
    }
    return node;
  },
  addexpr: function() {
    var node = new Node(Node.ADDEXPR),
      mtplexpr = this.mtplexpr();
    if(this.look && ['+', '-'].indexOf(this.look.content()) != -1) {
      node.add(mtplexpr);
      while(this.look && ['+', '-'].indexOf(this.look.content()) != -1) {
        node.add(
          this.match(),
          this.mtplexpr()
        );
      }
    }
    else {
      return mtplexpr;
    }
    return node;
  },
  mtplexpr: function() {
    var node = new Node(Node.MTPLEXPR),
      unaryexpr = this.unaryexpr();
    if(this.look && ['*', '/', '%'].indexOf(this.look.content()) != -1) {
      node.add(unaryexpr);
      while(this.look && ['*', '/', '%'].indexOf(this.look.content()) != -1) {
        node.add(
          this.match(),
          this.unaryexpr()
        );
      }
    }
    else {
      return unaryexpr;
    }
    return node;
  },
  unaryexpr: function() {
    var node = new Node(Node.UNARYEXPR);
    if(!this.look) {
      this.error();
    }
    switch(this.look.content()) {
      case '++':
      case '--':
        node.add(
          this.match(),
          this.leftexpr()
        );
        break;
      case 'delete':
      case 'void':
      case 'typeof':
      case '+':
      case '-':
      case '~':
      case '!':
        node.add(
          this.match(),
          this.unaryexpr()
        );
      break;
      default:
        return this.postfixexpr();
    }
    return node;
  },
  postfixexpr: function() {
    var node = new Node(Node.POSTFIXEXPR);
    var leftexpr = this.leftexpr();
    if(this.look && ['++', '--'].indexOf(this.look.content()) > -1 && !this.hasMoveLine) {
      node.add(
        leftexpr,
        this.match(undefined, true)
      );
    }
    else {
      return leftexpr;
    }
    return node;
  },
  leftexpr: function() {
    if(this.look.content() == 'new') {
      return this.newexpr();
    }
    else {
      return this.callexpr();
    }
  },
  newexpr: function(depth) {
    depth = depth || 0;
    var node = new Node(Node.NEWEXPR);
    node.add(this.match('new'));
    if(!this.look) {
      this.error();
    }
    if(this.look.content() == 'new') {
      node.add(this.newexpr(depth + 1));
    }
    //LL2分辨super后是否为.[至mmbexpr
    else if(this.look.content() == 'super') {
      var end = false;
      for(var i = this.index; i < this.length; i++) {
        var next = this.tokens[i];
        if(!S[next.type()]) {
          if(['.', '['].indexOf(next.content()) > -1) {
            node.add(this.mmbexpr());
          }
          else {
            node.add(this.match());
          }
          end = true;
          break;
        }
      }
      if(!end) {
        node.add(this.match());
      }
    }
    else {
      node.add(this.mmbexpr());
    }
    if(this.look && this.look.content() == '(') {
      node.add(this.args());
    }
    if(this.look && ['.', '['].indexOf(this.look.content()) > -1) {
      var mmb = new Node(Node.MMBEXPR);
      mmb.add(node);
      while(this.look) {
        if(this.look.content() == '.') {
          mmb.add(
            this.match(),
            this.match(Token.ID, 'missing name after . operator')
          );
        }
        else if(this.look.content() == '[') {
          mmb.add(
            this.match(),
            this.expr(),
            this.match(']')
          );
        }
        else {
          break;
        }
      }
      if(depth == 0 && this.look && this.look.content() == '(') {
        var callexpr = this.callexpr(mmb);
        return callexpr;
      }
      return mmb;
    }
    return node;
  },
  callexpr: function(mmb) {
    var node = new Node(Node.CALLEXPR);
    if(!mmb) {
      //根据LL2分辨是super()还是mmbexpr
      if(this.look.content() == 'super') {
        for(var i = this.index; i < this.length; i++) {
          var next = this.tokens[i];
          if(!S[next.type()]) {
            if(next.content() == '(') {
              node.add(
                this.match(),
                this.args()
              );
              mmb = node;
              node = new Node(Node.CALLEXPR);
            }
            else {
              mmb = this.mmbexpr();
            }
            break;
          }
        }
      }
      else {
        mmb = this.mmbexpr();
      }
    }
    if(this.look && this.look.content() == '(') {
      node.add(
        mmb,
        this.args()
      );
      while(this.look) {
        var temp;
        if(this.look.content() == '.') {
          temp = new Node(Node.MMBEXPR);
          temp.add(
            node,
            this.match(),
            this.match(Token.ID, 'missing name after . operator')
          );
          node = temp;
        }
        else if(this.look.content() == '[') {
          temp = new Node(Node.MMBEXPR);
          temp.add(
            node,
            this.match(),
            this.expr(),
            this.match(']')
          );
          node = temp;
        }
        else if(this.look.content() == '(') {
          temp = new Node(Node.CALLEXPR);
          temp.add(
            node,
            this.args()
          );
          node = temp;
        }
        else if(this.look.type() == Token.TEMPLATE) {
          temp = new Node(Node.CALLEXPR);
          temp.add(
            node,
            this.match()
          );
          node = temp;
        }
        else {
          break;
        }
      }
    }
    else {
      return mmb;
    }
    return node;
  },
  mmbexpr: function() {
    var node = new Node(Node.MMBEXPR);
    var mmb;
    if(this.look.content() == 'super') {
      mmb = this.match();
      if(!this.look || ['.', '['].indexOf(this.look.content()) == -1) {
        this.error();
      }
    }
    else {
      mmb = this.prmrexpr();
    }
    if(this.look
      && (['.', '['].indexOf(this.look.content()) > -1
        || this.look.type() == Token.TEMPLATE)) {
      node.add(mmb);
      if(this.look.content() == '.') {
        node.add(
          this.match(),
          this.match(Token.ID, 'missing name after . operator')
        )
      }
      else if(this.look.content() == '[') {
        node.add(
          this.match(),
          this.expr(),
          this.match(']')
        );
      }
      else {
        node.add(this.match());
      }
      while(this.look) {
        var temp
        if(this.look.content() == '.') {
          temp = new Node(Node.MMBEXPR);
          temp.add(
            node,
            this.match(),
            this.match(Token.ID, 'missing name after . operator')
          );
          node = temp;
        }
        else if(this.look.content() == '[') {
          temp = new Node(Node.MMBEXPR);
          temp.add(
            node,
            this.match(),
            this.expr(),
            this.match(']')
          );
          node = temp;
        }
        else if(this.look.type() == Token.TEMPLATE) {
          temp = new Node(Node.MMBEXPR);
          temp.add(
            node,
            this.match()
          );
          node = temp;
        }
        else {
          break;
        }
      }
    }
    else {
      return mmb;
    }
    return node;
  },
  prmrexpr: function() {
    var node = new Node(Node.PRMREXPR);
    switch(this.look.type()) {
      case Token.ID:
      case Token.NUMBER:
      case Token.STRING:
      case Token.REG:
      case Token.TEMPLATE:
        node.add(this.match());
      break;
      default:
        switch(this.look.content()) {
          //LL2是否为*区分fnexpr和genexpr
          case 'function':
            for(var i = this.index; i < this.length; i++) {
              var next = this.tokens[i];
              if(!S[next.type()]) {
                if(next.content() == '*') {
                  node.add(this.genexpr());
                }
                else {
                  node.add(this.fnexpr());
                }
                break;
              }
            }
          break;
          case 'class':
            node.add(this.classexpr());
          break;
          case 'this':
          case 'null':
          case 'true':
          case 'false':
            node.add(this.match());
          break;
          //LL2区分for是否为gencmph
          case '(':
            for(var i = this.index; i < this.length; i++) {
              var next = this.tokens[i];
              if(!S[next.type()]) {
                if(next.content() == 'for') {
                  node.add(this.gencmph());
                }
                else {
                  node.add(this.cpeapl());
                }
                break;
              }
            }
          break;
          case '[':
            node.add(this.arrinit());
          break;
          case '{':
            node.add(this.objltr());
          break;
          default:
            this.error();
        }
    }
    return node;
  },
  arrinit: function() {
    //根据LL2分辨是arrltr还是arrcmph
    //[assignexpr or [for
    for(var i = this.index; i < this.length; i++) {
      var next = this.tokens[i];
      if(!S[next.type()]) {
        if(next.content() == 'for') {
          return this.arrcmph();
        }
        else {
          return this.arrltr();
        }
      }
    }
    this.error();
  },
  gencmph: function() {
    var node = new Node(Node.GENCMPH);
    node.add(
      this.match('('),
      this.cmph(),
      this.match(')')
    );
    return node;
  },
  arrcmph: function() {
    var node = new Node(Node.ARRCMPH);
    node.add(
      this.match('['),
      this.cmph(),
      this.match(']', 'missing ] after element list')
    );
    return node;
  },
  cmph: function() {
    var node = new Node(Node.CMPH);
    node.add(this.cmphfor());
    while(this.look && this.look.content() != ']') {
      if(this.look.content() == 'for') {
        node.add(this.cmphfor());
      }
      else if(this.look.content() == 'if') {
        node.add(this.cmphif());
      }
      else {
        node.add(this.assignexpr());
        break;
      }
    }
    return node;
  },
  cmphfor: function() {
    var node = new Node(Node.CMPHFOR);
    node.add(
      this.match('for'),
      this.match('('),
      this.forbind(),
      this.match('of'),
      this.assignexpr(),
      this.match(')')
    );
    return node;
  },
  forbind: function() {
    if(!this.look) {
      this.error();
    }
    if(['[', '{'].indexOf(this.look.content()) > -1) {
      return this.bindpat();
    }
    else {
      return this.bindid();
    }
  },
  cmphif: function() {
    var node = new Node(Node.CMPHIF);
    node.add(
      this.match('if'),
      this.match('('),
      this.assignexpr(),
      this.match(')')
    );
    return node;
  },
  arrltr: function() {
    var node = new Node(Node.ARRLTR);
    node.add(this.match('['));
    while(this.look && this.look.content() != ']' && this.look.content() != '...') {
      if(this.look.content() == ',') {
        node.add(this.match());
      }
      else {
        node.add(this.assignexpr());
        if(this.look && this.look.content() == ',') {
          node.add(this.match());
        }
      }
    }
    if(this.look.content() == '...') {
      node.add(this.spread());
    }
    node.add(this.match(']', 'missing ] after element list'));
    return node;
  },
  spread: function() {
    var node = new Node(Node.SPREAD);
    node.add(this.match('...'), this.assignexpr());
    return node;
  },
  objltr: function() {
    var node = new Node(Node.OBJLTR);
    node.add(this.match('{'));
    while(this.look && this.look.content() != '}') {
      node.add(this.proptassign());
      if(this.look && this.look.content() == ',') {
        node.add(this.match());
      }
    }
    node.add(this.match('}', 'missing } after property list'));
    return node;
  },
  proptassign: function() {
    var node = new Node(Node.PROPTASSIGN);
    if(!this.look) {
      this.error();
    }
    if(this.look.content() == 'get') {
      node.add(this.match());
      if(!this.look) {
        this.error();
      }
      if(this.look.content() == ':') {
        node.add(this.match(), this.assignexpr());
      }
      else {
        node.add(this.getfn());
      }
    }
    else if(this.look.content() == 'set') {
      node.add(this.match());
      if(!this.look) {
        this.error();
      }
      if(this.look.content() == ':') {
        node.add(this.match(), this.assignexpr());
      }
      else {
        node.add(this.setfn());
      }
    }
    else {
      switch(this.look.type()) {
        case Token.ID:
        case Token.STRING:
        case Token.NUMBER:
          node.add(
            this.match(),
            this.match(':', 'missing : after property id'),
            this.assignexpr()
          );
        break;
        default:
          this.error('invalid property id');
      }
    }
    return node;
  },
  getfn: function() {
    var node = new Node(Node.GETFN);
    node.add(
      this.proptname(),
      this.match('('),
      this.match(')'),
      this.match('{'),
      this.fnbody(),
      this.match('}')
    );
    return node;
  },
  setfn: function() {
    var node = new Node(Node.SETFN);
    node.add(
      this.proptname(),
      this.match('('),
      this.propsets(),
      this.match(')'),
      this.match('{'),
      this.fnbody(),
      this.match('}')
    );
    return node;
  },
  proptname: function() {
    var node = new Node(Node.PROPTNAME);
    if(!this.look) {
      this.error('invalid property id');
    }
    if(this.look.content() == '[') {
      node.add(this.cmptpropt());
    }
    else {
      node.add(this.ltrpropt());
    }
    return node;
  },
  ltrpropt: function() {
    var node = new Node(Node.LTRPROPT);
    switch(this.look.type()) {
      case Token.ID:
      case Token.NUMBER:
      case Token.STRING:
        node.add(this.match());
        return node;
      default:
        this.error('invalid property id');
    }
  },
  cmptpropt: function() {
    var node = new Node(Node.CMPTPROPT);
    node.add(
      this.match('['),
      this.assignexpr(),
      this.match(']')
    );
    return node;
  },
  propsets: function() {
    var node = new Node(Node.PROPTSETS);
    node.add(this.match(Token.ID, 'setter functions must have one argument'));
    return node;
  },
  args: function() {
    var node = new Node(Node.ARGS);
    node.add(this.match('('));
    if(!this.look) {
      this.error();
    }
    if(this.look.content() != ')') {
      node.add(this.arglist());
    }
    node.add(this.match(')'));
    return node;
  },
  arglist: function() {
    var node = new Node(Node.ARGLIST);
    if(this.look && this.look.content() == '...') {
      node.add(
        this.match(),
        this.assignexpr()
      );
    }
    else {
      while(this.look && this.look.content() != ')') {
        node.add(this.assignexpr());
        if(this.look && this.look.content() == ',') {
          node.add(this.match());
          if(this.look && this.look.content() == '...') {
            node.add(
              this.match(),
              this.assignexpr()
            );
            break;
          }
        }
      }
    }
    return node;
  },
  virtual: function(s) {
    return new Node(Node.TOKEN, new Token(Token.VIRTUAL, s));
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
  },
  ignore: function() {
    return this.ignores;
  }
});
module.exports = Parser;