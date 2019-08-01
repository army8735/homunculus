define(function(require, exports, module) {var character = require('../util/character');
var Token = require('./AxmlToken');
var Lexer = require('./Lexer');

var RegMatch = require('./match/RegMatch');
var ELEM = new RegMatch(Token.ELEM, /^[a-z]\w*(?:-\w+)*/i);

var AxmlLexer = Lexer.extend(function(rule) {
  Lexer.call(this, rule);
}).methods({
  init: function() {
    Lexer.prototype.init.call(this);
    this.state = false; //是否在<>状态中
    this.style = false; //style标签
    this.script = false; //script标签
  },
  scan: function(temp) {
    var length = this.code.length;
    var count = 0;
    this.colNum = length ? 1 : 0;
    outer:
      while(this.index < length) {
        if(this.cacheLine > 0 && count >= this.cacheLine) {
          break;
        }
        if(this.state) {
          this.readch();
          // />
          if(this.peek == '/') {
            if(this.code.charAt(this.index) == '>') {
              this.state = false;
              var token = new Token(Token.MARK, this.peek + '>', this.peek + '>', this.index - 1);
              this.dealToken(token, 2, 0, temp);
            }
            else {
              this.error('unknow html token: / ');
            }
          }
          else if(this.peek == '>') {
            this.state = false;
            var token = new Token(Token.MARK, this.peek, this.peek, this.index - 1);
            this.dealToken(token, 1, 0, temp);
          }
          else {
            for(var i = 0, matches = this.rule.matches(), len = matches.length; i < len; i++) {
              var match = matches[i];
              if(match.match(this.peek, this.code, this.index)) {
                var token = new Token(match.tokenType(), match.content(), match.val(), this.index - 1);
                var error = match.error();
                var matchLen = match.content().length;
                if(error) {
                  this.error(error, this.code.slice(this.index - matchLen, this.index));
                }
                var n = character.count(token.val(), character.LINE);
                count += n;
                this.dealToken(token, matchLen, n, temp);
                continue outer;
              }
            }
            //如果有未匹配的，说明规则不完整，抛出错误
            this.error('unknow token');
          }
        }
        else if(this.style || this.script) {
          this.dealStSc(this.style ? 'style' : 'script', temp);
          this.style = this.script = false;
        }
        else {
          this.readch();
          var idx = this.code.indexOf('<', this.index - 1);
          if(idx == -1) {
            idx = length;
            if(this.index && idx > this.index - 1) {
              this.addText(this.code.slice(this.index - 1, idx), temp);
              this.index = length;
            }
            return this;
          }
          if(this.index && idx > this.index - 1) {
            this.addText(this.code.slice(this.index - 1, idx), temp);
            this.readch();
          }
          var s = this.code.slice(idx, idx + 4).toLowerCase();
          var c1 = this.code.charAt(idx + 1);
          var c2 = this.code.charAt(idx + 2);
          if(s == '<!--') {
            var end = this.code.indexOf('-->', this.index + 4);
            if(end == -1) {
              end = length;
            }
            else {
              end += 3;
            }
            s = this.code.slice(idx, end);
            var token = new Token(Token.COMMENT, s, s, this.index - 1);
            var n = character.count(s, character.LINE);
            this.dealToken(token, s.length, n, temp);
          }
          //</\w
          else if(c1 == '/' && character.isLetter(c2)) {
            this.state = true;
            var token = new Token(Token.MARK, '</', '</', this.index - 1);
            this.dealToken(token, 2, 0, temp);
            this.readch();
            //\w elem
            this.dealTag(temp);
          }
          //<\w
          else if(character.isLetter(c1)) {
            this.state = true;
            var token = new Token(Token.MARK, '<', '<', this.index - 1);
            this.dealToken(token, 1, 0, temp);
            this.readch();
            //\w elem
            this.dealTag(temp);
          }
          else if(c1 == '!') {
            this.state = true;
            var token = new Token(Token.MARK, '<', '<', this.index - 1);
            this.dealToken(token, 1, 0, temp);
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
          this.addText(s, temp);
          this.index = i;
          return;
        }
      }
    }
    var s = this.code.slice(this.index);
    this.index = this.code.length;
    this.addText(s, temp);
  },
  addText: function(s, temp) {
    var token = new Token(Token.TEXT, s, s, this.index - 1);
    var n = character.count(token.val(), character.LINE);
    this.dealToken(token, s.length, n, temp);
  },
  dealTag: function(temp) {
    ELEM.match(this.peek, this.code, this.index);
    var token = new Token(ELEM.tokenType(), ELEM.content(), ELEM.val(), this.index - 1);
    var matchLen = ELEM.content().length;
    this.dealToken(token, matchLen, 0, temp);
    var s = ELEM.content().toLowerCase();
    if(s == 'style') {
      this.style = true;
    }
    else if(s == 'script') {
      this.script = true;
    }
  }
});
module.exports = AxmlLexer;
});