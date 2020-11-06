define(function (require) {
  require('slide-indexer-config');

  require('/scripts/create_element');
  require('/scripts/clipboard_copy.js');    
  require('/scripts/utilitykts');

  document.addEventListener('DOMContentLoaded', app.init());
});

