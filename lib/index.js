var http = require('http'),
    util = require('util'),
    Layer = require('./layer'),
    makeRoute = require('./route'),
    httpVerbs = require('methods');

module.exports = function() {
  var port = 4000,
      server = http.createServer(app);

  var app = function(req, res) {
    var stack = app.stack,
        current = 0,
        result = undefined;

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
        result = currentLayer.match(req.url);
        if (currentLayer.handle.length === 4 && result) {
          req.params = result.params;
          return currentLayer.handle.call(server, err, req, res, next);
        } else {
          return next.call(server, err);
        }
      } else {
        result = currentLayer.match(req.url);
        if (currentLayer.handle.length !== 4 && result) {
          try {
            req.params = result.params;
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

    if (middleware instanceof Layer) {
      app.stack.push(middleware);
    } else if (util.isArray(middleware.stack) && typeof middleware.handle === 'function') {
      var subStack = [];

      middleware.stack.forEach(function(v, i) {
        var originalPath = v.path;
        v.path = path.replace(/\/$/, '') + v.path;
        // wrap it
        v.handle = (function(handle) {
          return function() {
            if (arguments.length === 4) {
              arguments[1].url = originalPath;
            } else {
              arguments[0].url = originalPath;
            }
            
            return handle.apply(server, arguments);            
          }
        })(v.handle, originalPath);

        subStack.push(v);
      })

      app.stack = app.stack.concat(subStack);
    } else {
      app.stack.push(new Layer(path, middleware));
    }

    return app;
  }

  // http verb support
  httpVerbs.forEach(function(method, i) {
    app[method] = function(path, handler) {
      var layer;

      handler = makeRoute(method.toUpperCase(), handler);

      app.use(new Layer(path, handler, {end: true}));
    };
  })

  app.handle = app;

  return app;
};

