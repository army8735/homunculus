var gulp = require('gulp');
var clean = require('gulp-clean');
var util = require('gulp-util');
var es = require('event-stream');

var fs = require('fs');
var path = require('path');

function mkdir(dir) {
  if(!fs.existsSync(dir)) {
    var parent = path.dirname(dir);
    mkdir(parent);
    fs.mkdirSync(dir);
  }
}

gulp.task('clean-web', function() {
  return gulp.src('./web/*')
    .pipe(clean());
});
gulp.task('clean-src', function() {
  return gulp.src('./src/*')
    .pipe(clean());
});

gulp.task('default', ['clean-web'], function() {
  gulp.src('./src/**/*.js')
    .pipe(function() {
      return es.map(function (file, cb) {
        var target = file.path.replace('/src/', '/web/');
        mkdir(path.dirname(target));
        util.log(path.relative(file.cwd, file.path), '->', path.relative(file.cwd, target));
        var s = fs.readFileSync(file.path, { encoding: 'utf-8' });
        s = 'define(function(require, exports, module) {\n  ' + s.replace(/\n/g, '\n  ') + '\n});';
        fs.writeFileSync(target, s, { encoding: 'utf-8' });
        cb(null, file);
      });
    }());
});