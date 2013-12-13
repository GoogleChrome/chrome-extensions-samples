'use strict';

(function (global) {
  var scripts = document.querySelectorAll('script');
  var script_base_url = scripts[scripts.length - 1].src;
  scripts = null;
  var include_re = /^#include\s*"([\w\.]+?)"\s*$/m;
  var rel_re = /(\/[^\/]+\/\.\.)|([^\/]+\/\.\.\/?)/g;
  var root_re = /^[\w\-]*:\/\/\/?[\w\-\.]+/;
  var loadingCache = {};

  function resolveShader(code, file, callback) {
    if (!include_re.test(code)) {
      callback(code);
      return;
    }
    loadShaderImpl(include_re.exec(code)[1], file, function (shader) {
      code = code.replace(include_re, shader);
      resolveShader(code, file, callback);
    });
  }

  function loadShaderImpl(file, base_url, callback) {
    if (loadingCache[file]) {
      callback(loadingCache[file]);
      return;
    }

    var nf = file.replace(rel_re, '');
    while (nf != file) {
      file = nf;
      nf = file.replace(rel_re, '');
    }

    if (root_re.exec(file)) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", file, true);
      xhr.onload = function () {
        var code = xhr.responseText;
        resolveShader(code, file, function (resolved_code) {
          loadingCache[file] = resolved_code;
          callback(resolved_code);
        });
      };
      xhr.send(null);
      return;
    }

    if (base_url.charAt(base_url.length - 1) == '/') {
      loadShaderImpl(base_url + file, base_url, callback);
    } else {
      loadShaderImpl(base_url.substring(0, base_url.lastIndexOf('/') + 1) + file, base_url, callback);
    }
  }

  function loadShader(file, callback) {
    loadShaderImpl(file, script_base_url, callback);
  }

  function loadShaders(files, callback) {
    var result = [], finished = 0;

    files.forEach(function (file, i) {
      loadShader(file, function (code) {
        result[i] = code;
        finished++;
        if (finished == files.length) {
          callback(result);
        }
      });
    });
  }

  global.loadShader = loadShader;
  global.loadShaders = loadShaders;
})(this);
