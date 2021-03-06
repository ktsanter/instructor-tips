define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element.js');  
  require('/scripts/navbar');
  require('/scripts/standard_notice'); 
  require('/scripts/clipboard_copy.js');  
  require('/scripts/sqldbinterface'); 
  
  require('generator');

  document.addEventListener('DOMContentLoaded', app.init());
});
