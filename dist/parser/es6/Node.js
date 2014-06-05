(function(factory) {
  if(typeof define === 'function' && (define.amd || define.cmd)) {
    define(factory);
  }
  else {
    factory(require, exports, module);
  }
})(function(require, exports, module) {
  var INode = require('../Node');
  var Node = INode.extend(function(type, children) {
    INode.call(this, type, children);
    return this;
  }).statics({
    SCRIPT: 'script',
    SCRIPTBODY: 'scriptbody',
    VARSTMT: 'varstmt',
    VARDECL: 'vardecl',
    FNBODY: 'fnbody',
    BLOCKSTMT: 'blockstmt',
    BLOCK: 'block',
    ITERSTMT: 'iterstmt',
    FNPARAMS: 'fnparams',
    BINDELEMENT: 'bindelement',
    RESTPARAM: 'restparam',
    EXPR: 'expr',
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
    CACHPARAM: 'cachparam',
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
    PROPTDEF: 'proptdef',
    ARGS: 'args',
    ARGLIST: 'arglist',
    IMPTSTMT: 'imptstmt',
    POSTFIXEXPR: 'postfixexpr',
    NEWEXPR: 'newexpr',
    CALLEXPR: 'callexpr',
    SPREAD: 'spread',
    ARRCMPH: 'arrcmph',
    CMPHFOR: 'cmphfor',
    INITLZ: 'initlz',
    BINDID: 'bindid',
    ARRBINDPAT: 'arrbindpat',
    OBJBINDPAT: 'objbindpat',
    BINDELEM: 'bindelem',
    BINDREST: 'bindrest',
    PROPTNAME: 'proptname',
    SINGLENAME: 'singlename',
    BINDPROPT: 'bindpropt',
    LTRPROPT: 'ltrpropt',
    CMPTPROPT: 'cmptpropt',
    LEXDECL: 'lexdecl',
    LEXBIND: 'lexbind',
    FMPARAMS: 'fmparams',
    CMPHIF: 'cmphif',
    YIELDEXPR: 'yieldexpr',
    ARROWFN: 'arrowfn',
    ARROWPARAMS: 'arrowparams',
    CPEAPL: 'cpeapl',
    CLASSEXPR: 'classexpr',
    GENEXPR: 'genexpr',
    GENDECL: 'gendecl',
    GENCMPH: 'gencmph',
    CMPH: 'cmph',
    CNCSBODY: 'cncsbody',
    CLASSDECL: 'classdecl',
    HERITAGE: 'heritage',
    CLASSBODY: 'classbody',
    CLASSELEM: 'classelem',
    METHOD: 'method',
    GENMETHOD: 'genmethod',
    MODULEBODY: 'moduelbody',
    IMPORT: 'import',
    EXPORT: 'export',
    IMPORTDECL: 'importdecl',
    MODULEIMPORT: 'moduleimport',
    FROMCAULSE: 'formcaulse',
    IMPORTCAULSE: 'importcaulse',
    NAMEIMPORT: 'nameimport',
    IMPORTSPEC: 'importspec',
    EXPORTDECL: 'exportdecl',
    EXPORTCAULSE: 'exportcaulse',
    EXPORTSPEC: 'exportspec',
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