/*global HTMLDocument, Window */
this.ErrorSites = (function() {
  var reportCallback,
      currentSection = 'global',
      _onError,
      _setTimeout,
      _setInterval,
      _addEventListener,
      _removeEventListener;

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

    if (window.Element && Element.prototype.addEventListener && !Element.prototype.addEventListener.errorSite) {
      _addEventListener = Element.prototype.addEventListener;
      var addEventListener = function(type, callback, useCapture) {
        callback._section = callback._section || section(callback);
        _addEventListener.call(this, type, callback._section, useCapture);
      };
      addEventListener.errorSite = true;
      Element.prototype.addEventListener = addEventListener;

      _removeEventListener = Element.prototype.removeEventListener;
      var removeEventListener = function(type, callback, useCapture) {
        _removeEventListener.call(this, type, callback._section || callback, useCapture);
      };
      removeEventListener.errorSite = true;
      Element.prototype.removeEventListener = removeEventListener;

      if (window.HTMLDocument) {
        HTMLDocument.prototype.addEventListener = addEventListener;
        HTMLDocument.prototype.removeEventListener = removeEventListener;
      }

      if (window.Window) {
        Window.prototype.addEventListener = addEventListener;
        Window.prototype.removeEventListener = removeEventListener;
      }
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
    if (window.Element && Element.prototype.addEventListener && Element.prototype.addEventListener.errorSite) {
      Element.prototype.addEventListener = _addEventListener;
      Element.prototype.removeEventListener = _removeEventListener;

      if (window.HTMLDocument) {
        HTMLDocument.prototype.addEventListener = _addEventListener;
        HTMLDocument.prototype.removeEventListener = _removeEventListener;
      }

      if (window.Window) {
        Window.prototype.addEventListener = _addEventListener;
        Window.prototype.removeEventListener = _removeEventListener;
      }
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
    run: function(name, callback) {
      section(name, callback)();
    },
  };
})();
