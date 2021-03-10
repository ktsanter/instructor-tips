define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element.js');  
  require('/scripts/standard_notice'); 
  require('/scripts/sqldbinterface');
  require('/scripts/classProfile');
  require('/scripts/usermanagement'); 
  require('/scripts/mytinymce');  
  
  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');

  // remove this after redoing table editor
  require('/scripts/markdowntohtml'); 
  require('classTableEditor');
  
  require('options');

  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
