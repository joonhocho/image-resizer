'use strict';

var INT_REGEXP = /^-?[1-9][0-9]*$/;
var UINT_REGEXP = /^[1-9][0-9]*$/;
var FLOAT_REGEXP = /^-?(?:[0-9]|[1-9][0-9]*)(?:\.[0-9]*[1-9])?$/;
var UFLOAT_REGEXP = /^(?:[0-9]|[1-9][0-9]*)(?:\.[0-9]*[1-9])?$/;

exports.toInt = function (str) {
  if (INT_REGEXP.test(str)) {
    var val = parseInt(str, 10);
    if (isFinite(val)) {
      return val;
    }
  }
  return null;
};

exports.toIntOrThrow = function (str) {
  var val = exports.toInt(str);
  if (val == null) {
    throw new Error('Invalid integer');
  }
  return val;
};

exports.toUInt = function (str) {
  if (UINT_REGEXP.test(str)) {
    var val = parseInt(str, 10);
    if (isFinite(val)) {
      return val;
    }
  }
  return null;
};

exports.toUIntOrThrow = function (str) {
  var val = exports.toUInt(str);
  if (val == null) {
    throw new Error('Invalid integer');
  }
  return val;
};

exports.toFloat = function (str) {
  if (FLOAT_REGEXP.test(str)) {
    var val = parseFloat(str);
    if (isFinite(val)) {
      return val;
    }
  }
  return null;
};

exports.toFloatOrThrow = function (str) {
  var val = exports.toFloat(str);
  if (val == null) {
    throw new Error('Invalid float');
  }
  return val;
};

exports.toUFloat = function (str) {
  if (UFLOAT_REGEXP.test(str)) {
    var val = parseFloat(str);
    if (isFinite(val)) {
      return val;
    }
  }
  return null;
};

exports.toUFloatOrThrow = function (str) {
  var val = exports.toUFloat(str);
  if (val == null) {
    throw new Error('Invalid float');
  }
  return val;
};

exports.limit = function (v, min, max) {
  if (min != null && v <= min) {
    return min;
  }
  if (max != null && v >= max) {
    return max;
  }
  return v;
};

exports.assertRange = function (v, min, max) {
  var newV = exports.limit(v, min, max);
  if (v !== newV) {
    throw new Error('Invalid range');
  }
};

exports.camelCase = function (input) {
  return input.toLowerCase().replace(/_(.)/g, function (match, letter) {
    return letter.toUpperCase();
  });
};

exports.endsWith = function (str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
};
