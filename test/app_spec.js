var myexpress = require('../lib/');
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


  describe('Implement middleware stack', function() {
    var app,
        server;

    beforeEach(function() {
      app = myexpress();
    });

    it('should be able to call a single middleware', function(done) {
      app.use(function(req, res, next) {
        res.end('hello from m1');
      });

      request(app)
        .get('/foo')
        .expect('hello from m1')
        .end(done);
    });

    it('should be able to call next to call the next middleware', function(done) {
      app.use(function(req, res, next) {
        next();
      });

      app.use(function(req, res, next) {
        res.end('hello from m2');
      });

      request(app)
        .get('/foo')
        .expect('hello from m2')
        .end(done);
    });

    it('should 404 at the end of middleware chain', function(done) {
      app.use(function(req, res, next) {
        next();
      });

      app.use(function(req, res, next) {
        next();
      });

      request(app)
        .get('/foo')
        .expect(404)
        .end(done);
    });

    it('should 404 no middleware added', function(done) {

      request(app)
        .get('/foo')
        .expect(404)
        .end(done);
    });
  });


  describe("Implement Error Handling",function() {
    var app;
    beforeEach(function() {
      app = new myexpress();
    });

    it("should return 500 for unhandled error", function(done) {
      var m1 = function(req,res,next) {
        next(new Error("boom!"));
      }
      app.use(m1);
      request(app).get("/").expect(500).end(done);
    });

    it("should return 500 for uncaught error", function(done) {
      var m1 = function(req,res,next) {
        throw new Error("boom!");
      }
      app.use(m1);
      request(app).get("/").expect(500).end(done);
    });

    it("should ignore error handlers when `next` is called without an error",function(done) {
      var m1 = function(req,res,next) {
        next();
      }

      var e1 = function(err,req,res,next) {
        // timeout
      }

      var m2 = function(req,res,next) {
        res.end("m2");
      }

      app.use(m1);
      app.use(e1); // should skip this
      app.use(m2);
      request(app).get("/").expect("m2").end(done);
    });

    it("should skip normal middlewares if `next` is called with an error",function(done) {
      var m1 = function(req,res,next) {
        next(new Error("boom!"));
      }

      var m2 = function(req,res,next) {
        // timeout
      }

      var e1 = function(err,req,res,next) {
        res.end("e1");
      }

      app.use(m1);
      app.use(m2); // should skip this. will timeout if called.
      app.use(e1);
      request(app).get("/").expect("e1").end(done);
    });
  });


  describe('Implement App Embedded middleware', function() {
    var app,
        subApp;

    beforeEach(function() {
      app = new myexpress();
      subApp = new myexpress();
    });

    it('should pass unhandled request to parent', function(done) {
      function m2(req, res, next) {
        res.end('m2');
      }

      app.use(m2);
      app.use(subApp);

      request(app)
        .get('/')
        .expect('m2')
        .end(done);
    });

    it('should pass unhandled error to parent', function(done) {
      function m1(req, res, next) {
        next('m1 error');
      }

      function e1(err, req, res, next) {
        res.end(err);
      }

      subApp.use(m1);

      app.use(subApp);
      app.use(e1);

      request(app)
        .get('/')
        .expect('m1 error')
        .end(done);
    });
  });

});

