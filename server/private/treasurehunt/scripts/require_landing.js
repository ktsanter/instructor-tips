define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element.js');  
  require('/scripts/standard_notice'); 
  require('/scripts/sqldbinterface');
  
  require('effect');
  require('firework');
  require('particle');
  require('cannonball');
  require('landing');

  document.addEventListener('DOMContentLoaded', app.init());
});

