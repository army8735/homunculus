define(function(require, exports, module) {var index;

function recursion(node, ignore, nodeVisitors, tokenVisitors) {
  var isToken = node.isToken();
  if(isToken) {
    var token = node.token();
    var isVirtual = token.isVirtual();
    if(!isVirtual) {
      var ignores = [];
      while(ignore[++index]) {
        ignores.push(ignore[index]);
      }
      if(tokenVisitors.hasOwnProperty(token.type())) {
        tokenVisitors[token.type()](token, ignores);
      }
    }
  }
  else {
    if(nodeVisitors.hasOwnProperty(node.name())) {
      nodeVisitors[node.name()](node);
    }
    node.leaves().forEach(function(leaf) {
      recursion(leaf, ignore, nodeVisitors, tokenVisitors);
    });
  }
}

exports.simple = function(node, nodeVisitors, tokenVisitors) {
  exports.simpleIgnore(node, {}, nodeVisitors, tokenVisitors)
};

exports.simpleIgnore = function(node, ignore, nodeVisitors, tokenVisitors) {
  index = 0;
  while(ignore[index]) {
    ignore[index++];
  }
  nodeVisitors = nodeVisitors || {};
  tokenVisitors = tokenVisitors || {};
  recursion(node, ignore, nodeVisitors, tokenVisitors);
};

function rcs(node, callback) {
  var isToken = node.isToken();
  if(isToken) {
    var token = node.token();
    var isVirtual = token.isVirtual();
    if(!isVirtual) {
      callback(token, true);
    }
  }
  else {
    callback(node);
    node.leaves().forEach(function(leaf) {
      rcs(leaf, callback);
    });
  }
}

exports.recursion = function(node, callback) {
  rcs(node, callback);
};

function toPlainObject(node, res) {
  var isToken = node.isToken();
  if(isToken) {
    var token = node.token();
    var isVirtual = token.isVirtual();
    if(!isVirtual) {
      res.push(token.content());
    }
  }
  else {
    res.push(node.name().toUpperCase());
    var childs = [];
    res.push(childs);
    node.leaves().forEach(function(leaf) {
      toPlainObject(leaf, childs);
    });
  }
  return res;
}

exports.plainObject = function(obj) {
  //token
  if(Array.isArray(obj)) {
    var res = [];
    obj.forEach(function(token) {
      res.push(token.content());
    });
    return res;
  }
  //ast
  else {
    return toPlainObject(obj, []);
  }
};});