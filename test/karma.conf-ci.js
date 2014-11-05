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
    },


    sl_iPhone_latest: {
      base: 'SauceLabs',
      browserName: 'iPhone'
    },
    sl_iPhone_4: {
      base: 'SauceLabs',
      browserName: 'iPhone',
      version: '4.3'
    },
    sl_iPhone_5: {
      base: 'SauceLabs',
      browserName: 'iPhone',
      version: '5.1'
    },
    sl_iPhone_6: {
      base: 'SauceLabs',
      browserName: 'iPhone',
      version: '6.1'
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

  delete baseConfig.logLevel;

  config.set(baseConfig);
};
