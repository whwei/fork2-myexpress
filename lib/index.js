'use strict';

var http = require('http'),
    util = require('util'),
    Layer = require('./layer'),
    makeRoute = require('./route'),
    httpVerbs = require('methods'),
    createInjector = require('./injector');

module.exports = function () {
  var port = 4000,
      server = http.createServer(app);

  var app = function (req, res, parentNext) {
    var stack = app.stack,
        current = 0,
        result = undefined,
        matchUrl;

    return next();

    function next(err) {
      var currentLayer = stack[current];
      current++;

      // check if all the middlewares are called
      if (parentNext && (current > stack.length || !currentLayer)) {
        return parentNext(err);
      }

      if (!currentLayer) {
        if (!err) {
          res.writeHead(404);
          return res.end();
        } else {
          res.writeHead(500);
          return res.end();
        }
      } else if (currentLayer.handle.stack && currentLayer.handle.handle) {
        // subApp
        req.originalUrl = req.url;
        req.url = req.url.replace(currentLayer.path, '');

      } else if (currentLayer.handle.stack && !currentLayer.handle.handle) {
        // route
      } 

      matchUrl = req.originalUrl || req.url;
      if (parentNext) {
        // if it's subApp, use sub path to match
        matchUrl = req.url;
      } else if(!currentLayer.handle.stack) {
        // for normal middleware, restore the url
        req.url = req.originalUrl || req.url;
      }

      if(err) {
        result = currentLayer.match(matchUrl);
        if (currentLayer.handle.length === 4 && result) {
          req.params = result.params;
          return currentLayer.handle.call(server, err, req, res, next);
        } else {
          return next.call(server, err);
        }
      } else {
        result = currentLayer.match(matchUrl);
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

    app.stack.push(new Layer(path, middleware));
    
    return app;
  }

  // http verb support
  httpVerbs.forEach(function (method, i) {
    app[method] = function(path, handler) {
      app.route(path)[method](handler);

      return app;
    };
  })

  // all
  app.all = function(path, handler) {
    app.route(path).all(handler);

    return app;
  }

  app.route = function(path) {
    var route = makeRoute(),
        layer = new Layer(path, route);

    app.stack.push(layer);

    return route;
  };

  // di
  app._factories = {};
  app.factory = function(name, fn) {
    app._factories[name] = fn;
  };

  // inject
  app.inject = function (handler) {
    var injector = createInjector(handler, app);

    return injector;
  };

  app.handle = app;

  return app;
};

