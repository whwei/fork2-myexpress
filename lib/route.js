var methods = require('methods');

var makeRoute = function() {
  var route = function (req, res, parentNext) {
    var stack = route.stack,
        current = 0;

    return next();

    function next(err) {
      var currentHandler = stack[current];
      current++;

      if (parentNext && err instanceof Error) {
        return parentNext(err);
      }

      if (parentNext && current > stack.length) {
        return parentNext(err);
      }

      if ( currentHandler.verb === 'all' || (err !== 'route' && req.method.toUpperCase() === currentHandler.verb.toUpperCase())) {
        return currentHandler.handler(req, res, next);
      } else {
        return next();
      }
    }
  };

  route.stack = [];

  route.use = function (verb, handler) {
    route.stack.push({
      verb: verb,
      handler: handler
    });
  }

  // route.VERB
  methods.forEach(function(v, i) {
    route[v] = function(handler) {
      route.use(v, handler);
      return route;
    }
  });

  // add all
  route.all = function(handler) {
    route.use('all', handler);
    return route;
  }

  return route;
};

module.exports = makeRoute;