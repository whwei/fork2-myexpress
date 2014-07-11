// var makeRoute = function(verb, handler) {
//   return (function(v, h) {
//     return function(req, res, next) {
//       if (req.method === v.toUpperCase()) {
//         return h(req, res, next);
//       } else {
//         return next && next();
//       }
//     };
//   })(verb, handler);
// };

var makeRoute = function() {
  var route = function (req, res, parentNext) {
    var stack = route.stack,
        current = 0;

    return next();

    function next(err) {
      var currentHandler = stack[current];
      current++;

      if (parentNext && current > stack.length) {
        return parentNext(err);
      }

      if (err !== 'route' && req.method.toUpperCase() === currentHandler.verb.toUpperCase()) {
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

  return route;
};

module.exports = makeRoute;