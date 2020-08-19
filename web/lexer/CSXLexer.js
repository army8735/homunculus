define(function(require, exports, module) {var character = require('../util/character');
var CSXToken = require('./CSXToken');
var EcmascriptLexer = require('./EcmascriptLexer');

var RegMatch = require('./match/RegMatch');
var CompleteEqual = require('./match/CompleteEqual');
var LineSearch = require('./match/LineSearch');
var CharacterSet = require('./match/CharacterSet');

var ELEM = new RegMatch(CSXToken.ELEM, /^\$?[a-z]\w*(?:-\w+)*/i);
var CSXMatch = [
  new CompleteEqual(CSXToken.BLANK, character.BLANK),
  new CompleteEqual(CSXToken.TAB, character.TAB),
  new CompleteEqual(CSXToken.LINE, character.ENTER + character.LINE),
  new CompleteEqual(CSXToken.LINE, character.ENTER),
  new CompleteEqual(CSXToken.LINE, character.LINE),
  new CompleteEqual(CSXToken.SIGN, character.DECIMAL),
  new LineSearch(CSXToken.STRING, '"', '"', true),
  new LineSearch(CSXToken.STRING, "'", "'", true),
  new CharacterSet(CSXToken.SIGN, '=:'),
  new RegMatch(CSXToken.NUMBER, /^\d+(?:\.\d*)?/),
  new RegMatch(CSXToken.BIND_PROPERTY, /^@[a-z]\w*/i),
  new RegMatch(CSXToken.PROPERTY, /^[a-z]\w*(?:-\w+)*/i)
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

var CSXLexer = EcmascriptLexer.extend(function(rule) {
  EcmascriptLexer.call(this, rule);
}).methods({
  init: function() {
    EcmascriptLexer.prototype.init.call(this);
    this.html = false; //目前是否为解析html状态
    this.state = false; //是否在<>中
    this.hStack = []; //当mark开始时++，减少时--，以此得知csx部分结束回归js
    this.jStack = []; //当{开始时++，}减少时--，以此得知js部分结束回归csx
    this.aStack = []; //html和js互相递归时，记录当前层是否在attr状态中
    this.cStack = []; //html和js互相递归时，记录当前csx标签是否是自闭合
    this.selfClose = false; //当前csx标签是否是自闭合
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
                var token = new CSXToken(CSXToken.MARK, this.peek + '>', this.peek + '>', this.index - 1);
                this.dealToken(token, 2, 0, temp);
              }
              else {
                this.error('unknow csx token: ' + this.code.charAt(this.index));
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
              var token = new CSXToken(CSXToken.MARK, this.peek, this.peek, this.index - 1);
              this.dealToken(token, 1, 0, temp);
            }
            //<>和</>
            else if(this.peek == '<') {
              if(this.code.charAt(this.index) == '>') {
                var token = new CSXToken(CSXToken.MARK, this.peek, this.peek, this.index - 1);
                this.dealToken(token, 1, 0, temp);
                this.readch();
                token = new CSXToken(CSXToken.MARK, this.peek, this.peek, this.index - 1);
                this.dealToken(token, 1, 0, temp);
              }
              else if(this.code.charAt(this.index) == '/' && this.code.charAt(this.index + 1) == '>') {
                var token = new CSXToken(CSXToken.MARK, this.peek, this.peek, this.index - 1);
                this.dealToken(token, 1, 0, temp);
                this.readch();
                token = new CSXToken(CSXToken.MARK, '</', '</', this.index - 1);
                this.dealToken(token, 2, 0, temp);
                this.index += 2;
              }
              else {
                this.error('unknow csx token: ' + this.code.charAt(this.index));
              }
            }
            //{递归进入js状态
            else if(this.peek == '{') {
              this.html = false;
              this.jStack.push(1);
              this.cStack.push(this.selfClose);
              this.aStack.push(this.state);
              var token = new CSXToken(CSXToken.SIGN, this.peek, this.peek);
              this.dealToken(token, 1, 0, temp);
              this.stateBrace(this.peek);
            }
            else {
              for(var i = 0, len = CSXMatch.length; i < len; i++) {
                var match = CSXMatch[i];
                if(match.match(this.peek, this.code, this.index)) {
                  var token = new CSXToken(match.tokenType(), match.content(), match.val(), this.index - 1);
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
              this.error('unknow csx token');
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
                var token = new CSXToken(CSXToken.MARK, '</', '</', this.index - 1);
                this.dealToken(token, 2, 0, temp);
                this.index = idx + 2;
                this.readch();
                //\w elem
                this.dealTag(temp, true);
              }
              //</>
              else if(c1 == '/' && c2 == '>') {
                if(idx > this.index - 1) {
                  this.addText(this.code.slice(this.index - 1, idx), temp);
                  this.index = idx;
                }
                this.state = true;
                this.hStack[this.hStack.length - 1]--;
                //</
                var token = new CSXToken(CSXToken.MARK, '</', '</', this.index - 1);
                this.dealToken(token, 2, 0, temp);
                this.index = idx + 2;
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
                var token = new CSXToken(CSXToken.MARK, '<', '<', this.index - 1);
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
              var token = new CSXToken(CSXToken.SIGN, this.peek, this.peek, this.index - 1);
              this.dealToken(token, 1, 0, temp);
              this.stateBrace(this.peek);
            }
          }
        }
        //<\w开始则csx，<作为mark开头和识别正则/开头上下文语意相同
        else if(this.isReg == CSXLexer.IS_REG
          && this.peek == '<'
          && character.isLetter(this.code.charAt(this.index))) {
          //新的csx开始，html深度++，html状态开始，同时为非text状态
          this.hStack.push(1);
          this.html = true;
          this.state = true;
          //<
          var token = new CSXToken(CSXToken.MARK, this.peek, this.peek, this.index - 1);
          this.dealToken(token, 1, 0, temp);
          this.readch();
          //\w elem
          this.dealTag(temp);
        }
        //<>则csx，fragment出现
        else if(this.isReg == CSXLexer.IS_REG
          && this.peek == '<'
          && this.code.charAt(this.index) == '>') {
          //新的csx开始，html深度++，html状态开始，同时为非text状态
          this.hStack.push(1);
          this.html = true;
          //<>
          var token = new CSXToken(CSXToken.MARK, this.peek, this.peek, this.index - 1);
          this.dealToken(token, 1, 0, temp);
          this.readch();
          token = new CSXToken(CSXToken.MARK, this.peek, this.peek, this.index - 1);
          this.dealToken(token, 1, 0, temp);
        }
        //perl风格正则
        else if(perlReg
          && this.isReg == CSXLexer.IS_REG
          && this.peek == character.SLASH
          && !{ '/': true, '*': true }[this.code.charAt(this.index)]) {
          this.dealReg(temp, length);
          this.isReg = CSXLexer.NOT_REG;
        }
        //template特殊语法
        else if(this.peek == character.GRAVE) {
          this.dealGrave(temp, length);
          this.isReg = EcmascriptLexer.NOT_REG;
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
              var token = new CSXToken(match.tokenType(), match.content(), match.val(), this.index - 1);
              var error = match.error();
              var matchLen = match.content().length;
              if(error) {
                this.error(error, this.code.slice(this.index - matchLen, this.index));
              }
              if(token.type() == CSXToken.ID
                && this.rule.keyWords().hasOwnProperty(token.content())) {
                token.type(CSXToken.KEYWORD);
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
              if(perlReg && match.perlReg() != EcmascriptLexer.IGNORE) {
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
    var token = new CSXToken(CSXToken.TEXT, s, s, this.index - 1);
    var n = character.count(token.val(), character.LINE);
    this.dealToken(token, s.length, n, temp);
  },
  dealTag: function(temp, end) {
    ELEM.match(this.peek, this.code, this.index);
    var token = new CSXToken(ELEM.tokenType(), ELEM.content(), ELEM.val(), this.index - 1);
    var matchLen = ELEM.content().length;
    this.dealToken(token, matchLen, 0, temp);
    if(!end) {
      //自闭合没有.和:
      if(SELF_CLOSE.hasOwnProperty(token.content().toLowerCase())) {
        this.selfClose = true;
        return;
      }
      this.selfClose = false;
    }
    this.selfClose = false;
    var c = this.code.charAt(this.index);
    if(c == '.') {
      while(true) {
        this.readch();
        token = new CSXToken(CSXToken.SIGN, this.peek, this.peek, this.index - 1);
        this.dealToken(token, 1, 0, temp);
        this.readch();
        if(!character.isLetter(this.peek)) {
          this.error('missing csx identifier');
        }
        ELEM.match(this.peek, this.code, this.index);
        token = new CSXToken(ELEM.tokenType(), ELEM.content(), ELEM.val(), this.index - 1);
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
        token = new CSXToken(CSXToken.SIGN, this.peek, this.peek, this.index - 1);
        this.dealToken(token, 1, 0, temp);
        this.readch();
        if(!character.isLetter(this.peek)) {
          this.error('missing csx identifier');
        }
        ELEM.match(this.peek, this.code, this.index);
        token = new CSXToken(ELEM.tokenType(), ELEM.content(), ELEM.val(), this.index - 1);
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
          this.selfClose = this.cStack.pop();
          this.state = this.aStack.pop();
          this.jStack.pop();
        }
      }
    }
  }
}).statics({
  SELF_CLOSE: SELF_CLOSE
});
module.exports = CSXLexer;
});