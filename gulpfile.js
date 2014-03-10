var gulp = require('gulp');
var transform = require('./transform');

gulp.task('src2web', function() {
  transform.src2web();
});
gulp.task('web2src', function() {
  transform.web2src();
});

gulp.task('default', function() {
  gulp.run('src2web');
});