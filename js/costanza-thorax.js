/*global Costanza */
function bindEventHandler(eventName, params) {
  eventName += params.originalName;

  var callback = params.handler,
      method = _.isFunction(callback) ? callback : this[callback];
  if (!method) {
    throw new Error('Event "' + callback + '" does not exist ' + (this.name || this.cid) + ':' + eventName);
  }

  var context = params.context || this,
      section = 'thorax-exception: ' + (context.name || context.cid) + ' ;; ' + eventName,
      ret = Costanza.bind(section, _.bind(method, context));

  // Backbone will delegate to _callback in off calls so we should still be able to support
  // calling off on specific handlers.
  ret._callback = method;
  ret._thoraxBind = true;
  return ret;
}

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
