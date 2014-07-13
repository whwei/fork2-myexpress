var createInjector = function (handler, app) {
  var args = [],
      injector,
      request,
      response;

  injector = function(req, res, next) {
    request = req;
    response = res;

    return handler.apply(app.server, args.concat(res));
  };

  injector.extract_params = function() {
    return getParameters(handler);
  };

  injector.dependencies_loader = function() {
    return function(callback) {
      var args = [],
          dependencies = injector.extract_params(),
          current = 0,
          err;

      next();

      function next() {
        var dp = dependencies[current];
        current++;

        if(!dp) {
          return;
        }

        app._factories[dp](request, response, function(err, value) {
          args.push(value);
          next();
        });
      }

      return callback(err, args);
    };
  };

  return injector;
};

module.exports = createInjector;


var getParameters = function (fn) {
  var fnText = fn.toString();
  if (getParameters.cache[fnText]) {
    return getParameters.cache[fnText];
  }

  var FN_ARGS        = /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
      FN_ARG_SPLIT   = /,/,
      FN_ARG         = /^\s*(_?)(\S+?)\1\s*$/,
      STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

  var inject = [];
  var argDecl = fnText.replace(STRIP_COMMENTS, '').match(FN_ARGS);
  argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg) {
    arg.replace(FN_ARG, function(all, underscore, name) {
      inject.push(name);
    });
  });

  getParameters.cache[fn] = inject;
  return inject;
};

getParameters.cache = {};