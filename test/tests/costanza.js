/*global Costanza, Event, jQuery */

//    Originally taken from Zepto.js - http://git.io/iKLCrw
//    Modified to work with jQuery

;(function($){
  function detect(ua){
    var os = this.os = {}, browser = this.browser = {},
      webkit = ua.match(/Web[kK]it[\/]{0,1}([\d.]+)/),
      android = ua.match(/(Android);?[\s\/]+([\d.]+)?/),
      ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/),
      iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
      blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/),
      bb10 = ua.match(/(BB10).*Version\/([\d.]+)/),
      chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
      firefox = ua.match(/Firefox\/([\d.]+)/),
      opera = ua.match(/Opera/),
      ie = ua.match(/MSIE\s([\d.]+)/) || ua.match(/Trident\/[\d](?=[^\?]+).*rv:([0-9.].)/);
      safari = ua.match(/Version\/([\d.]+)([^S](Safari)|[^M]*(Mobile)[^S]*(Safari))/);

    if (browser.webkit = !!webkit) browser.version = webkit[1];
    if (android) os.android = true, os.version = android[2];
    if (browser.ie = !!ie) browser.version = parseInt(ie[1]);
    if (opera) browser.opera = true;
    if (ua.match(/PhantomJS/)) browser.phantom = true;
    if (safari) browser.safari = true;


    os.phone  = !!(!os.tablet && !os.ipod && (android || iphone || blackberry || bb10 ||
      (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) ||
      (firefox && ua.match(/Mobile/)) || (ie && ua.match(/Touch/))));
  }

  detect.call($, navigator.userAgent);
  // make available to unit tests
  $.__detect = detect;

})(jQuery);

// NOTE: Many of these tests are async form when they appear to be sync. This is because many of the
// tests will not properly emit failures outside of timeout errors due to the error handling logic
// that is under test. If test timeouts are seen then it's likely that one of the expectations
// failed. The first step in this case should be logging the expectations to see if any threw.

