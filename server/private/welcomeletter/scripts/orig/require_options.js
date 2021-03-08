define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element.js');  
  require('/scripts/navbar_for_bootstrap');
  require('/scripts/standard_notice'); 
  require('/scripts/sqldbinterface');
  
  require('/scripts/markdowntohtml');
  require('classTableEditor');
  
  require('options');

  document.addEventListener('DOMContentLoaded', app.init());
});
