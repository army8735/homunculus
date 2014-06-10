define(function(require, exports, module) {
  var INode = require('../Node');
  var Node = INode.extend(function(type, children) {
    INode.call(this, type, children);
    return this;
  }).statics({
    PROGRAM: 'program',
    ELEM: 'elem',
    VARSTMT: 'varstmt',
    VARDECL: 'vardecl',
    FNBODY: 'fnbody',
    BLOCK: 'block',
    ITERSTMT: 'iterstmt',
    FNPARAMS: 'fnparams',
    EXPR: 'expr',
    PROGRAM: 'program',
    STMT: 'stmt',
    ASSIGN: 'assign',
    EMPTSTMT: 'emptstmt',
    IFSTMT: 'ifstmt',
    CNTNSTMT: 'cntnstmt',
    BRKSTMT: 'brkstmt',
    RETSTMT: 'retstmt',
    WITHSTMT: 'withstmt',
    SWCHSTMT: 'swchstmt',
    CASEBLOCK: 'caseblock',
    CASECLAUSE: 'caseclause',
    DFTCLAUSE: 'dftclause',
    LABSTMT: 'labstmt',
    THRSTMT: 'thrstmt',
    TRYSTMT: 'trystmt',
    DEBSTMT: 'debstmt',
    EXPRSTMT: 'exprstmt',
    CACH: 'cach',
    FINL: 'finl',
    FNDECL: 'fndecl',
    FNEXPR: 'fnexpr',
    ASSIGNEXPR: 'assignexpr',
    CNDTEXPR: 'cndtexpr',
    LOGOREXPR: 'logorexpr',
    LOGANDEXPR: 'logandexpr',
    BITOREXPR: 'bitorexpr',
    BITANDEXPR: 'bitandexpr',
    BITXOREXPR: 'bitxorexpr',
    EQEXPR: 'eqexpr',
    RELTEXPR: 'reltexpr',
    SHIFTEXPR: 'shiftexpr',
    ADDEXPR: 'addexpr',
    MTPLEXPR: 'mtplexpr',
    UNARYEXPR: 'unaryexpr',
    MMBEXPR: 'mmbexpr',
    PRMREXPR: 'prmrexpr',
    ARRLTR: 'arrltr',
    OBJLTR: 'objltr',
    PROPTASSIGN: 'proptassign',
    ARGS: 'args',
    ARGLIST: 'arglist',
    POSTFIXEXPR: 'postfixexpr',
    NEWEXPR: 'newexpr',
    CALLEXPR: 'callexpr',
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
});