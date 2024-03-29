define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/standard_notice');
  require('/scripts/sqldbinterface');
  require('/scripts/classProfile');
  require('/scripts/usermanagement');
  require('/scripts/clipboard_copy');  
  require('/scripts/classFilterControl');
  
  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');
   
  require('classReportPoster');
  require('classDataIntegrator');
  require('classRosterViewer');
  require('classMentorViewer');
  require('classProgressCheck');
  require('roster-manager');

  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
