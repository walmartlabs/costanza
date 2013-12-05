this.ErrorSites = (function() {
  var reportCallback,
      currentSection;

  function init(_reportCallback) {
    reportCallback = _reportCallback;

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
    current: function() {
      return currentSection;
    },
    section: section,
  };
})();
