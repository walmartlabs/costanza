// A place to dump polyfils required to get the testsuite to run in various browsers

// what - document.defaultView is known as parentWindow in IE 8
// where - http://git.io/F3h7Hg
// notes - this was fixed in 1.1, however that also removed the detect module
//    from the default build, which we are using. Therefore this change is simplier
document.defaultView = document.defaultView || document.parentWindow;


// what - Array.forEach does not exist in IE 8
// where - all over the place
// taken from http://git.io/hSUVrQ
Array.prototype.forEach = Array.prototype.forEach || function forEach(callback) {
  if (this === undefined || this === null) {
    throw new TypeError(this + 'is not an object');
  }

  if (!(callback instanceof Function)) {
    throw new TypeError(callback + ' is not a function');
  }

  var object = Object(this),
    scope = arguments[1],
    arraylike = object instanceof String ? object.split('') : object,
    length = Number(arraylike.length) || 0,
    index = -1,
    result = [],
    element;

  while (++index < length) {
    if (index in arraylike) {
      callback.call(scope, arraylike[index], index, object);
    }
  }
};
