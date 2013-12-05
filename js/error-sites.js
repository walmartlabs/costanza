this.ErrorSites = (function() {
  var reportCallback,
      currentSection,
      _onError,
      _setTimeout,
      _setInterval;

  function init(_reportCallback) {
    reportCallback = _reportCallback;

    if (!setTimeout.errorSite) {
      _setTimeout = setTimeout;
      window.setTimeout = function(callback, duration) {
        return _setTimeout(section(callback), duration);
      };
      setTimeout.errorSite = true;
    }

    if (!setInterval.errorSite) {
      _setInterval = setInterval;
      window.setInterval = function(callback, interval) {
        return _setInterval(section(callback), interval);
      };
      setInterval.errorSite = true;
    }
  }
  function cleanup() {
    reportCallback = undefined;
    if (setTimeout.errorSite) {
      window.setTimeout = _setTimeout;
    }
    if (setInterval.errorSite) {
      window.setInterval = _setInterval;
    }
  }

  function section(name, callback) {
    if (!callback) {
      callback = name;
      name = currentSection;
    }

    return function() {
      var priorSite = currentSection;

      try {
        currentSection = name;

        callback.apply(this, arguments);
      } catch (err) {
        reportCallback(currentSection, err);
      } finally {
        currentSection = priorSite;
      }
    };
  }

  return {
    init: init,
    cleanup: cleanup,
    current: function() {
      return currentSection;
    },
    section: section,
  };
})();
