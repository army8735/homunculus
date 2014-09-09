define(function(require, exports, module) {var Class = require('../util/Class');
var character = require('../util/character');
var tid = 0;
var types;
var Token = Class(function(type, content, val, sIndex) {
  this.t = type; //token类型
  this.c = content; //token的字面内容，string包括头尾的引号
  this.pr = null;
  this.ne = null;
  if(character.isNumber(val)) {
    sIndex = val;
    val = content;
  }
  else if(character.isUndefined(val)) {
    val = content;
    sIndex = -1;
  }
  this.v = val; //token的值，一般情况下等于content，特殊如string情况下值是不加头尾的引号
  this.id = tid++; //token的索引
  this.si = sIndex; //token在源码字符串中的索引
}).methods({
  type: function(t) {
    if(t !== void 0) {
      this.t = t;
    }
    return this.t;
  },
  content: function(c) {
    if(c !== void 0) {
      this.c = c;
    }
    return this.c;
  },
  val: function(v) {
    if(v !== void 0) {
      this.v = v;
    }
    return this.v;
  },
  tag: function(t) {
    if(t !== void 0) {
      this.t = t;
    }
    return Token.type(this.t);
  },
  tid: function(id) {
    if(id !== void 0) {
      this.id = id;
    }
    return this.id;
  },
  sIndex: function(si) {
    if(si !== void 0) {
      this.si = si;
    }
    return this.si;
  },
  prev: function(t) {
    if(t !== void 0) {
      this.pr = t;
    }
    return this.pr;
  },
  next: function(t) {
    if(t !== void 0) {
      this.ne = t;
    }
    return this.ne;
  },
  cancel: function() {
    tid--;
  }
}).statics({
  IGNORE: -2,
  VIRTUAL: -1,
  OTHER: 0,
  BLANK: 1,
  TAB: 2,
  LINE: 3,
  NUMBER: 4,
  ID: 5,
  COMMENT: 6,
  STRING: 7,
  SIGN: 8,
  REG: 9,
  KEYWORD: 10,
  ANNOT: 11,
  HEAD: 12,
  TEMPLATE: 13,
  ENTER: 14,
  PROPERTY: 15,
  VARS: 16,
  HACK: 17,
  IMPORTANT: 18,
  PSEUDO: 19,
  UNITS: 20,
  SELECTOR: 21,
  ATTR: 22,
  COLOR: 23,
  DATA: 24,
  TEXT: 25,
  MARK: 26,
  type: function(tag) {
    if(character.isUndefined(types)) {
      types = [];
      Object.keys(Token).forEach(function(o) {
        if(typeof Token[o] == 'number') {
          types[Token[o]] = o;
        }
      });
    }
    return types[tag];
  }
});
module.exports = Token;});