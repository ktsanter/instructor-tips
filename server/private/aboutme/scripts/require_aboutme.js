define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element.js');   
  
  require('aboutme');

  document.addEventListener('DOMContentLoaded', app.init());
});
