/*global Costanza, Event */

// NOTE: Many of these tests are async form when they appear to be sync. This is because many of the
// tests will not properly emit failures outside of timeout errors due to the error handling logic
// that is under test. If test timeouts are seen then it's likely that one of the expectations
// failed. The first step in this case should be logging the expectations to see if any threw.

describe('costanza', function() {
  var error = new Error('Failure is always an option'),
      spy,
      errorSpy,
      _onError = window.onerror;
  beforeEach(function() {
    spy = this.spy();

    // Have to disable the default error handling to prevent failures in tests that are expecting
    // them
    window.onerror = errorSpy = this.spy();

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
      var callback = this.spy();
      Costanza.run(callback);
      expect(callback).to.have.been.calledOnce;

      Costanza.run('foo', callback);
      expect(callback).to.have.been.calledTwice;
      done();
    });
    it('report errors', function(done) {
      Costanza.run('fail!', function() {
        throw error;
      });
      expect(spy).to.have.been.calledWith({
          type: 'javascript',
          section: 'fail!',
          msg: 'Failure is always an option',
          stack: error.stack
        },
        error);
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
      section1();
      expect(spy).to.have.been.calledWith({
          type: 'javascript',
          section: 'fail!',
          msg: 'Failure is always an option',
          stack: error.stack
        }, error);
      done();
    });
  });

  describe('#onerror', function() {
    it('should handle error strings', function(done) {
      Costanza.onError('foo', 'bar', 1);
      expect(spy).to.have.been.calledWith({type: 'javascript', section: 'global', url: 'bar', line: 1, msg: 'foo', stack: undefined});
      done();
    });
    it('should handle error objects', function(done) {
      Costanza.onError('foo', 'bar', 1, {foo: true});
      expect(spy).to.have.been.calledWith({type: 'javascript', section: 'global', url: 'bar', line: 1, msg: 'foo', stack: undefined}, {foo: true});
      done();
    });
    it('should handle ErrorEvents', function(done) {
      Costanza.onError({message: 'foo', lineno: 1, filename: 'bar'});
      expect(spy).to.have.been.calledWith({type: 'javascript', section: 'global', url: 'bar', line: 1, msg: 'foo', stack: undefined});
      done();
    });

    describe('loading errors', function() {
      it('should handle image load errors', function(done) {
        if ($.browser.firefox) {
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
        document.getElementById('qunit-fixture').appendChild(img);
      });
      it('should handle script load errors', function(done) {
        if ($.browser.firefox
            || window.mochaPhantomJS) {
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
        document.getElementById('qunit-fixture').appendChild(script);
      });
      it('should handle script parse errors', function(done) {
        if (($.os.android && parseFloat($.os.version) < 3)
            || /Opera\//.test(navigator.userAgent)
            || window.mochaPhantomJS) {
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
        script.src = '/invalid.js';
        document.getElementById('qunit-fixture').appendChild(script);
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
        document.getElementById('qunit-fixture').appendChild(link);
      });

      it('should handle video not found errors', function(done) {
        if ($.os.phone || $.browser.firefox || $.os.android) {
          // Most phones dump to an external app for video, so ignore for the sake of tests
          // Firefox generally doesn't support capturing error events
          return done();
        }

        Costanza.init(function(info, err) {
          expect(info.section).to.equal('global');
          expect(info.type).to.equal('video');
          expect(info.url).to.match(/\/not-found.mpg$/);
          done();
        });

        var video = document.createElement('video');
        video.src = '/not-found.mpg';
        document.getElementById('qunit-fixture').appendChild(video);
      });

      it('should handle video load errors', function(done) {
        if ($.os.phone || $.browser.firefox || $.os.android) {
          // Most phones dump to an external app for video, so ignore for the sake of tests
          // Firefox generally doesn't support capturing error events
          return done();
        }

        Costanza.init(function(info, err) {
          expect(info.section).to.equal('global');
          expect(info.type).to.equal('video');
          expect(info.url).to.match(/\/invalid.js$/);
          done();
        });

        var video = document.createElement('video');
        video.src = '/invalid.js';
        document.getElementById('qunit-fixture').appendChild(video);
      });
    });
  });

  describe('setTimeout', function() {
    it('should trigger successfully', function(done) {
      var spy = this.spy(done);
      setTimeout(spy, 10);
      expect(spy).to.not.have.been.called;
    });

    it('should trigger strings successfully', function(done) {
      window._stringSet = done;
      setTimeout('window._stringSet();', 10);
    });

    it('should trigger with args successfully', function(done) {
      if (/MSIE/i.test(navigator.userAgent)) {
        return done();
      }

      var spy = this.spy(function(arg1, arg2) {
        expect(arg1).to.equal('foo');
        expect(arg2).to.equal(2);
        done();
      });
      setTimeout(spy, 10, 'foo', 2);
      expect(spy).to.not.have.been.called;
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
  describe('setInterval', function() {
    var interval;
    afterEach(function() {
      clearInterval(interval);
    });

    it('should trigger successfully', function(done) {
      var spy = this.spy(function() {
        clearInterval(interval);
        done();
      });
      interval = setInterval(spy, 10);
      expect(spy).to.not.have.been.called;
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

      var spy = this.spy(function(arg1, arg2) {
        clearInterval(interval);
        expect(arg1).to.equal('foo');
        expect(arg2).to.equal(2);
        done();
      });
      interval = setInterval(spy, 10, 'foo', 2);
      expect(spy).to.not.have.been.called;
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
      var spy = this.spy();

      el = document.createElement('div');
      el.addEventListener('click', spy);

      document.body.appendChild(el);
      click(el);

      expect(spy).to.have.been.calledOnce;
      done();
    });

    it('should execute handleEvent listeners', function(done) {
      var spy = this.spy();
      var handler = {
        handleEvent: spy
      };

      el = document.createElement('div');
      el.addEventListener('click', handler);

      document.body.appendChild(el);
      click(el);

      expect(spy)
          .to.have.been.calledOnce
          .to.have.been.calledOn(handler);

      el.removeEventListener('click', handler);
      click(el);

      expect(spy).to.have.been.calledOnce;

      done();
    });
    it('should catch errors', function(done) {
      var error = new Error('It failed');

      el = document.createElement('div');
      el.addEventListener('click', function() { throw error; });

      document.body.appendChild(el);
      click(el);

      expect(spy)
          .to.have.been.calledOnce
          .to.have.been.calledWith(sinon.match({section: 'global'}), error);
      done();
    });
    it('should include current catch tag', function(done) {
      var error = new Error('It failed');

      el = document.createElement('div');
      Costanza.run('tracked!', function() {
        el.addEventListener('click', function() { throw error; });
      });

      document.body.appendChild(el);
      click(el);

      expect(spy)
          .to.have.been.calledOnce
          .to.have.been.calledWith(sinon.match({section: 'tracked!'}), error);
      done();
    });
    it('should remove event listeners', function(done) {
      var spy = this.spy();

      el = document.createElement('div');
      el.addEventListener('click', spy);
      el.removeEventListener('click', spy);

      document.body.appendChild(el);
      click(el);

      expect(spy).to.not.have.been.called;
      done();
    });

    it('should handle events on the window object', function(done) {
      if (!window.Window) {
        return done();
      }

      var error = new Error('It failed: window'),
          handler = this.spy(function() { throw error; });

      Costanza.run('caught!', function() {
        window.addEventListener('click', handler);

        click(window);

        expect(spy)
            .to.have.been.calledOnce
            .to.have.been.calledWith(sinon.match({section: 'caught!'}), error);
        expect(handler).to.have.been.calledOnce;

        window.removeEventListener('click', handler);

        click(window);
        expect(spy).to.have.been.calledOnce;
        expect(handler).to.have.been.calledOnce;
        done();
      });
    });
    it('should handle events on the document object', function(done) {
      var error = new Error('It failed: doc'),
          handler = this.spy(function() { throw error; });

      Costanza.run('caught!', function() {
        document.addEventListener('click', handler, true);

        el = document.createElement('div');
        document.body.appendChild(el);
        click(el);

        expect(spy)
            .to.have.been.calledOnce
            .to.have.been.calledWith(sinon.match({section: 'caught!'}), error);
        expect(handler).to.have.been.calledOnce;

        document.removeEventListener('click', handler, true);

        click(el);
        expect(spy).to.have.been.calledOnce;
        expect(handler).to.have.been.calledOnce;
        done();
      });
    });
  });

  function click(el) {
    if (el.click) {
      el.click();
    } else {
      try {
        event = new Event('click');
      } catch (err) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
      }
      el.dispatchEvent(event);
    }
  }
});
