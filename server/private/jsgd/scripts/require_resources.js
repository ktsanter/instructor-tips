define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/clipboard_copy');
  
  require('resources');
  
  document.addEventListener('DOMContentLoaded', app.init());
});
