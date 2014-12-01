/* jshint node: true */
var baseConfig = require('./karmaBase');

module.exports = function(config) {
  var customLaunchers = {
    sl_ie_8: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '8'
    },

    sl_ie_9: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '9'
    },

    sl_ie_10: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '10'
    },
    sl_ie_11: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '11'
    }
  };

  baseConfig.customLaunchers = customLaunchers;
  baseConfig.reporters.push('saucelabs');
  baseConfig.browsers = Object.keys(customLaunchers);
  baseConfig.sauceLabs = { testName: 'Costanza' };

  config.set(baseConfig);
};
