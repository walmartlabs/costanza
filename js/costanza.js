/*global HTMLDocument, Window, console, define */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof require === 'function') {
    module.exports = factory();
  } else {
    root.Costanza = factory();
  }
}(this, function() {
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
      _listeners = [],
      _addEventStr = window.addEventListener ? 'addEventListener' : 'attachEvent',
      _removeEventStr = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
      _onError,
      _setTimeout,
      _setInterval;

  function init(_reportCallback, options) {
    options = options || {};
    reportCallback = _reportCallback || defaultReporter;

    if (!options.noGlobal && window.addEventListener && (!window.onerror || !window.onerror._costanza)) {
      _onError = _onError || window.onerror;
      window.onerror = onErrorRoot;

      window.addEventListener('error', onError, true);

      if ('onpagehide' in window) {
        window.addEventListener('pageshow', onPageShow, false);
        window.addEventListener('pagehide', onPageHide, false);
      } else {
        window.addEventListener('beforeunload', onPageHide, false);
      }
    }

    // Allow users to opt out of the native prototype augmentation.
    if (options.safeMode) {
      return;
    }

    // IE <=8 makes it nearly impossible to override setTimeout, so we don't
    // http://www.adequatelygood.com/Replacing-setTimeout-Globally.html
    if (window.addEventListener) {
      if (window.setTimeout && !setTimeout._costanza) {
        _setTimeout = setTimeout;
        window.setTimeout = wrapSet(_setTimeout);
      }

      if (window.setInterval && !setInterval._costanza) {
        _setInterval = setInterval;
        window.setInterval = wrapSet(_setInterval);
      }
    }

    function wrapSet($super) {
      function ret(_callback, duration) {
        var callback = _callback;
        if (typeof _callback === 'string') {
          callback = function() {
            /*jshint -W061:true */
            // Force global exec
            // http://perfectionkills.com/global-eval-what-are-the-options
            (1,window.eval)(_callback);
          };
        }

        var args = Array.prototype.slice.call(arguments);
        args[0] = bind({
          captureErrors: true,     // No need to propagate to global error handler
          callback: callback
        });

        return $super.apply(this, args);
      }
      ret._costanza = true;
      return ret;
    }

    if (window.Element && Element.prototype[_addEventStr] && !Element.prototype[_addEventStr]._costanza) {

      wrapListener(Element.prototype);
      if (window.HTMLDocument || window.Document) {
        // IE10: Document, others are HTMLDocument
        wrapListener((window.HTMLDocument || window.Document).prototype);
      }
      if (window.Window) {
        wrapListener(Window.prototype);
      }
    }

    function addCleanupListener(proto, listenerName, listener) {
      proto[listenerName]._costanza = true;

      _listeners.push(function() {
        proto[listenerName] = listener;
      });
    }

    function wrapListener(proto) {
      var _addListener,
          _removeListener;

      // We must pair the native implementation with the proper proto object as ios7 will throw
      // if they are not.
          //
      _addListener = proto[_addEventStr];
      proto[_addEventStr] = function(type, callback, useCapture) {
        if (!callback._section) {
          var className = '';
          if (this.className) {
            // Use baseVal for SVGAnimatedString on svg elements
            className = this.className.baseVal != null ? this.className.baseVal : this.className;
            if (className) {
              className = '.' + className.replace(' ', '.');
            }
          }

          var elementId = (this.nodeName || 'window').toLowerCase()
              + (this.id ? '#' + this.id : className),
            sectionName = 'event-' + elementId + ':' + type;

          if (callback.handleEvent) {
            callback._section = {
              handleEvent: bind(sectionName, function(event) {
                return callback.handleEvent(event);
              })
            };
          } else {
            callback._section = bind({
              name: sectionName,
              captureErrors: true,   // No need to propagate to global error handler
              callback: callback
            });
          }
        }

        _addListener.call(this, type, callback._section, useCapture);
      };

      addCleanupListener(proto, _addEventStr, _addListener);

      _removeListener = proto[_removeEventStr];
      proto[_removeEventStr] = function(type, callback, useCapture) {
        _removeListener.call(this, type, callback._section || callback, useCapture);
      };

      addCleanupListener(proto, _removeEventStr, _removeListener);
    }
  }

  function cleanup() {
    while (_listeners.length) {
      _listeners.pop()();
    }

    reportCallback = defaultReporter;
    if (_setTimeout && setTimeout._costanza) {
      window.setTimeout = _setTimeout;
    }
    if (_setInterval && setInterval._costanza) {
      window.setInterval = _setInterval;
    }

    if (window.onerror && window.onerror._costanza) {
      window.onerror = _onError;

      if (window.removeEventListener) {
        window.removeEventListener('error', onError, true);
      }
    }
  }

  function bind(/* [name, ][info, ] callback */) {
    var callback = arguments[2] || arguments[1] || arguments[0],
        captureErrors,
        info,
        name = currentSection;

    if (!callback.apply) {
      // Options object was passed
      name = callback.name || name;
      info = callback.info;
      captureErrors = callback.captureErrors;

      callback = callback.callback;
    } else {
      // Array-based arguments
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

        // Continute propagation of the error so we aren't left in an intedeterminate
        // state
        if (!captureErrors) {
          // Rewrite the error so we know that its already gone through the error handling
          // stack
          if (!err.stack) {
            // Unexpected data. Log and hope that this is surfaced somewhere that it's usable.
            if (window.console) {
              console.error('Unknown throw:', err);
            }

            var toThrow = new Error('Costanza: ' + err);
            toThrow._costanza = true;
            throw toThrow;
          } else {
            // We don't want to throw a different type or otherwise loose the data that we have
            // attached to this error message. Instead do the "safest" thing and insert our
            // logging message so we can detect this in the global error handler.
            err.message = 'Costanza: ' + err.message;
            err._costanza = true;
            throw err;
          }
        }
      } finally {
        currentSection = priorSite;
      }
    };
    ret._costanza = true;
    return ret;

    function reportError(err) {
      // Do not over report
      if (err._costanza) {
        return;
      }
      err._costanza = true;

      var reportInfo = {
        type: 'javascript',
        section: currentSection,
        msg: err.message,
        stack: (err.stack || err) + ''
      };

      // Inline debug data
      function extend(info) {
        if (info) {
          for (var keyName in info) {
            if (info.hasOwnProperty(keyName)) {
              reportInfo[keyName] = info[keyName];
            }
          }
        }
      }
      extend(info);
      extend(err.info);

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

    var isCostanzaError = /\bCostanza: /.test(errorMsg);
    if ((errorMsg === 'Script error.' && !url)
        || isCostanzaError) {
      // Ignore untrackable external errors locally
      // Also ignore errors that have already been reported (The _costanza flag does not
      // propagate to window.onerror
      return isCostanzaError;
    }
    if (!url && lineNumber === 0) {
      // If the external script error message MIGHT have some more meaning then provide a more
      // meaningful url than undefined.
      url = 'Unknown External Script';
    }

    // This is a real event handler vs. the onerror special case.
    // Since some browsers decide to treat window.onerror as the error event handler,
    // we have to be prepared for either case
    var el = errorMsg.target || errorMsg.srcElement;
    if (errorMsg && el) {
      // Don't submit duplciate events (and if we weren't already tracking
      // it, it probably wasn't that important)
      // Additionally ignore load errors that might happen after page unload has started.
      if (errorMsg.defaultPrevented || errorMsg._costanzaHandled
          || Costanza.pageUnloading) {
        return;
      }

      errorMsg._costanzaHandled = true;
      url = url || el.src || el.href;
      type = (el.nodeName || 'window').toLowerCase();
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
    return onError(errorMsg, url, lineNumber, error);
  }
  onErrorRoot._costanza = true;

  function onPageShow(event) {
    Costanza.pageUnloading = false;
  }
  function onPageHide(event) {
    Costanza.pageUnloading = true;
  }

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
}));
