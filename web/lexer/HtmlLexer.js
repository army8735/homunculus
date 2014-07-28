define(function(require, exports, module) {
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
        }
        else {
          var end = this.code.indexOf('<', this.index);
          if(end == -1) {
            end = length;
            var s = this.code.slice(this.index, end);
            var text = new Token(Token.TEXT, s, s, this.index);
            temp.push(text);
            this.tokenList.push(text);
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
});