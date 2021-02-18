define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element.js');  
  require('/scripts/navbar');
  require('/scripts/standard_notice'); 
  require('/scripts/sqldbinterface');
  
  require('classTableEditor');
  
  require('options');

  document.addEventListener('DOMContentLoaded', app.init());
});
