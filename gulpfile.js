/* jshint node: true */
var gulp = require('gulp'),
    karma = require('karma').server;

gulp.task('test', function(done) {
  karma.start({
    configFile: __dirname + '/test/karma.phantom.js'
  }, done);
});

gulp.task('watch', function(done) {
  karma.start({
    configFile: __dirname + '/test/karma.watch.js'
  }, done);
});

gulp.task('test-local', function(done) {
  karma.start({
    configFile: __dirname + '/test/karma.conf.js'
  }, done);
});

gulp.task('sauce', function(done) {
  karma.start({
    configFile: __dirname + '/test/karma.conf-ci.js'
  }, done);
});

gulp.task('default', ['test']);
