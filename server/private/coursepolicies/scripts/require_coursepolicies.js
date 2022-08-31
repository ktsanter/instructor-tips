define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/standard_notice');
  require('/scripts/sqldbinterface');
  require('/scripts/classProfile');
  require('/scripts/usermanagement');
  require('/scripts/clipboard_copy');  
  
  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');
   
   require('classGeneralPolicies');
   require('classCoursePolicies');
   require('classAdmin');
  require('coursepolicies');

  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
