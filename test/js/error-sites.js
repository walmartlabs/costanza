/*global ErrorSites */
describe('error-sites', function() {
  var spy;
  beforeEach(function() {
    spy = this.spy();

    ErrorSites.init(spy);
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
