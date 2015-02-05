var fs = require('fs');

var Lu = require('unicode-7.0.0/categories/Lu/code-points');
var Ll = require('unicode-7.0.0/categories/Ll/code-points');
var Lt = require('unicode-7.0.0/categories/Lt/code-points');
var Lm = require('unicode-7.0.0/categories/Lm/code-points');
var Lo = require('unicode-7.0.0/categories/Lo/code-points');
var Nl = require('unicode-7.0.0/categories/Nl/code-points');
var Mn = require('unicode-7.0.0/categories/Mn/code-points');
var Mc = require('unicode-7.0.0/categories/Mc/code-points');
var Nd = require('unicode-7.0.0/categories/Nd/code-points');
var Pc = require('unicode-7.0.0/categories/Pc/code-points');

var sort = require('../src/util/sort');

var 编码集 = Lu.concat(Ll, Lt, Lm, Lo, Nl);
sort(编码集);
编码集 = 过滤(编码集);

function 过滤(编码集) {
  编码集 = 编码集.filter(function(编码) {
    if(编码 >= 0x010000 && 编码 <= 0x10FFFF) {
      return false;
    }
    if(编码 >= 0x0 && 编码 <= 0x7F) {
      return false;
    }
    return true;
  });
  return 编码集;
}

fs.writeFileSync('./编码集.txt', 编码集.join('\n'), { encoding: 'utf-8' });

var 结果集 = [];
var 上个索引 = 0;
for(var i = 1, len = 编码集.length; i < len; i++) {
  var 当前 = 编码集[i];
  var 前个 = 编码集[i-1];
  if(当前 == 前个 + 1) {
    //
  }
  else {
    if(上个索引 == i - 1) {
      结果集.push(转为Unicode(前个));
    }
    else {
      结果集.push(转为Unicode(编码集[上个索引]) + '-' + 转为Unicode(前个));
    }
    上个索引 = i;
  }
}

function 转为Unicode(编码) {
  if(编码 > 0xFFFF) {
    var 高位 = Math.floor((编码 - 0x10000) / 0x400) + 0xD800;
    var 低位 = (编码 - 0x10000) % 0x400 + 0xDC00;
    return 补前缀(高位.toString(16)) + 补前缀(低位.toString(16));
  }
  else {
    var 进制 = 编码.toString(16);
    return 补前缀(进制);
  }
}
function 补前缀(编码) {
  if(编码.length < 4) {
    var 前缀 = '';
    for(var i = 0; i < 4 - 编码.length; i++) {
      前缀 += '0';
    }
    return '\\u' + 前缀 + 编码;
  }
  else {
    return '\\u' + 编码;
  }
}

fs.writeFileSync('./结果集.txt', 结果集.join('\n'), { encoding: 'utf-8' });




var 后缀编码集 = [0x200C, 0x200D].concat(Lu, Ll, Lt, Lm, Lo, Nl, Mn, Mc, Nd, Pc);
sort(后缀编码集);
后缀编码集 = 过滤(后缀编码集);

fs.writeFileSync('./后缀编码集.txt', 后缀编码集.join('\n'), { encoding: 'utf-8' });

var 后缀结果集 = [];
var 上个索引 = 0;
for(var i = 1, len = 后缀编码集.length; i < len; i++) {
  var 当前 = 后缀编码集[i];
  var 前个 = 后缀编码集[i-1];
  if(当前 == 前个 + 1) {
    //
  }
  else {
    if(上个索引 == i - 1) {
      后缀结果集.push(转为Unicode(前个));
    }
    else {
      后缀结果集.push(转为Unicode(后缀编码集[上个索引]) + '-' + 转为Unicode(前个));
    }
    上个索引 = i;
  }
}

fs.writeFileSync('./后缀结果集.txt', 后缀结果集.join('\n'), { encoding: 'utf-8' });