define(function (require) {
  require('index');
  
  require('create_element');
  require('libsodium');
  var libsodiumWrappers = require('libsodium-wrappers');

  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});

