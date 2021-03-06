define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element.js');  
  require('/scripts/standard_notice'); 
  require('/scripts/sqldbinterface'); 
  require('/scripts/clipboard_copy');  
  require('/scripts/classProfile');
  require('/scripts/usermanagement');  
  
  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');  
  
  require('generator');

  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
