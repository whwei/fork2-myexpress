
var Layer = function(path, middleware) {
  this.handle = middleware;
  this.path = path;
};

Layer.prototype.match = function(p) {
  var ret;

  if (p.indexOf(this.path) === 0) {
    ret = {
      path: this.path
    };
  }

  return ret;
};

module.exports = Layer;
