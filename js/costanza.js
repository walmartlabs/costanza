/*global HTMLDocument, Window */
this.Costanza = (function() {
  "use strict";

  var reportCallback,
      currentSection = 'global',
      _onError,
      _setTimeout,
      _setInterval,
      _addEventListener,
      _removeEventListener;

  function init(_reportCallback, options) {
    reportCallback = _reportCallback;

    if (!window.onerror || !window.onerror.errorSite) {
      _onError = _onError || window.onerror;
      window.onerror = onErrorRoot;

      window.addEventListener('error', onError, true);
    }

    // Allow users to opt out of the native prototype augmentation.
    if (options && options.safeMode) {
      return;
    }

    if (!setTimeout.errorSite) {
      _setTimeout = setTimeout;
      window.setTimeout = function(callback, duration) {
        return _setTimeout(bind(callback), duration);
      };
      setTimeout.errorSite = true;
    }

    if (!setInterval.errorSite) {
      _setInterval = setInterval;
      window.setInterval = function(callback, interval) {
        return _setInterval(bind(callback), interval);
      };
      setInterval.errorSite = true;
    }

    if (window.Element && Element.prototype.addEventListener && !Element.prototype.addEventListener.errorSite) {
      _addEventListener = Element.prototype.addEventListener;
      var addEventListener = function(type, callback, useCapture) {
        callback._section = callback._section || bind(callback);
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
    if (window.onerror && window.onerror.errorSite) {
      window.onerror = _onError;

      window.removeEventListener('error', onError, true);
    }
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

  function bind(name, callback) {
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
        reportCallback({
          type: 'javascript',
          section: currentSection,
          msg: err.message,
          stack: err.stack
        }, err);
      } finally {
        currentSection = priorSite;
      }
    };
  }

  function onError(errorMsg, url, lineNumber, error) {
    var type = 'javascript';

    // Handle ErrorEvent if we receieve it
    if (errorMsg && errorMsg.message) {
      url = errorMsg.filename;
      lineNumber = errorMsg.lineno;
      error = errorMsg.error;
      errorMsg = errorMsg.message;
    }

    if (errorMsg === 'Script error.' && !url) {
      // Ignore untrackable external errors locally
      return;
    }

    // This is a real event handler vs. the onerror special case.
    // Since some browsers decide to treat window.onerror as the error event handler,
    // we have to be prepared for either case
    if (errorMsg && errorMsg.srcElement) {
      // Don't submit duplciate events (and if we weren't already tracking
      // it, it probably wasn't that important)
      if (errorMsg.defaultPrevented || errorMsg.errorSiteHandled) {
        return;
      }

      errorMsg.errorSiteHandled = true;
      url = url || errorMsg.srcElement.src || errorMsg.srcElement.href;
      type = errorMsg.srcElement.tagName.toLowerCase();
      errorMsg = 'load-failed';
    }

    // Error argument added to the spec. Adding support so we can catch this as it rolls out
    // http://html5.org/tools/web-apps-tracker?from=8085&to=8086
    reportCallback({
      section: currentSection,
      url: url,
      line: lineNumber,
      type: type,

      // Cast error message to string as it sometimes can come through with objects, particularly DOM objects
      // containing circular references.
      msg: errorMsg+'',
      stack: error && error.stack
    }, error);
  }

  function onErrorRoot(errorMsg, url, lineNumber, error) {
    _onError && _onError(errorMsg, url, lineNumber, error);
    onError(errorMsg, url, lineNumber, error);
  }
  onErrorRoot.errorSite = true;

  return {
    init: init,
    cleanup: cleanup,
    current: function() {
      return currentSection;
    },
    emit: function(info, error) {
      reportCallback(info, error);
    },
    bind: bind,
    run: function(name, callback) {
      bind(name, callback)();
    },
    onError: onError
  };
})();
