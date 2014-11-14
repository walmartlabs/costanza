/* jshint node: true */
var baseConfig = require('./karmaBase');

module.exports = function(config) {
  baseConfig.singleRun = false;
  baseConfig.frameworks.unshift('detectBrowsers');
  baseConfig.logLevel = config.LOG_ERROR;
  baseConfig.port = 9876;
  delete baseConfig.browsers;

  baseConfig.logLevel = config.LOG_ERROR,
  config.set(baseConfig);
};
