define(function(require, exports, module) {
  var Lexer = require('./Lexer');
  var Token = require('./Token');
  var character = require('../util/character');
  var S = {
    '\n': true,
    '\r': true,
    ' ': true,
    '\t': true
  };
  var CssLexer = Lexer.extend(function(rule) {
    Lexer.call(this, rule);
    this.media = false;
    this.import = false;
    this.value = false;
    this.parenthese = false;
    this.bracket = false;
    this.number = false;
    this.url = false;
    this.kw = false;
    this.sel = true;
    this.var = false;
    this.page = false;
    this.kf = false;
    this.ns = false;
    this.doc = false;
    this.depth = 0;
  }).methods({
    //@override
    scan: function(temp) {
      var length = this.code.length;
      var count = 0;
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
              ')': true
            }.hasOwnProperty(this.peek)) {
            this.dealPt(temp);
            this.url = false;
            continue outer;
          }
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
              //@import和@media之后进入值状态
              case Token.HEAD:
              s = s.replace(/^@(-moz-|-o-|-ms-|-webkit-)/, '@');
                switch(s) {
                  case '@import':
                    this.import = true;
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
                }
                this.sel = false;
                this.kw = false;
                this.value = true;
                this.number = false;
                this.var = false;
                break;
              //单位要跟在数字之后，否则便不是单位
              case Token.UNITS:
                if(!this.number) {
                  continue;
                }
                this.sel = false;
                this.kw = false;
                this.var = false;
                this.number = false;
                this.page = false;
                this.kf = false;
                this.ns = false;
                this.doc = false;
                break;
              case Token.KEYWORD:
                if(!this.value) {
                  this.kw = true;
                  this.url = false;
                  this.var = false;
                  this.sel = false;
                  this.number = false;
                  this.page = false;
                  this.kf = false;
                  this.ns = false;
                  this.doc = false;
                }
                break;
              //将id区分出属性名和属性值
              case Token.ID:
                if(this.page || this.kf || this.ns) {
                  this.sel = true;
                  this.url = false;
                  this.kw = false;
                  this.var = false;
                  this.value = false;
                }
                else if(this.bracket && this.sel) {
                  token.type(Token.ATTR);
                  this.url = false;
                  this.var = false;
                }
                else if(this.var) {
                  token.type(Token.VARS);
                  this.url = false;
                  this.var = false;
                }
                else if(this.value) {
                  if(this.rule.colors().hasOwnProperty(s)) {
                    token.type(Token.NUMBER);
                    this.url = false;
                    this.var = false;
                  }
                  else if(this.rule.keyWords().hasOwnProperty(s)
                    || this.rule.values().hasOwnProperty(s)) {
                    token.type(Token.PROPERTY);
                    this.url = s == 'url' || s == 'format';
                    this.var = s == 'var';
                  }
                  this.kw = false;
                  this.sel = false;
                }
                else {
                  if(this.rule.keyWords().hasOwnProperty(s)) {
                    token.type(Token.KEYWORD);
                    this.kw = true;
                    this.url = false;
                    this.var = false;
                    this.sel = false;
                  }
                  else {
                    token.type(Token.SELECTOR);
                    this.sel = true;
                    this.url = false;
                    this.kw = false;
                    this.var = false;
                  }
                }
                this.number = false;
                this.page = false;
                this.kf = false;
                this.ns = false;
                this.doc = false;
                break;
              case Token.PSEUDO:
                if((this.kw || this.value)
                  && !this.page) {
                  continue;
                }
                this.var = false;
                this.page = false;
                this.kf = false;
                this.ns = false;
                this.doc = false;
                break;
              case Token.SELECTOR:
                this.sel = true;
                this.kw = false;
                this.number = false;
                this.var = false;
                this.page = false;
                this.kf = false;
                this.ns = false;
                this.doc = false;
                break;
              case Token.IMPORTANT:
                this.url = false;
                this.var = false;
                this.page = false;
                this.kf = false;
                this.ns = false;
                this.doc = false;
                break;
              case Token.SIGN:
                switch(s) {
                  case ':':
                    if(this.kw) {
                      this.value = true;
                    }
                    this.url = false;
                    this.sel = false;
                    this.var = false;
                    break;
                  case '(':
                    if(this.media || this.import || this.doc) {
                      this.value = false;
                    }
                    this.parenthese = true;
                    this.sel = false;
                    break;
                  case ')':
                    if(this.media || this.import || this.doc) {
                      this.value = true;
                    }
                    this.url = false;
                    this.parenthese = false;
                    this.sel = false;
                    this.var = false;
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
                    this.var = false;
                    break;
                  case ']':
                    if(!this.value && !this.sel) {
                      token.type(Token.HACK);
                    }
                    this.bracket = false;
                    this.url = false;
                    this.var = false;
                    break;
                  case ';':
                    if(this.bracket && !this.sel) {
                      token.type(Token.HACK);
                    }
                    this.value = false;
                    this.import = false;
                    this.url = false;
                    this.sel = false;
                    this.var = false;
                    break;
                  case '{':
                    this.depth++;
                    this.value = false;
                    this.media = false;
                    this.import = false;
                    this.url = false;
                    this.sel = true;
                    this.var = false;
                    break;
                  case '}':
                    this.value = false;
                    this.media = false;
                    this.import = false;
                    this.url = false;
                    this.sel = true;
                    this.depth--;
                    this.var = false;
                    break;
                  case '*':
                    if(this.depth) {
                      if(!this.value) {
                        //LL2确定是selector还是hack
                        for(var j = this.index; j < length; j++) {
                          var c = this.code.charAt(j);
                          if(!S.hasOwnProperty(c)) {
                            if(c == ':' || c == '{') {
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
                    }
                    else {
                      token.type(Token.SELECTOR);
                      this.sel = true;
                    }
                    this.var = false;
                    break;
                  case '-':
                  case '_':
                    if(this.depth && !this.value) {
                      token.type(Token.HACK);
                    }
                    this.url = false;
                    this.sel = false;
                    this.var = false;
                    break;
                  default:
                    this.url = false;
                    this.var = false;
                    break;
                }
                this.number = false;
                this.kw = false;
                this.page = false;
                this.kf = false;
                this.ns = false;
                this.doc = false;
                break;
              case Token.NUMBER:
                if(!this.value && token.content().charAt(0) == '#') {
                  token.type(Token.SELECTOR);
                }
                else {
                  this.number = true;
                }
                this.url = false;
                this.var = false;
                this.page = false;
                this.kf = false;
                this.ns = false;
                this.doc = false;
                break;
              case Token.VARS:
                this.kw = true;
                this.sel = false;
                this.url = false;
                this.number = false;
                this.var = false;
                this.page = false;
                this.kf = false;
                this.ns = false;
                this.doc = false;
                break;
            }
  
            temp.push(token);
            this.tokenList.push(token);
            this.index += matchLen - 1;
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
        temp.push(token);
        this.tokenList.push(token);
        this.index = j;
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
      temp.push(token);
      this.tokenList.push(token);
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
  
  module.exports = CssLexer;
});