describe('costanza', function() {
  var error,
      spy,
      errorSpy,
      _onError = window.onerror;

  beforeEach(function() {
    spy = sinon.spy();
    error = new Error('Failure is always an option');

    // Have to disable the default error handling to prevent failures in tests that are expecting
    // them
    window.onerror = errorSpy = sinon.spy();

    // Disable the sandbox if any as we want to actually hit the native impl
    if (this.clock) {
      this.clock.restore();
    }

    Costanza.init(spy);
  });

  afterEach(function() {
    Costanza.cleanup();
    window.onerror = _onError;
    window._stringSet = false;
  });

  describe('#bind', function() {
    it('should run callback', function(done) {
      var callback = sinon.spy();
      Costanza.run(callback);
      expect(callback.callCount).to.equal(1);

      Costanza.run('foo', callback);
      expect(callback.callCount).to.equal(2);
      done();
    });

    it('report errors', function(done) {
      expect(function() {
        Costanza.run('fail!', function() {
          throw error;
        });
      }).to.throwError(/Costanza: /);

      expect(spy.calledWith({
        type: 'javascript',
        section: 'fail!',
        msg: 'Failure is always an option',
        stack: error.stack || error + ''
      },
      error)).to.be(true);
      done();
    });

    it('report info', function(done) {
      expect(function() {
        Costanza.run({foo: true}, function() {
          throw error;
        });
      }).to.throwError(/Costanza: /);

      expect(spy.calledWith({
        type: 'javascript',
        section: 'global',
        foo: true,
        msg: 'Failure is always an option',
        stack: error.stack || error + ''
      },
      error)).to.be(true);
      done();
    });

    it('report errors and info', function(done) {
      expect(function() {
        Costanza.run('fail!', {foo: true}, function() {
          throw error;
        });
      }).to.throwError(/Costanza: /);

      expect(spy.calledWith({
        type: 'javascript',
        section: 'fail!',
        foo: true,
        msg: 'Failure is always an option',
        stack: error.stack || error + ''
      },
      error)).to.be(true);
      done();
    });

    it('should restore the site', function(done) {
      var section1 = Costanza.bind('success', function() {
        expect(Costanza.current()).to.equal('success');
        section2();
        expect(Costanza.current()).to.equal('success');
      });
      var section2 = Costanza.bind(function() {
        expect(Costanza.current()).to.equal('global');
        section3();
      });
      var section3 = Costanza.bind('fail!', function() {
        expect(Costanza.current()).to.equal('fail!');
        throw error;
      });
      expect(section1).to.throwError(/Costanza: /);

      expect(spy.calledWith({
        type: 'javascript',
        section: 'fail!',
        msg: 'Failure is always an option',
        stack: error.stack || error + ''
      }, error)).to.be(true);
      done();
    });

    it('captureErrors with flag', function(done) {
      Costanza.run({
        name: 'fail!',
        captureErrors: true,
        callback: function() {
          throw error;
        }
      });

      expect(spy.calledWith({
        type: 'javascript',
        section: 'fail!',
        msg: 'Failure is always an option',
        stack: error.stack || error + ''
      },
      error)).to.be(true);
      done();
    });
  });

  describe('#onerror', function() {
    it('should handle error strings', function(done) {
        Costanza.onError('foo', 'bar', 1);
        expect(spy.calledWith({type: 'javascript', section: 'global', url: 'bar', line: 1, msg: 'foo', stack: undefined})).to.be(true);
        done();
      });

    it('should handle error objects', function(done) {
        Costanza.onError('foo', 'bar', 1, {foo: true});
        expect(spy.calledWith({type: 'javascript', section: 'global', url: 'bar', line: 1, msg: 'foo', stack: undefined}, {foo: true})).to.be(true);
        done();
      });

    it('should handle ErrorEvents', function(done) {
        Costanza.onError({message: 'foo', lineno: 1, filename: 'bar'});
        expect(spy.calledWith({type: 'javascript', section: 'global', url: 'bar', line: 1, msg: 'foo', stack: undefined})).to.be(true);
        done();
      });

    describe('loading errors', function() {

    it('should handle image load errors', function(done) {
        if ($.browser.firefox || ($.browser.ie && $.browser.version < 9)) {
          return done();
        }

        Costanza.init(function(info, err) {
          expect(info.section).to.equal('global');
          expect(info.type).to.equal('img');
          expect(info.url).to.match(/\/not-found.png$/);
          done();
        });

        var img = document.createElement('img');
        img.src = '/not-found.png';
        document.body.appendChild(img);
      });

      it('should handle script load errors', function(done) {
        if ($.browser.firefox || ($.browser.ie && $.browser.version < 9)) {
          return done();
        }

        Costanza.init(function(info, err) {
          expect(info.section).to.equal('global');

          // This may be a javascript error if the host server has redirects for 404
          if (info.type !== 'script' && info.type !== 'javascript') {
            throw new Error('Unexpected type: ' + info.type);
          }
          expect(info.url).to.match(/\/not-found.js$/);
          done();
        });

        var script = document.createElement('script');
        script.src = '/not-found.js';
        document.body.appendChild(script);
      });

      it('should handle script parse errors', function(done) {
        if (($.os.android && parseFloat($.os.version) < 3)
          || ($.browser.ie && parseFloat($.browser.version) < 9)
            || $.browser.opera || $.browser.phantom) {
              // window.onerror is not supported by android 2.3
              // https://code.google.com/p/android/issues/detail?id=15680
              // Opera doesn't seem to trigger this for syntax errors specifically
              // Mocha phantom aborts the tests if this occurs.
              return done();
            }

            Costanza.init(function(info, err) {
              expect(info.section).to.equal('global');
              expect(info.type).to.equal('javascript');
              expect(info.url).to.match(/\/invalid.js$/);
              done();
            });

            var script = document.createElement('script');
            script.src = '/base/fixtures/invalid.js';
            document.body.appendChild(script);
      });

      it('should handle link load errors', function(done) {
        if (($.browser.webkit || parseFloat($.browser.version) < 535)
          || !($.browser.webkit || $.browser.firefox)) {
            // Attempt to filter on stylesheet error support per
            // http://pieisgood.org/test/script-link-events/
            return done();
          }

          Costanza.init(function(info, err) {
            expect(info.section).to.equal('global');
            expect(info.type).to.equal('link');
            expect(info.url).to.match(/\/not-found.css$/);
            done();
          });

          var link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = 'text/css';
          link.href = '/not-found.css';
          document.body.appendChild(link);
      });

      it('should handle video not found errors', function(done) {
        var video = document.createElement('video');

        if ($.os.phone ||
            $.browser.firefox ||
              $.os.android ||
                $.browser.phantom ||
                  $.browser.safari ||
                    !('src' in video)
           ) {
             // Most phones dump to an external app for video, so ignore for the sake of tests
             // Firefox generally doesn't support capturing error events
             // Safari doesn't throws resource errors for missing video or audio srcs
             // Skip all browsers that don't actually support video
             return done();
           }

           if ($.os.phone || $.browser.firefox || $.os.android || $.browser.phantom || $.browser.safari) {
             // Most phones dump to an external app for video, so ignore for the sake of tests
             // Firefox generally doesn't support capturing error events
             // Safari doesn't throws resource errors for missing video or audio srcs
             return done();
           }

           Costanza.init(function(info, err) {
             expect(info.section).to.equal('global');
             expect(info.type).to.equal('video');
             expect(info.url).to.match(/\/not-found.mpg$/);
             done();
           });

           video.src = '/not-found.mpg';
           document.body.appendChild(video);
      });

      it('should handle video load errors', function(done) {
        var video = document.createElement('video');
        if ($.os.phone ||
            $.browser.firefox ||
              $.os.android ||
                $.browser.safari ||
                  !('src' in video)
           ) {
             // Most phones dump to an external app for video, so ignore for the sake of tests
             // Firefox generally doesn't support capturing error events
             // Skip browsers that don't actually support video
             return done();
           }

           Costanza.init(function(info, err) {
             expect(info.section).to.equal('global');
             expect(info.type).to.equal('video');
             expect(info.url).to.match(/\/invalid.js$/);
             done();
           });

           video.src = '/invalid.js';
           document.body.appendChild(video);
      });

      it('should ignore handle image load errors during unload', function(done) {
        if ($.browser.firefox ) {
          return done();
        }

        Costanza.pageUnloading = true;
        Costanza.init(function(info, err) {
          throw new Error('error seen');
        });

        var img = document.createElement('img');
        img.src = '/not-found.png';
        document.body.appendChild(img);
        setTimeout(function() {
          Costanza.pageUnloading = false;
          done();
        }, 1500);
      });
    });
  });

  // setTimeout and setInterval doesn't work in old IE except under very
  // specific circumstances so we skip all of the tests
  // http://www.adequatelygood.com/Replacing-setTimeout-Globally.html
  ($.browser.ie && $.browser.version < 9 ?
    describe.skip : describe)('setTimeout', function() {
  it('should trigger successfully', function(done) {

      var spy = sinon.spy(done);
      window.setTimeout(spy, 10);
      expect(spy.callCount).to.equal(0);
    });

  it('should trigger strings successfully', function(done) {
      window._stringSet = function(callback) {
        expect(callback).to.equal('undefined');
        done();
      };
      setTimeout('window._stringSet(typeof callback);', 10);
    });

  it('should trigger with args successfully', function(done) {
      if ($.browser.ie) {
        return done();
      }

      var spy = sinon.spy(function(arg1, arg2) {
        expect(arg1).to.equal('foo');
        expect(arg2).to.equal(2);
        done();
      });
      setTimeout(spy, 10, 'foo', 2);
      expect(spy.callCount).to.equal(0);
    });

  it('should catch errors', function(done) {
      Costanza.init(function(info, err) {
        expect(info.section).to.equal('global');
        expect(err.message).to.equal('It failed');
        done();
      });

      setTimeout(function() {
        throw new Error('It failed');
      }, 10);
    });

  it('should include current catch tag', function(done) {
      Costanza.init(function(info, err) {
        expect(info.section).to.equal('tracked!');
        expect(err.message).to.equal('It failed');
        done();
      });

      Costanza.run('tracked!', function() {
        setTimeout(function() {
          throw new Error('It failed');
        }, 10);
      });
    });
  });

  ($.browser.ie && $.browser.version < 9 ?
  describe.skip : describe)('setInterval', function() {
    var interval;
    afterEach(function() {
      clearInterval(interval);
    });

  it('should trigger successfully', function(done) {
      var spy = sinon.spy(function() {
        clearInterval(interval);
        done();
      });
      interval = setInterval(spy, 10);
      expect(spy.callCount).to.equal(0);
    });

  it('should trigger strings successfully', function(done) {
      window._stringSet = function() {
        clearInterval(interval);
        done();
      };
      interval = setInterval('window._stringSet();', 10);
    });
  it('should trigger with args successfully', function(done) {
      if (/MSIE/i.test(navigator.userAgent)) {
        return done();
      }

      var spy = sinon.spy(function(arg1, arg2) {
        clearInterval(interval);
        expect(arg1).to.equal('foo');
        expect(arg2).to.equal(2);
        done();
      });
      interval = setInterval(spy, 10, 'foo', 2);
      expect(spy.callCount).to.equal(0);
    });
  it('should catch errors', function(done) {
      Costanza.init(function(info, err) {
        clearInterval(interval);

        expect(info.section).to.equal('global');
        expect(err.message).to.equal('It failed');
        done();
      });

      interval = setInterval(function() {
        throw new Error('It failed');
      }, 10);
    });
  it('should include current catch tag', function(done) {
      Costanza.init(function(info, err) {
        clearInterval(interval);

        expect(info.section).to.equal('tracked!');
        expect(err.message).to.equal('It failed');
        done();
      });

      Costanza.run('tracked!', function() {
        interval = setInterval(function() {
          throw new Error('It failed');
        }, 10);
      });
    });
  });
  describe('addEventListener', function() {
    var el;
    afterEach(function() {
      if (el) {
        el.parentNode.removeChild(el);
        el = undefined;
      }
    });

  it('should execute event listeners', function(done) {
      var spy = sinon.spy();

      el = document.createElement('div');

      if (el.addEventListener) {
        el.addEventListener('click', spy);
      } else {
        el.attachEvent('onclick', spy);
      }


      document.body.appendChild(el);
      click(el);

      expect(spy.callCount).to.equal(1);
      done();
    });

  it('should execute handleEvent listeners', function(done) {
      if (window.attachEvent) {
        return done();
      }
      var spy = sinon.spy();
      var handler = {
        handleEvent: spy
      };

      el = document.createElement('div');
      el.addEventListener('click', handler);

      document.body.appendChild(el);
      click(el);

      expect(spy.callCount).to.equal(1);
      expect(spy.calledOn(handler)).to.be(true);

      el.removeEventListener('click', handler);
      click(el);

      expect(spy.callCount).to.equal(1);
      done();
    });

  it('should catch errors', function(done) {
      var error = new Error('It failed');

      el = document.createElement('div');

      if (el.addEventListener) {
        el.addEventListener('click', function() { throw error; });
      } else {
        el.attachEvent('onclick', function() { throw error; });
      }

      document.body.appendChild(el);
      click(el);

      expect(spy.callCount).to.equal(1);
      expect(spy.calledWith(
        sinon.match({section: 'event-div:click'}).or(
        sinon.match({section: 'event-div:onclick'})),
        error)
      ).to.be(true);
      done();
    });

  it('should define section from id', function(done) {
      var error = new Error('It failed');

      el = document.createElement('div');
      el.id = 'id!';
      el.className = 'foo bar';

      if (el.addEventListener) {
        el.addEventListener('click', function() { throw error; });
      } else {
        el.attachEvent('onclick', function() { throw error; });
      }

      document.body.appendChild(el);
      click(el);

      expect(spy.calledWith(
        sinon.match({section: 'event-div#id!:click'}).or(
        sinon.match({section: 'event-div#id!:onclick'})),
        error)
      ).to.be(true);
      done();
    });

  it('should define section from classname', function(done) {
      var error = new Error('It failed');

      el = document.createElement('div');
      el.className = 'foo bar';

      if (el.addEventListener) {
        el.addEventListener('click', function() { throw error; });
      } else {
        el.attachEvent('onclick', function() { throw error; });
      }

      document.body.appendChild(el);
      click(el);

      expect(spy.calledWith(
        sinon.match({section: 'event-div.foo.bar:click'}).or(
        sinon.match({section: 'event-div.foo.bar:onclick'})),
        error)
      ).to.be(true);
      done();
    });

  it('should remove event listeners', function(done) {
      var spy = sinon.spy();

      el = document.createElement('div');

      if (el.addEventListener) {
        el.addEventListener('click', spy);
        el.removeEventListener('click', spy);
      } else {
        el.attachEvent('click', spy);
        el.detachEvent('click', spy);
      }

      document.body.appendChild(el);
      click(el);

      expect(spy.callCount).to.equal(0);
      done();
    });

  it('should handle events on the window object', function(done) {
     // We can't fire events on IE <= 8, so we can't catch them
     if (!window.Window || window.attachEvent) {
        return done();
      }

      var error = new Error('It failed: window'),
          handler = sinon.spy(function() { throw error; });

      Costanza.run('caught!', function() {
        window.addEventListener('click', handler);
      });

        click(window);

        expect(spy.callCount).to.equal(1);
        expect(spy.calledWith(sinon.match({section: 'event-window:click'}), error)).to.be(true);
        expect(handler.callCount).to.equal(1);

        window.removeEventListener('click', handler);

        click(window);
        expect(spy.callCount).to.equal(1);
        expect(handler.callCount).to.equal(1);
        done();
      });
    });

   it('should handle events on the document object', function(done) {
      var error = new Error('It failed: doc'),
      handler = sinon.spy(function() { throw error; });

      Costanza.run('caught!', function() {
        if (document.addEventListener) {
          document.addEventListener('click', handler, true);
        } else {
          document.attachEvent('onclick', handler);
        }

        el = document.createElement('div');
        document.body.appendChild(el);
        click(el);

        expect(spy.callCount).to.equal(1);
        expect(spy.calledWith(
          sinon.match({section: 'event-#document:click'}).or(
          sinon.match({section: 'event-#document:onclick'})),
          error)
            ).to.be(true);
        expect(handler.callCount).to.equal(1);

        if (document.removeEventListener) {
          document.removeEventListener('click', handler, true);
        } else {
          document.detachEvent('click', handler);
        }

        click(el);
        expect(spy.callCount).to.equal(1);
        expect(handler.callCount).to.equal(1);
        done();
      });
    });

  function click(el) {
    if (el.click) {
      el.click();
    } else {
      try {
        event = new event('click');
      } catch (err) {
        if (document.createEvent) {
          var event = document.createEvent('MouseEvents');
          event.initEvent('click', true, true);
        } else {
          var eventObj = document.createEventObject();
          document.body.fireEvent('onclick', eventObj);
        }
      }
      el.dispatchEvent(event);
    }
  }
});
