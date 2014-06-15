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
    this.isValue = false;
    this.parenthese = false;
    this.bracket = false;
    this.isNumber = false;
    this.isUrl = false;
    this.isKw = false;
    this.isSelector = false;
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
        if(this.parenthese && this.isUrl) {
          if(!S.hasOwnProperty(this.peek)
            && !{
              "'": true,
              '"': true,
              ')': true
            }.hasOwnProperty(this.peek)) {
            this.dealPt(temp);
            this.isUrl = false;
            continue outer;
          }
        }
        for(var i = 0, matches = this.rule.matches(), len = matches.length; i < len; i++) {
          var match = matches[i];
          if(match.match(this.peek, this.code, this.index)) {
            var token = new Token(match.tokenType(), match.content(), match.val(), this.index - 1);
            var matchLen = match.content().length;
  
            var s = token.content();
            switch(token.type()) {
              //@import和@media之后进入值状态
              case Token.HEAD:
                switch(s) {
                  case '@import':
                    this.import = true;
                    break;
                  case '@media':
                    this.media = true;
                    break;
                }
                this.isSelector = false;
                this.isKw = false;
                this.isValue = true;
                this.isNumber = false;
                break;
              //单位要跟在数字之后，否则便不是单位
              case Token.UNITS:
                if(!this.isNumber) {
                  continue;
                }
                this.isSelector = false;
                this.isKw = false;
                break;
              //将id区分出属性名和属性值
              case Token.ID:
                this.isSelector = false;
                if(this.isKw) {
                  token.type(Token.IGNORE);
                  this.isKw = false;
                }
                else if(this.bracket) {
                  token.type(Token.ATTR);
                  this.isUrl = false;
                }
                else if(this.isValue) {
                  if(this.rule.colors().hasOwnProperty(s)) {
                    token.type(Token.NUMBER);
                    this.isUrl = false;
                  }
                  else if(this.rule.keyWords().hasOwnProperty(s)
                    || this.rule.values().hasOwnProperty(s)) {
                    token.type(Token.PROPERTY);
                    this.isUrl = s == 'url' || s == 'format';
                  }
                  this.isKw = false;
                }
                else {
                  if(this.rule.keyWords().hasOwnProperty(s)) {
                    if(this.depth || this.media || this.import) {
                      token.type(Token.KEYWORD);
                      this.isKw = true;
                      this.isUrl = false;
                    }
                    else {
                      token.type(Token.IGNORE);
                    }
                  }
                  else {
                    token.type(Token.SELECTOR);
                    this.isSelector = true;
                    this.isUrl = false;
                    this.isKw = false;
                  }
                }
                this.isNumber = false;
                break;
              case Token.PSEUDO:
                if(!this.isSelector) {
                  continue;
                }
                break;
              case Token.SELECTOR:
                this.isSelector = true;
                this.isKw = false;
                this.isNumber = false;
                break;
              case Token.IMPORTANT:
                if(!this.depth || !this.isValue) {
                  token.type(Token.IGNORE);
                }
                this.isUrl = false;
                break;
              case Token.SIGN:
                this.isNumber = false;
                switch(s) {
                  case ':':
                    if(this.isKw) {
                      this.isValue = true;
                    }
                    this.isUrl = false;
                    this.isKw = false;
                    this.isSelector = false;
                    break;
                  case '(':
                    if(this.media || this.import) {
                      this.isValue = false;
                    }
                    this.parenthese = true;
                    break;
                  case ')':
                    if(this.media || this.import) {
                      this.isValue = true;
                    }
                    this.isUrl = false;
                    this.parenthese = false;
                  case '[':
                    if(this.isSelector) {
                      this.bracket = true;
                    }
                    this.isUrl = false;
                    break;
                  case ']':
                    this.bracket = false;
                    this.isUrl = false;
                    break;
                  case ';':
                    this.isValue = false;
                    this.import = false;
                    this.isUrl = false;
                    break;
                  case '{':
                    this.depth++;
                    this.isValue = false;
                    this.media = false;
                    this.import = false;
                    this.isUrl = false;
                    break;
                  case '}':
                    this.isValue = false;
                    this.media = false;
                    this.import = false;
                    this.isUrl = false;
                    this.depth--;
                    break;
                  case '*':
                    if(this.depth) {
                      if(!this.isValue) {
                        //LL2确定是selector还是hack
                        for (var j = this.index; j < length; j++) {
                          var c = this.code.charAt(j);
                          if (!S.hasOwnProperty(c)) {
                            if (c == ':' || c == '{') {
                              token.type(Token.SELECTOR);
                              this.isSelector = true;
                            }
                            else {
                              token.type(Token.HACK);
                            }
                            break;
                          }
                        }
                      }
                    }
                    else {
                      token.type(Token.SELECTOR);
                      this.isSelector = true;
                    }
                    break;
                  case '-':
                  case '_':
                    if(this.depth && !this.isValue) {
                      token.type(Token.HACK);
                    }
                    this.isUrl = false;
                    break;
                  default:
                    this.isUrl = false;
                    break;
                }
                break;
              case Token.NUMBER:
                if(!this.isValue && token.content().charAt(0) == '#') {
                  token.type(Token.SELECTOR);
                }
                else {
                  this.isNumber = true;
                }
                break;
            }
  
            //回调可自定义处理匹配的token
            if(match.callback) {
              match.callback(token);
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
          j = this.code.length;
          if(this.depth) {
            j = this.code.indexOf('}', this.index);
            if (j == -1) {
              j = this.code.length;
            }
            else {
              j--;
            }
          }
        }
        var s = this.code.slice(this.index - 1, ++j);
        var token = new Token(Token.IGNORE, s);
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
        var token = new Token(Token.IGNORE, this.code.slice(this.index - 1, this.code.length));
        temp.push(token);
        this.tokenList.push(token);
        this.index = this.code.length;
        var n = character.count(token.val(), character.LINE);
        if(n > 0) {
          var i = token.content().indexOf(character.LINE),
            j = token.content().lastIndexOf(character.LINE);
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
        token = new Token(Token.IGNORE, s);
      }
      else {
        token = new Token(Token.STRING, s);
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
    },
    find: function() {
      //
    }
  });
  
  module.exports = CssLexer;
});