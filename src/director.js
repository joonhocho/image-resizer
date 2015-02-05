'use strict';

// fit=300,200,0.1,0.5;sepia=0.5

function Director(options) {
  options = options || {};
  this.directiveSeparator = options.directiveSeparator || ';';
  this.paramSeparator = options.paramSeparator || ',';
  this.regexp = options.regexp || /^(\w+)(?:\=([\w.]+(?:,[\w.]+)*))?$/;
  this.map = {};
}

Director.prototype = {
  add: function (key, parse, stream) {
    this.map[key] = {
      key: key,
      parse: parse,
      stream: stream
    };
  },
  parse: function (str) {
    return str.split(this.directiveSeparator).map(this.parseOne, this);
  },
  parseOne: function (str) {
    if (!str) {
      throw new Error('Empty directive');
    }
    var match = str.match(this.regexp);
    if (!match) {
      throw new Error('Invalid directive');
    }
    var key = match[1];
    var params = match[2].split(this.paramSeparator);
    var dt = this.map[key];
    if (!dt) {
      throw new Error('Unknown directive');
    }
    return dt.stream(dt.parse.apply(dt, params));
  },
  stream: function (src, streams) {
    return streams.reduce(function (src, stream) {
      return src.pipe(stream);
    }, src);
  },
  parseAndStream: function (str, src) {
    return this.stream(src, this.parse(str));
  }
};

(function () {
  var shared = Director.shared = new Director();

  var directives = require('./directives');
  Object.keys(directives).forEach(function (key) {
    var directive = directives[key];
    shared.add(key, directive.parse, directive.stream);
  });
})();

module.exports = Director;
