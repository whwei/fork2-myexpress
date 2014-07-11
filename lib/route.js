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
  var route = function (req, res, next) {
    
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