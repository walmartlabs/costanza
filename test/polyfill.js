// A place to dump polyfils required to get the testsuite to run in various browsers

// what - document.defaultView is known as parentWindow in IE 8
// where - http://git.io/F3h7Hg
// notes - this was fixed in 1.1, however that also removed the detect module
//    from the default build, which we are using. Therefore this change is simplier
document.defaultView = document.defaultView || document.parentWindow;


// what - Array.forEach does not exist in IE 8
// where - all over the place
Array.prototype.forEach = Array.prototype.forEach || function forEach(callback) {
  if (!(this instanceof Object)) {
    throw new TypeError(this + 'is not an object');
  }

  if (typeof callback !== 'function') {
    throw new TypeError(callback + ' is not a function');
  }

  var
  array = Object(this),
  arrayIsString = array instanceof String,
  scope = arguments[1],
  length = array.length,
  index = 0;

  for (; index < length; ++index) {
    if (arrayIsString || index in array) {
      callback.call(scope, arrayIsString ? array.charAt(index) : array[index], index, array);
    }
  }
};
