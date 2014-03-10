var fs = require('fs');
var path = require('path');

function web2src(dir) {
  fs.readdirSync(dir).forEach(function(f) {
    f = dir + path.sep + f;
    var stat = fs.statSync(f);
    var target = f.replace('web', 'src');
    if(stat.isDirectory()) {
      if(!fs.existsSync(target)) {
        fs.mkdirSync(target);
      }
      web2src(f);
    }
    else if(stat.isFile()) {
        console.log(f, '->', target);
        var s = fs.readFileSync(f, { encoding: 'utf-8' });
        s = s.replace(/^define[^\n]*\n\t?/, '');
        s = s.replace(/\n\t/g, '\n');
        s = s.replace(/\t/g, '  ');
        s = s.replace(/[\s]*\}\)\;[\s]*$/, '');
        fs.writeFileSync(target, s, { encoding: 'utf-8' });
    }
  });
}

function src2web(dir) {
  fs.readdirSync(dir).forEach(function(f) {
    f = dir + path.sep + f;
    var stat = fs.statSync(f);
    var target = f.replace('src', 'web');
    if(stat.isDirectory()) {
      if(!fs.existsSync(target)) {
        fs.mkdirSync(target);
      }
      src2web(f);
    }
    else if(stat.isFile()) {
      console.log(f, '->', target);
      var s = fs.readFileSync(f, { encoding: 'utf-8' });
      s = 'define(function(require, exports, module) {\n  ' + s.replace(/\n/g, '\n  ') + '\n});';
      fs.writeFileSync(target, s, { encoding: 'utf-8' });
    }
  });
}

exports.web2src = function() {
  web2src('./web');
};
exports.src2web = function() {
  src2web('./src');
};