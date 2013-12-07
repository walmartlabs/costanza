# Costanza

Frontend error tracking toolkit: Own your own domain

Provides a [Node.js domains][node_domains] inspired async error-tracking system for frontend clients. This allows for tracking errors with more than the `Undefined is not an object` level of detail that many implementations of generic `window.onerror` provide.

```
onerror:
  msg: Uncaught TypeError: 'undefined' is not an object
  url: http://localhost/home.js
  line: 1
```

But with Costanza the logged error is much more expressive:

```
Costanza error:
  type: javascript
  section: thorax-exception: home ;; DOM-event:click .js-big-red-button

TypeError: 'undefined' is not an object
    at bigRedButtonHandler (http://localhost/home.js:1:129)
    at http://localhost/base.js:1:2221
    at ret (http://localhost/base.js:1:9860)
```

Showing that the error occurred in the `click .js-big-red-button` event handler of the throax `home` view as well as providing wthe stack trace associated with that event.

## Features

- Automatically associating callbacks and events with the code group that created them
- Tracking global javascript errors
- Tracking resource load failures

## Usage

Initialize the library using the `Costanza.init` method, passing a callback that will handle errors. This callback should send the error info to your centralized tracking server.

```javascript
Costanza.init(function(info, rawError) {
  $.ajax({
    url: myAnalyticsServer,
    method: 'POST',
    data: info
  });
});
```

This is the minimum required to use the library, but the fidelity of the error tracking is greatly improved if code is associated with known sections. Sections allow for a unique name to be associated with a code execution path. Should an error occur within the section or one of it's anonymous sections, this unique name will be included in the error result, easing debugging.

The easiest way to create a section is with the `run` method, which will immediately execute.

```javascript
Costanza.run('unique-name', function() {
  // Do stuff that fails
});
```

Callbacks may also be created with sections for later execution:

```javascript
var callback = Costanza.bind('another-unique-name', function() {
  // Bang!
});
```

Anonomyous sections may be created within other known sections. When these child sections execute, they will do so using the same identifier pased to the parent section. This is done automatically for callbacks passed to `setTimeout`, `setInterval`, and `addEventListener` by default.

```javascript
Costanza.run('yet-another-unique-name', function() {
  setTimeout(function() {
    // A later bang!
  }, 1000);
});
```

Ideally new named sections are created for any logical entry point into the system from the event loop. Things like DOM event handlers and ajax callbacks are prime candidates for creating named sections. Plugins such as costanza-thorax allow for doing this in an automated fashion. (Don't see a plugin for your framework of choice? [Send over a PR][pull_request]!

### Implementation Warning

This code hijacks majors portions of built-in prototype objects. This should fail-safe but is not guaranteed to do so. Use only after considering the risks. User's who would like to avoid prototype extension may pass the `safeMode` option to avoid altering host objects. `safeMode` users will need to manually wrap callback functions to ensure that stack traces are available for methods that are executed on subsequent event loops.


```javascript
Costanza.init(function(info, rawError) {
  $.ajax();
}, {safeMode: true});

Costanza.run('still-yet-another-unique-name', function() {
  setTimeout(Costanza.bind('still-yet-another-unique-name', function() {
    // A later bang!
  }), 1000);
});
```

## API

### #init(callback)

Initializes the library. In the event of an error `callback(info, rawError)` will be receive:

- `info`: A stringifable object that may contain the following, in addition to custom fields for the case of `emit`.
  - `type`: The type of error that occurred. For execution errors this will be `javascript`. For errors loading external resources for a particular element this will be tag name of the element that failed to load.
  - `section`: Current section executing when the failure occured. `global` if there is no current section.
  - `url`: URL of the error, if available. For element load errors this will be the referenced external object.
  - `line`: The line number of the error, if available.
  - `msg`: The error message.
  - `stack`: The javascript stack trace of the error, if available.

- `rawError`: The raw error object that generated the event, if available. This is not guaranteed to be JSON safe.

### #run(name, callback)

Creates a new named section and executes immediately. This allows for easy creation of new section scopes.

### #bind([name, ] callback)

Creates a section which may be executed at a later time. If `name` is omitted then the section will execute under the current section name. This is useful for providing callbacks to methods that do not use one of the automaticly bound paths.

### #current()

Returns the name of the current section. If none is defined then the return is `global`.

### #emit(info, error)

Emits a custom event to the error handler callback.

### #cleanup()

Removes any overrides that may have been performed. Calling this method is unnecessary under most circumstances.

## Hall of Shame

The following are exceptions seen in the wild that appear to be thrown by 3rd party extensions or proxy injected code. Don't let friends inject buggy code... or any for that matter.

- TypeError: 'undefined' is not an object (evaluating 'document.getElementsByTagName('video')[0].src')
- TypeError: 'undefined' is not an object (evaluating 'document.getElementsByTagName('video')[0].getElementsByTagName')
- TypeError: 'undefined' is not an object (evaluating 'document.getElementsByTagName('video')[0].getAttribute')
- Uncaught TypeError: Cannot call method 'Log' of undefined
- Uncaught TypeError: Cannot call method 'setHTML' of undefined
- Uncaught TypeError: Cannot call method 'setTitleDescription' of undefined
- ReferenceError: Can't find variable: pc_scroll_view_will_begin_dragging
- ReferenceError: Can't find variable: pc_scroll_view_will_begin_decelerating
- ReferenceError: Can't find variable: pc_scroll_view_did_end_decelerating
- ReferenceError: Can't find variable: atomicFindClose
- Uncaught ReferenceError: MMSDK is not defined
- Uncaught ReferenceError: measurePositions is not defined

## Testing

Command line:

    jake test

Interactive:

    jake watch
    brower http://machine.name:8080/test.html

## Why is this called Costanza?

George Costanza (of Seinfeld fame) was the [master of his domain](http://en.wikipedia.org/wiki/The_Contest) and we want you to be the master of yours.

[node_domains]: http://nodejs.org/api/domain.html
[pull_request]: https://github.com/walmartlabs/costanza/pulls
