/*global ErrorSites */
describe('error-sites', function() {
  var spy;
  beforeEach(function() {
    spy = this.spy();

    ErrorSites.init(spy);
  });

  describe('#section', function() {
    it('should run callback', function() {
      var callback = this.spy(),
          section = ErrorSites.section(callback);
      section();
      expect(callback).to.have.been.calledOnce;

      section = ErrorSites.section('foo', callback);
      section();
      expect(callback).to.have.been.calledTwice;
    });
    it('report errors', function() {
      var section = ErrorSites.section('fail!', function() {
        throw new Error('Failure is always an option');
      });
      section();
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
    it('should catch errors');
    it('should include current catch tag');
  });
  describe('setInterval', function() {
    it('should catch errors');
    it('should include current catch tag');
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
