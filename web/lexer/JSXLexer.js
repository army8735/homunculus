define(function(require, exports, module) {var Class = require('../util/Class');
var character = require('../util/character');
var JSXToken = require('./JSXToken');
var walk = require('../util/walk');

var RegMatch = require('./match/RegMatch');
var CompleteEqual = require('./match/CompleteEqual');
var LineSearch = require('./match/LineSearch');

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
  new CompleteEqual(JSXToken.SIGN, '=', null, true),
  new RegMatch(JSXToken.NUMBER, /^\d+(?:\.\d*)?/),
  new RegMatch(JSXToken.ATTR, /^[a-z]+(?:-\w+)*/i)
];

var JSXLexer = Class(function(rule) {
  this.rule = rule; //当前语法规则
  this.init();
}).methods({
  init: function() {
    this.code = ''; //要解析的代码
    this.peek = ''; //向前看字符
    this.index = 0; //向前看字符字符索引
    this.isReg = JSXLexer.IS_REG; //当前/是否是perl风格正则表达式
    this.tokenList = []; //结果的token列表
    this.parentheseState = false; //(开始时标记之前终结符是否为if/for/while等关键字
    this.parentheseStack = []; //圆括号深度记录当前是否为if/for/while等语句内部
    this.cacheLine = 0; //行缓存值
    this.totalLine = 1; //总行数
    this.colNum = 0; //列
    this.colMax = 0; //最大列数
    this.last = null;
    this.html = false; //目前是否为解析html状态
    this.state = false; //是否在<>中
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
  tokens: function(plainObject) {
    if(plainObject) {
      return walk.plainObject(this.tokenList);
    }
    return this.tokenList;
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
                var token = new JSXToken(JSXToken.MARK, this.peek + '>', this.peek + '>');
                token.prev(this.last);
                this.last.next(token);
                this.last = token;
                temp.push(token);
                this.tokenList.push(token);
                token.line(this.totalLine);
                token.col(this.colNum);
                this.colNum += 2;
                this.colMax = Math.max(this.colMax, this.colNum);
                this.readch(); //不要忘了多读了个>
              }
              else {
                this.error();
              }
            }
            //>
            else if(this.peek == '>') {
              this.state = false;
              var token = new JSXToken(JSXToken.MARK, this.peek, this.peek);
              token.prev(this.last);
              this.last.next(token);
              this.last = token;
              temp.push(token);
              this.tokenList.push(token);
              token.line(this.totalLine);
              token.col(this.colNum);
              this.colNum++;
              this.colMax = Math.max(this.colMax, this.colNum);
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
                  token.prev(this.last);
                  this.last.next(token);
                  this.last = token;
                  temp.push(token);
                  this.tokenList.push(token);
                  token.line(this.totalLine);
                  token.col(this.colNum);
                  var n = character.count(token.val(), character.LINE);
                  count += n;
                  this.totalLine += n;
                  this.index += matchLen - 1;
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
                }
              }
              //如果有未匹配的，说明规则不完整，抛出错误
              this.error('unknow jsx token');
            }
          }
          else {
            //<之前的text部分
            var idx = this.code.indexOf('<', this.index);
            while(true) {
              //找不到<
              if(idx == -1) {
                idx = length;
                if(idx > this.index) {
                  this.addText(this.code.slice(this.index - 1, idx), temp);
                  this.index = length;
                }
                return this;
              }
              //找到<
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
                if(this.last) {
                  token.prev(this.last);
                  this.last.next(token);
                }
                this.last = token;
                temp.push(token);
                this.tokenList.push(token);
                token.line(this.totalLine);
                token.col(this.colNum);
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
                  //</
                  var token = new JSXToken(JSXToken.MARK, '</', '</');
                  if(this.last) {
                    token.prev(this.last);
                    this.last.next(token);
                  }
                  this.last = token;
                  temp.push(token);
                  this.tokenList.push(token);
                  token.line(this.totalLine);
                  token.col(this.colNum);
                  this.colNum += 2;
                  this.index = idx + 2;
                  this.readch();
                  //\w elem
                  ELEM.match(this.peek, this.code, this.index);
                  var token = new JSXToken(ELEM.tokenType(), ELEM.content(), ELEM.val(), this.index - 1);
                  var matchLen = ELEM.content().length;
                  token.prev(this.last);
                  this.last.next(token);
                  this.last = token;
                  temp.push(token);
                  this.tokenList.push(token);
                  this.index += matchLen - 1;
                  token.line(this.totalLine);
                  token.col(this.colNum);
                  this.colNum += matchLen;
                  this.colMax = Math.max(this.colMax, this.colNum);
                  break;
                }
                //<\w
                else if(character.isLetter(c1)) {
                  if(idx > this.index) {
                    this.addText(this.code.slice(this.index - 1, idx), temp);
                  }
                  this.state = true;
                  //<
                  var token = new JSXToken(JSXToken.MARK, '<', '<');
                  if(this.last) {
                    token.prev(this.last);
                    this.last.next(token);
                  }
                  this.last = token;
                  temp.push(token);
                  this.tokenList.push(token);
                  token.line(this.totalLine);
                  token.col(this.colNum);
                  this.colNum++;
                  this.index = idx + 1;
                  this.readch();
                  //\w elem
                  ELEM.match(this.peek, this.code, this.index);
                  var token = new JSXToken(ELEM.tokenType(), ELEM.content(), ELEM.val(), this.index - 1);
                  var matchLen = ELEM.content().length;
                  token.prev(this.last);
                  this.last.next(token);
                  this.last = token;
                  temp.push(token);
                  this.tokenList.push(token);
                  this.index += matchLen - 1;
                  token.line(this.totalLine);
                  token.col(this.colNum);
                  this.colNum += matchLen;
                  this.colMax = Math.max(this.colMax, this.colNum);
                  break;
                }
                else {
                  idx = this.code.indexOf('<', idx + 1);
                }
              }
            }
          }
        }
        //<\w开始则jsx，<作为mark开头和识别正则/开头上下文语意相同
        else if(this.isReg == JSXLexer.IS_REG
          && this.peek == '<'
          && character.isLetter(this.code.charAt(this.index))) {
          this.html = true;
          this.state = true;
          //<
          var token = new JSXToken(JSXToken.MARK, this.peek, this.peek, this.index - 1);
          if(this.last) {
            token.prev(this.last);
            this.last.next(token);
          }
          this.last = token;
          temp.push(token);
          this.tokenList.push(token);
          token.line(this.totalLine);
          token.col(this.colNum);
          this.colNum++;
          this.readch();
          //\w elem
          ELEM.match(this.peek, this.code, this.index);
          var token = new JSXToken(ELEM.tokenType(), ELEM.content(), ELEM.val(), this.index - 1);
          var matchLen = ELEM.content().length;
          token.prev(this.last);
          this.last.next(token);
          this.last = token;
          temp.push(token);
          this.tokenList.push(token);
          this.index += matchLen - 1;
          token.line(this.totalLine);
          token.col(this.colNum);
          this.colNum += matchLen;
          this.colMax = Math.max(this.colMax, this.colNum);
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

              if(this.last) {
                token.prev(this.last);
                this.last.next(token);
              }
              this.last = token;
              temp.push(token);
              this.tokenList.push(token);
              this.index += matchLen - 1;
              token.line(this.totalLine);
              token.col(this.colNum);
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

              //支持perl正则需判断关键字、圆括号对除号语义的影响
              if(perlReg && match.perlReg() != JSXLexer.IGNORE) {
                if(match.perlReg() == JSXLexer.SPECIAL) {
                  this.isReg = match.special();
                }
                else {
                  this.isReg = match.perlReg();
                }
                if(this.peek == character.LEFT_PARENTHESE) {
                  this.parentheseStack.push(this.parentheseState);
                  this.parentheseState = false;
                }
                else if(this.peek == character.RIGHT_PARENTHESE) {
                  this.isReg = this.parentheseStack.pop() ? JSXLexer.IS_REG : JSXLexer.NOT_REG;
                }
                else {
                  this.parentheseState = match.parenthese();
                }
              }
              continue outer;
            }
          }
          //如果有未匹配的，说明规则不完整，抛出错误
          this.error('unknow token');
        }
      }
    return this;
  },
  readch: function() {
    this.peek = this.code.charAt(this.index++);
  },
  dealReg: function(temp, length) {
    var lastIndex = this.index - 1;
    var res = false;
    outer:
      do {
        this.readch();
        if(this.peek == character.LINE) {
          this.error('SyntaxError: unterminated regular expression literal '
          + this.peek, this.code.slice(lastIndex, this.index));
          break;
        }
        else if(this.peek == character.BACK_SLASH) {
          this.index++;
        }
        else if(this.peek == character.LEFT_BRACKET) {
          do {
            this.readch();
            if(this.peek == character.LINE) {
              this.error('SyntaxError: unterminated regular expression literal '
              + this.peek, this.code.slice(lastIndex, this.index));
              break outer;
            }
            else if(this.peek == character.BACK_SLASH) {
              this.index++;
            }
            else if(this.peek == character.RIGHT_BRACKET) {
              continue outer;
            }
          } while(this.index < length);
        }
        else if(this.peek == character.SLASH) {
          res = true;
          var hash = {};
          var flag = {
            'g': true,
            'i': true,
            'm': true,
            'u': true,
            'y': true
          };
          //正则的flag中有gimuy5种，大小写敏感且不能重复
          do {
            this.readch();
            if(character.isLetter(this.peek)) {
              if(hash.hasOwnProperty(this.peek) || !flag.hasOwnProperty(this.peek)) {
                this.error('SyntaxError: invalid regular expression flag '
                + this.peek, this.code.slice(lastIndex, this.index));
                break outer;
              }
              hash[this.peek] = true;
            }
            else {
              break outer;
            }
          } while(this.index <= length);
        }
      } while(this.index < length);
    if(!res) {
      this.error('SyntaxError: unterminated regular expression literal',
        this.code.slice(lastIndex, this.index - 1));
    }
    var token = new JSXToken(JSXToken.REG, this.code.slice(lastIndex, --this.index), lastIndex);
    if(this.last) {
      token.prev(this.last);
      this.last.next(token);
    }
    this.last = token;
    temp.push(token);
    this.tokenList.push(token);
    token.line(this.totalLine);
    token.col(this.colNum);
    this.colNum += this.index - lastIndex;
    this.colMax = Math.max(this.colMax, this.colNum);
    return this;
  },
  addText: function(s, temp) {
    var token = new JSXToken(JSXToken.TEXT, s, s);
    this.last = token;
    temp.push(token);
    this.tokenList.push(token);
    token.line(this.totalLine);
    token.col(this.colNum);
    var n = character.count(token.val(), character.LINE);
    this.totalLine += n;
    if(n) {
      var j = s.indexOf(character.LINE);
      var k = s.lastIndexOf(character.LINE);
      this.colMax = Math.max(this.colMax, this.colNum + j);
      this.colNum = s.length - k;
    }
    else {
      this.colNum += s.length;
    }
    this.colMax = Math.max(this.colMax, this.colNum);
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
    if(JSXLexer.mode() === JSXLexer.STRICT) {
      throw new Error(s + ', line ' + this.line() + ' col ' + this.colNum + '\n' + str);
    }
    else if(JSXLexer.mode() === JSXLexer.LOOSE && typeof console !== void 0) {
      console.warn(s + ', line ' + this.line() + ' col ' + this.colNum + '\n' + str);
    }
    return this;
  }
}).statics({
  IGNORE: 0,
  IS_REG: 1,
  NOT_REG: 2,
  SPECIAL: 3,
  STRICT: 0,
  LOOSE: 1,
  mode: function(i) {
    if(!character.isUndefined(i)) {
      cmode = i;
    }
    return cmode;
  }
});
var cmode = JSXLexer.STRICT;
module.exports = JSXLexer;});