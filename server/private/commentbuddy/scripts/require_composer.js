define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/standard_notice');
  require('/scripts/sqldbinterface');  
  require('/scripts/google_webapp_interface');
  require('/scripts/mytinymce');
  require('/scripts/classProfile');
  require('/scripts/usermanagement');  
  
  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');  

  require('classCommentBuddyDB');
  require('composer');

  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
