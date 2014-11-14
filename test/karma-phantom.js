/* jshint node: true */
var baseConfig = require('./karmaBase');

module.exports = function(config) {

  baseConfig.logLevel = config.LOG_ERROR;
  config.set(baseConfig);
};
