define(function (require) {
  require('slide-indexer-config');

  require('/scripts/create_element');
  require('/scripts/clipboard_copy.js');    
  require('/scripts/utilitykts');
  require('google_webapp_interface');

  document.addEventListener('DOMContentLoaded', app.init());
});

