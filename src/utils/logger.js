'use strict';

var env = require('../config/environment_vars');
var slice = Array.prototype.slice;
var prefix = env.LOG_PREFIX || '';

function Logger() {
  this.queue = [];
  this.times = {};
  this.queueLog = env.QUEUE_LOG;
}

Logger.prototype.log = function () {
  var args = slice.call(arguments);
  if (this.queueLog) {
    this.queue.push({
      method: 'log',
      args: args
    });
  }
  else {
    args.unshift('[' + prefix + ']');
    console.log.apply(console, args);
  }
};

Logger.prototype.error = function () {
  var args = slice.call(arguments);
  if (this.queueLog) {
    this.queue.push({
      method: 'error',
      args: args
    });
  }
  else {
    args.unshift('[' + prefix + ']');
    console.error.apply(console, args);
  }
};

Logger.prototype.time = function (key) {
  if (this.queueLog) {
    this.times[key] = Date.now();
  }
  else {
    console.time.call(console, '[' + prefix + '] ' + key);
  }
};

Logger.prototype.timeEnd = function (key) {
  if (this.queueLog) {
    var time = Date.now() - this.times[key];
    this.queue.push({
      method: 'time',
      key: key,
      time: time
    });
  }
  else {
    console.timeEnd.call(console, '[' + prefix + '] ' + key);
  }
};

Logger.prototype.flush = function () {
  if (!this.queue.length) {
    return;
  }

  var log = [];
  this.queue.forEach(function (item) {
    log.push('[' + prefix + '] ');
    switch (item.method) {
    case 'log':
    case 'error':
      item.args.forEach(function (arg) {
        log.push(arg.toString() + ' ');
      });
      break;
    case 'time':
      log.push(item.key + ' - ' + item.time.toString() + 'ms');
      break;
    }
    log.push('\n');
  });

  console.log(log.join(''));
};

module.exports = Logger;
