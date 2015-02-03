'use strict';

function gravity(g, width, height, cropWidth, cropHeight) {
  // set the default x/y, same as gravity 'c' for center
  var x = width / 2 - cropWidth / 2;
  var y = height / 2 - cropHeight / 2;

  switch (g) {
  case 'n':
    y = 0;
    break;
  case 'ne':
    x = width - cropWidth;
    y = 0;
    break;
  case 'nw':
    x = 0;
    y = 0;
    break;
  case 's':
    y = height - cropHeight;
    break;
  case 'se':
    x = width - cropWidth;
    y = height - cropHeight;
    break;
  case 'sw':
    x = 0;
    y = height - cropHeight;
    break;
  case 'e':
    x = width - cropWidth;
    break;
  case 'w':
    x = 0;
    break;
  }

  // make sure we do not return numbers less than zero
  if (x < 0) {
    x = 0;
  }

  if (y < 0) {
    y = 0;
  }

  return {
    x: Math.floor(x),
    y: Math.floor(y)
  };
}
exports.gravity = gravity;

function xy(modifiers, width, height, cropWidth, cropHeight) {
  var dims = gravity(modifiers.gravity, width, height, cropWidth, cropHeight);

  var x = modifiers.x;
  if (x != null) {
    if (x <= width - cropWidth) {
      dims.x = x;
    }
    else {
      // don't ignore modifier dimension
      // instead, place within bounds
      dims.x = width - cropWidth;
    }
  }

  var y = modifiers.y;
  if (y != null) {
    if (y <= height - cropHeight) {
      dims.y = y;
    }
    else {
      // don't ignore modifier dimension
      // instead, place within bounds
      dims.y = height - cropHeight;
    }
  }

  return dims;
}
exports.xy = xy;

exports.cropFill = function (modifiers, size) {

  if (modifiers.width === null) {
    modifiers.width = modifiers.height;
  }
  if (modifiers.height === null) {
    modifiers.height = modifiers.width;
  }

  var cropWidth, cropHeight;
  if (modifiers.width > size.width && modifiers.height <= size.height) {
    cropWidth = size.width;
    cropHeight = modifiers.height;
  }
  else if (modifiers.width <= size.width && modifiers.height > size.height) {
    cropWidth = modifiers.width;
    cropHeight = size.height;
  }
  else if (modifiers.width > size.width && modifiers.height > size.height) {
    cropWidth = size.width;
    cropHeight = size.height;
  }
  else {
    cropWidth = modifiers.width;
    cropHeight = modifiers.height;
  }

  var wd = cropWidth;
  var newWd = wd;

  var ht = Math.round(newWd * (size.height / size.width));
  var newHt = ht;

  if (newHt < cropHeight) {
    ht = newHt = cropHeight;
    wd = newWd = Math.round(newHt * (size.width / size.height));
  }

  // get the crop X/Y as defined by the gravity or x/y modifiers
  var crop = xy(modifiers, newWd, newHt, cropWidth, cropHeight);

  return {
    resize: {
      width: wd,
      height: ht
    },
    crop: {
      width: cropWidth,
      height: cropHeight,
      x: crop.x,
      y: crop.y
    }
  };
};
