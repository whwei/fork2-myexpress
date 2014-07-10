var makeRoute = require('../lib/route'),
    expect = require("chai").expect;

describe('makeRoute', function() {
  var handler;

  before(function() {
    handler = function(req, res, next) {
      return 'handler';
    };
  });

  it('should wrap passed handler', function() {
      var h = makeRoute('GET', handler);
      expect(h({method: 'GET'})).to.eql('handler');
  });

  it('should respond for given mothed', function() {
      var h = makeRoute('GET', handler);

      expect(h({method: 'GET'})).to.eql('handler');

      expect(h({method: 'POST'})).to.be.undefined;
  });
})