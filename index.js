var http = require('http');

module.exports = function() {
  var server,
      port = 4000;

  var app = function(req, res) {
    var stack = app.stack;
    var current = 0;

    stack[0] && stack[0].call(server, req, res, next);

    function next() {
      current++;
      if (stack[current]) {
        stack[current].call(server, req, res, next);
      } else {
        res.writeHead(404);
        res.end();
      }
    }

    res.writeHead(404);
    res.end();
  };

  app.listen = function(port, callback) {
    server = http.createServer(app).listen(port, callback);

    return server;
  };

  app.stack = [];
  app.use = function(middleware) {
    app.stack.push(middleware);

    return server;
  }

  return app;
};