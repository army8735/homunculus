var gulp = require('gulp');

var fs = require('fs');
var path = require('path');

function clean(dir, includeSelf) {
  if(!fs.existsSync(dir)) {
    return;
  }
  fs.readdirSync(dir).forEach(function(f) {
    f = dir + path.sep + f;
    if(!fs.existsSync(f)) {
      return;
    }
    var stat = fs.statSync(f);
    if(stat.isDirectory()) {
      clean(f, true);
    }
    else if(stat.isFile()) {
      fs.unlinkSync(f);
    }
  });
  if(includeSelf) {
    fs.rmdirSync(dir);
  }
}
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

gulp.task('src2web', ['clean-web'], function() {
  src2web('./src');
});
gulp.task('web2src', ['clean-src'], function() {
  web2src('./web');
});
gulp.task('clean-web', function() {
  clean('./web');
});
gulp.task('clean-src', function() {
  clean('./src');
});

gulp.task('default', ['src2web']);