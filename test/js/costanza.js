/*global Costanza, Event */
sinon.config.useFakeTimers = undefined;

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

    Costanza.init(spy);
  });
  afterEach(function() {
    Costanza.cleanup();
    window.onerror = _onError;
  });

  describe('#bind', function() {
    it('should run callback', function() {
      var callback = this.spy();
      Costanza.run(callback);
      expect(callback).to.have.been.calledOnce;

      Costanza.run('foo', callback);
      expect(callback).to.have.been.calledTwice;
    });
    it('report errors', function() {
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
    });
    it('should restore the site', function() {
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
    });
  });

  describe('#onerror', function() {
    it('should handle error strings', function() {
      Costanza.onError('foo', 'bar', 1);
      expect(spy).to.have.been.calledWith({type: 'javascript', section: 'global', url: 'bar', line: 1, msg: 'foo', stack: undefined});
    });
    it('should handle error objects', function() {
      Costanza.onError('foo', 'bar', 1, {foo: true});
      expect(spy).to.have.been.calledWith({type: 'javascript', section: 'global', url: 'bar', line: 1, msg: 'foo', stack: undefined}, {foo: true});
    });
    it('should handle ErrorEvents', function() {
      Costanza.onError({message: 'foo', lineno: 1, filename: 'bar'});
      expect(spy).to.have.been.calledWith({type: 'javascript', section: 'global', url: 'bar', line: 1, msg: 'foo', stack: undefined});
    });

    describe('loading errors', function() {
      it('should handle image load errors', function(done) {
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
        Costanza.init(function(info, err) {
          expect(info.section).to.equal('global');
          expect(info.type).to.equal('script');
          expect(info.url).to.match(/\/not-found.js$/);
          done();
        });

        var script = document.createElement('script');
        script.src = '/not-found.js';
        document.getElementById('qunit-fixture').appendChild(script);
      });
      it('should handle script load errors', function(done) {
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
    it('should execute event listeners', function() {
      var el = document.createElement('div'),
          spy = this.spy();
      el.addEventListener('click', spy);

      var event = new Event('click');
      el.dispatchEvent(event);

      expect(spy)
          .to.have.been.calledOnce
          .to.have.been.calledWith(event);
    });
    it('should catch errors', function() {
      var el = document.createElement('div'),
          error = new Error('It failed');
      el.addEventListener('click', function() { throw error; });

      var event = new Event('click');
      el.dispatchEvent(event);

      expect(spy)
          .to.have.been.calledOnce
          .to.have.been.calledWith(sinon.match({section: 'global'}), error);
    });
    it('should include current catch tag', function() {
      var el = document.createElement('div'),
          error = new Error('It failed');

      Costanza.run('tracked!', function() {
        el.addEventListener('click', function() { throw error; });
      });

      var event = new Event('click');
      el.dispatchEvent(event);

      expect(spy)
          .to.have.been.calledOnce
          .to.have.been.calledWith(sinon.match({section: 'tracked!'}), error);
    });
    it('should remove event listeners', function() {
      var el = document.createElement('div'),
          spy = this.spy();
      el.addEventListener('click', spy);
      el.removeEventListener('click', spy);

      var event = new Event('click');
      el.dispatchEvent(event);

      expect(spy).to.not.have.been.called;
    });
  });
});
