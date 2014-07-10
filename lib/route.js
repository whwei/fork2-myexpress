var makeRoute = function(verb, handler) {
  return (function(v, h) {
    return function(req, res, next) {
      if (req.method === v.toUpperCase()) {
        return h(req, res, next);
      } else {
        return next && next();
      }
    };
  })(verb, handler);
};

module.exports = makeRoute;