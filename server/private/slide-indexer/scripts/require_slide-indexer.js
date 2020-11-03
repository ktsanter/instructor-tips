define(function (require) {
  require('slide-indexer');

  require('/scripts/create_element');
  require('/scripts/standard_notice');
  require('/scripts/utilitykts');
  require('/scripts/clipboard_copy.js');  
  require('google_webapp_interface');

  document.addEventListener('DOMContentLoaded', app.init());
});

