define(function(require, exports, module) {var character = require('../util/character');
var Token = require('./Token');
var Lexer = require('./Lexer');
var EcmascriptRule = require('./rule/EcmascriptRule');

var EcmascriptLexer = Lexer.extend(function(rule, inTemplate) {
  Lexer.call(this, rule);
  this.inTemplate = inTemplate;
}).methods({
  init: function() {
    Lexer.prototype.init.call(this);
  },
  scan: function(temp) {
    var perlReg = this.rule.perlReg();
    var length = this.code.length;
    var count = 0;
    this.colNum = length ? 1 : 0;
    outer:
      while(this.index < length) {
        if(this.cacheLine > 0 && count >= this.cacheLine) {
          break;
        }
        this.readch();
        //perl风格正则
        if(perlReg
          && this.isReg == Lexer.IS_REG
          && this.peek == character.SLASH
          && !{ '/': true, '*': true }[this.code.charAt(this.index)]) {
          this.dealReg(temp, length);
          this.isReg = Lexer.NOT_REG;
        }
        //template特殊语法
        else if(this.peek == character.GRAVE) {
          this.dealGrave(temp, length);
          this.isReg = Lexer.NOT_REG;
        }
        //递归解析template中的expr时结束跳出
        else if(this.inTemplate && this.peek == '}') {
          return this;
        }
        //依次遍历匹配规则，命中则继续
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

              if(token.type() == Token.ID
                && this.rule.keyWords().hasOwnProperty(token.content())) {
                token.type(Token.KEYWORD);
              }

              //回调可自定义处理匹配的token
              if(match.callback) {
                match.callback.call(match, token, this.tokenList);
              }
              //回调特殊处理忽略掉此次匹配
              if(match.cancel) {
                token.cancel();
                continue;
              }

              var n = character.count(token.val(), character.LINE);
              count += n;
              //处理token
              this.dealToken(token, matchLen, n, temp);
              //支持perl正则需判断关键字、圆括号对除号语义的影响
              if(perlReg && match.perlReg() != Lexer.IGNORE) {
                this.stateReg(match);
              }
              //处理{
              this.stateBrace(match.content(), token.type());

              continue outer;
            }
          }
          //如果有未匹配的，说明规则不完整，抛出错误
          this.error('unknow token');
        }
      }
    return this;
  },
  dealGrave: function(temp, length) {
    var lastIndex = this.index - 1;
    var res = false;
    var expr = false;
    var head = true;
    var tempIndex = lastIndex;
    do {
      this.readch();
      if(this.peek == character.BACK_SLASH) {
        this.index++;
      }
      else if(this.peek == character.DOLLAR) {
        this.readch();
        if(this.peek == character.LEFT_BRACE) {
          this.readch();
          expr = true;
          var token = new Token(head ? Token.TEMPLATE_HEAD : Token.TEMPLATE_MIDDLE, this.code.slice(tempIndex, --this.index), lastIndex);
          head = false;
          this.index = tempIndex + 1;
          var n = character.count(token.val(), character.LINE);
          this.dealToken(token, token.content().length, n, temp);
          var lexer = new EcmascriptLexer(new EcmascriptRule(), true);
          lexer.index = this.index;
          lexer.colNum = this.colNum;
          lexer.colMax = this.colMax;
          lexer.totalLine = this.totalLine;
          lexer.parse(this.code);
          var tokenList = lexer.tokenList;
          for(var i = 0, len = tokenList.length; i < len; i++) {
            var n = character.count(token.val(), character.LINE);
            this.dealToken(tokenList[i], token.content().length, n, temp);
          }
          tempIndex = this.index = lexer.index - 1;
        }
      }
      else if(this.peek == character.GRAVE) {
        res = true;
        break;
      }
    } while(this.index < length);
    if(!res) {
      this.error('SyntaxError: unterminated template literal',
        this.code.slice(lastIndex, this.index - 1));
    }
    var token = new Token(expr ? Token.TEMPLATE_TAIL : Token.TEMPLATE, this.code.slice(tempIndex, this.index), tempIndex);
    this.index = tempIndex + 1;
    var n = character.count(token.val(), character.LINE);
    this.dealToken(token, token.content().length, n, temp);
  }
});
module.exports = EcmascriptLexer;
});