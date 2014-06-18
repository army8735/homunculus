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
  LENGTH: 'length',
  COLOR: 'color',
  VARDECL: 'vardecl',
  EXTEND: 'extend',
  FORMAT: 'format',
  FN: 'function',
  PARAMS: 'params',
  FNC: 'fncall',
  CPARAMS: 'cparams',
  CPARAM: 'cparam',
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