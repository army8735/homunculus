var INode = require('../Node');
var Node = INode.extend(function(type, children) {
  INode.call(this, type, children);
  return this;
}).statics({
  SHEET: 'sheet',
  ELEMENT: 'element',
  IMPORT: 'import',
  MEDIA: 'media',
  CHARSET: 'charset',
  MEDIAQLIST: 'mediaqlist',
  MEDIAQUERY: 'mediaquer',
  MEDIATYPE: 'mediatype',
  NAMESPACE: 'namespace',
  DOC: 'doc',
  EXPR: 'expression',
  BLOCK: 'block',
  STYLESET: 'styleset',
  STYLE: 'style',
  SELECTORS: 'selectors',
  SELECTOR: 'selector',
  KEY: 'key',
  VALUE: 'value',
  FONTFACE: 'fontface',
  KEYFRAMES: 'kframes',
  PAGE: 'page',
  URL: 'url',
  LINEARGRADIENT: 'lineargradient',
  POINT: 'point',
  COLORSTOP: 'colorstop',
  RADIOGRADIENT: 'radiogradient',
  POS: 'pos',
  LEN: 'len',
  LENGTH: 'length',
  RGB: 'rgb',
  RGBA: 'rgba',
  HSL: 'hsl',
  HSLA: 'hsla',
  MAX: 'max',
  MIN: 'min',
  VARDECL: 'vardecl',
  EXTEND: 'extend',
  FORMAT: 'format',
  FN: 'function',
  PARAMS: 'params',
  FNC: 'fncall',
  CPARAMS: 'cparams',
  CTSTYLE: 'ctstyle',
  VIEWPORT: 'viewport',
  SUPPORTS: 'supports',
  CNDT: 'cndt',
  ADDEXPR: 'addexpr',
  MTPLEXPR: 'mtplexpr',
  PRMREXPR: 'prmrexpr',
  PARAM: 'param',
  COUNTER: 'counter',
  CALC: 'calc',
  TOGGLE: 'toggle',
  ATTR: 'attr',
  FILTER: 'filter',
  TRANSLATE: 'translate',
  "TRANSLATE3D": 'translate3d',
  TRANSLATEX: 'translatex',
  TRANSLATEY: 'translatey',
  TRANSLATEZ: 'translatez',
  ROTATE: 'rotate',
  "ROTATE3D": 'rotate3d',
  ROTATEX: 'rotatex',
  ROTATEY: 'rotatey',
  ROTATEZ: 'rotatez',
  SCALE: 'scale',
  "SCALE3D": 'scale3d',
  SCALEX: 'scalex',
  SCALEY: 'scaley',
  SCALEZ: 'scalez',
  VARS: 'vars',
  BRACKET: 'bracket',
  URLPREFIX: 'ulrprefix',
  DOMAIN: 'domain',
  REGEXP: 'regexp',
  IFSTMT: 'ifstmt',
  FORSTMT: 'forstmt',
  VARSTMT: 'varstmt',
  EQSTMT: 'eqstmt',
  RELSTMT: 'relstmt',
  ADDSTMT: 'addstmt',
  MTPLSTMT: 'mtplstmt',
  POSTFIXSTMT: 'postfixstmt',
  MMBSTMT: 'mmbstmt',
  PRMRSTMT: 'prmrstmt',
  ARRLTR: 'arrltr',
  DIR: 'dir',
  UNBOX: 'unbox',
  BASENAME: 'basename',
  EXTNAME: 'extname',
  WIDTH: 'width',
  HEIGHT: 'height',
  getKey: function(s) {
    if(!s) {
      throw new Error('empty value');
    }
    if(!keys) {
      var self = this;
      keys = {};
      Object.keys(this).forEach(function(k) {
        var v = self[k];
        keys[v] = k;
      });
    }
    return keys[s];
  }
});
var keys;
module.exports = Node;