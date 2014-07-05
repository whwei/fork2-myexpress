var http = require('http'),
    util = require('util');

module.exports = function() {
  var port = 4000,
      server = http.createServer(app);

  var app = function(req, res) {
    var stack = app.stack;
    var current = 0;

    return next();

    function next(err) {
      var currentMiddleware = stack[current];
      current++;

      if (typeof currentMiddleware !== 'function') {
        if (!err) {
          res.writeHead(404);
          res.end();
        } else {
          res.writeHead(500);
          res.end();
        }
      } else if(err) {
        if (currentMiddleware.length === 4) {
          return currentMiddleware.call(server, err, req, res, next);
        } else {
          return next.call(server, err);
        }
      } else {
        if (currentMiddleware.length !== 4) {
          try {
            return currentMiddleware.call(server, req, res, next);
          } catch (e) {
            return next.call(server, e);
          }
        } else {
          return next.call(server);
        }
      }
      return;
    }
  };

  app.listen = function(port, callback) {
    server = http.createServer(app).listen(port, callback);

    return server;
  };

  app.stack = [];
  app.use = function(middleware) {
    if (util.isArray(middleware.stack)) {
      app.stack = app.stack.concat(middleware.stack)
    } else {
      app.stack.push(middleware);
    }
    return app;
  }

  return app;
};

