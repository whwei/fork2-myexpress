var http = require('http'),
    Layer = require('./layer'),
    util = require('util');

module.exports = function() {
  var port = 4000,
      server = http.createServer(app);

  var app = function(req, res) {
    var stack = app.stack;
    var current = 0;

    return next();

    function next(err) {
      var currentLayer = stack[current];
      current++;

      if (!(currentLayer instanceof Layer)) {
        if (!err) {
          res.writeHead(404);
          res.end();
        } else {
          res.writeHead(500);
          res.end();
        }
      } else if(err) {
        if (currentLayer.handle.length === 4 && currentLayer.match(req.url)) {
          return currentLayer.handle.call(server, err, req, res, next);
        } else {
          return next.call(server, err);
        }
      } else {
        if (currentLayer.handle.length !== 4 && currentLayer.match(req.url)) {
          try {
            return currentLayer.handle.call(server, req, res, next);
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
  app.use = function(path, middleware) {
    if (arguments.length === 1) {
      middleware = path;
      path = '/';
    }

    if (util.isArray(middleware.stack)) {
      app.stack = app.stack.concat(middleware.stack)
    } else {
      app.stack.push(new Layer(path, middleware));
    }

    return app;
  }

  return app;
};

