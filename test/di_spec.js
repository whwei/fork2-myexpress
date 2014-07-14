var request = require("supertest")
  , expect = require("chai").expect
  , http = require("http");

var express = require("../");

var inject;

try {
  inject = require("../lib/injector");
} catch(e) {}

describe('Implement dependency caching', function () {
  var app, fn, count = '';

  beforeEach(function() {
    app = express();
    fn = function(req, res, next) {
      count = count + '+';
      next(null, count);
    };
    app.factory('foo', fn);
  });

  it('factory should be executed once per request', function(done) {
    app.use(app.inject(function(res, foo, next) {
      next();
    }));
    app.use(app.inject(function(res, foo) {
      res.end(foo);
    }));

    request(app)
      .get('/')
      .expect('+')
      .end(done);
  })
});