define(function(require, exports, module) {var Class = require('../util/Class');
var character = require('../util/character');
var JSXToken = require('./JSXToken');
var walk = require('../util/walk');
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

var JSXLexer = Lexer.extend(function(rule) {
  Lexer.call(this, rule);
}).methods({
  init: function() {
    Lexer.prototype.init.call(this);
    this.html = false; //目前是否为解析html状态
    this.state = false; //是否在<>中
    this.hStack = []; //当mark开始时++，减少时--，以此得知jsx部分结束回归js
    this.jStack = []; //当{开始时++，减少时--，以此得知js部分结束回归jsx
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
                var token = new JSXToken(JSXToken.MARK, this.peek + '>', this.peek + '>');
                this.dealToken(token, 2, 0, temp);
              }
              else {
                this.error('unknow jsx token: / ');
              }
            }
            //>
            else if(this.peek == '>') {
              this.state = false;
              //>结束时，html深度若为0，说明html状态结束
              if(!this.hStack.length) {
                this.html = false;
                this.isReg = false;
              }
              var token = new JSXToken(JSXToken.MARK, this.peek, this.peek);
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
            while(true) {
              //找不到<
              if(idx == -1 && idx2 == -1) {
                idx = length;
                if(idx > this.index) {
                  this.addText(this.code.slice(this.index - 1, idx), temp);
                  this.index = length;
                }
                return this;
              }
              //找到<
              if(idx2 == -1 || idx2 > idx) {
                var s = this.code.slice(idx, idx + 4).toLowerCase();
                //<!--注释
                if(s == '<!--') {
                  if(idx > this.index) {
                    this.addText(this.code.slice(this.index - 1, idx), temp);
                  }
                  var end = this.code.indexOf('-->', idx + 4);
                  if(end == -1) {
                    end = length;
                  }
                  else {
                    end += 3;
                  }
                  s = this.code.slice(idx, end);
                  var token = new JSXToken(JSXToken.COMMENT, s, s);
                  var n = character.count(token.val(), character.LINE);
                  this.dealToken(token, s.length, n, temp);
                  this.index = end;
                }
                //<
                else {
                  var c1 = this.code.charAt(idx + 1);
                  var c2 = this.code.charAt(idx + 2);
                  //</\w
                  if(c1 == '/' && character.isLetter(c2)) {
                    if(idx > this.index) {
                      this.addText(this.code.slice(this.index - 1, idx), temp);
                    }
                    this.state = true;
                    this.hStack[this.hStack.length - 1]--;
                    if(this.hStack[this.hStack.length - 1] == 0) {
                      this.hStack.pop();
                    }
                    //</
                    var token = new JSXToken(JSXToken.MARK, '</', '</');
                    this.dealToken(token, 2, 0, temp);
                    this.index = idx + 2;
                    this.readch();
                    //\w elem
                    this.dealTag(temp);
                    break;
                  }
                  //<\w
                  else if(character.isLetter(c1)) {
                    if(idx > this.index) {
                      this.addText(this.code.slice(this.index - 1, idx), temp);
                    }
                    this.state = true;
                    this.hStack[this.hStack.length - 1]++;
                    //<
                    var token = new JSXToken(JSXToken.MARK, '<', '<');
                    this.dealToken(token, 1, 0, temp);
                    this.index++;
                    this.readch();
                    //\w elem
                    this.dealTag(temp);
                    break;
                  }
                  else {
                    idx = this.code.indexOf('<', idx + 1);
                  }
                }
              }
              //{block
              else {
                if(idx2 > this.index) {
                  this.addText(this.code.slice(this.index - 1, idx2), temp);
                  this.readch();
                }
                this.jStack.push(1);
                this.html = false;
                this.braceState = false;
                var token = new JSXToken(JSXToken.SIGN, this.peek, this.peek);
                this.dealToken(token, 1, 0, temp);
                this.stateBrace(this.peek);
                break;
              }
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
    var token = new JSXToken(JSXToken.TEXT, s, s);
    var n = character.count(token.val(), character.LINE);
    this.dealToken(token, s.length, n, temp);
  },
  dealTag: function(temp) {
    ELEM.match(this.peek, this.code, this.index);
    var token = new JSXToken(ELEM.tokenType(), ELEM.content(), ELEM.val(), this.index - 1);
    var matchLen = ELEM.content().length;
    this.dealToken(token, matchLen, 0, temp);
    //ELEM:ELEM
    if(this.code.charAt(this.index) == ':') {
      this.readch();
      token = new JSXToken(JSXToken.SIGN, this.peek, this.peek, this.index - 1);
      this.dealToken(token, 1, 0, temp);
      if(!character.isLetter(this.code.charAt(this.index))) {
        this.error('missing jsx identifier');
      }
      this.readch();
      ELEM.match(this.peek, this.code, this.index);
      token = new JSXToken(ELEM.tokenType(), ELEM.content(), ELEM.val(), this.index - 1);
      this.dealToken(token, matchLen, 0, temp);
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
});
module.exports = JSXLexer;});