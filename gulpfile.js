var gulp = require('gulp');
var clean = require('gulp-clean');
var transform = require('./transform');

gulp.task('src2web', ['clean-web'], function() {
  transform.src2web();
});
gulp.task('web2src', ['clean-src'], function() {
  transform.web2src();
});
gulp.task('clean-web', function() {
  gulp.src('./web/*', { read: false })
    .pipe(clean());
});
gulp.task('clean-src', function() {
  gulp.src('./src/*')
    .pipe(clean());
});

gulp.task('default', ['src2web']);