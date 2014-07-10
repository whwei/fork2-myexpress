var p2re = require('path-to-regexp');

var Layer = function(path, middleware, opt) {
  this.handle = middleware;
  this.path = path;
  this.opt = opt;
};

Layer.prototype.match = function(p) {
  var ret,
      opt = this.opt,
      keys = [],
      params = {},
      match = this.path,
      result;

  // decode
  p = decodeURIComponent(p);

  /\/$/.test(match) && (match = match.substr(-1));
  match = match === '/' ? '' : match;

  re = p2re(match, keys, opt || {end: false});
  
  if (re.test(p)) {
    result = re.exec(p);

    keys.forEach(function(v, i) {
      params[v.name] = result[i + 1];
    });

    ret = {
      path: result[0],
      params: params
    };
  }

  return ret;
};

module.exports = Layer;
