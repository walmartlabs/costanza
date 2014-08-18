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

    expect(function() {
      view.trigger('thorax');
    }).to.throw(/Costanza: /);

    expect(spy).to.have.been.calledWith({
        type: 'javascript',
        section: 'thorax-event',
        msg: 'It failed!',
        stack: error.stack,

        view: 'test',
        eventName: 'view-event:thorax'
      },
      error);
  });

  it('should tie to onException', function() {
    Thorax.onException('here!', error);
    expect(spy).to.have.been.calledWith({
        type: 'javascript',
        section: 'here!',
        msg: 'Costanza: It failed!',
        stack: error.stack
      },
      error);
  });
});
