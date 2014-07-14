var createInjector = function (handler, app) {
  var args = [],
      injector;

  injector = function(req, res, next) {
    var loader = injector.dependencies_loader(req, res, next);

    return loader(function(err, value) {
      if (err) {
        next(err);
      } else if (handler) {
        handler.apply(app.server, value);        
      }
    });
  };

  injector.extract_params = function() {
    return getParameters(handler);
  };

  injector.dependencies_loader = function(req, res, next) {
    return function(callback) {
      var args = [],
          dependencies = injector.extract_params(),
          current = 0,
          error,
          cache = {};

      // save req, res, next
      cache.req = req;
      cache.res = res;
      cache.next = next;

      nxt();

      return callback(error, args);

      function nxt(err) {
        var dp = dependencies[current];
        current++;

        if(!dp) {
          return;
        }

        if (app._dependencyCache[dp]) {
          // already been cached in app._dependencyCache
          args.push(app._dependencyCache[dp]);
          nxt();
        } else if (dp === 'req' || dp === 'res' || dp === 'next') {
          // buildin dependencies 
          args.push(cache[dp]);
          nxt();
        } else if (!app._factories[dp]) {
          error = new Error('Factory not defined: ' + dp);
          args.push(error);
          nxt();
        } else {
          try {
            app._factories[dp](cache.req, cache.res, function(err, value) {
              if (err) {
                args.push(err);
                error = err;
              } else {
                args.push(value); 
                app._dependencyCache[dp] = value;             
              }
              nxt();
            });
          } catch (e) {
            error = e;
          }
        }  
      }

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