define(function (require) {
  require('/scripts/create_element');
  require('/scripts/utilitykts');
  require('/scripts/sqldbinterface');    
  
  require('pacingguide-viewer');

  document.addEventListener('DOMContentLoaded', app.init());
});
