define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element.js');  
  require('/scripts/standard_notice'); 
  require('/scripts/sqldbinterface');
  require('/scripts/clipboard_copy.js');
  require('/scripts/classProfile');
  require('/scripts/usermanagement'); 
  
  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');
  
  require('configuration');

  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
