/*global Costanza */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['thorax', 'costanza'], factory);
  } else if (typeof require === 'function') {
    factory(require('throax'), require('costanza'));
  } else {
    factory(root.Thorax, root.Costanza);
  }
}(this, function(Thorax, Costanza) {
  Thorax.onException = function(name, error) {
    error = error || {};

    Costanza.emit({
        type: 'javascript',
        section: name,
        msg: error.message,
        stack: error.stack || error + ''
      },
      error);
  };

  Thorax.bindSection = Costanza.bind;
  Thorax.runSection = Costanza.run;
}));
