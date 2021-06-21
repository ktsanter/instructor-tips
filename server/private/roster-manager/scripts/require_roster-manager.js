define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/standard_notice');
  require('/scripts/sqldbinterface');
  require('/scripts/classProfile');
  require('/scripts/usermanagement');
  require('/scripts/classGoogleManagement');

  
  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');
   
  require('classGoogleDrive');
  require('classReportPoster');
  require('roster-manager');

  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
