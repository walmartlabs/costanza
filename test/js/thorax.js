/*global Costanza */
describe('costanza-thorax', function() {
  var error = new Error('It failed!'),
      spy;
  beforeEach(function() {
    spy = sinon.spy();
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
    }).to.throwError(/Costanza: /);

    expect(spy.calledWith({
        type: 'javascript',
        section: 'thorax-event',
        msg: 'It failed!',
        stack: error.stack,

        view: 'test',
        eventName: 'view-event:thorax'
      },
      error)).to.be(true);
  });

  it('should tie to onException', function() {
    Thorax.onException('here!', error);
    expect(spy.calledWith({
        type: 'javascript',
        section: 'here!',
        msg: 'Costanza: It failed!',
        stack: error.stack
      },
      error)).to.be(true);
  });
});
