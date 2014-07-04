var myexpress = require('../');
var http = require('http');
var request = require('supertest');
var expect = require('chai').expect;

describe('app', function() {

  describe('create http server', function() {
    var app = myexpress();
    var server;

    before(function() {
      server = http.createServer(app);
    });
    
    it('and response to / with 404', function(done) {
      request(server)
        .get('/')
        .expect(404)
        .end(done);
    })
  });


  describe('implement #listen method', function() {
    var app = myexpress();
    var server;

    before(function(done) {
      server = app.listen(7000, done);
    });

    it('should return a server', function() {
      expect(server).to.be.instanceof(http.Server);
    });

    it('should listen on port 7000 and response with 404', function(done) {
      request('http://localhost:7000')
        .get('/foo')
        .expect(404)
        .end(done);
    });
  });

  describe('app.use', function() {
    var app = myexpress();

    it('should has a use method', function() {
      expect(app.use).to.be.a('function');
    });

    it('should be able to add middlewares to stack', function() {
      var m1 = function(){};
      var m2 = function(){};
      app.use(m1);
      app.use(m2);
      expect(app.stack.length).to.eql(2);
    })
  });


  describe('calling middleware stack', function() {
    var app,
        server;

    beforeEach(function() {
      app = myexpress();
    });

    it('should be able to call a single middleware', function(done) {
      app.use(function(req, res, next) {
        res.end('hello from m1');
      });

      server = app.listen(4000); 

      request(server)
        .get('/foo')
        .expect('hello from m1')
        .end(done);
    });
  });


});

