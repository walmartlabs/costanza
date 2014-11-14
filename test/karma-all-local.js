/* jshint node: true */
var baseConfig = require('./karmaBase');

module.exports = function(config) {
  baseConfig.frameworks.unshift('detectBrowsers');
  baseConfig.logLevel = config.LOG_ERROR,

  delete baseConfig.browsers;

  config.set(baseConfig);
};
