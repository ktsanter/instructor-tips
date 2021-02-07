define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element.js');  
  
  require('flipper');

  document.addEventListener('DOMContentLoaded', app.init());
});
