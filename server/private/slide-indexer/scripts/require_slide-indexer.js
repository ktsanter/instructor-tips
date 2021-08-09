define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/standard_notice');
  require('/scripts/clipboard_copy.js');  
  require('google_webapp_interface');
  
  require('slide-indexer');

  document.addEventListener('DOMContentLoaded', app.init());
});
