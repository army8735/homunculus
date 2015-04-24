var INode = require('../Node');
var Node = INode.extend(function(type, children) {
  INode.call(this, type, children);
  return this;
}).statics({
  DOCUMENT: 'document',
  Element: 'Element',
  SelfClosingElement: 'SelfClosingElement',
  OpeningElement: 'OpeningElement',
  ClosingElement: 'ClosingElement',
  Attribute: 'Attribute',
  Attributes: 'Attributes',
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