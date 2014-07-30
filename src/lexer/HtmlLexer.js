var Class = require('../util/Class');
var character = require('../util/character');
var Token = require('./Token');
var HtmlLexer = Class(function(rule) {
  this.rule = rule; //当前语法规则
  this.init();
}).methods({
  init: function() {
    this.code = ''; //要解析的代码
    this.peek = ''; //向前看字符
    this.index = 0; //向前看字符字符索引
    this.tokenList = []; //结果的token列表
    this.cacheLine = 0; //行缓存值
    this.totalLine = 1; //总行数
    this.colNum = 0; //列
    this.colMax = 0; //最大列数
    this.state = false; //是否在<>状态中
    this.last = null;
  },
  parse: function(code) {
    this.code = code || '';
    var temp = [];
    this.scan(temp);
    return temp;
  },
  parseOn: function() {
    var temp = [];
    this.scan(temp);
    return temp;
  },
  tokens: function() {
    return this.tokenList;
  },
  scan: function(temp) {
    var length = this.code.length;
    var count = 0;
    outer:
    while(this.index < length) {
      if(this.cacheLine > 0 && count >= this.cacheLine) {
        break;
      }
      if(this.state) {
        this.readch();
        if(this.peek == '>') {
          this.state = false;
          var token = new Token(Token.SIGN, this.peek, this.peek);
          continue;
        }
        for(var i = 0, matches = this.rule.matches(), len = matches.length; i < len; i++) {
          var match = matches[i];
          if(match.match(this.peek, this.code, this.index)) {
            var token = new Token(match.tokenType(), match.content(), match.val(), this.index - 1);
            var error = match.error();
            if(error) {
              this.error(error, this.code.slice(this.index - matchLen, this.index));
            }
            var matchLen = match.content().length;
            if(token.type() == Token.ID
              && this.rule.keyWords().hasOwnProperty(token.content())) {
              token.type(Token.KEYWORD);
            }

            //回调可自定义处理匹配的token
            if(match.callback) {
              match.callback(token);
            }

            if(this.last) {
              token.prev(this.last);
              this.last.next(token);
            }
            this.last = token;
            temp.push(token);
            this.tokenList.push(token);
            this.index += matchLen - 1;
            var n = character.count(token.val(), character.LINE);
            count += n;
            this.totalLine += n;
            if(n) {
              var j = match.content().indexOf(character.LINE);
              var k = match.content().lastIndexOf(character.LINE);
              this.colMax = Math.max(this.colMax, this.colNum + j);
              this.colNum = match.content().length - k;
            }
            else {
              this.colNum += matchLen;
            }
            this.colMax = Math.max(this.colMax, this.colNum);

            continue outer;
          }
          //如果有未匹配的，说明规则不完整，抛出错误
          this.error('unknow token');
        }
      }
      else {
        var end = this.code.indexOf('<', this.index);
        if(end == -1) {
          end = length;
        }
        if(end > this.index) {
          var s = this.code.slice(this.index, end);
          var text = new Token(Token.TEXT, s, s, this.index);
          temp.push(text);
          this.tokenList.push(text);
        }
        this.index = end;
        var s = this.code.slice(this.index, this.index + 4).toLowerCase();
        var c1 = this.code.charAt(this.index);
        var c2 = this.code.charAt(this.index + 1);
        if(s == '<!--') {
          end = this.code.indexOf('-->', this.index + 4);
          if(end == -1) {
            end = length;
          }
          else {
            end += 3;
          }
          s = this.code.slice(this.index, end);
          var token = new Token(Token.COMMENT, s, s);
          temp.push(token);
          this.tokenList.push(token);
          this.index = end;
        }
        else if(c1 == '<' && (character.isLetter(c2) || c2 == '!')) {
          this.state = true;
          var token = new Token(Token.SIGN, c1, c1);
          temp.push(token);
          this.tokenList.push(token);
          this.index++;
        }
      }
    }
    return this;
  },
  readch: function() {
    this.peek = this.code.charAt(this.index++);
  },
  cache: function(i) {
    if(!character.isUndefined(i) && i !== null) {
      this.cacheLine = i;
    }
    return this.cacheLine;
  },
  finish: function() {
    return this.index >= this.code.length;
  },
  line: function() {
    return this.totalLine;
  },
  col: function() {
    return this.colMax;
  },
  error: function(s, str) {
    if(character.isUndefined(str)) {
      str = this.code.substr(this.index - 1, 20);
    }
    if(Lexer.mode() === Lexer.STRICT) {
      throw new Error(s + ', line ' + this.line() + ' col ' + this.colNum + '\n' + str);
    }
    else if(Lexer.mode() === Lexer.LOOSE && typeof console !== void 0) {
      console.warn(s + ', line ' + this.line() + ' col ' + this.colNum + '\n' + str);
    }
    return this;
  }
});
module.exports = HtmlLexer;