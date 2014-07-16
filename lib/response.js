var http = require("http"),
    mime = require('mime'),
    accepts = require('accepts');

var proto = {};
proto.isExpress = true;

proto.redirect = function(code, path) {
  if (typeof code === 'string') {
    path = code;
    code = 302;
  }

  this.writeHead(code, {
    'Location': path,
    'Content-Length': 0
  });
  this.end();
};

// res.type
proto.type = function(type) {
  this.setHeader('Content-Type', mime.lookup(type));
};

// default type
proto.default_type = function (type) {
  if (!this.getHeader('Content-Type')) {
    this.setHeader('Content-Type', mime.lookup(type));        
  }
};


// format
proto.format = function (obj) {
  var types = Object.keys(obj),
      accept = accepts(this.req),
      prefer = accept.types(types);

  if (types.length === 0) {
    var err = new Error("Not Acceptable");
    err.statusCode = 406;
    throw err;
  } else {
    this.setHeader('Content-Type', mime.lookup(prefer));
    return obj[prefer](this.req, this);
  }
};

proto.__proto__ = http.ServerResponse.prototype;
module.exports = proto;