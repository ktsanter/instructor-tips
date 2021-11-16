define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/mytinymce');
  require('/scripts/clipboard_copy');  
  
  require('equation-editor');

  document.addEventListener('DOMContentLoaded', app.init());
});
