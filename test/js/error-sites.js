sinon.config.useFakeTimers = undefined;

/*global ErrorSites */
describe('error-sites', function() {
  var spy;
  beforeEach(function() {
    spy = this.spy();

    ErrorSites.init(spy);
  });
  afterEach(function() {
    ErrorSites.cleanup();
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
        expect(ErrorSites.current()).to.not.exist;
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
    it('should catch errors');
    it('should include current catch tag');
  });
  describe('on attribute handlers', function() {
    it('should catch errors');
    it('should include current catch tag');
  });
});
