define(function (require) {
  require('../create_element');
  require('../sqldbinterface');  
  require('../utilitykts');
  
  require('usermanagement');
  require('login');
  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');
 
  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
