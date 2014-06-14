var Lexer = require('./Lexer');
var Token = require('./Token');
var character = require('../util/character');
var CssLexer = Lexer.extend(function(rule) {
  Lexer.call(this, rule);
  this.isValue = false;
  this.parenthese = false;
  this.bracket = false;
  this.isNumber = false;
  this.isUrl = false;
  this.isKw = false;
  this.isSelector = false;
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
      for(var i = 0, matches = this.rule.matches(), len = matches.length; i < len; i++) {
        var match = matches[i];
        if(match.match(this.peek, this.code, this.index)) {
          var token = new Token(match.tokenType(), match.content(), match.val());
          var error = match.error();
          if(error) {
            this.error(error, this.code.slice(this.index - matchLen, this.index));
          }
          var matchLen = match.content().length;

          //(之后的字符串可省略"号
          if(this.parenthese) {
            if(token.type() == Token.STRING) {
              //
            }
            else if(token.content() == ')') {
              this.parenthese = false;
            }
            else {
              this.dealPt(temp);
              continue outer;
            }
          }

          var s = token.content();
          switch(token.type()) {
            //@import和@media之后进入值状态
            case Token.HEAD:
              this.isValue = ['@import', '@media'].indexOf(s) != -1
              this.isSelector = false;
              this.isKw = false;
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
              this.isKw = false;
              this.isSelector = false;
              if(this.bracket) {
                token.type(Token.ATTR);
              }
              else if(this.isValue) {
                token.type(Token.PROPERTY);
                if(this.rule.colors().hasOwnProperty(s)) {
                  token.type(Token.NUMBER);
                }
                this.isUrl = token.content() == 'url' || token.content() == 'format';
              }
              else {
                if(this.rule.keyWords().hasOwnProperty(s)) {
                  token.type(Token.KEYWORD);
                  this.isKw = true;
                }
                else {
                  token.type(Token.SELECTOR);
                  this.isSelector = true;
                }
              }
              break;
            case Token.PSEUDO:
              if(!this.isSelector) {
                continue;
              }
              break;
            case Token.SELECTOR:
              if(this.bracket) {
                token.type(Token.ATTR);
              }
              else {
                this.isSelector = true;
              }
              this.isKw = false;
              break;
            case Token.SIGN:
              switch(s) {
                case ':':
                  if(this.isKw) {
                    this.isValue = true;
                  }
                  this.isKw = false;
                  this.isSelector = false;
                  break;
                case '(':
                  if(this.isUrl) {
                    this.parenthese = true;
                  }
                  break;
                case '[':
                  if(this.isSelector) {
                    this.bracket = true;
                  }
                  break;
                case ']':
                  this.bracket = false;
                  break;
                case ';':
                  this.isValue = false;
                  break;
                case '{':
                case '}':
                  this.isValue = false;
                  break;
                case '-':
                case '*':
                case '_':
                  if(!this.isValue) {
                    token.type(Token.HACK);
                  }
                  break;
              }
            case Token.NUMBER:
              if(!this.isValue && token.content().charAt(0) == '#') {
                token.type(Token.SELECTOR);
              }
              break;
          }

          this.isNumber = token.type() == Token.NUMBER;

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
      if(this.parenthese) {
        this.dealPt(temp);
        continue outer;
      }
      //如果有未匹配的，css默认忽略，查找下一个;
      var j = this.code.indexOf(';', this.index);
      if(j == -1) {
        j = this.code.indexOf('}', this.index);
        if(j == -1) {
          j = this.code.length;
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
    var reg = /[^\s\r\n]+[\s\r\n]/.exec(s);
    //)之前的空白要判断
    if(reg) {
      s = reg[0];
    }
    var token = new Token(Token.STRING, s);
    temp.push(token);
    this.tokenList.push(token);
    this.index += s.length - 1;
    this.parenthese = false;
    this.url = false;
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
  }
});

module.exports = CssLexer;