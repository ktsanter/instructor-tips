define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/sqldbinterface'); 
  require('/scripts/clipboard.min.js');
  require('/scripts/clipboard_copy.js');  
  
  require('welcomeletter');

  document.addEventListener('DOMContentLoaded', app.init());
});
