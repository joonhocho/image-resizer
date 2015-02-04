'use strict';

var INT_REGEXP = /^-?[1-9][0-9]*$/;
var UINT_REGEXP = /^[1-9][0-9]*$/;

exports.toInt = function (str) {
  if (INT_REGEXP.test(str)) {
    var val = parseInt(str, 10);
    return isFinite(val) ? val : null;
  }
  return null;
};

exports.toUInt = function (str) {
  if (UINT_REGEXP.test(str)) {
    var val = parseInt(str, 10);
    return isFinite(val) ? val : null;
  }
  return null;
};

exports.camelCase = function (input) {
  return input.toLowerCase().replace(/_(.)/g, function (match, letter) {
    return letter.toUpperCase();
  });
};

exports.endsWith = function (str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
};
