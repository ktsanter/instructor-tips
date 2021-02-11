define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element.js'); 
  require('/scripts/standard_notice');
  require('/scripts/sqldbinterface');   
  
  require('flipper');

  document.addEventListener('DOMContentLoaded', app.init());
});
