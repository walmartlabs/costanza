/* jshint node: true */
var baseConfig = require('./karmaBase');

module.exports = function(config) {
  var customLaunchers = {
    sl_chrome: {
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'Windows 7'
    },

    sl_firefox_latest: {
      base: 'SauceLabs',
      browserName: 'firefox',
    },

    sl_safari_latest: {
      base: 'SauceLabs',
      browserName: 'safari',
      platform: 'OS X 10.10'
    },
    sl_safari_7: {
      base: 'SauceLabs',
      browserName: 'safari',
      version: '7'
    },

    sl_opera_latest: {
      base: 'SauceLabs',
      browserName: 'opera',
      version: '12'
    }
  };

  baseConfig.customLaunchers = customLaunchers;
  baseConfig.reporters.push('saucelabs');
  baseConfig.browsers = Object.keys(customLaunchers);
  baseConfig.sauceLabs = { testName: 'Costanza' };

  config.set(baseConfig);
};
