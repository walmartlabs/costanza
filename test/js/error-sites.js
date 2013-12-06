/*global ErrorSites, Event */
sinon.config.useFakeTimers = undefined;

describe('error-sites', function() {
  var spy,
      errorSpy,
      _onError = window.onerror;
  beforeEach(function() {
    spy = this.spy();

    // Have to disable the default error handling to prevent failures in tests that are expecting
    // them
    window.onerror = errorSpy = this.spy();

    ErrorSites.init(spy);
  });
  afterEach(function() {
    ErrorSites.cleanup();
    window.onerror = _onError;
  });

  describe('#section', function() {
    it('should run callback', function() {
      var callback = this.spy();
      ErrorSites.run(callback);
      expect(callback).to.have.been.calledOnce;

      ErrorSites.run('foo', callback);
      expect(callback).to.have.been.calledTwice;
    });
    it('report errors', function() {
      ErrorSites.run('fail!', function() {
        throw new Error('Failure is always an option');
      });
      expect(spy).to.have.been.calledWith('fail!', new Error('Failure is always an option'));
    });
    it('should restore the site', function() {
      var section1 = ErrorSites.section('success', function() {
        expect(ErrorSites.current()).to.equal('success');
        section2();
        expect(ErrorSites.current()).to.equal('success');
      });
      var section2 = ErrorSites.section(function() {
        expect(ErrorSites.current()).to.equal('global');
        section3();
      });
      var section3 = ErrorSites.section('fail!', function() {
        expect(ErrorSites.current()).to.equal('fail!');
        throw new Error('Failure is always an option');
      });
      section1();
      expect(spy).to.have.been.calledWith('fail!', new Error('Failure is always an option'));
    });
  });

  describe('#onerror', function() {
  });

  describe('setTimeout', function() {
    it('should trigger successfully', function(done) {
      var spy = this.spy(done);
      setTimeout(spy, 10);
      expect(spy).to.not.have.been.called;
    });
    it('should catch errors', function(done) {
      ErrorSites.init(function(name, err) {
        expect(name).to.equal('global');
        expect(err.message).to.equal('It failed');
        done();
      });

      setTimeout(function() {
        throw new Error('It failed');
      }, 10);
    });
    it('should include current catch tag', function(done) {
      ErrorSites.init(function(name, err) {
        expect(name).to.equal('tracked!');
        expect(err.message).to.equal('It failed');
        done();
      });

      ErrorSites.run('tracked!', function() {
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
      ErrorSites.init(function(name, err) {
        clearInterval(interval);

        expect(name).to.equal('global');
        expect(err.message).to.equal('It failed');
        done();
      });

      interval = setInterval(function() {
        throw new Error('It failed');
      }, 10);
    });
    it('should include current catch tag', function(done) {
      ErrorSites.init(function(name, err) {
        clearInterval(interval);

        expect(name).to.equal('tracked!');
        expect(err.message).to.equal('It failed');
        done();
      });

      ErrorSites.run('tracked!', function() {
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
      var el = document.createElement('div');
      el.addEventListener('click', function() { throw new Error('It failed'); });

      var event = new Event('click');
      el.dispatchEvent(event);

      expect(spy)
          .to.have.been.calledOnce
          .to.have.been.calledWith('global', new Error('It failed'));
    });
    it('should include current catch tag', function() {
      var el = document.createElement('div');

      ErrorSites.run('tracked!', function() {
        el.addEventListener('click', function() { throw new Error('It failed'); });
      });

      var event = new Event('click');
      el.dispatchEvent(event);

      expect(spy)
          .to.have.been.calledOnce
          .to.have.been.calledWith('tracked!', new Error('It failed'));
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
  describe('on attribute handlers', function() {
    it('should catch errors');
    it('should include current catch tag');
  });
});
