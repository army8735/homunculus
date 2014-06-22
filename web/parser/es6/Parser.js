define(function(require, exports, module) {
  var IParser = require('../Parser');
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
  var Parser = IParser.extend(function(lexer) {
    IParser.call(this, lexer);
    this.init(lexer);
    return this;
  }).methods({
    parse: function(code) {
      this.lexer.parse(code);
      this.tree = this.script();
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
      this.module = false;
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
        node.add(this.modulebody());
        //未出现module,import,export时，此script不是一个模块
        if(!this.module) {
          node.leaf(0).name(Node.SCRIPTBODY);
        }
      }
      return node;
    },
    modulebody: function() {
      var node = new Node(Node.MODULEBODY);
      while(this.look) {
        node.add(this.moduleitem());
      }
      return node;
    },
    moduleitem: function() {
      if(this.look.content() == 'module') {
        this.module = true;
        return this.moduleimport();
      }
      else if(this.look.content() == 'import') {
        this.module = true;
        return this.importdecl();
      }
      else if(this.look.content() == 'export') {
        this.module = true;
        return this.exportdecl();
      }
      else {
        return this.stmtlitem();
      }
    },
    importdecl: function() {
      var node = new Node(Node.IMPORTDECL);
      node.add(this.match('import'));
      if(!this.look) {
        this.error();
      }
      if(this.look.type() == Token.STRING) {
        node.add(
          this.match()
        );
      }
      else {
        node.add(
          this.importcaulse(),
          this.fromcaulse()
        );
      }
      node.add(this.match(';'));
      return node;
    },
    moduleimport: function() {
      var node = new Node(Node.MODULEIMPORT);
      node.add(
        this.match('module', true),
        this.bindid(),
        this.fromcaulse(),
        this.match(';')
      );
      return node;
    },
    fromcaulse: function() {
      var node = new Node(Node.FROMCAULSE);
      node.add(
        this.match('from'),
        this.match(Token.STRING)
      );
      return node;
    },
    importcaulse: function() {
      var node = new Node(Node.IMPORTCAULSE);
      while(this.look) {
        if(this.look.type() == Token.ID) {
          node.add(this.match());
          if(this.look && this.look.content() == ',') {
            node.add(this.match());
          }
          else {
            break;
          }
        }
        else if(this.look.content() == '{') {
          node.add(this.nameimport());
          break;
        }
        else {
          break;
        }
      }
      return node;
    },
    nameimport: function() {
      var node = new Node(Node.NAMEIMPORT);
      node.add(this.match('{'));
      while(this.look && this.look.content() != '}') {
        node.add(this.importspec());
        if(this.look && this.look.content() == ',') {
          node.add(this.match());
        }
      }
      node.add(this.match('}'));
      return node;
    },
    importspec: function() {
      var node = new Node(Node.IMPORTSPEC);
      if(!this.look || this.look.type() != Token.ID) {
        this.error();
      }
      //LL2确定是否有as
      for(var i = this.index; i < this.length; i++) {
        var token = this.tokens[i];
        if(!S[token.type()]) {
          if(token.content() == 'as') {
            node.add(
              this.match(),
              this.match(),
              this.bindid()
            );
            return node;
          }
          else {
            break;
          }
        }
      }
      node.add(this.idref());
      return node;
    },
    exportdecl: function() {
      var node = new Node(Node.EXPORTDECL);
      node.add(this.match('export'));
      if(!this.look) {
        this.error();
      }
      if(this.look.content() == '*') {
        node.add(
          this.match(),
          this.fromcaulse(),
          this.match(';')
        );
      }
      else if(this.look.content() == '{') {
        node.add(this.exportcaulse());
        if(this.look && this.look.content() == 'from') {
          node.add(this.fromcaulse());
        }
        node.add(this.match(';'));
      }
      else if(this.look.content() == 'default') {
        node.add(
          this.match(),
          this.assignexpr(),
          this.match(';')
        );
      }
      else if(this.look.content() == 'var') {
        node.add(this.varstmt());
      }
      else {
        node.add(this.decl());
      }
      return node;
    },
    exportcaulse: function() {
      var node = new Node(Node.EXPORTCAULSE);
      while(this.look && this.look.content() != '}') {
        node.add(this.match('{'));
        node.add(this.exportspec());
        if(this.look && this.look.content() == ',') {
          node.add(this.match());
        }
      }
      node.add(this.match('}'));
      return node;
    },
    exportspec: function() {
      var node = new Node(Node.EXPORTSPEC);
      node.add(this.idref());
      if(this.look && this.look.content() == 'as') {
        node.add(
          this.match('as'),
          this.match(Token.ID)
        );
      }
      return node;
    },
    stmtlitem: function(yYield) {
      if(['function', 'class', 'let', 'const'].indexOf(this.look.content()) > -1) {
        return this.decl(yYield);
      }
      else {
        return this.stmt(yYield);
      }
    },
    decl: function(yYield) {
      if(!this.look) {
        this.error();
      }
      switch(this.look.content()) {
        case 'let':
        case 'const':
          return this.lexdecl(yYield);
        case 'function':
          for(var i = this.index; i < this.length; i++) {
            var token = this.tokens[i];
            if(!S[token.type()]) {
              if(token.content() == '*') {
                return this.gendecl();
              }
              else {
                return this.fndecl();
              }
            }
          }
          return this.fndecl();
        case 'class':
          return this.classdecl();
        default:
          this.error();
      }
    },
    stmt: function(yYield) {
      if(!this.look) {
        this.error();
      }
      switch(this.look.content()) {
        case 'var':
          return this.varstmt(null, yYield);
        case '{':
          return this.blockstmt(yYield);
        case ';':
          return this.emptstmt();
        case 'if':
          return this.ifstmt(yYield);
        case 'do':
        case 'while':
        case 'for':
          return this.iterstmt(yYield);
        case 'continue':
          return this.cntnstmt();
        case 'break':
          return this.brkstmt();
        case 'return':
          return this.retstmt();
        case 'with':
          return this.withstmt(yYield);
        case 'switch':
          return this.swchstmt(yYield);
        case 'throw':
          return this.thrstmt(yYield);
        case 'try':
          return this.trystmt(yYield);
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
                  return this.exprstmt(yYield);
                }
              }
            }
          }
          return this.exprstmt(yYield);
      }
    },
    exprstmt: function(yYield) {
      var node = new Node(Node.EXPRSTMT);
      node.add(this.expr(null, null, yYield), this.match(';'));
      return node;
    },
    lexdecl: function(yYield) {
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
      node.add(this.lexbind(yYield));
      while(this.look && this.look.content() == ',') {
        node.add(
          this.match(),
          this.lexbind(yYield)
        );
      }
      node.add(this.match(';'));
      return node;
    },
    lexbind: function(yYield) {
      var node = new Node(Node.LEXBIND);
      this.declnode(node, yYield);
      return node;
    },
    declnode: function(node, yYield) {
      if(!this.look) {
        this.error('missing variable name');
      }
      if(['[', '{'].indexOf(this.look.content()) > -1) {
        node.add(this.bindpat());
        if(!this.look || this.look.content() != '=') {
          this.error('missing = in destructuring declaration');
        }
        node.add(this.initlz(null, null, yYield));
      }
      else {
        node.add(this.bindid('missing variable name'));
        if(this.look && this.look.content() == '=') {
          node.add(this.initlz(null, null, yYield));
        }
      }
    },
    varstmt: function(noSem, yYield) {
      var node = new Node(Node.VARSTMT);
      node.add(
        this.match('var'),
        this.vardecl(yYield)
      );
      while(this.look && this.look.content() == ',') {
        node.add(
          this.match(),
          this.vardecl(yYield)
        );
      }
      if(!noSem) {
        node.add(this.match(';'));
      }
      return node;
    },
    vardecl: function(yYield) {
      var node = new Node(Node.VARDECL);
      this.declnode(node, yYield);
      return node;
    },
    bindid: function(msg, noIn, noOf, canKw) {
      var node = new Node(Node.BINDID);
      if(!this.look) {
        this.error(msg);
      }
      if(noIn && this.look.content() == 'in') {
        this.error();
      }
      if(noOf && this.look.content() == 'of') {
        this.error();
      }
      if(canKw && this.look.type() == Token.KEYWORD) {
        node.add(this.match(undefined, msg));
      }
      else {
        node.add(this.match(Token.ID, msg));
      }
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
      if(this.look && this.look.content() == '...') {
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
    singlename: function(canKw) {
      var node = new Node(Node.SINGLENAME);
      node.add(this.bindid(null, null, null, canKw));
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
        case Token.KEYWORD:
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
            node.add(this.singlename(true));
          }
          return node;
        }
      }
      this.error('missing : after property id');
    },
    blockstmt: function(yYield) {
      var node = new Node(Node.BLOCKSTMT);
      node.add(this.block(null, yYield));
      return node;
    },
    block: function(msg, yYield) {
      var node = new Node(Node.BLOCK);
      node.add(this.match('{', msg));
      while(this.look && this.look.content() != '}') {
        node.add(this.stmtlitem(yYield));
      }
      node.add(this.match('}', 'missing } in compound statement'));
      return node;
    },
    emptstmt: function() {
      var node = new Node(Node.EMPTSTMT);
      node.add(this.match(';'));
      return node;
    },
    ifstmt: function(yYield) {
      var node = new Node(Node.IFSTMT);
      node.add(
        this.match('if'),
        this.match('('),
        this.expr(),
        this.match(')'),
        this.stmt(yYield)
      );
      if(this.look && this.look.content() == 'else') {
        node.add(
          this.match('else'),
          this.stmt(yYield)
        );
      }
      return node;
    },
    iterstmt: function(yYield) {
      var node = new Node(Node.ITERSTMT);
      switch(this.look.content()) {
        case 'do':
          node.add(
            this.match(),
            this.stmt(yYield),
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
            this.stmt(yYield)
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
          //当前是var的话，LL2确定是for(var forbind;或for(var vardecllist
          if(this.look.content() == 'var') {
            var end = false;
            outer:
            for(var i = this.index; i < this.length; i++) {
              var token = this.tokens[i];
              if(!S[token.type()]) {
                //直接指向forbind
                if(['{', ']'].indexOf(token.content()) > -1) {
                  node.add(
                    this.match(),
                    this.forbind()
                  );
                }
                //仅一个id之后跟着of或in就是forbind
                else if(token.type() == Token.ID) {
                  var end2 = false;
                  for(var j = i + 1; j < this.length; j++) {
                    var next = this.tokens[j];
                    if(!S[token.type()]) {
                      if(['in', 'of'].indexOf(next.content()) > -1) {
                        node.add(
                          this.match(),
                          this.forbind()
                        );
                      }
                      else {
                        node.add(this.varstmt(true));
                      }
                      end = end2 = true;
                      break outer;
                    }
                  }
                }
                else {
                  this.error();
                }
                end = true;
                break;
              }
            }
            if(!end || !this.look) {
              this.error('missing ; after for-loop initializer');
            }
            //in/of前只能是一个vardecl，不能出现vardecllist
            if(['in', 'of'].indexOf(this.look.content()) > -1) {
              if(node.leaf(2).name() == Node.VARSTMT && node.leaf(2).size() > 2) {
                this.error('invalid for/in left-hand side');
              }
              var isOf = this.look.content() == 'of';
              node.add(
                this.match(),
                isOf ? this.assignexpr() : this.expr()
              );
            }
            else {
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
          else if(['let', 'const'].indexOf(this.look.content()) > -1) {
            node.add(
              this.match(),
              this.forbind()
            );
            if(!this.look || ['in', 'of'].indexOf(this.look.content()) == -1) {
              this.error();
            }
            var isOf = this.look.content() == 'of';
            node.add(
              this.match(),
              isOf ? this.assignexpr() : this.expr()
            );
          }
          else {
            if(['in', 'of'].indexOf(this.look.content()) > -1) {
              this.error();
            }
            //for(EXPRnoin;) or for(leftexpr in
            var expr;
            if(this.look.content() != ';') {
              expr = this.expr(true, true);
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
            else if(this.look.content() == 'of') {
              if(expr.name() == Node.MMBEXPR
                || expr.name() == Node.PRMREXPR
                || expr.name() == Node.NEWEXPR) {
                node.add(
                  this.match(),
                  this.assignexpr()
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
          node.add(this.stmt(yYield));
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
    withstmt: function(yYield) {
      var node = new Node(Node.WITHSTMT);
      node.add(
        this.match('with', 'missing ( before with-statement object'),
        this.match('('),
        this.expr(),
        this.match(')', 'missing ) after with-statement object'),
        this.stmt(yYield)
      );
      return node;
    },
    swchstmt: function(yYield) {
      var node = new Node(Node.SWCHSTMT);
      node.add(
        this.match('switch'),
        this.match('('),
        this.expr(),
        this.match(')'),
        this.caseblock(yYield)
      );
      return node;
    },
    caseblock: function(yYield) {
      var node = new Node(Node.CASEBLOCK);
      node.add(this.match('{'));
      while(this.look && this.look.content() != '}') {
        if(this.look.content() == 'case') {
          node.add(this.caseclause(yYield));
        }
        else if(this.look.content() == 'default') {
          node.add(this.dftclause(yYield));
        }
        else {
          this.error('invalid switch statement');
        }
      }
      node.add(this.match('}'));
      return node;
    },
    caseclause: function(yYield) {
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
        node.add(this.stmt(yYield));
      }
      return node;
    },
    dftclause: function(yYield) {
      var node = new Node(Node.DFTCLAUSE);
      node.add(
        this.match('default'),
        this.match(':')
      );
      while(this.look && this.look.content() != '}') {
        node.add(this.stmt(yYield));
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
    trystmt: function(yYield) {
      var node = new Node(Node.TRYSTMT);
      node.add(
        this.match('try'),
        this.block('missing { before try block', yYield)
      );
      if(this.look && this.look.content() == 'catch') {
        node.add(this.cach(yYield));
        if(this.look && this.look.content() == 'finally') {
          node.add(this.finl(yYield));
        }
      }
      else {
        node.add(this.finl(yYield));
      }
      return node;
    },
    debstmt: function() {
      var node = new Node(Node.DEBSTMT);
      node.add(this.match('debugger'), this.match(';'));
      return node;
    },
    cach: function(yYield) {
      var node = new Node(Node.CACH);
      node.add(
        this.match('catch', 'missing catch or finally after try'),
        this.match('(', 'missing ( before catch'),
        this.cachparam(),
        this.match(')', 'missing ) after catch'),
        this.block('missing { before catch block', yYield)
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
    finl: function(yYield) {
      var node = new Node(Node.FINL);
      node.add(
        this.match('finally'),
        this.block('missing { before finally block', yYield)
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
    fnexpr: function(noIn, noOf) {
      var node = new Node(Node.FNEXPR);
      node.add(
        this.match('function')
      );
      if(!this.look) {
        this.error('missing formal parameter');
      }
      if(this.look.type() == Token.ID) {
        node.add(this.bindid(null, noIn, noOf));
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
    genexpr: function(noIn, noOf) {
      var node = new Node(Node.GENEXPR);
      node.add(
        this.match('function'),
        this.match('*')
      );
      if(!this.look) {
        this.error('missing formal parameter');
      }
      if(this.look.type() == Token.ID) {
        node.add(this.bindid(null, noIn, noOf));
      }
      node.add(
        this.match('(', 'missing ( before formal parameters'),
        this.fmparams(),
        this.match(')', 'missing ) after formal parameters'),
        this.match('{'),
        this.fnbody(true),
        this.match('}', 'missing } after function body')
      );
      return node;
    },
    gendecl: function(noIn, noOf) {
      var node = new Node(Node.GENDECL);
      node.add(
        this.match('function'),
        this.match('*')
      );
      node.add(this.bindid('missing formal parameter', noIn, noOf));
      node.add(
        this.match('(', 'missing ( before formal parameters'),
        this.fmparams(),
        this.match(')', 'missing ) after formal parameters'),
        this.match('{'),
        this.fnbody(true),
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
          node.add(this.bindelem(true));
          if(this.look && this.look.content() == ',') {
            node.add(this.match());
          }
        }
      }
      if(!this.look) {
        this.error('missing ) after formal parameters');
      }
      if(this.look.content() == '...') {
        node.add(this.bindrest(true));
      }
      return node;
    },
    fnbody: function(yYield) {
      var node = new Node(Node.FNBODY);
      while(this.look && this.look.content() != '}') {
        node.add(this.stmtlitem(yYield));
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
    classexpr: function(noIn, noOf) {
      var node = new Node(Node.CLASSEXPR);
      node.add(this.match('class'));
      if(!this.look) {
        this.error();
      }
      if(this.look.type() == Token.ID) {
        node.add(this.bindid(null, noIn, noOf));
      }
      if(!this.look) {
        this.error();
      }
      if(this.look.content() == 'extends') {
        node.add(this.heratige(noIn, noOf));
      }
      node.add(
        this.match('{'),
        this.classbody(noIn, noOf),
        this.match('}')
      );
      return node;
    },
    heratige: function(noIn, noOf) {
      var node = new Node(Node.HERITAGE);
      node.add(
        this.match('extends'),
        this.leftexpr(noIn, noOf)
      );
      return node;
    },
    classbody: function(noIn, noOf) {
      var node = new Node(Node.CLASSBODY);
      while(this.look && this.look.content() != '}') {
        node.add(this.classelem(noIn, noOf));
      }
      return node;
    },
    classelem: function(noIn, noOf) {
      var node = new Node(Node.CLASSELEM);
      if(this.look.content() == ';') {
        node.add(this.match());
      }
      else if(this.look.content() == 'static') {
        node.add(
          this.match(),
          this.method(noIn, noOf)
        );
      }
      else {
        node.add(this.method(noIn, noOf));
      }
      return node;
    },
    method: function(noIn, noOf) {
      var node = new Node(Node.METHOD);
      if(this.look.content() == 'get') {
        node.add(
          this.match(),
          this.proptname(noIn, noOf),
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
          this.proptname(noIn, noOf),
          this.match('('),
          this.fmparams(),
          this.match(')'),
          this.match('{'),
          this.fnbody(),
          this.match('}')
        );
      }
      else if(this.look.content() == '*') {
        return this.genmethod(noIn, noOf);
      }
      else {
        node.add(
          this.proptname(noIn, noOf),
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
    genmethod: function(noIn, noOf) {
      var node = new Node(Node.GENMETHOD);
      node.add(
        this.match('*'),
        this.proptname(noIn, noOf),
        this.match('('),
        this.fmparams(),
        this.match(')'),
        this.match('{'),
        this.fnbody(),
        this.match('}')
      );
      return node;
    },
    expr: function(noIn, noOf, yYield) {
      var node = new Node(Node.EXPR),
        assignexpr = this.assignexpr(noIn, noOf, yYield);
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
          node.add(this.match(), this.assignexpr(noIn, noOf, yYield));
        }
      }
      else {
        return assignexpr;
      }
      return node;
    },
    initlz: function(noIn, noOf, yYield) {
      var node = new Node(Node.INITLZ);
      node.add(
        this.match('='),
        this.assignexpr(noIn, noOf, yYield)
      );
      return node;
    },
    assignexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.ASSIGNEXPR);
      if(!this.look) {
        this.error();
      }
      if(this.look.content() == 'yield') {
        if(!yYield) {
          this.error('yield not in generator function');
        }
        return this.yieldexpr(noIn, noOf, yYield);
      }
      var cndt = this.cndtexpr(noIn, noOf, yYield);
      if(this.look
        && this.look.content() == '=>'
        && this.hasMoveLine == false
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
          this.cncsbody(noIn, noOf, yYield)
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
        node.add(cndt, this.match(), this.assignexpr(noIn, noOf, yYield));
      }
      else {
        return cndt;
      }
      return node;
    },
    yieldexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.YIELDEXPR);
      node.add(this.match('yield'));
      if(this.look && this.look.content() == '*') {
        node.add(this.match());
      }
      if(!this.look) {
        this.error();
      }
      if([';', '}'].indexOf(this.look.content()) == -1
        && this.look.type() != Token.KEYWORD) {
        node.add(this.assignexpr(noIn, noOf, yYield));
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
    cncsbody: function(noIn, noOf) {
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
        node.add(this.assignexpr(noIn, noOf));
      }
      return node;
    },
    cndtexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.CNDTEXPR),
        logorexpr = this.logorexpr(noIn, noOf, yYield);
      if(this.look && this.look.content() == '?') {
        node.add(
          logorexpr,
          this.match(),
          this.assignexpr(noIn, noOf, yYield),
          this.match(':'),
          this.assignexpr(noIn, noOf, yYield)
        );
      }
      else {
        return logorexpr;
      }
      return node;
    },
    logorexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.LOGOREXPR),
        logandexpr = this.logandexpr(noIn, noOf, yYield);
      if(this.look && this.look.content() == '||') {
        node.add(logandexpr);
        while(this.look && this.look.content() == '||') {
          node.add(
            this.match(),
            this.logandexpr(noIn, noOf, yYield)
          );
        }
      }
      else {
        return logandexpr;
      }
      return node;
    },
    logandexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.LOGANDEXPR),
        bitorexpr = this.bitorexpr(noIn, noOf);
      if(this.look && this.look.content() == '&&') {
        node.add(bitorexpr);
        while(this.look && this.look.content() == '&&') {
          node.add(
            this.match(),
            this.bitorexpr(noIn, noOf, yYield)
          );
        }
      }
      else {
        return bitorexpr;
      }
      return node;
    },
    bitorexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.BITOREXPR),
        bitxorexpr = this.bitxorexpr(noIn, noOf, yYield);
      if(this.look && this.look.content() == '|') {
        node.add(bitxorexpr);
        while(this.look && this.look.content() == '|') {
          node.add(
            this.match(),
            this.bitxorexpr(noIn, noOf, yYield)
          );
        }
      }
      else {
        return bitxorexpr;
      }
      return node;
    },
    bitxorexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.BITXOREXPR),
        bitandexpr = this.bitandexpr(noIn, noOf, yYield);
      if(this.look && this.look.content() == '^') {
        node.add(bitandexpr);
        while(this.look && this.look.content() == '^') {
          node.add(
            this.match(),
            this.bitandexpr(noIn, noOf, yYield)
          );
        }
      }
      else {
        return bitandexpr;
      }
      return node;
    },
    bitandexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.BITANDEXPR),
        eqexpr = this.eqexpr(noIn, noOf, yYield);
      if(this.look && this.look.content() == '&') {
        node.add(eqexpr);
        while(this.look && this.look.content() == '&') {
          node.add(
            this.match(),
            this.eqexpr(noIn, noOf, yYield)
          );
        }
      }
      else {
        return eqexpr;
      }
      return node;
    },
    eqexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.EQEXPR),
        reltexpr = this.reltexpr(noIn, noOf, yYield);
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
            this.reltexpr(noIn, noOf, yYield)
          );
        }
      }
      else {
        return reltexpr;
      }
      return node;
    },
    reltexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.RELTEXPR),
        shiftexpr = this.shiftexpr();
      if(this.look && ({
        '<': true,
        '>': true,
        '>=': true,
        '<=': true,
        'instanceof': true
      }.hasOwnProperty(this.look.content())
        || (!noIn && this.look.content() == 'in'))) {
        node.add(shiftexpr);
        while(this.look && ({
          '<': true,
          '>': true,
          '>=': true,
          '<=': true,
          'instanceof': true
        }.hasOwnProperty(this.look.content())
          || (!noIn && this.look.content() == 'in'))) {
          node.add(
            this.match(),
            this.shiftexpr(noIn, noOf, yYield)
          );
        }
      }
      else {
        return shiftexpr;
      }
      return node;
    },
    shiftexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.SHIFTEXPR),
        addexpr = this.addexpr(noIn, noOf, yYield);
      if(this.look && ['<<', '>>', '>>>'].indexOf(this.look.content()) != -1) {
        node.add(addexpr);
        while(this.look && ['<<', '>>', '>>>'].indexOf(this.look.content()) != -1) {
          node.add(
            this.match(),
            this.addexpr(noIn, noOf, yYield)
          );
        }
      }
      else {
        return addexpr;
      }
      return node;
    },
    addexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.ADDEXPR),
        mtplexpr = this.mtplexpr(noIn, noOf, yYield);
      if(this.look && ['+', '-'].indexOf(this.look.content()) != -1) {
        node.add(mtplexpr);
        while(this.look && ['+', '-'].indexOf(this.look.content()) != -1) {
          node.add(
            this.match(),
            this.mtplexpr(noIn, noOf, yYield)
          );
        }
      }
      else {
        return mtplexpr;
      }
      return node;
    },
    mtplexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.MTPLEXPR),
        unaryexpr = this.unaryexpr(noIn, noOf, yYield);
      if(this.look && ['*', '/', '%'].indexOf(this.look.content()) != -1) {
        node.add(unaryexpr);
        while(this.look && ['*', '/', '%'].indexOf(this.look.content()) != -1) {
          node.add(
            this.match(),
            this.unaryexpr(noIn, noOf, yYield)
          );
        }
      }
      else {
        return unaryexpr;
      }
      return node;
    },
    unaryexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.UNARYEXPR);
      if(!this.look) {
        this.error();
      }
      switch(this.look.content()) {
        case '++':
        case '--':
          node.add(
            this.match(),
            this.leftexpr(noIn, noOf, yYield)
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
            this.unaryexpr(noIn, noOf, yYield)
          );
        break;
        default:
          return this.postfixexpr(noIn, noOf, yYield);
      }
      return node;
    },
    postfixexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.POSTFIXEXPR);
      var leftexpr = this.leftexpr(noIn, noOf, yYield);
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
    leftexpr: function(noIn, noOf, yYield) {
      if(this.look.content() == 'new') {
        return this.newexpr(0, noIn, noOf, yYield);
      }
      else {
        return this.callexpr(null, noIn, noOf, yYield);
      }
    },
    newexpr: function(depth, noIn, noOf, yYield) {
      depth = depth || 0;
      var node = new Node(Node.NEWEXPR);
      node.add(this.match('new'));
      if(!this.look) {
        this.error();
      }
      if(this.look.content() == 'new') {
        node.add(this.newexpr(depth + 1, noIn, noOf, yYield));
      }
      //LL2分辨super后是否为.[至mmbexpr
      else if(this.look.content() == 'super') {
        var end = false;
        for(var i = this.index; i < this.length; i++) {
          var next = this.tokens[i];
          if(!S[next.type()]) {
            if(['.', '['].indexOf(next.content()) > -1) {
              node.add(this.mmbexpr(noIn, noOf, yYield));
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
        node.add(this.mmbexpr(noIn, noOf, yYield));
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
              this.expr(noIn, noOf, yYield),
              this.match(']')
            );
          }
          else {
            break;
          }
        }
        if(depth == 0 && this.look && this.look.content() == '(') {
          var callexpr = this.callexpr(mmb, noIn, noOf, yYield);
          return callexpr;
        }
        return mmb;
      }
      return node;
    },
    callexpr: function(mmb, noIn, noOf, yYield) {
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
                mmb = this.mmbexpr(noIn, noOf, yYield);
              }
              break;
            }
          }
        }
        else {
          mmb = this.mmbexpr(noIn, noOf, yYield);
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
              this.expr(noIn, noOf, yYield),
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
    mmbexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.MMBEXPR);
      var mmb;
      if(this.look.content() == 'super') {
        mmb = this.match();
        if(!this.look || ['.', '['].indexOf(this.look.content()) == -1) {
          this.error();
        }
      }
      else {
        mmb = this.prmrexpr(noIn, noOf, yYield);
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
            this.expr(noIn, noOf, yYield),
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
              this.expr(noIn, noOf, yYield),
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
    prmrexpr: function(noIn, noOf, yYield) {
      var node = new Node(Node.PRMREXPR);
      switch(this.look.type()) {
        case Token.ID:
          if(noIn && this.look.content() == 'in') {
            this.error();
          }
          if(noOf && this.look.content() == 'of') {
            this.error();
          }
          node.add(this.idref(noIn, noOf));
        break;
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
                    node.add(this.genexpr(noIn, noOf));
                  }
                  else {
                    node.add(this.fnexpr(noIn, noOf));
                  }
                  break;
                }
              }
            break;
            case 'class':
              node.add(this.classexpr(noIn, noOf));
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
                    node.add(this.gencmph(noIn, noOf, yYield));
                  }
                  else {
                    node.add(this.cpeapl(noIn, noOf, yYield));
                  }
                  break;
                }
              }
            break;
            case '[':
              node.add(this.arrinit(noIn, noOf));
            break;
            case '{':
              node.add(this.objltr(noIn, noOf));
            break;
            default:
              this.error();
          }
      }
      return node;
    },
    arrinit: function(noIn, noOf) {
      //根据LL2分辨是arrltr还是arrcmph
      //[assignexpr or [for
      for(var i = this.index; i < this.length; i++) {
        var next = this.tokens[i];
        if(!S[next.type()]) {
          if(next.content() == 'for') {
            return this.arrcmph(noIn, noOf);
          }
          else {
            return this.arrltr(noIn, noOf);
          }
        }
      }
      this.error();
    },
    gencmph: function(noIn, noOf, yYield) {
      var node = new Node(Node.GENCMPH);
      node.add(
        this.match('('),
        this.cmph(noIn, noOf, yYield),
        this.match(')')
      );
      return node;
    },
    arrcmph: function(noIn, noOf) {
      var node = new Node(Node.ARRCMPH);
      node.add(
        this.match('['),
        this.cmph(noIn, noOf),
        this.match(']', 'missing ] after element list')
      );
      return node;
    },
    cmph: function(noIn, noOf, yYield) {
      var node = new Node(Node.CMPH);
      node.add(this.cmphfor());
      while(this.look && this.look.content() != ']') {
        if(this.look.content() == 'for') {
          node.add(this.cmphfor(noIn, noOf, yYield));
        }
        else if(this.look.content() == 'if') {
          node.add(this.cmphif(noIn, noOf, yYield));
        }
        else {
          node.add(this.assignexpr(noIn, noOf, yYield));
          break;
        }
      }
      return node;
    },
    cmphfor: function(noIn, noOf) {
      var node = new Node(Node.CMPHFOR);
      node.add(
        this.match('for'),
        this.match('('),
        this.forbind(noIn, noOf),
        this.match('of'),
        this.assignexpr(noIn, noOf),
        this.match(')')
      );
      return node;
    },
    forbind: function(noIn, noOf) {
      if(!this.look) {
        this.error();
      }
      if(['[', '{'].indexOf(this.look.content()) > -1) {
        return this.bindpat();
      }
      else {
        return this.bindid(noIn, noOf);
      }
    },
    cmphif: function(noIn, noOf) {
      var node = new Node(Node.CMPHIF);
      node.add(
        this.match('if'),
        this.match('('),
        this.assignexpr(noIn, noOf),
        this.match(')')
      );
      return node;
    },
    arrltr: function(noIn, noOf) {
      var node = new Node(Node.ARRLTR);
      node.add(this.match('['));
      while(this.look && this.look.content() != ']' && this.look.content() != '...') {
        if(this.look.content() == ',') {
          node.add(this.match());
        }
        else {
          node.add(this.assignexpr(noIn, noOf));
          if(this.look && this.look.content() == ',') {
            node.add(this.match());
          }
        }
      }
      if(this.look && this.look.content() == '...') {
        node.add(this.spread(noIn, noOf));
      }
      node.add(this.match(']', 'missing ] after element list'));
      return node;
    },
    spread: function(noIn, noOf) {
      var node = new Node(Node.SPREAD);
      node.add(this.match('...'), this.assignexpr(noIn, noOf));
      return node;
    },
    objltr: function(noIn, noOf) {
      var node = new Node(Node.OBJLTR);
      node.add(this.match('{'));
      while(this.look && this.look.content() != '}') {
        node.add(this.proptdef(noIn, noOf));
        if(this.look && this.look.content() == ',') {
          node.add(this.match());
        }
      }
      node.add(this.match('}', 'missing } after property list'));
      return node;
    },
    proptdef: function(noIn, noOf) {
      var node = new Node(Node.PROPTDEF);
      if(!this.look) {
        this.error();
      }
      if(this.look.content() == '[') {
        var cmpt = this.cmptpropt(noIn, noOf);
        if(!this.look) {
          this.error();
        }
        if(this.look.content() == ':') {
          node.add(
            this.proptname(cmpt, noIn, noOf),
            this.match(),
            this.assignexpr(noIn, noOf)
          );
        }
        else {
          node.add(cmpt);
        }
      }
      else {
        switch(this.look.type()) {
          case Token.ID:
            //LL2区分 (为method :为propt: assginment
            var end = false;
            for(var i = this.index; i < this.length; i++) {
              var next = this.tokens[i];
              if(!S[next.type()]) {
                if([Token.KEYWORD, Token.ID].indexOf(next.type()) > -1 || next.content() == '(') {
                  node.add(this.method(noIn, noOf));
                  end = true;
                }
                else if(next.content() == '=') {
                  node.add(
                    this.match(),
                    this.initlz(noIn, noOf)
                  );
                  end = true;
                }
                else if([',', '}'].indexOf(next.content()) > -1) {
                  node.add(this.idref(noIn, noOf));
                  end = true;
                }
                break;
              }
            }
            if(end) {
              break;
            }
          case Token.STRING:
          case Token.NUMBER:
          case Token.KEYWORD:
            node.add(
              this.proptname(noIn, noOf),
              this.match(':', 'missing : after property id'),
              this.assignexpr(noIn, noOf)
            );
          break;
          default:
            this.error('invalid property id');
        }
      }
      return node;
    },
    idref: function(noIn, noOf) {
      if(!this.look) {
        this.error('invalid property id');
      }
      if(noIn && this.look.content() == 'in') {
        this.error();
      }
      if(noOf && this.look.content() == 'of') {
        this.error();
      }
      return this.match(Token.ID, 'invalid property id');
    },
    proptname: function(cmpt, noIn, noOf) {
      var node = new Node(Node.PROPTNAME);
      if(!this.look) {
        this.error('invalid property id');
      }
      if(cmpt) {
        node.add(cmpt);
      }
      else if(this.look.content() == '[') {
        node.add(this.cmptpropt(noIn, noOf));
      }
      else {
        node.add(this.ltrpropt(noIn, noOf));
      }
      return node;
    },
    ltrpropt: function(noIn, noOf) {
      var node = new Node(Node.LTRPROPT);
      switch(this.look.type()) {
        case Token.ID:
          if(noIn && this.look.content() == 'in') {
            this.error();
          }
          if(noOf && this.look.content() == 'of') {
            this.error();
          }
        case Token.NUMBER:
        case Token.STRING:
        case Token.KEYWORD:
          node.add(this.match());
          return node;
        default:
          this.error('invalid property id');
      }
    },
    cmptpropt: function(noIn, noOf) {
      var node = new Node(Node.CMPTPROPT);
      node.add(
        this.match('['),
        this.assignexpr(noIn, noOf),
        this.match(']')
      );
      return node;
    },
    args: function() {
      var node = new Node(Node.ARGS);
      node.add(this.match('('));
      if(!this.look) {
        this.error();
      }
      node.add(this.arglist());
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
    }
  });
  module.exports = Parser;
});