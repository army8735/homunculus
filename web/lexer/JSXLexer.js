define(function(require, exports, module) {var character = require('../util/character');
var JSXToken = require('./JSXToken');
var Lexer = require('./Lexer');

var RegMatch = require('./match/RegMatch');
var CompleteEqual = require('./match/CompleteEqual');
var LineSearch = require('./match/LineSearch');
var CharacterSet = require('./match/CharacterSet');

var ELEM = new RegMatch(JSXToken.ELEM, /^[a-z]\w*(?:-\w+)*/i);
var JSXMatch = [
  new CompleteEqual(JSXToken.BLANK, character.BLANK),
  new CompleteEqual(JSXToken.TAB, character.TAB),
  new CompleteEqual(JSXToken.LINE, character.ENTER + character.LINE),
  new CompleteEqual(JSXToken.LINE, character.ENTER),
  new CompleteEqual(JSXToken.LINE, character.LINE),
  new CompleteEqual(JSXToken.SIGN, character.DECIMAL),
  new LineSearch(JSXToken.STRING, '"', '"', true),
  new LineSearch(JSXToken.STRING, "'", "'", true),
  new CharacterSet(JSXToken.SIGN, '=:'),
  new RegMatch(JSXToken.NUMBER, /^\d+(?:\.\d*)?/),
  new RegMatch(JSXToken.PROPERTY, /^[a-z]+(?:-\w+)*/i)
];

var SELF_CLOSE = {
  'img': true,
  'meta': true,
  'link': true,
  'br': true,
  'basefont': true,
  'base': true,
  'col': true,
  'embed': true,
  'frame': true,
  'hr': true,
  'input': true,
  'keygen': true,
  'area': true,
  'param': true,
  'source': true,
  'track': true
};

var JSXLexer = Lexer.extend(function(rule) {
  Lexer.call(this, rule);
}).methods({
  init: function() {
    Lexer.prototype.init.call(this);
    this.html = false; //目前是否为解析html状态
    this.state = false; //是否在<>中
    this.hStack = []; //当mark开始时++，减少时--，以此得知jsx部分结束回归js
    this.jStack = []; //当{开始时++，减少时--，以此得知js部分结束回归jsx
    this.selfClose = false; //当前jsx标签是否是自闭和
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
        //在解析html中
        if(this.html) {
          if(this.state) {
            // />
            if(this.peek == '/') {
              if(this.code.charAt(this.index) == '>') {
                this.state = false;
                // />结束时，html深度--，如到0，说明html状态结束
                this.hStack[this.hStack.length - 1]--;
                if(this.hStack[this.hStack.length - 1] == 0) {
                  this.hStack.pop();
                  this.html = false;
                  this.isReg = false;
                }
                var token = new JSXToken(JSXToken.MARK, this.peek + '>', this.peek + '>', this.index - 1);
                this.dealToken(token, 2, 0, temp);
              }
              else {
                this.error('unknow jsx token: / ');
              }
            }
            //>
            else if(this.peek == '>') {
              if(this.selfClose) {
                this.error('self-close tag needs />');
              }
              this.state = false;
              //>结束时，html深度若为0，说明html状态结束，或者栈最后一个计数器为0，也结束
              if(!this.hStack.length || !this.hStack[this.hStack.length - 1]) {
                this.html = false;
                this.isReg = false;
                if(this.hStack.length) {
                  this.hStack.pop();
                }
              }
              var token = new JSXToken(JSXToken.MARK, this.peek, this.peek, this.index - 1);
              this.dealToken(token, 1, 0, temp);
            }
            //{递归进入js状态
            else if(this.peek == '{') {
              this.html = false;
              this.braceState = false;
              this.jStack.push(1);
              var token = new JSXToken(JSXToken.SIGN, this.peek, this.peek);
              this.dealToken(token, 1, 0, temp);
              this.stateBrace(this.peek);
            }
            else {
              for(var i = 0, len = JSXMatch.length; i < len; i++) {
                var match = JSXMatch[i];
                if(match.match(this.peek, this.code, this.index)) {
                  var token = new JSXToken(match.tokenType(), match.content(), match.val(), this.index - 1);
                  var error = match.error();
                  if(error) {
                    this.error(error, this.code.slice(this.index - matchLen, this.index));
                  }
                  var matchLen = match.content().length;
                  var n = character.count(token.val(), character.LINE);
                  count += n;
                  this.dealToken(token, matchLen, n, temp);
                  continue outer;
                }
              }
              //如果有未匹配的，说明规则不完整，抛出错误
              this.error('unknow jsx token');
            }
          }
          //<>外面
          else {
            //<之前的text部分或{}js部分
            var idx = this.code.indexOf('<', this.index - 1);
            var idx2 = this.code.indexOf('{', this.index - 1);
            //找不到<和{
            if(idx == -1 && idx2 == -1) {
              idx = length;
              if(idx > this.index - 1) {
                this.addText(this.code.slice(this.index - 1, idx), temp);
                this.index = length;
              }
              return this;
            }
            //找到<
            if(idx2 == -1 || idx2 > idx) {
              var c1 = this.code.charAt(idx + 1);
              var c2 = this.code.charAt(idx + 2);
              //</\w
              if(c1 == '/' && character.isLetter(c2)) {
                if(idx > this.index - 1) {
                  this.addText(this.code.slice(this.index - 1, idx), temp);
                  this.index = idx;
                }
                this.state = true;
                this.hStack[this.hStack.length - 1]--;
                //</
                var token = new JSXToken(JSXToken.MARK, '</', '</', this.index - 1);
                this.dealToken(token, 2, 0, temp);
                this.index = idx + 2;
                this.readch();
                //\w elem
                this.dealTag(temp);
              }
              //<\w
              else if(character.isLetter(c1)) {
                if(idx > this.index - 1) {
                  this.addText(this.code.slice(this.index - 1, idx), temp);
                  this.index = idx;
                }
                this.state = true;
                this.hStack[this.hStack.length - 1]++;
                //<
                var token = new JSXToken(JSXToken.MARK, '<', '<', this.index - 1);
                this.dealToken(token, 1, 0, temp);
                this.index = idx + 1;
                this.readch();
                //\w elem
                this.dealTag(temp);
              }
              else {
                this.error();
              }
            }
            //{block
            else {
              if(idx2 > this.index - 1) {
                this.addText(this.code.slice(this.index - 1, idx2), temp);
                this.readch();
              }
              this.jStack.push(1);
              this.html = false;
              this.braceState = false;
              var token = new JSXToken(JSXToken.SIGN, this.peek, this.peek, this.index - 1);
              this.dealToken(token, 1, 0, temp);
              this.stateBrace(this.peek);
            }
          }
        }
        //<\w开始则jsx，<作为mark开头和识别正则/开头上下文语意相同
        else if(this.isReg == JSXLexer.IS_REG
          && this.peek == '<'
          && character.isLetter(this.code.charAt(this.index))) {
          //新的jsx开始，html深度++，html状态开始，同时为非text状态
          this.hStack.push(1);
          this.html = true;
          this.state = true;
          //<
          var token = new JSXToken(JSXToken.MARK, this.peek, this.peek, this.index - 1);
          this.dealToken(token, 1, 0, temp);
          this.readch();
          //\w elem
          this.dealTag(temp);
          this.braceState = false;
        }
        //perl风格正则
        else if(perlReg
          && this.isReg == JSXLexer.IS_REG
          && this.peek == character.SLASH
          && !{ '/': true, '*': true }[this.code.charAt(this.index)]) {
          this.dealReg(temp, length);
          this.isReg = JSXLexer.NOT_REG;
        }
        //依次遍历匹配规则，命中则继续
        else {
          for(var i = 0, matches = this.rule.matches(), len = matches.length; i < len; i++) {
            var match = matches[i];
            if(match.match(this.peek, this.code, this.index)) {
              var token = new JSXToken(match.tokenType(), match.content(), match.val(), this.index - 1);
              var error = match.error();
              var matchLen = match.content().length;
              if(error) {
                this.error(error, this.code.slice(this.index - matchLen, this.index));
              }
              if(token.type() == JSXToken.ID
                && this.rule.keyWords().hasOwnProperty(token.content())) {
                token.type(JSXToken.KEYWORD);
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
              this.xBrace(match.content());

              continue outer;
            }
          }
          //如果有未匹配的，说明规则不完整，抛出错误
          this.error('unknow token');
        }
      }
    return this;
  },
  addText: function(s, temp) {
    var token = new JSXToken(JSXToken.TEXT, s, s, this.index - 1);
    var n = character.count(token.val(), character.LINE);
    this.dealToken(token, s.length, n, temp);
  },
  dealTag: function(temp) {
    ELEM.match(this.peek, this.code, this.index);
    var token = new JSXToken(ELEM.tokenType(), ELEM.content(), ELEM.val(), this.index - 1);
    var matchLen = ELEM.content().length;
    this.dealToken(token, matchLen, 0, temp);
    //自闭和没有.和:
    if(SELF_CLOSE.hasOwnProperty(token.content().toLowerCase())) {
      this.selfClose = true;
      return;
    }
    this.selfClose = false;
    var c = this.code.charAt(this.index);
    if(c == '.') {
      while(true) {
        this.readch();
        token = new JSXToken(JSXToken.SIGN, this.peek, this.peek, this.index - 1);
        this.dealToken(token, 1, 0, temp);
        this.readch();
        if(!character.isLetter(this.peek)) {
          this.error('missing jsx identifier');
        }
        ELEM.match(this.peek, this.code, this.index);
        token = new JSXToken(ELEM.tokenType(), ELEM.content(), ELEM.val(), this.index - 1);
        matchLen = ELEM.content().length;
        this.dealToken(token, matchLen, 0, temp);
        c = this.code.charAt(this.index);
        if(c != '.') {
          break;
        }
      }
    }
    else if(c == ':') {
      while(true) {
        this.readch();
        token = new JSXToken(JSXToken.SIGN, this.peek, this.peek, this.index - 1);
        this.dealToken(token, 1, 0, temp);
        this.readch();
        if(!character.isLetter(this.peek)) {
          this.error('missing jsx identifier');
        }
        ELEM.match(this.peek, this.code, this.index);
        token = new JSXToken(ELEM.tokenType(), ELEM.content(), ELEM.val(), this.index - 1);
        matchLen = ELEM.content().length;
        this.dealToken(token, matchLen, 0, temp);
        c = this.code.charAt(this.index);
        if(c != ':') {
          break;
        }
      }
    }
  },
  xBrace: function(content) {
    if(content == '{') {
      if(this.jStack.length) {
        this.jStack[this.jStack.length - 1]++;
      }
    }
    else if(content == '}') {
      if(this.jStack.length) {
        this.jStack[this.jStack.length - 1]--;
        if(this.jStack[this.jStack.length - 1] == 0) {
          this.html = true;
          this.jStack.pop();
        }
      }
    }
  }
}).statics({
  SELF_CLOSE: SELF_CLOSE
});
module.exports = JSXLexer;});