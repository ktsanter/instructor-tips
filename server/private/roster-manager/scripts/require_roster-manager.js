define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/standard_notice');
  require('/scripts/sqldbinterface');
  require('/scripts/classProfile');
  require('/scripts/usermanagement');
  require('/scripts/clipboard_copy');  
  require('/scripts/classGoogleManagement');

  
  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');
   
  require('classGoogleDrive');
  require('classReportPoster');
  require('classDataIntegrator');
  require('classRosterViewer');
  require('classMentorViewer');
  require('roster-manager');

  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
