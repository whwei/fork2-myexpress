var http = require("http"),
    mime = require('mime'),
    accepts = require('accepts'),
    crc32 = require('buffer-crc32');

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

// send
proto.send = function (code, content) {
  var type;

  if (arguments.length === 1) {
    content = code;
    code = null;
  }
  type = typeof content;

  switch(type) {
    case 'object':
      // buffer
      if (content.length) {
        !this.getHeader('Content-Type') && this.setHeader('Content-Type', 'application/octet-stream');
        this.setHeader('Content-Length', Buffer.byteLength(content));
        code && this.writeHead(code);
        this.end(content);
      } else {
        // json
        !this.getHeader('Content-Type') && this.setHeader('Content-Type', 'application/json');
        code && this.writeHead(code);
        this.end(JSON.stringify(content));
      }
      break;
    case 'string':
      // string
      
      !this.getHeader('Content-Type') && this.setHeader('Content-Type', 'text/html');
      this.setHeader('Content-Length', Buffer.byteLength(content));
      /get/i.test(this.req.method) && !this.getHeader('ETag') && content && this.setHeader('ETag', '\"' + crc32.unsigned(content) + '\"');

      if (this.req.headers["if-none-match"] && content && crc32.unsigned(this.req.headers["if-none-match"]) === crc32.unsigned(content)) {
        code = 304;
        content = null;
      } else {
        var since = +(new Date(this.req.headers['if-modified-since'])) || 0;
        var last = +(new Date(this.getHeader('Last-Modified')));
        
        if ( since >= last ) {
          code = 304;
          content = null;
        }
      }

      code && this.writeHead(code);
      this.end(content);
      break;
    case 'number':
      // status code
      this.writeHead(content);
      this.end(http.STATUS_CODES[content]);
      break;

  }
}

proto.__proto__ = http.ServerResponse.prototype;
module.exports = proto;