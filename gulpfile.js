/* jshint node: true */
var gulp = require('gulp'),
    karma = require('karma').server;

gulp.task('test', function(done) {
  karma.start({
    configFile: __dirname + '/test/karma-phantom.js'
  }, done);
});

gulp.task('watch', function(done) {
  karma.start({
    configFile: __dirname + '/test/karma-watch.js'
  }, done);
});

gulp.task('test-local', function(done) {
  karma.start({
    configFile: __dirname + '/test/karma-all-local.js'
  }, done);
});

gulp.task('sauce-ie', function(done) {
  karma.start({
    configFile: __dirname + '/test/karma-sauce-ie.js'
  }, done);
});

gulp.task('sauce-mobile', function(done) {
  karma.start({
    configFile: __dirname + '/test/karma-sauce-mobile.js'
  }, done);
});

gulp.task('sauce-good', function(done) {
  karma.start({
    configFile: __dirname + '/test/karma-sauce-good.js'
  }, done);
});


gulp.task('default', ['test']);
