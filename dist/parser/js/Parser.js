(function(factory) {
  if(typeof define === 'function' && (define.amd || define.cmd)) {
    define(factory);
  }
  else {
    factory(require, exports, module);
  }
})(function(require, exports, module) {
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
      this.tree = this.program();
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
    program: function() {
      this.tokens = this.lexer.tokens();
      this.length = this.tokens.length;
      if(this.tokens.length) {
        this.move();
      }
      var node = new Node(Node.PROGRAM);
      while(this.look) {
        node.add(this.element());
      }
      return node;
    },
    element: function() {
      if(this.look.content() == 'function') {
        return this.fndecl();
      }
      else {
        return this.stmt();
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
          return this.block();
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
      if(!this.look) {
        this.error('missing variable name');
      }
      node.add(this.match(Token.ID, 'missing variable name'));
      if(this.look && this.look.content() == '=') {
        node.add(this.assign());
      }
      return node;
    },
    assign: function() {
      var node = new Node(Node.ASSIGN);
      node.add(this.match('='));
      if(!this.look) {
        this.error();
      }
      node.add(this.assignexpr());
      return node;
    },
    block: function() {
      var node = new Node(Node.BLOCK);
      node.add(this.match('{'));
      while(this.look && this.look.content() != '}') {
        node.add(this.stmt());
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
          //当前是var/let/const的话，LL3确定是for(var vardecllist;或for(var vardecl in
          if(this.look.content() == 'var') {
            var node2 = this.varstmt(true);
            if(!this.look) {
              this.error('missing ; after for-loop initializer');
            }
            if(this.look.content() == 'in') {
              if(node2.size() > 2) {
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
            //for(EXPRnoin;) or for(leftexpr in
            var expr;
            if(this.look.content() != ';') {
              expr = this.expr(true);
              node.add(expr);
            }
            if(!this.look) {
              this.error('missing ;');
            }
            if(this.look.content() == 'in') {
              if(expr.name() == Node.MMBEXPR
                || expr.name() == Node.PRMREXPR
                || expr.name() == Node.NEWEXPR) {
                node.add(
                  this.match(),
                  this.expr()
                );
              }
              else {
                this.error('invalid for/in left-hand side');
              }
            }
            else {
              //for的;不能省略，强制判断
              node.add(this.match(';', 'missing ;'));
              if(!this.look) {
                this.error();
              }
              if(this.look.content() != ';') {
                node.add(this.expr());
              }
              node.add(this.match(';', 'missing ;'));
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
        this.match('with'),
        this.match('('),
        this.expr(),
        this.match(')'),
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
      node.add(
        this.match(Token.ID),
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
        this.block()
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
        this.match('catch'),
        this.match('('),
        this.match(Token.ID, 'missing identifier in catch'),
        this.match(')'),
        this.block()
      );
      return node;
    },
    finl: function() {
      var node = new Node(Node.FINL);
      node.add(
        this.match('finally'),
        this.block()
      );
      return node;
    },
    fndecl: function() {
      var node = new Node(Node.FNDECL);
      node.add(
        this.match('function'),
        this.match(Token.ID, 'function statement requires a name'),
        this.match('(')
      );
      if(!this.look) {
        this.error('missing formal parameter');
      }
      if(this.look.content() != ')') {
        node.add(this.fnparams());
      }
      node.add(
        this.match(')'),
        this.match('{'),
        this.fnbody(),
        this.match('}')
      );
      return node;
    },
    fnexpr: function(noIn) {
      var node = new Node(Node.FNEXPR);
      node.add(this.match('function'));
      if(!this.look) {
        this.error('missing formal parameter');
      }
      if(this.look.type() == Token.ID) {
        if(noIn && this.look.content() == 'in') {
          this.error();
        }
        node.add(this.match());
      }
      node.add(this.match('('));
      if(!this.look) {
        this.error();
      }
      if(this.look.content() != ')') {
        node.add(this.fnparams());
      }
      node.add(
        this.match(')'),
        this.match('{'),
        this.fnbody(),
        this.match('}', 'missing } in compound statement')
      );
      return node;
    },
    fnparams: function() {
      var node = new Node(Node.FNPARAMS);
      while(this.look && this.look.content() != ')') {
        node.add(this.match(Token.ID, 'missing formal parameter'));
        if(this.look && this.look.content() == ',') {
          node.add(this.match());
        }
      }
      return node;
    },
    fnbody: function() {
      var node = new Node(Node.FNBODY);
      while(this.look && this.look.content() != '}') {
        node.add(this.element());
      }
      return node;
    },
    expr: function(noIn) {
      var node = new Node(Node.EXPR),
        assignexpr = this.assignexpr(noIn);
      if(this.look && this.look.content() == ',') {
        node.add(assignexpr);
        while(this.look && this.look.content() == ',') {
          node.add(this.match(), this.assignexpr(noIn));
        }
      }
      else {
        return assignexpr;
      }
      return node;
    },
    assignexpr: function(noIn) {
      var node = new Node(Node.ASSIGNEXPR);
      var cndt = this.cndtexpr(noIn);
      if(this.look && {
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
      }.hasOwnProperty(this.look.content()) && !NOASSIGN.hasOwnProperty(cndt.name())) {
        node.add(cndt, this.match(), this.assignexpr(noIn));
      }
      else {
        return cndt;
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
        shiftexpr = this.shiftexpr(noIn);
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
            this.shiftexpr(noIn)
          );
        }
      }
      else {
        return shiftexpr;
      }
      return node;
    },
    shiftexpr: function(noIn) {
      var node = new Node(Node.SHIFTEXPR),
        addexpr = this.addexpr(noIn);
      if(this.look && ['<<', '>>', '>>>'].indexOf(this.look.content()) != -1) {
        node.add(addexpr);
        while(this.look && ['<<', '>>', '>>>'].indexOf(this.look.content()) != -1) {
          node.add(
            this.match(),
            this.addexpr(noIn)
          );
        }
      }
      else {
        return addexpr;
      }
      return node;
    },
    addexpr: function(noIn) {
      var node = new Node(Node.ADDEXPR),
        mtplexpr = this.mtplexpr(noIn);
      if(this.look && ['+', '-'].indexOf(this.look.content()) != -1) {
        node.add(mtplexpr);
        while(this.look && ['+', '-'].indexOf(this.look.content()) != -1) {
          node.add(
            this.match(),
            this.mtplexpr(noIn)
          );
        }
      }
      else {
        return mtplexpr;
      }
      return node;
    },
    mtplexpr: function(noIn) {
      var node = new Node(Node.MTPLEXPR),
        unaryexpr = this.unaryexpr(noIn);
      if(this.look && ['*', '/', '%'].indexOf(this.look.content()) != -1) {
        node.add(unaryexpr);
        while(this.look && ['*', '/', '%'].indexOf(this.look.content()) != -1) {
          node.add(
            this.match(),
            this.unaryexpr(noIn)
          );
        }
      }
      else {
        return unaryexpr;
      }
      return node;
    },
    unaryexpr: function(noIn) {
      var node = new Node(Node.UNARYEXPR);
      if(!this.look) {
        this.error();
      }
      switch(this.look.content()) {
        case '++':
        case '--':
          node.add(
            this.match(),
            this.leftexpr(noIn)
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
            this.unaryexpr(noIn)
          );
        break;
        default:
          return this.postfixexpr(noIn);
      }
      return node;
    },
    postfixexpr: function(noIn) {
      var node = new Node(Node.POSTFIXEXPR);
      var leftexpr = this.leftexpr(noIn);
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
    leftexpr: function(noIn) {
      if(this.look.content() == 'new') {
        return this.newexpr(0, noIn);
      }
      else {
        return this.callexpr(null, noIn);
      }
    },
    newexpr: function(depth, noIn) {
      depth = depth || 0;
      var node = new Node(Node.NEWEXPR);
      node.add(this.match('new'));
      if(!this.look) {
        this.error();
      }
      if(this.look.content() == 'new') {
        node.add(this.newexpr(depth + 1, noIn));
      }
      else {
        node.add(this.mmbexpr(noIn));
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
              this.expr(noIn),
              this.match(']')
            );
          }
          else {
            break;
          }
        }
        if(depth == 0 && this.look && this.look.content() == '(') {
          var callexpr = this.callexpr(mmb, noIn);
          return callexpr;
        }
        return mmb;
      }
      return node;
    },
    callexpr: function(mmb, noIn) {
      var node = new Node(Node.CALLEXPR);
      mmb = mmb || this.mmbexpr(noIn);
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
              this.expr(noIn),
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
    mmbexpr: function(noIn) {
      var node = new Node(Node.MMBEXPR);
      var mmb;
      if(this.look.content() == 'function') {
        mmb = this.fnexpr(noIn);
      }
      else {
        mmb = this.prmrexpr(noIn);
      }
      if(this.look && ['.', '['].indexOf(this.look.content()) > -1) {
        node.add(mmb);
        if(this.look.content() == '.') {
          node.add(
            this.match(),
            this.match(Token.ID, 'missing name after . operator')
          )
        }
        else {
          node.add(
            this.match(),
            this.expr(noIn),
            this.match(']')
          );
        }
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
              this.expr(noIn),
              this.match(']')
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
    prmrexpr: function(noIn) {
      var node = new Node(Node.PRMREXPR);
      switch(this.look.type()) {
        case Token.ID:
          if(noIn && this.look.content() == 'in') {
            this.error();
          }
        case Token.NUMBER:
        case Token.STRING:
        case Token.REG:
        case Token.TEMPLATE:
          node.add(this.match());
        break;
        default:
          switch(this.look.content()) {
            case 'this':
            case 'null':
            case 'true':
            case 'false':
              node.add(this.match());
            break;
            case '(':
              node.add(this.match(), this.expr(), this.match(')'));
            break;
            case '[':
              node.add(this.arrltr());
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
    arrltr: function() {
      var node = new Node(Node.ARRLTR);
      node.add(this.match('['));
      while(this.look && this.look.content() != ']') {
        if(this.look.content() == ',') {
          node.add(this.match());
        }
        else {
          node.add(this.assignexpr());
        }
      }
      node.add(this.match(']', 'missing ] after element list'));
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
      switch(this.look.type()) {
        case Token.ID:
          if(this.look.content() == 'get') {
            node.add(this.match());
            if(!this.look) {
              this.error('missing : after property id');
            }
            if(this.look.type() == Token.ID) {
              node.add(
                this.match(),
                this.match('(', 'missing ( before formal parameters'),
                this.match(')', 'missing ) after formal parameters'),
                this.match('{'),
                this.fnbody(),
                this.match('}', 'missing } after function body')
              );
            }
            else {
              node.add(
                this.match(':', 'missing : after property id'),
                this.assignexpr()
              );
            }
            break;
          }
          else if(this.look.content() == 'set') {
            node.add(this.match());
            if(!this.look) {
              this.error('missing : after property id');
            }
            if(this.look.type() == Token.ID) {
              node.add(
                this.match(),
                this.match('(', 'missing ( before formal parameters'),
                this.match(Token.ID, 'setter functions must have one argument'),
                this.match(')', 'missing ) after formal parameters'),
                this.match('{'),
                this.fnbody(),
                this.match('}', 'missing } after function body')
              );
            }
            else {
              node.add(
                this.match(':', 'missing : after property id'),
                this.assignexpr()
              );
            }
            break;
          }
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
      while(this.look && this.look.content() != ')') {
        node.add(this.assignexpr());
        if(this.look && this.look.content() == ',') {
          node.add(this.match());
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
});