var http = require("http"),
    path = require('path'),
    fs = require('fs'),
    util = require('util'),
    mime = require('mime'),
    accepts = require('accepts'),
    crc32 = require('buffer-crc32'),
    rparser = require('range-parser');

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
proto.send = function (statusCode, responseContent) {
  var type,
      code,
      content;

  if (arguments.length === 1) {
    content = statusCode;
    code = null;
  } else {
    code = statusCode;
    content = responseContent;
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

// stream
proto.stream = function (stream) {
  var res = this;
  stream.on('data', function (chunk) {
    var ret = res.write(chunk);
    if (!ret) {
      stream.pause();
    }

    res.once('drain', function () {
      stream.resume();
    })
  });

  stream.on('end', function () {
    res.end();
  })
};


// sendfile
proto.sendfile = function (file, root) {
  var res = this,
      dir = (root && root.root ? root.root : '') + file;

  if (file.indexOf('..') !== -1) {
    return res.send(403);
  }

  dir = path.normalize(dir);

  fs.stat(dir, function (err, stats) {
    if (err) {
      return res.send(404);
    }

    if (stats.isDirectory()) {
      return res.send(403);
    }

    // get range
    var headerRange = res.req.headers['range'],
        range =  headerRange && rparser(stats.size, headerRange);

    if (headerRange) {
      if (range == -1) {
        return res.send(416);
      }

      if (range instanceof Array) {
        res.setHeader('Content-Range', 'bytes ' + headerRange.split('=')[1] + '/' + stats.size);
        res.statusCode = 206;
      }
    }

    var read = fs.createReadStream(dir, range && range[0]);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Accept-Range', (range && range.type) || 'bytes');

    read.on('data', function (chunk) {
      var ret = res.write(chunk);

      if (!ret) {
        read.pause();
      }

      res.once('drain', function () {
        read.resume();
      });
    });

    read.on('end', function () {
      res.end();
    })
  })
  
};

proto.__proto__ = http.ServerResponse.prototype;
module.exports = proto;