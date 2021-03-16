define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/standard_notice');
  require('/scripts/sqldbinterface');
  require('/scripts/tree.jquery');
  require('/scripts/classTreeManager');
  require('/scripts/mytinymce');
  require('/scripts/clipboard_copy');
  require('/scripts/classProfile');
  require('/scripts/usermanagement');
  
  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');
   
  require('classAccordion');
  require('helper');

  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
