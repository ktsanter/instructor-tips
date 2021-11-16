define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/mytinymce');
  
  require('equation-editor');

  document.addEventListener('DOMContentLoaded', app.init());
});
