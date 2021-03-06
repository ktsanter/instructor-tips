define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/standard_notice');
  require('/scripts/sqldbinterface');
  require('/scripts/classProfile');
  require('/scripts/usermanagement');
  require('/scripts/google_webapp_interface');  

  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');
   
  require('classDBIntrospect');
  require('as-admin');

  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
