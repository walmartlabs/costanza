this.ErrorSites = (function() {
  var reportCallback;

  function init(_reportCallback) {
    reportCallback = _reportCallback;

  }

  return {
    init: init,
  };
})();
