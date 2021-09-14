define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/standard_notice');
  require('/scripts/sqldbinterface');
  require('/scripts/classProfile');
  require('/scripts/usermanagement');  
  
  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');
  
  require('classITipsDB');
   
  require('classScheduling');
  require('classSchedulingSelection');
  require('classSchedulingDetails');
  
  require('classTipsEditing');
  require('classSharing');
  require('classNotification');
  require('classAdmin');
  require('itips');

  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
