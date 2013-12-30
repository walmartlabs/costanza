/*global HTMLDocument, Window, console */
// Helper method used to avoid exposing costanza internals to the funky string methods
var _costanzaEvil = function(__costanza_str) {
  return function() {
    return eval(__costanza_str);
  };
};

this.Costanza = (function() {
  // Save off a reference to the eval rescoper and remove it from the global scope
  // to keep things somewhat modular
  var costanzaEvil = _costanzaEvil;
  _costanzaEvil = undefined;

  function defaultReporter(info, err) {
    /*jshint eqnull:true */
    console.error('Costanza error:'
          + '\n  type: ' + info.type
          + '\n  section: ' + info.section
          + (info.url ? '\n  url: ' + info.url : '')
          + (info.line != null ? '\n  line: ' + info.line : '')
          + ((info.stack && info.stack.indexOf(info.msg) < 0) ? '\n\n' + info.msg : ''),
          + '\n\n' + (info.stack || info.msg));
  }

  var reportCallback = defaultReporter,
      currentSection = 'global',
      _onError,
      _setTimeout,
      _setInterval;

  function init(_reportCallback, options) {
    options = options || {};
    reportCallback = _reportCallback || defaultReporter;

    if (!options.noGlobal && (!window.onerror || !window.onerror._costanza)) {
      _onError = _onError || window.onerror;
      window.onerror = onErrorRoot;

      window.addEventListener('error', onError, true);
    }

    // Allow users to opt out of the native prototype augmentation.
    if (options.safeMode) {
      return;
    }

    if (!setTimeout._costanza) {
      _setTimeout = setTimeout;
      window.setTimeout = wrapSet(_setTimeout);
    }

    if (!setInterval._costanza) {
      _setInterval = setInterval;
      window.setInterval = wrapSet(_setInterval);
    }

    function wrapSet($super) {
      function ret(callback, duration) {
        if (typeof callback === 'string') {
          callback = costanzaEvil(callback);
        }

        var args = Array.prototype.slice.call(arguments);
        args[0] = bind(callback);

        return $super.apply(this, args);
      }
      ret._costanza = true;
      return ret;
    }

    if (window.Element && Element.prototype.addEventListener && !Element.prototype.addEventListener._costanza) {

      wrapListener(Element.prototype);
      if (window.HTMLDocument || window.Document) {
        // IE10: Document, others are HTMLDocument
        wrapListener((window.HTMLDocument || window.Document).prototype);
      }
      if (window.Window) {
        wrapListener(Window.prototype);
      }
    }

    function wrapListener(proto) {
      // We must pair the native implementation with the proper proto object as ios7 will throw
      // if they are not.
      proto._addEventListener = proto.addEventListener;
      proto.addEventListener = function(type, callback, useCapture) {
        if (!callback._section) {
          if (callback.handleEvent) {
            callback._section = {
              handleEvent: function(event) {
                return callback.handleEvent(event);
              }
            };
          } else {
            callback._section = bind(callback);
          }
        }

        this._addEventListener(type, callback._section, useCapture);
      };
      proto.addEventListener._costanza = true;

      proto._removeEventListener = proto.removeEventListener;
      proto.removeEventListener = function(type, callback, useCapture) {
        this._removeEventListener(type, callback._section || callback, useCapture);
      };
      proto.removeEventListener._costanza = true;
    }
  }
  function cleanup() {
    function cleanupListener(proto) {
      proto.addEventListener = proto._addEventListener;
      proto.removeEventListener = proto._removeEventListener;
    }

    reportCallback = defaultReporter;
    if (setTimeout._costanza) {
      window.setTimeout = _setTimeout;
    }
    if (setInterval._costanza) {
      window.setInterval = _setInterval;
    }
    if (window.Element && Element.prototype.addEventListener && Element.prototype.addEventListener._costanza) {
      cleanupListener(Element.prototype);
      if (window.HTMLDocument) {
        cleanupListener(HTMLDocument.prototype);
      }
      if (window.Window) {
        cleanupListener(Window.prototype);
      }
    }

    if (window.onerror && window.onerror._costanza) {
      window.onerror = _onError;

      window.removeEventListener('error', onError, true);
    }
  }

  function bind(/* [name, ][info, ] callback */) {
    var callback = arguments[2] || arguments[1] || arguments[0],
        info,
        name = currentSection;

    if (arguments.length > 2) {
      info = arguments[1];
      name = arguments[0];
    }
    if (arguments.length > 1) {
      name = arguments[0];
      if (typeof name !== 'string') {
        info = name;
        name = currentSection;
      }
    }

    if (!callback || !callback.apply) {
      // If we don't have a valid function, log it and pass whatever it is on
      reportError(new Error('Costanza:Unexpected bind: ' + callback));

      return callback;
    } else if (callback._costanza) {
      return callback;
    }

    var ret = function() {
      var priorSite = currentSection;

      try {
        currentSection = name;

        return callback.apply(this, arguments);
      } catch (err) {
        reportError(err);
      } finally {
        currentSection = priorSite;
      }
    };
    ret._costanza = true;
    return ret;

    function reportError(err) {
      var reportInfo = {
        type: 'javascript',
        section: currentSection,
        msg: err.message,
        stack: err.stack
      };

      // Inline debug data
      if (info) {
        for (var keyName in info) {
          if (info.hasOwnProperty(keyName)) {
            reportInfo[keyName] = info[keyName];
          }
        }
      }

      reportCallback(reportInfo, err);
    }
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
    var el = errorMsg.target || errorMsg.srcElement;
    if (errorMsg && el) {
      // Don't submit duplciate events (and if we weren't already tracking
      // it, it probably wasn't that important)
      if (errorMsg.defaultPrevented || errorMsg._costanzaHandled) {
        return;
      }

      errorMsg._costanzaHandled = true;
      url = url || el.src || el.href;
      type = el.nodeName.toLowerCase();
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
  onErrorRoot._costanza = true;


  var Costanza = {
    init: init,
    cleanup: cleanup,
    current: function() {
      return currentSection;
    },
    emit: function(info, error) {
      reportCallback(info, error);
    },
    bind: bind,
    run: function(name, info, callback) {
      return bind(name, info, callback)();
    },
    onError: onError
  };
  return Costanza;
})();
