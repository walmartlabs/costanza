/*global Costanza */
Thorax.onException = function(name, error) {
  error = error || {};

  Costanza.emit({
      type: 'javascript',
      section: name,
      msg: error.message,
      stack: error.stack
    },
    error);
};

Thorax.bindSection = Costanza.bind;
Thorax.runSection = Costanza.run;
