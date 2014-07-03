var express = require('../');
var http = require('http');
var request = require('supertest');
var expect = require('chai').expect;

describe('app', function() {
  var app = express();

  describe('create http server', function() {
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

  describe('#listen', function() {
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
})