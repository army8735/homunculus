var Class = require('../util/Class');
var character = require('../util/character');
var Token = require('./Token');
var walk = require('../util/walk');

var Lexer = Class(function(rule) {
  this.rule = rule; //当前语法规则
  this.init();
}).methods({
  init: function() {
    this.code = ''; //要解析的代码
    this.peek = ''; //向前看字符
    this.index = 0; //向前看字符字符索引
    this.isReg = Lexer.IS_REG; //当前/是否是perl风格正则表达式
    this.tokenList = []; //结果的token列表
    this.parentheseState = false; //(开始时标记之前终结符是否为if/for/while等关键字
    this.parentheseStack = []; //圆括号深度记录当前是否为if/for/while等语句内部
    this.braceState = false; //{是object还是block
    this.braceStack = []; //深度记录
    this.cacheLine = 0; //行缓存值
    this.totalLine = 1; //总行数
    this.colNum = 0; //列
    this.colMax = 0; //最大列数
    this.isReturn = false; //当出现return，后面有换行则自动插入;，影响{的语意
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
      //perl风格正则
      if(perlReg
        && this.isReg == Lexer.IS_REG
        && this.peek == character.SLASH
        && !{ '/': true, '*': true }[this.code.charAt(this.index)]) {
        this.dealReg(temp, length);
        this.isReg = Lexer.NOT_REG;
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
  dealToken: function(token, matchLen, count, temp) {
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
    this.totalLine += count;
    if(count) {
      var j = token.content().indexOf(character.LINE);
      var k = token.content().lastIndexOf(character.LINE);
      this.colMax = Math.max(this.colMax, this.colNum + j);
      this.colNum = token.content().length - k;
    }
    else {
      this.colNum += matchLen;
    }
    this.colMax = Math.max(this.colMax, this.colNum);
  },
  stateReg: function(match) {
    if(match.perlReg() == Lexer.SPECIAL) {
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
      this.isReg = this.parentheseStack.pop() ? Lexer.IS_REG : Lexer.NOT_REG;
    }
    else {
      this.parentheseState = match.parenthese();
    }
  },
  stateBrace: function(content, type) {
    if(content == '{') {
      if(this.isReturn) {
        this.braceState = true;
      }
      this.braceStack.push(this.braceState);
      this.isReturn = false;
    }
    else if(content == '}') {
      this.braceState = this.braceStack.pop();
      if(this.braceState) {
        this.isReg = false;
      }
      this.isReturn = false;
    }
    else if(type == Token.SIGN) {
      //反向设置，符号大多出现expr中，后跟{表示object；某些不能跟；以下（换行）跟表示block
      this.braceState = !{
        '--': true,
        '++': true,
        '=>': true,
        ';': true,
        ')': true
      }.hasOwnProperty(content);
      this.isReturn = false;
    }
    else if(type == Token.KEYWORD) {
      this.braceState = {
        'instanceof': true,
        'delete': true,
        'void': true,
        'typeof': true,
        'return': true
      }.hasOwnProperty(content);
      this.isReturn = content == 'return';
    }
    else if([Token.BLANK, Token.TAB, Token.LINE, Token.COMMENT].indexOf(type) == -1) {
      this.braceState = false;
    }
    else if(type == Token.LINE
      || type == Token.COMMENT
        && content.indexOf('\n') > -1) {
      if(this.isReturn) {
        this.braceState = false;
        this.isReturn = false;
      }
    }
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
    var token = new Token(Token.REG, this.code.slice(lastIndex, --this.index), lastIndex);
    this.index = lastIndex + 1;
    this.dealToken(token, token.content().length, 0, temp);
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
var cmode = Lexer.STRICT;
module.exports = Lexer;