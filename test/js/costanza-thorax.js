/*global Costanza */
describe('costanza-thorax', function() {
  var error = new Error('It failed!'),
      spy;
  beforeEach(function() {
    spy = this.spy();
    Costanza.init(spy);
  });
  afterEach(function() {
    Costanza.cleanup();
  });

  it('should create a section for view events', function() {
    var view = new (Thorax.View.extend({
      name: 'test',
      events: {
        thorax: function() {
          throw error;
        }
      }
    }))();

    view.trigger('thorax');
    expect(spy).to.have.been.calledWith({
        type: 'javascript',
        section: 'thorax-exception: test ;; view-event:thorax',
        msg: 'It failed!',
        stack: error.stack
      },
      error);
  });
  it('should tie to onException', function() {
    Thorax.onException('here!', error);
    expect(spy).to.have.been.calledWith({
        type: 'javascript',
        section: 'here!',
        msg: 'It failed!',
        stack: error.stack
      },
      error);
  });
});
