define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element.js');  
  
  require('generator');

  document.addEventListener('DOMContentLoaded', app.init());
});
