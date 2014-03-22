var Class = require('../util/Class');
var character = require('../util/character');
var tid = 0;
var types;
var Token = Class(function(type, content, val, sIndex) {
  this.t = type; //token类型
  this.c = content; //token的字面内容，string包括头尾的引号
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
    if(!character.isUndefined(t)) {
      this.t = t;
    }
    return this.t;
  },
  content: function(c) {
    if(!character.isUndefined(c)) {
      this.c = c;
    }
    return this.c;
  },
  val: function(v) {
    if(!character.isUndefined(v)) {
      this.v = v;
    }
    return this.v;
  },
  tag: function(t) {
    if(!character.isUndefined(t)) {
      this.t = t;
    }
    return Token.type(this.t);
  },
  tid: function(id) {
    if(!character.isUndefined(id)) {
      this.id = id;
    }
    return this.id;
  },
  sIndex: function(si) {
    if(!character.isUndefined(si)) {
      this.si = si;
    }
    return this.si;
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
module.exports = Token;