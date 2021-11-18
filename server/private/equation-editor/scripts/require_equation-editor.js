define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/mytinymce');
  require('/scripts/clipboard_copy');  
  
  require('classFindMathML');
  require('classPngImage');
  require('classPngChunk');  
  require('equation-editor');

  document.addEventListener('DOMContentLoaded', app.init());
});
