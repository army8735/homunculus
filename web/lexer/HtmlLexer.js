define(function(require, exports, module) {var Class = require('../util/Class');
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
    this.index2 = 0; //临时索引
    this.tokenList = []; //结果的token列表
    this.cacheLine = 0; //行缓存值
    this.totalLine = 1; //总行数
    this.colNum = 0; //列
    this.colMax = 0; //最大列数
    this.state = false; //是否在<>状态中
    this.style = false;
    this.script = false;
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
        if(this.peek == '/') {
          if(this.code.charAt(this.index) == '>') {
            this.state = false;
            var token = new Token(Token.MARK, this.peek + '>', this.peek + '>');
            temp.push(token);
            this.tokenList.push(token);
            this.index2 = ++this.index;
            continue;
          }
          else {
            this.error();
          }
        }
        else if(this.peek == '>') {
          this.state = false;
          var token = new Token(Token.MARK, this.peek, this.peek);
          temp.push(token);
          this.tokenList.push(token);
          this.index2 = this.index;
          continue;
        }
        for(var i = 0, matches = this.rule.matches(), len = matches.length; i < len; i++) {
          var match = matches[i];
          if(match.match(this.peek, this.code, this.index)) {
            var token = new Token(match.tokenType(), match.content(), match.val(), this.index - 1);
            var error = match.error();
            var matchLen = match.content().length;
            if(error) {
              this.error(error, this.code.slice(this.index - matchLen, this.index));
            }
            if(token.type() == Token.ID
              && this.rule.keyWords().hasOwnProperty(token.content())) {
              token.type(Token.KEYWORD);
            }

            if(this.last) {
              token.prev(this.last);
              this.last.next(token);
            }
            this.last = token;

            //回调可自定义处理匹配的token
            if(match.callback) {
              match.callback(token);
            }

            temp.push(token);
            this.tokenList.push(token);
            this.index2 = this.index += matchLen - 1;
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
        }
        //如果有未匹配的，说明规则不完整，抛出错误
        this.error('unknow token');
      }
      else if(this.style || this.script) {
        this.dealStSc(this.style ? 'style' : 'script', temp);
        this.style = this.script = false;
      }
      else {
        var idx = this.code.indexOf('<', this.index);
        if(idx == -1) {
          idx = length;
          if(idx > this.index2) {
            this.addText(this.code.slice(this.index2, idx), temp);
          }
          return this;
        }
        var s = this.code.slice(idx, idx + 4).toLowerCase();
        var c1 = this.code.charAt(idx);
        var c2 = this.code.charAt(idx + 1);
        if(s == '<!--') {
          var end = this.code.indexOf('-->', this.index + 4);
          if(end == -1) {
            end = length;
          }
          else {
            end += 3;
          }
          if(idx > this.index2) {
            this.addText(this.code.slice(this.index2, idx), temp);
          }
          s = this.code.slice(idx, end);
          var token = new Token(Token.COMMENT, s, s);
          this.last = token;
          temp.push(token);
          this.tokenList.push(token);
          this.index2 = this.index = end;
        }
        else if(c1 == '<') {
          if(c2 == '/') {
            if(idx > this.index2) {
              this.addText(this.code.slice(this.index2, idx), temp);
            }
            this.state = true;
            s = c1 + c2;
            var token = new Token(Token.MARK, s, s);
            this.last = token;
            temp.push(token);
            this.tokenList.push(token);
            this.index2 = this.index = idx + 2;
          }
          else if(character.isLetter(c2) || c2 == '!') {
            if(idx > this.index2) {
              this.addText(this.code.slice(this.index2, idx), temp);
            }
            s = this.code.slice(idx + 1, idx + 7).toLowerCase();
            if(/^style\b/i.test(s)) {
              this.style = true;
            }
            else if(/^script\b/i.test(s)) {
              this.script = true;
            }
            this.state = true;
            var token = new Token(Token.MARK, c1, c1);
            this.last = token;
            temp.push(token);
            this.tokenList.push(token);
            this.index2 = this.index = idx + 1;
          }
        }
      }
    }
    return this;
  },
  dealStSc: function(s, temp) {
    var reg = new RegExp('^/' + s + '\\b');
    for(var i = this.index; i < this.code.length; i++) {
      if(this.code.charAt(i) == '<') {
        if(reg.test(this.code.slice(i + 1, i + 8))) {
          var s = this.code.slice(this.index, i);
          this.index = this.index2 = i;
          this.addText(s, temp);
          return;
        }
      }
    }
    var s = this.code.slice(this.index);
    this.index = this.index2 = this.code.length;
    this.addText(s, temp);
  },
  addText: function(s, temp) {
    var token = new Token(Token.TEXT, s, s);
    this.last = token;
    temp.push(token);
    this.tokenList.push(token);
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
    if(HtmlLexer.mode() === HtmlLexer.STRICT) {
      throw new Error(s + ', line ' + this.line() + ' col ' + this.colNum + '\n' + str);
    }
    else if(HtmlLexer.mode() === HtmlLexer.LOOSE && typeof console !== void 0) {
      console.warn(s + ', line ' + this.line() + ' col ' + this.colNum + '\n' + str);
    }
    return this;
  }
}).statics({
  STRICT: 0,
  LOOSE: 1,
  mode: function(i) {
    if(!character.isUndefined(i)) {
      cmode = i;
    }
    return cmode;
  }
});
var cmode = HtmlLexer.STRICT;
module.exports = HtmlLexer;});