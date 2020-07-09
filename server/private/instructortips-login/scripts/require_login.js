define(function (require) {
  require('/scripts/create_element');
  require('/scripts/sqldbinterface');  
  require('/scripts/utilitykts');
  
  require('usermanagement');
  require('login');
  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');
 
  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
