define(function(require, exports, module) {var Lexer = require('./Lexer');
var Token = require('./CssToken');
var character = require('../util/character');
var RegMatch = require('./match/RegMatch');
var S = {
  '\n': true,
  '\r': true,
  ' ': true,
  '\t': true
};
var ADD_VALUE = new RegMatch(Token.ID, /^[a-z][\w\-\+\.]*/i);
var CssLexer = Lexer.extend(function(rule) {
  Lexer.call(this, rule);
  this.media = false;
  this.impt = false;
  this.value = false;
  this.parenthese = false;
  this.bracket = false;
  this.number = false;
  this.url = false;
  this.kw = false;
  this.sel = true;
  this.va = false;
  this.cvar = false;
  this.page = false;
  this.kf = false;
  this.ns = false;
  this.doc = false;
  this.supports = false;
  this.extend = false;
  this.param = false;
  this.depth = 0;
}).methods({
  //@override
  scan: function(temp) {
    var length = this.code.length;
    var count = 0;
    this.colNum = length ? 1 : 0;
    outer:
    while(this.index < length) {
      if(this.cacheLine > 0 && count >= this.cacheLine) {
        break;
      }
      this.readch();
      //(之后的字符串可省略"号
      if(this.parenthese && this.url) {
        if(!S.hasOwnProperty(this.peek)
          && !{
            "'": true,
            '"': true,
            ')': true,
            '$': true
          }.hasOwnProperty(this.peek)) {
          this.dealPt(temp);
          this.url = false;
          continue outer;
        }
        //url只能省略一次，即url()中第一个出现的非空白token，多个的话不能省略
        this.url = false;
      }
      for(var i = 0, matches = this.rule.matches(), len = matches.length; i < len; i++) {
        var match = matches[i];
        if(match.match(this.peek, this.code, this.index)) {
          var token = new Token(match.tokenType(), match.content(), match.val(), this.index - 1);
          var matchLen = match.content().length;

          //回调可自定义处理匹配的token
          if(match.callback) {
            match.callback(token);
          }

          var s = token.content().toLowerCase();
          switch(token.type()) {
            //单位必须紧跟数字，否则便不是单位
            case Token.BLANK:
            case Token.TAB:
            case Token.LINE:
              this.number = false;
              break;
            //@import和@media之后进入值状态
            case Token.HEAD:
              s = s.replace(/^@(-moz-|-o-|-ms-|-webkit-|-vx-|-hp-|-khtml-|mso-|-prince-|-rim-|-ro-|-tc-|-wap-|-apple-|-atsc-|-ah-)/, '@');
              this.sel = false;
              this.kw = false;
              this.value = true;
              this.number = false;
              this.va = false;
              switch(s) {
                case '@import':
                  this.impt = true;
                  break;
                case '@media':
                  this.media = true;
                  break;
                case '@page':
                  this.page = true;
                  break;
                case '@keyframes':
                  this.kf = true;
                  break;
                case '@document':
                  this.doc = true;
                  break;
                case '@supports':
                  this.supports = true;
                  break;
                case '@extend':
                  this.extend = true;
                  this.value = false;
                  this.sel = true;
                  break;
              }
              break;
            //单位要跟在数字之后，否则便不是单位
            case Token.UNITS:
              if(!this.number) {
                continue;
              }
              this.sel = false;
              this.kw = false;
              this.va = false;
              this.number = false;
              this.page = false;
              this.kf = false;
              this.ns = false;
              this.doc = false;
              break;
            case Token.KEYWORD:
              if(!this.value || this.supports) {
                this.kw = true;
                this.url = false;
                this.va = false;
                this.sel = false;
                this.number = false;
                this.page = false;
                this.kf = false;
                this.ns = false;
                this.doc = false;
                this.parenthese = false;
              }
              break;
            case Token.COLOR:
              if(!this.value && !this.param && !this.cvar) {
                token.type(Token.SELECTOR);
              }
              break;
            //将id区分出属性名和属性值
            case Token.ID:
              if(this.bracket && this.sel) {
                token.type(Token.ATTR);
                this.url = false;
                this.va = false;
              }
              else if(this.extend) {
                token.type(Token.SELECTOR);
              }
              else if(this.number) {
                token.type(Token.UNITS);
                this.url = false;
                this.kw = false;
                this.va = false;
              }
              else if(this.page || this.kf || this.ns) {
                this.sel = true;
                this.url = false;
                this.kw = false;
                this.va = false;
                this.value = false;
              }
              else if(this.va) {
                token.type(Token.VARS);
                this.url = false;
                this.va = false;
              }
              else if(this.supports) {
                if(this.rule.keyWords().hasOwnProperty(s)) {
                  token.type(Token.KEYWORD);
                }
                else {
                  token.type(Token.PROPERTY);
                }
              }
              else if(this.param || this.cvar) {
                //value时id可以带+号，必须紧跟
                if(this.code.charAt(this.index) == '+') {
                  ADD_VALUE.match(this.peek, this.code, this.index);
                  token = new Token(ADD_VALUE.tokenType(), ADD_VALUE.content(), ADD_VALUE.val(), this.index - 1);
                  matchLen = ADD_VALUE.content().length;
                }
                if(this.rule.keyWords().hasOwnProperty(s)) {
                  //前面是hack也作为关键字
                  if(this.tokenList[this.tokenList.length - 1].type() == Token.HACK) {
                    token.type(Token.KEYWORD);
                    this.kw = true;
                  }
                  else {
                    //LL2确定后面如果是:说明是关键字（$var:keyword:）
                    for(var j = this.index + matchLen - 1; j < length; j++) {
                      var c = this.code.charAt(j);
                      if(!S.hasOwnProperty(c)) {
                        if(c == ':') {
                          token.type(Token.KEYWORD);
                          this.kw = true;
                        }
                        else {
                          token.type(Token.PROPERTY);
                          this.value = true;
                        }
                        break;
                      }
                    }
                  }
                }
                else if(this.rule.values().hasOwnProperty(s)) {
                  token.type(Token.PROPERTY);
                  this.url = ['url', 'format', 'url-prefix', 'domain', 'regexp'].indexOf(s) > -1;
                }
                this.sel = false;
                this.cvar = false;
              }
              else if(this.value) {
                //value时id可以带+号，必须紧跟
                if(this.code.charAt(this.index) == '+') {
                  ADD_VALUE.match(this.peek, this.code, this.index);
                  token = new Token(ADD_VALUE.tokenType(), ADD_VALUE.content(), ADD_VALUE.val(), this.index - 1);
                  matchLen = ADD_VALUE.content().length;
                }
                if(this.rule.colors().hasOwnProperty(s)) {
                  token.type(Token.COLOR);
                  this.url = false;
                  this.va = false;
                }
                else if(this.rule.keyWords().hasOwnProperty(s)
                  || this.rule.values().hasOwnProperty(s)) {
                  token.type(Token.PROPERTY);
                  this.url = ['url', 'format', 'url-prefix', 'domain', 'regexp'].indexOf(s) > -1;
                  this.va = s == 'var';
                }
                this.kw = false;
                this.sel = false;
              }
              else {
                if(this.rule.keyWords().hasOwnProperty(s)) {
                  token.type(Token.KEYWORD);
                  this.kw = true;
                  this.sel = false;
                  this.parenthese = false;
                }
                else {
                  var isFnCall = false;
                  for(var i = this.index + s.length - 1; i < length; i++) {
                    var c = this.code.charAt(i);
                    if(!S.hasOwnProperty(c)) {
                      isFnCall = c == '(';
                      break;
                    }
                  }
                  if(isFnCall) {
                    token.type(Token.VARS);
                    this.sel = false;
                  }
                  else {
                    token.type(Token.SELECTOR);
                    this.sel = true;
                  }
                  this.kw = false;
                }
                this.url = false;
                this.va = false;
              }
              this.number = false;
              this.page = false;
              this.kf = false;
              this.ns = false;
              this.doc = false;
              break;
            case Token.PSEUDO:
              if((this.kw || this.value || this.cvar)
                && !this.page) {
                token.cancel();
                continue;
              }
              this.va = false;
              this.page = false;
              this.kf = false;
              this.ns = false;
              this.doc = false;
              break;
            case Token.SELECTOR:
              if(this.value) {
                token.cancel();
                continue;
              }
              this.sel = true;
              this.kw = false;
              this.number = false;
              this.va = false;
              this.page = false;
              this.kf = false;
              this.ns = false;
              this.doc = false;
              break;
            case Token.IMPORTANT:
              this.url = false;
              this.va = false;
              this.page = false;
              this.kf = false;
              this.ns = false;
              this.doc = false;
              break;
            case Token.SIGN:
              this.number = false;
              switch(s) {
                case ':':
                  if(this.kw) {
                    this.value = true;
                  }
                  this.url = false;
                  this.sel = false;
                  this.va = false;
                  break;
                case '(':
                  this.parenthese = true;
                  if(this.media || this.impt || this.doc) {
                    this.value = false;
                  }
                  //fncall只会出现在block中
                  else if(this.depth > 0) {
                    //向前确定此(之后是fncall的param
                    for(var j = this.tokenList.length - 1; j >= 2; j--) {
                      var t = this.tokenList[j];
                      if([Token.IGNORE, Token.BLANK, Token.LINE, Token.VIRTUAL, Token.COMMENT].indexOf(t.type()) == -1) {
                        if(t.type() == Token.VARS) {
                          this.param = true;
                          this.parenthese = false;
                        }
                        break;
                      }
                    }
                  }
                  break;
                case ')':
                  if(this.media || this.impt || this.doc) {
                    this.value = true;
                  }
                  this.url = false;
                  this.parenthese = false;
                  this.va = false;
                  //)之后可能跟单位，比如margin:(1+2)px
                  this.number = true;
                  this.param = false;
                  break;
                case '[':
                  if(!this.value) {
                    //LL2确定是selector还是hack
                    for(var j = this.index; j < length; j++) {
                      var c = this.code.charAt(j);
                      if(!S.hasOwnProperty(c)) {
                        if(c == ';') {
                          token.type(Token.HACK);
                          this.sel = false;
                        }
                        break;
                      }
                    }
                  }
                  this.bracket = true;
                  this.url = false;
                  this.va = false;
                  break;
                case ']':
                  if(!this.value && !this.sel) {
                    token.type(Token.HACK);
                  }
                  this.bracket = false;
                  this.url = false;
                  this.va = false;
                  break;
                case ';':
                  if(this.bracket && !this.sel) {
                    token.type(Token.HACK);
                  }
                  this.value = false;
                  this.impt = false;
                  this.url = false;
                  this.sel = false;
                  this.va = false;
                  this.cvar = false;
                  this.extend = false;
                  this.param = false;
                  break;
                case '{':
                  this.depth++;
                  this.value = false;
                  this.media = false;
                  this.impt = false;
                  this.url = false;
                  this.sel = true;
                  this.va = false;
                  this.supports = false;
                  this.cvar = false;
                  this.extend = false;
                  this.param = false;
                  break;
                case '}':
                  this.value = false;
                  this.media = false;
                  this.impt = false;
                  this.url = false;
                  this.sel = true;
                  this.depth--;
                  this.va = false;
                  this.cvar = false;
                  this.extend = false;
                  this.param = false;
                  break;
                case '*':
                  if(this.cvar && !this.value) {
                    token.type(Token.HACK);
                  }
                  else if(this.param) {
                    //向前如果是(则为hack
                    for(var j = this.tokenList.length - 1; j >= 2; j--) {
                      var t = this.tokenList[j];
                      if([Token.IGNORE, Token.BLANK, Token.LINE, Token.VIRTUAL, Token.COMMENT].indexOf(t.type()) == -1) {
                        if(t.content() == '(') {
                          token.type(Token.HACK);
                        }
                        break;
                      }
                    }
                  }
                  else if(this.depth && !this.value) {
                    //LL2确定是selector还是hack
                    for(var j = this.index; j < length; j++) {
                      var c = this.code.charAt(j);
                      if(!S.hasOwnProperty(c)) {
                        if(':{,+([#>.'.indexOf(c) > -1) {
                          token.type(Token.SELECTOR);
                          this.sel = true;
                        }
                        else {
                          token.type(Token.HACK);
                          this.sel = false;
                        }
                        break;
                      }
                    }
                  }
                  else if(!this.value) {
                    token.type(Token.SELECTOR);
                    this.sel = true;
                  }
                  this.va = false;
                  break;
                case '-':
                case '/':
                  if(!this.value) {
                    token.type(Token.HACK);
                  }
                  this.url = false;
                  this.sel = false;
                  this.va = false;
                  break;
                case '~':
                  if(this.sel && !this.param) {
                    var last = this.tokenList[this.tokenList.length - 1];
                    if(last) {
                      if(last.type() == Token.SIGN && ['{', '}'].indexOf(last.content()) > -1) {
                        token.type(Token.HACK);
                      }
                    }
                  }
                  else if(!this.value && ['"', "'", '@', '$'].indexOf(this.code.charAt(this.index)) == -1) {
                    token.type(Token.HACK);
                  }
                default:
                  this.url = false;
                  this.va = false;
                  break;
              }
              this.kw = false;
              this.page = false;
              this.kf = false;
              this.ns = false;
              this.doc = false;
              break;
            case Token.NUMBER:
              this.number = true;
              this.url = false;
              this.va = false;
              this.page = false;
              this.kf = false;
              this.ns = false;
              this.doc = false;
              if(this.cvar || this.param) {
                this.value = true;
              }
              break;
            case Token.STRING:
              if(this.cvar || this.param) {
                this.value = true;
              }
              break;
            case Token.VARS:
              this.sel = false;
              this.url = false;
              this.number = false;
              this.va = false;
              this.page = false;
              this.kf = false;
              this.ns = false;
              this.doc = false;
              //vardecl时作为值
              if(this.cvar) {
                this.value = true;
              }
              //非值时的$是声明
              else if(!this.value) {
                this.cvar = true;
              }
              break;
          }

          if(this.last) {
            token.prev(this.last);
            this.last.next(token);
          }
          this.last = token;
          temp.push(token);
          this.tokenList.push(token);
          this.index += matchLen - 1;
          token.line(this.totalLine);
          token.col(this.colNum);
          var n = character.count(token.val(), character.LINE);
          count += n;
          this.totalLine += n;
          if(n) {
            var i = match.content().indexOf(character.LINE);
            var j = match.content().lastIndexOf(character.LINE);
            this.colMax = Math.max(this.colMax, this.colNum + i);
            this.colNum = match.content().length - j;
          }
          else {
            this.colNum += matchLen;
          }
          this.colMax = Math.max(this.colMax, this.colNum);
          continue outer;
        }
      }
      //如果有未匹配的，css默认忽略，查找下一个;
      var j = this.code.indexOf(';', this.index);
      if(j == -1) {
        j = this.code.indexOf('}', this.index);
        if(j == -1) {
          j = this.code.length;
        }
        else if(this.depth) {
          j--;
        }
      }
      var s = this.code.slice(this.index - 1, ++j);
      var token = new Token(Token.IGNORE, s, this.index - 1);
      if(this.last) {
        token.prev(this.last);
        this.last.next(token);
      }
      this.last = token;
      temp.push(token);
      this.tokenList.push(token);
      token.line(this.totalLine);
      token.col(this.colNum);
      this.index = j;
      this.colNum += this.index - s.length;
      this.colMax = Math.max(this.colMax, this.colNum);
    }
    return this;
  },
  dealPt: function(temp) {
    var k = this.code.indexOf(')', this.index);
    //()未结束直接跳出
    if(k == -1) {
      var token = new Token(Token.IGNORE, this.code.slice(this.index - 1, this.code.length), this.index - 1);
      temp.push(token);
      this.tokenList.push(token);
      token.line(this.totalLine);
      token.col(this.colNum);
      this.index = this.code.length;
      var n = character.count(token.val(), character.LINE);
      if(n > 0) {
        var i = token.content().indexOf(character.LINE);
        var j = token.content().lastIndexOf(character.LINE);
        this.colMax = Math.max(this.colMax, this.colNum + i);
        this.colNum = token.content().length - j;
      }
      else {
        this.colNum += token.content().length;
      }
      this.colMax = Math.max(this.colMax, this.colNum);
      return;
    }
    var s = this.code.slice(this.index - 1, k);
    var reg = /[\s\r\n]/.exec(s.trim());
    var token;
    //)之前的空白要判断
    if(reg) {
      token = new Token(Token.IGNORE, s, this.index - 1);
    }
    else {
      token = new Token(Token.STRING, s, this.index - 1);
    }
    if(this.last) {
      token.prev(this.last);
      this.last.next(token);
    }
    this.last = token;
    temp.push(token);
    this.tokenList.push(token);
    token.line(this.totalLine);
    token.col(this.colNum);
    this.index += s.length - 1;
    this.parenthese = false;
    this.url = false;
    var n = character.count(token.val(), character.LINE);
    if(n > 0) {
      var i = token.content().indexOf(character.LINE);
      var j = token.content().lastIndexOf(character.LINE);
      this.colMax = Math.max(this.colMax, this.colNum + i);
      this.colNum = token.content().length - j;
    }
    else {
      this.colNum += token.content().length;
    }
    this.colMax = Math.max(this.colMax, this.colNum);
  }
});

module.exports = CssLexer;});