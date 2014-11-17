var index;

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

exports.simple = function(node, ignore, nodeVisitors, tokenVisitors) {
  index = 0;
  while(ignore[index]) {
    ignore[index++];
  }
  nodeVisitors = nodeVisitors || {};
  tokenVisitors = tokenVisitors || {};
  recursion(node, ignore, nodeVisitors, tokenVisitors);
};