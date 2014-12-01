/* jshint node: true */
var baseConfig = require('./karmaBase');

module.exports = function(config) {
  baseConfig.singleRun = false;
  baseConfig.frameworks.unshift('detectBrowsers');
  baseConfig.logLevel = config.LOG_INFO;
  delete baseConfig.browsers;

  config.set(baseConfig);
};
