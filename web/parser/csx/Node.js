define(function(require, exports, module) {var Es6Node = require('../es6/Node');
var Node = Es6Node.extend(function(type, children) {
  Es6Node.call(this, type, children);
  return this;
}).statics({
  CSXElement: 'CSXElement',
  CSXSelfClosingElement: 'CSXSelfClosingElement',
  CSXOpeningElement: 'CSXOpeningElement',
  CSXClosingElement: 'CSXClosingElement',
  CSXChild: 'CSXChild',
  CSXSpreadAttribute: 'CSXSpreadAttribute',
  CSXAttribute: 'CSXAttribute',
  CSXBindAttribute: 'CSXBindAttribute',
  CSXNamespacedName: 'CSXNamespacedName',
  CSXMemberExpression: 'CSXMemberExpression',
  CSXAttributes: 'CSXAttributes',
  CSXAttributeValue: 'CSXAttributeValue',
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
module.exports = Node;});