define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/mytinymce');
  
  require('equation');

  document.addEventListener('DOMContentLoaded', app.init());
});
