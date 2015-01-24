/* jshint node: true */
var baseConfig = require('./karmaBase');

module.exports = function(config) {
  var customLaunchers = {

    sl_iPhone_latest: {
      base: 'SauceLabs',
      browserName: 'iPhone'
    },

    sl_iPhone_7: {
      base: 'SauceLabs',
      browserName: 'iPhone',
      version: '7.1'
    },

    sl_android_tablet_4: {
      base: 'SauceLabs',
      browserName: 'android',
      version: '4.4'
    }

  };

  baseConfig.customLaunchers = customLaunchers;
  baseConfig.reporters.push('saucelabs');
  baseConfig.browsers = Object.keys(customLaunchers);
  baseConfig.sauceLabs = { testName: 'Costanza' };

  config.set(baseConfig);
};
