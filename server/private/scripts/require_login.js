define(function (require) {
  require('login');
  require('create_element');
  require('sqldbinterface');  
  require('utilitykts');
  require('usermanagement');
  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');
 
  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
